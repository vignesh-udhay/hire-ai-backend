import { Octokit } from "octokit";
import { TalentProfile, AIExperience } from "../types/talent";
import { GroqService } from "./groqService";
import { config } from "../config";

export class GitHubService {
  private octokit: Octokit;
  private groqService: GroqService;

  constructor() {
    // Initialize Octokit with GitHub token
    this.octokit = new Octokit({
      auth: config.github.token,
    });

    // Initialize Groq service
    this.groqService = new GroqService();
  }  async searchUsers(
    query: string,
    page: number = 1,
    perPage: number = 12
  ): Promise<{ profiles: TalentProfile[]; total: number }> {
    try {
      // Parse the query using Groq service
      const parsedQuery = await this.groqService.parseQuery(query);
      const enhancedQuery = this.buildEnhancedSearchQuery(parsedQuery);
      
      // Explicitly filter for user type (not organizations)
      const searchQueryWithTypeFilter = `${enhancedQuery} type:user`;

      // Search for users based on the enhanced query with pagination
      const searchResponse = await this.octokit.rest.search.users({
        q: searchQueryWithTypeFilter,
        per_page: perPage,
        page: page,
      });

      // Create lightweight profiles without additional API calls for better performance
      const userProfiles = searchResponse.data.items.map((user) =>
        this.createLightweightProfile(user)
      );

      return {
        profiles: userProfiles,
        total: searchResponse.data.total_count,
      };
    } catch (error) {
      console.error("Error searching GitHub users:", error);
      throw error;
    }
  }  private createLightweightProfile(user: any): TalentProfile {
    // Create a lightweight profile with minimal data from search results
    // Skip organization accounts
    if (user.type && user.type.toLowerCase() === 'organization') {
      throw new Error('Organization accounts should not be processed as talent profiles');
    }
    
    const bio = user.bio || "";
    const title = this.inferTitleFromBio(bio);
    const skills = this.extractSkillsFromBio(bio);
    const aiExperience = this.extractBasicAIExperience(bio);
    const experience = this.estimateExperienceFromAccount(user);
    return {
      id: user.login, // Use GitHub username as ID for easier API calls
      name: user.name || user.login, // Use display name if available, fallback to username
      title,
      experience,
      skills,
      location: user.location || "Not specified",
      availability: "open" as const,
      source: "github" as const,
      matchScore: 0, // Will be calculated by talent search service
      highlights: this.generateBasicHighlights(user),
      avatar: user.avatar_url,
      summary:
        bio || `GitHub developer with ${user.public_repos} public repositories`,
      aiExperience,
      employmentPreferences: {
        type: "full-time" as const,
        remote: true,
        relocation: false,
      },
      seniority: this.inferSeniority(experience, []),
      screeningStatus: {
        automated: false,
        score: 0,
        notes: [],
        recommended: false,
      },
    };
  }

  private extractSkillsFromBio(bio: string): string[] {
    // Extract skills from bio using common programming terms
    const commonSkills = [
      "JavaScript",
      "TypeScript",
      "Python",
      "Java",
      "C++",
      "React",
      "Node.js",
      "Angular",
      "Vue",
      "Docker",
      "Kubernetes",
      "AWS",
      "Azure",
      "GCP",
      "TensorFlow",
      "PyTorch",
      "Machine Learning",
      "AI",
      "Data Science",
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "Redis",
      "GraphQL",
      "REST",
    ];

    const skills: string[] = [];
    const bioLower = bio.toLowerCase();

    for (const skill of commonSkills) {
      if (bioLower.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    }

    return skills.slice(0, 10); // Limit to 10 skills
  }

  private extractBasicAIExperience(bio: string): AIExperience {
    // Extract basic AI experience from bio
    const aiFrameworks = [
      "TensorFlow",
      "PyTorch",
      "Keras",
      "Scikit-learn",
      "Hugging Face",
    ];
    const aiDomains = [
      "Machine Learning",
      "Deep Learning",
      "NLP",
      "Computer Vision",
      "AI",
    ];

    const bioLower = bio.toLowerCase();
    const frameworks = aiFrameworks.filter((f) =>
      bioLower.includes(f.toLowerCase())
    );
    const domains = aiDomains.filter((d) => bioLower.includes(d.toLowerCase()));

    return {
      years: frameworks.length > 0 || domains.length > 0 ? 1 : 0,
      frameworks,
      domains,
      projects: [], // Will be populated only when full details are fetched
    };
  }

  private estimateExperienceFromAccount(user: any): number {
    // Estimate experience based on account age and activity
    const accountAge =
      new Date().getFullYear() - new Date(user.created_at).getFullYear();
    const repoCount = user.public_repos || 0;

    // Base experience on account age, capped at reasonable limits
    let experience = Math.min(accountAge, 15); // Max 15 years

    // Adjust based on activity level
    if (repoCount > 50) experience += 1;
    if (repoCount > 100) experience += 1;
    if (user.followers > 100) experience += 1;

    return Math.max(1, Math.min(experience, 20)); // Between 1-20 years
  }

  private generateBasicHighlights(user: any): string[] {
    const highlights: string[] = [];

    if (user.public_repos > 0) {
      highlights.push(`${user.public_repos} public repositories`);
    }

    if (user.followers > 0) {
      highlights.push(`${user.followers} followers on GitHub`);
    }

    if (user.bio) {
      highlights.push("Has detailed profile bio");
    }

    return highlights.slice(0, 3); // Limit to 3 highlights
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
  } // Get detailed user profile by GitHub username - called when user clicks on candidate card
  async getUserById(username: string): Promise<TalentProfile | null> {
    try {
      // Fetch user details and repositories in parallel
      const [userResponse, reposResponse] = await Promise.all([
        this.octokit.rest.users.getByUsername({ username }),
        this.octokit.rest.repos.listForUser({
          username,
          per_page: 30,
          sort: "updated",
          type: "owner",
        }),
      ]);

      const user = userResponse.data;
      const repos = reposResponse.data;

      // Create detailed profile with repository data
      const bio = user.bio || "";
      const title = this.inferTitleFromBio(bio);
      const skills = this.extractSkillsFromBio(bio);
      const aiExperience = this.extractAIExperience(bio, repos);
      const experience = this.estimateExperienceFromAccount(user);
      const highlights = this.generateHighlights(user, repos);
      const matchScore = this.calculateMatchScore(user, repos);
      const screeningScore = this.calculateScreeningScore(user, repos);
      const screeningNotes = this.generateScreeningNotes(user, repos);
      return {
        id: user.login, // Use GitHub username as ID for consistency
        name: user.name || user.login, // Use display name if available, fallback to username
        title,
        experience,
        skills,
        location: user.location || "Not specified",
        availability: "open" as const,
        source: "github" as const,
        matchScore,
        highlights,
        avatar: user.avatar_url,
        summary:
          bio ||
          `GitHub developer with ${user.public_repos} public repositories`,
        aiExperience,
        employmentPreferences: {
          type: "full-time" as const,
          remote: true,
          relocation: false,
        },
        seniority: this.inferSeniority(experience, repos),
        screeningStatus: {
          automated: true,
          score: screeningScore,
          notes: screeningNotes,
          recommended: screeningScore > 70,
        },
      };
    } catch (error) {
      console.error("Error fetching GitHub user details:", error);
      return null;
    }
  }
}
