import {
  TalentSearchQuery,
  TalentProfile,
  TalentSearchResponse,
  AIProject,
} from "../types/talent";
import { GitHubService } from "./githubService";
import { GroqService } from "./groqService";

interface SearchQuery {
  query: string;
  limit?: number;
  offset?: number;
}

export class TalentSearchService {
  private githubService: GitHubService;
  private groqService: GroqService;

  constructor() {
    this.githubService = new GitHubService();
    this.groqService = new GroqService();
  }

  // Process natural language query to extract structured information
  private async processNaturalLanguageQuery(query: string): Promise<{
    extractedSkills: string[];
    extractedRequirements: string[];
    confidence: number;
    derivedFilters: {
      experience?: number;
      skills?: string[];
      location?: string;
      availability?: "immediate" | "notice" | "open";
      employmentType?: "full-time" | "contract" | "part-time";
      seniority?: "junior" | "mid" | "senior" | "lead" | "principal";
      aiExperience?: {
        frameworks?: string[];
        domains?: string[];
        years?: number;
      };
    };
  }> {
    return this.groqService.parseTalentQuery(query);
  }

  private calculateMatchScore(
    profile: TalentProfile,
    extractedSkills: string[],
    extractedRequirements: string[],
    derivedFilters: any
  ): number {
    let score = 0;
    const maxScore = 100;

    // Skills match (up to 40 points)
    if (extractedSkills.length > 0) {
      const skillMatches = extractedSkills.filter((skill) =>
        profile.skills.some((pSkill) =>
          pSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      score += (skillMatches.length / extractedSkills.length) * 40;
    }

    // Requirements match (up to 30 points)
    if (extractedRequirements.length > 0) {
      const requirementMatches = extractedRequirements.filter((req) => {
        const reqLower = req.toLowerCase();
        return (
          profile.title.toLowerCase().includes(reqLower) ||
          profile.highlights.some((h) => h.toLowerCase().includes(reqLower)) ||
          profile.aiExperience.domains.some((d) =>
            d.toLowerCase().includes(reqLower)
          ) ||
          profile.aiExperience.frameworks.some((f) =>
            f.toLowerCase().includes(reqLower)
          )
        );
      });
      score += (requirementMatches.length / extractedRequirements.length) * 30;
    }

    // Experience match (up to 20 points)
    if (derivedFilters?.experience) {
      const experienceDiff = Math.abs(
        profile.experience - derivedFilters.experience
      );
      // More flexible experience matching
      if (experienceDiff <= 2) {
        score += 20; // Exact match or very close
      } else if (experienceDiff <= 4) {
        score += 15; // Close enough
      } else if (experienceDiff <= 6) {
        score += 10; // Somewhat close
      } else if (profile.experience >= derivedFilters.experience * 0.7) {
        score += 5; // At least 70% of required experience
      }
    }

    // Location match (up to 10 points)
    if (derivedFilters?.location) {
      const locationMap: Record<string, string[]> = {
        bangalore: ["bangalore", "bengaluru", "bangaluru"],
        mumbai: ["mumbai", "bombay"],
        delhi: ["delhi", "new delhi", "ncr"],
        hyderabad: ["hyderabad", "secunderabad"],
        chennai: ["chennai", "madras"],
        pune: ["pune", "puna"],
      };

      const profileLocation = profile.location.toLowerCase();
      const searchLocation = derivedFilters.location.toLowerCase();

      // Check for exact match
      if (profileLocation === searchLocation) {
        score += 10;
      } else {
        // Check for variations
        for (const [standard, variations] of Object.entries(locationMap)) {
          if (
            variations.includes(searchLocation) &&
            variations.includes(profileLocation)
          ) {
            score += 10;
            break;
          }
        }
      }
    }

    // If no criteria were evaluated, return a base score based on profile quality
    if (score === 0) {
      // Base score on profile completeness and activity
      if (profile.skills.length > 0) score += 20;
      if (profile.highlights.length > 0) score += 20;
      if (profile.aiExperience.frameworks.length > 0) score += 20;
      if (profile.aiExperience.domains.length > 0) score += 20;
      if (profile.experience > 0) score += 20;
    }

    // Normalize score to 0-1 range
    return Math.min(1, Math.max(0, score / maxScore));
  }

  // Mock implementation of automated screening
  private screenCandidate(profile: TalentProfile): {
    automated: boolean;
    score: number;
    notes: string[];
    recommended: boolean;
  } {
    const score = Math.random() * 100;
    const notes = [
      "Strong AI project portfolio",
      "Relevant industry experience",
      "Good cultural fit based on previous roles",
    ];
    return {
      automated: true,
      score,
      notes,
      recommended: score > 70,
    };
  }

  async searchTalent(query: SearchQuery): Promise<TalentSearchResponse> {
    try {
      // Process natural language query and derive filters
      const {
        extractedSkills,
        extractedRequirements,
        confidence,
        derivedFilters,
      } = await this.processNaturalLanguageQuery(query.query);

      // Search GitHub for matching profiles
      const githubProfiles = await this.githubService.searchUsers(query.query);

      // Apply derived filters and calculate match scores
      let filteredResults = githubProfiles
        .map((profile) => ({
          ...profile,
          matchScore: this.calculateMatchScore(
            profile,
            extractedSkills,
            extractedRequirements,
            derivedFilters
          ),
        }))
        .filter((profile) => {
          // Only apply filters that weren't already applied at the GitHub API level
          if (
            derivedFilters.aiExperience?.domains &&
            !derivedFilters.aiExperience.domains.every((domain) =>
              profile.aiExperience.domains.includes(domain)
            )
          ) {
            return false;
          }
          if (
            derivedFilters.aiExperience?.frameworks &&
            !derivedFilters.aiExperience.frameworks.every((framework) =>
              profile.aiExperience.frameworks.includes(framework)
            )
          ) {
            return false;
          }
          if (
            derivedFilters.employmentType &&
            profile.employmentPreferences.type !== derivedFilters.employmentType
          ) {
            return false;
          }
          if (
            derivedFilters.availability &&
            profile.availability !== derivedFilters.availability
          ) {
            return false;
          }
          return true;
        });

      // Sort results by match score (though they should already be sorted from GitHub service)
      filteredResults.sort((a, b) => b.matchScore - a.matchScore);

      // Calculate match distribution
      const matchDistribution = {
        bySeniority: this.calculateDistribution(filteredResults, "seniority"),
        byLocation: this.calculateDistribution(filteredResults, "location"),
        byAvailability: this.calculateDistribution(
          filteredResults,
          "availability"
        ),
      };

      // Apply pagination
      const paginatedResults = filteredResults.slice(
        query.offset ?? 0,
        (query.offset ?? 0) + (query.limit ?? 10)
      );

      return {
        results: paginatedResults,
        total: filteredResults.length,
        page: Math.floor((query.offset ?? 0) / (query.limit ?? 10)) + 1,
        limit: query.limit ?? 10,
        searchMetadata: {
          queryUnderstanding: {
            extractedSkills,
            extractedRequirements,
            confidence,
          },
          matchDistribution,
        },
      };
    } catch (error) {
      console.error("Error in talent search:", error);
      throw error;
    }
  }

  private calculateDistribution(
    profiles: TalentProfile[],
    field: keyof TalentProfile
  ): Record<string, number> {
    const distribution: Record<string, number> = {};
    profiles.forEach((profile) => {
      const value = profile[field];
      if (typeof value === "string") {
        distribution[value] = (distribution[value] || 0) + 1;
      }
    });
    return distribution;
  }
}
