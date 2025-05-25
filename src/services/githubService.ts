import { Octokit } from "octokit";
import { TalentProfile } from "../types/talent";
import { GroqService } from "./groqService";

export class GitHubService {
  private octokit: Octokit;
  private groqService: GroqService;

  constructor() {
    // Initialize Octokit with GitHub token
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Initialize Groq service
    this.groqService = new GroqService();
  }

  async searchUsers(query: string): Promise<TalentProfile[]> {
    try {
      // Parse the query using Groq service
      const parsedQuery = await this.groqService.parseQuery(query);
      console.log("Original query:", query);
      console.log("Parsed query:", parsedQuery);

      // Enhance the search query with additional filters
      const enhancedQuery = this.buildEnhancedSearchQuery(parsedQuery);
      console.log("Enhanced query:", enhancedQuery);

      // Search for users based on the enhanced query
      const searchResponse = await this.octokit.rest.search.users({
        q: enhancedQuery,
        per_page: 20, // Increased to get more potential matches
      });
      console.log("Search response:", searchResponse.data);

      // Get detailed information for each user
      const userProfiles = await Promise.all(
        searchResponse.data.items.map(async (user) => {
          // Get user details
          const userDetails = await this.octokit.rest.users.getByUsername({
            username: user.login,
          });

          // Get user repositories with more detailed information
          const repos = await this.octokit.rest.repos.listForUser({
            username: user.login,
            sort: "updated",
            per_page: 10, // Increased to get more repository data
            direction: "desc",
          });

          // Get user's primary programming languages and technologies
          const languages = new Set<string>();
          const technologies = new Set<string>();
          for (const repo of repos.data) {
            if (repo.language) {
              languages.add(repo.language);
            }
            // Extract technologies from repository topics
            if (repo.topics) {
              repo.topics.forEach((topic) => technologies.add(topic));
            }
          }

          // Calculate experience based on account age and activity
          const accountAge =
            new Date().getFullYear() -
            new Date(userDetails.data.created_at).getFullYear();
          const experience = Math.max(accountAge, 1);

          // Create talent profile from GitHub data
          const profile: TalentProfile = {
            id: user.id.toString(),
            name: userDetails.data.name || user.login,
            title: this.inferTitleFromBio(userDetails.data.bio || ""),
            experience,
            skills: Array.from(languages),
            location: userDetails.data.location || "Unknown",
            availability: "open",
            source: "github",
            matchScore: this.calculateMatchScore(user, repos.data),
            highlights: this.generateHighlights(user, repos.data),
            aiExperience: this.extractAIExperience(
              userDetails.data.bio || "",
              repos.data
            ),
            employmentPreferences: {
              type: "full-time",
              remote: true,
              relocation: false,
            },
            seniority: this.inferSeniority(experience, repos.data),
            screeningStatus: {
              automated: true,
              score: this.calculateScreeningScore(user, repos.data),
              notes: this.generateScreeningNotes(user, repos.data),
              recommended: false,
            },
          };

          return profile;
        })
      );

      // Sort profiles by match score before returning
      return userProfiles.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error("Error searching GitHub users:", error);
      throw error;
    }
  }

  private inferTitleFromBio(bio: string): string {
    // Simple title inference from bio
    const titles = ["Engineer", "Developer", "Architect", "Scientist"];
    for (const title of titles) {
      if (bio.toLowerCase().includes(title.toLowerCase())) {
        return title;
      }
    }
    return "Software Developer";
  }

  private calculateMatchScore(user: any, repos: any[]): number {
    // Calculate match score based on various factors
    let score = 0;

    // Repository count (up to 30 points)
    score += Math.min(user.public_repos * 2, 30);

    // Followers (up to 20 points)
    score += Math.min(user.followers * 0.5, 20);

    // Stars on repositories (up to 30 points)
    const totalStars = repos.reduce(
      (sum, repo) => sum + repo.stargazers_count,
      0
    );
    score += Math.min(totalStars, 30);

    // Account age (up to 20 points)
    const accountAge =
      new Date().getFullYear() - new Date(user.created_at).getFullYear();
    score += Math.min(accountAge * 2, 20);

    return score / 100; // Normalize to 0-1
  }

  private generateHighlights(user: any, repos: any[]): string[] {
    const highlights: string[] = [];

    // Add repository highlights
    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3);

    topRepos.forEach((repo) => {
      if (repo.stargazers_count > 0) {
        highlights.push(
          `Created ${repo.name} with ${repo.stargazers_count} stars`
        );
      }
    });

    // Add contribution highlights
    if (user.public_repos > 0) {
      highlights.push(`Maintains ${user.public_repos} public repositories`);
    }

