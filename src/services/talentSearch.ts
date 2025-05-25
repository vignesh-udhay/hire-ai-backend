import {
  TalentSearchQuery,
  TalentProfile,
  TalentProfileResponse,
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
    } // Requirements match (up to 30 points)
    if (extractedRequirements.length > 0) {
      const requirementMatches = extractedRequirements.filter((req) => {
        const reqLower = req.toLowerCase();
        return (
          profile.title.toLowerCase().includes(reqLower) ||
          profile.highlights.some((h) => h.toLowerCase().includes(reqLower)) ||
          (profile.aiExperience?.domains.some((d) =>
            d.toLowerCase().includes(reqLower)
          ) ??
            false) ||
          (profile.aiExperience?.frameworks.some((f) =>
            f.toLowerCase().includes(reqLower)
          ) ??
            false)
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
    } // If no criteria were evaluated, return a base score based on profile quality
    if (score === 0) {
      // Base score on profile completeness and activity
      if (profile.skills.length > 0) score += 20;
      if (profile.highlights.length > 0) score += 20;
      if ((profile.aiExperience?.frameworks.length ?? 0) > 0) score += 20;
      if ((profile.aiExperience?.domains.length ?? 0) > 0) score += 20;
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
      // Process natural language query and GitHub search in parallel for better performance
      const [nlpResult, githubResponse] = await Promise.all([
        this.processNaturalLanguageQuery(query.query),
        this.githubService.searchUsers(
          query.query,
          Math.floor((query.offset || 0) / (query.limit || 10)) + 1,
          query.limit || 10
        ),
      ]);

      const {
        extractedSkills,
        extractedRequirements,
        confidence,
        derivedFilters,
      } = nlpResult;

      // Apply optimized filtering and scoring
      const filteredResults = this.filterAndScoreProfilesOptimized(
        githubResponse.profiles,
        extractedSkills,
        extractedRequirements,
        derivedFilters
      );

      // Sort results by match score
      filteredResults.sort((a, b) => b.matchScore - a.matchScore);

      // Transform profiles to response format
      const transformedResults: TalentProfileResponse[] = filteredResults.map(
        (profile) => ({
          ...profile,
          experience: `${profile.experience} years`,
        })
      );

      // Calculate distributions efficiently
      const matchDistribution =
        this.calculateDistributionsOptimized(filteredResults);

      return {
        results: transformedResults,
        total: githubResponse.total,
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

  // Optimized filtering and scoring method
  private filterAndScoreProfilesOptimized(
    profiles: TalentProfile[],
    extractedSkills: string[],
    extractedRequirements: string[],
    derivedFilters: any
  ): TalentProfile[] {
    // Pre-compile filter conditions for better performance
    const filterConditions = {
      hasAIDomainsFilter: derivedFilters.aiExperience?.domains?.length > 0,
      hasAIFrameworksFilter:
        derivedFilters.aiExperience?.frameworks?.length > 0,
      hasEmploymentTypeFilter: !!derivedFilters.employmentType,
      hasAvailabilityFilter: !!derivedFilters.availability,
      aiDomains: derivedFilters.aiExperience?.domains || [],
      aiFrameworks: derivedFilters.aiExperience?.frameworks || [],
      employmentType: derivedFilters.employmentType,
      availability: derivedFilters.availability,
    };

    return profiles
      .map((profile) => ({
        ...profile,
        matchScore: this.calculateMatchScoreOptimized(
          profile,
          extractedSkills,
          extractedRequirements,
          derivedFilters
        ),
      }))
      .filter((profile) => {
        // Apply pre-compiled filter conditions
        if (
          filterConditions.hasAIDomainsFilter &&
          profile.aiExperience &&
          !filterConditions.aiDomains.every((domain: string) =>
            profile.aiExperience!.domains.includes(domain)
          )
        ) {
          return false;
        }

        if (
          filterConditions.hasAIFrameworksFilter &&
          profile.aiExperience &&
          !filterConditions.aiFrameworks.every((framework: string) =>
            profile.aiExperience!.frameworks.includes(framework)
          )
        ) {
          return false;
        }

        if (
          filterConditions.hasEmploymentTypeFilter &&
          profile.employmentPreferences &&
          profile.employmentPreferences.type !== filterConditions.employmentType
        ) {
          return false;
        }

        if (
          filterConditions.hasAvailabilityFilter &&
          profile.availability !== filterConditions.availability
        ) {
          return false;
        }

        return true;
      });
  }

  // Optimized match score calculation
  private calculateMatchScoreOptimized(
    profile: TalentProfile,
    extractedSkills: string[],
    extractedRequirements: string[],
    derivedFilters: any
  ): number {
    let score = 0;
    const maxScore = 100;

    // Pre-process skills and requirements for faster comparison
    const profileSkillsLower = profile.skills.map((skill) =>
      skill.toLowerCase()
    );
    const profileHighlightsLower = profile.highlights.map((h) =>
      h.toLowerCase()
    );
    const profileTitleLower = profile.title.toLowerCase();
    const profileAIDomains =
      profile.aiExperience?.domains.map((d) => d.toLowerCase()) || [];
    const profileAIFrameworks =
      profile.aiExperience?.frameworks.map((f) => f.toLowerCase()) || [];

    // Skills match (up to 40 points) - optimized
    if (extractedSkills.length > 0) {
      const skillMatches = extractedSkills.filter((skill) => {
        const skillLower = skill.toLowerCase();
        return profileSkillsLower.some((pSkill) => pSkill.includes(skillLower));
      });
      score += (skillMatches.length / extractedSkills.length) * 40;
    }

    // Requirements match (up to 30 points) - optimized
    if (extractedRequirements.length > 0) {
      const requirementMatches = extractedRequirements.filter((req) => {
        const reqLower = req.toLowerCase();
        return (
          profileTitleLower.includes(reqLower) ||
          profileHighlightsLower.some((h) => h.includes(reqLower)) ||
          profileAIDomains.some((d) => d.includes(reqLower)) ||
          profileAIFrameworks.some((f) => f.includes(reqLower))
        );
      });
      score += (requirementMatches.length / extractedRequirements.length) * 30;
    }

    // Experience match (up to 20 points) - unchanged but cached
    if (derivedFilters?.experience) {
      const experienceDiff = Math.abs(
        profile.experience - derivedFilters.experience
      );
      if (experienceDiff <= 2) {
        score += 20;
      } else if (experienceDiff <= 4) {
        score += 15;
      } else if (experienceDiff <= 6) {
        score += 10;
      } else if (profile.experience >= derivedFilters.experience * 0.7) {
        score += 5;
      }
    }

    // Location match (up to 10 points) - optimized with pre-compiled map
    if (derivedFilters?.location) {
      score += this.calculateLocationScore(
        profile.location,
        derivedFilters.location
      );
    }

    // Base quality score if no criteria matched
    if (score === 0) {
      score += this.calculateBaseQualityScore(profile);
    }

    return Math.min(1, Math.max(0, score / maxScore));
  }

  // Helper method for location scoring
  private calculateLocationScore(
    profileLocation: string,
    searchLocation: string
  ): number {
    const locationMap: Record<string, string[]> = {
      bangalore: ["bangalore", "bengaluru", "bangaluru"],
      mumbai: ["mumbai", "bombay"],
      delhi: ["delhi", "new delhi", "ncr"],
      hyderabad: ["hyderabad", "secunderabad"],
      chennai: ["chennai", "madras"],
      pune: ["pune", "puna"],
    };

    const profileLocationLower = profileLocation.toLowerCase();
    const searchLocationLower = searchLocation.toLowerCase();

    if (profileLocationLower === searchLocationLower) {
      return 10;
    }

    for (const [standard, variations] of Object.entries(locationMap)) {
      if (
        variations.includes(searchLocationLower) &&
        variations.includes(profileLocationLower)
      ) {
        return 10;
      }
    }

    return 0;
  }

  // Helper method for base quality scoring
  private calculateBaseQualityScore(profile: TalentProfile): number {
    let score = 0;
    if (profile.skills.length > 0) score += 20;
    if (profile.highlights.length > 0) score += 20;
    if ((profile.aiExperience?.frameworks.length ?? 0) > 0) score += 20;
    if ((profile.aiExperience?.domains.length ?? 0) > 0) score += 20;
    if (profile.experience > 0) score += 20;
    return score;
  }

  // Optimized distribution calculation
  private calculateDistributionsOptimized(profiles: TalentProfile[]): {
    bySeniority: Record<string, number>;
    byLocation: Record<string, number>;
    byAvailability: Record<string, number>;
  } {
    const distributions = {
      bySeniority: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      byAvailability: {} as Record<string, number>,
    };

    // Single pass through profiles for all distributions
    profiles.forEach((profile) => {
      // Seniority distribution
      const seniority = profile.seniority || "unknown";
      distributions.bySeniority[seniority] =
        (distributions.bySeniority[seniority] || 0) + 1;

      // Location distribution
      const location = profile.location || "unknown";
      distributions.byLocation[location] =
        (distributions.byLocation[location] || 0) + 1;

      // Availability distribution
      const availability = profile.availability || "unknown";
      distributions.byAvailability[availability] =
        (distributions.byAvailability[availability] || 0) + 1;
    });

    return distributions;
  } // Get detailed talent profile - optimized for when user clicks on candidate card
  async getTalentDetails(id: string): Promise<TalentProfile | null> {
    try {
      // For GitHub profiles, the "id" is actually the GitHub username (stored in name field)
      // We need to fetch from GitHub by username, not by numeric ID

      // First, try to find the profile by ID to get the username
      // Since this is a details request, we need to convert ID to username
      // For now, we'll assume the frontend should pass the username instead of ID

      // The frontend should pass the 'name' field (GitHub username) as the ID parameter
      // Let's fetch the detailed profile using the username
      const profile = await this.githubService.getUserById(id);
      return profile;
    } catch (error) {
      console.error("Error fetching talent details:", error);
      return null;
    }
  }
}