    return highlights;
  }

  private extractAIExperience(
    bio: string,
    repos: any[]
  ): {
    years: number;
    frameworks: string[];
    domains: string[];
    projects: any[];
  } {
    const aiFrameworks = [
      "TensorFlow",
      "PyTorch",
      "LangChain",
      "HuggingFace",
      "Scikit-learn",
    ];
    const aiDomains = [
      "Machine Learning",
      "Deep Learning",
      "NLP",
      "Computer Vision",
      "AI",
    ];

    const frameworks = aiFrameworks.filter(
      (framework) =>
        bio.toLowerCase().includes(framework.toLowerCase()) ||
        repos.some((repo) =>
          repo.description?.toLowerCase().includes(framework.toLowerCase())
        )
    );

    const domains = aiDomains.filter(
      (domain) =>
        bio.toLowerCase().includes(domain.toLowerCase()) ||
        repos.some((repo) =>
          repo.description?.toLowerCase().includes(domain.toLowerCase())
        )
    );

    const aiProjects = repos
      .filter(
        (repo) =>
          repo.description?.toLowerCase().includes("ai") ||
          repo.description?.toLowerCase().includes("machine learning") ||
          frameworks.some((framework) =>
            repo.description?.toLowerCase().includes(framework.toLowerCase())
          )
      )
      .map((repo) => ({
        name: repo.name,
        description: repo.description || "",
        technologies: this.extractTechnologies(repo),
        impact: `Repository with ${repo.stargazers_count} stars`,
        year: new Date(repo.created_at).getFullYear(),
      }));

    return {
      years: Math.max(frameworks.length, 1),
      frameworks,
      domains,
      projects: aiProjects,
    };
  }

  private extractTechnologies(repo: any): string[] {
    const technologies: string[] = [];
    if (repo.language) {
      technologies.push(repo.language);
    }
    // Add more technology extraction logic here
    return technologies;
  }

  private inferSeniority(
    experience: number,
    repos: any[]
  ): "junior" | "mid" | "senior" | "lead" | "principal" {
    if (experience >= 8) return "principal";
    if (experience >= 6) return "lead";
    if (experience >= 4) return "senior";
    if (experience >= 2) return "mid";
    return "junior";
  }

  private calculateScreeningScore(user: any, repos: any[]): number {
    // Calculate screening score based on various factors
    let score = 0;

    // Repository quality (up to 40 points)
    const repoScore = repos.reduce((sum, repo) => {
      return sum + repo.stargazers_count * 2 + repo.forks_count;
    }, 0);
    score += Math.min(repoScore, 40);

    // Account activity (up to 30 points)
    score += Math.min(user.public_repos * 2, 30);

    // Profile completeness (up to 30 points)
    if (user.bio) score += 10;
    if (user.location) score += 10;
    if (user.blog) score += 10;

    return score;
  }

  private generateScreeningNotes(user: any, repos: any[]): string[] {
    const notes: string[] = [];

    // Add repository quality notes
    const topRepo = repos.sort(
      (a, b) => b.stargazers_count - a.stargazers_count
    )[0];
    if (topRepo && topRepo.stargazers_count > 0) {
      notes.push(`Top repository has ${topRepo.stargazers_count} stars`);
    }

    // Add activity notes
    if (user.public_repos > 10) {
      notes.push(
        `Active contributor with ${user.public_repos} public repositories`
      );
    }

    // Add profile notes
    if (user.bio) {
      notes.push("Has a detailed profile bio");
    }

    return notes;
  }

  private buildEnhancedSearchQuery(parsedQuery: string): string {
    // Add additional search parameters to improve results
    const baseQuery = parsedQuery;
    let enhancedQuery = `${baseQuery} type:user sort:repositories`;

    // Add language filters if present in the query
    const languageMatch = parsedQuery.match(/language:(\w+)/);
    if (languageMatch) {
      enhancedQuery += ` language:${languageMatch[1]}`;
    }

    // Add location filter if present with common variations
    const locationMatch = parsedQuery.match(/location:([^ ]+)/);
    if (locationMatch) {
      const location = locationMatch[1].toLowerCase();
      // Handle common location variations
      const locationMap: Record<string, string[]> = {
        bangalore: ["bangalore", "bengaluru", "bangaluru"],
        mumbai: ["mumbai", "bombay"],
        delhi: ["delhi", "new delhi", "ncr"],
        hyderabad: ["hyderabad", "secunderabad"],
        chennai: ["chennai", "madras"],
        pune: ["pune", "puna"],
      };

      // Find the standard location name
      let standardLocation = location;
      for (const [standard, variations] of Object.entries(locationMap)) {
        if (variations.includes(location)) {
          standardLocation = standard;
          break;
        }
      }

      enhancedQuery += ` location:${standardLocation}`;
    }

    // Reduce minimum requirements for better results
    enhancedQuery += " repos:>2"; // Reduced from 5
    enhancedQuery += " followers:>5"; // Reduced from 10

    return enhancedQuery;
  }
}
