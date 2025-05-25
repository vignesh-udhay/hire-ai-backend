export interface TalentSearchQuery {
  query: string;
  limit?: number;
  offset?: number;
}

export interface AIProject {
  name: string;
  description: string;
  technologies: string[];
  impact: string;
  year: number;
}

export interface AIExperience {
  years: number;
  frameworks: string[];
  domains: string[];
  projects: AIProject[];
}

export interface EmploymentPreferences {
  type: "full-time" | "contract" | "part-time";
  remote: boolean;
  relocation: boolean;
}

export interface ScreeningStatus {
  automated: boolean;
  score: number;
  notes: string[];
  recommended: boolean;
}

// Internal profile type used in services
export interface TalentProfile {
  id: string;
  name: string;
  title: string;
  experience: number; // Stored as number internally
  skills: string[];
  location: string;
  availability: "immediate" | "notice" | "open";
  source: "linkedin" | "github" | "portfolio" | "resume";
  matchScore: number;
  highlights: string[];
  avatar: string;
  summary: string;
  aiExperience?: AIExperience;
  employmentPreferences?: EmploymentPreferences;
  seniority?: "junior" | "mid" | "senior" | "lead" | "principal";
  screeningStatus?: ScreeningStatus;
}

// Response type for API endpoints
export interface TalentProfileResponse {
  id: string;
  name: string;
  title: string;
  experience: string; // Formatted as string for display
  skills: string[];
  location: string;
  availability: "immediate" | "notice" | "open";
  source: "linkedin" | "github" | "portfolio" | "resume";
  matchScore: number;
  highlights: string[];
  avatar: string;
  summary: string;
  aiExperience?: AIExperience;
  employmentPreferences?: EmploymentPreferences;
  seniority?: "junior" | "mid" | "senior" | "lead" | "principal";
  screeningStatus?: ScreeningStatus;
}

export interface TalentSearchResponse {
  results: TalentProfileResponse[];
  total: number;
  page: number;
  limit: number;
  searchMetadata: {
    queryUnderstanding: {
      extractedSkills: string[];
      extractedRequirements: string[];
      confidence: number;
    };
    matchDistribution: {
      bySeniority: Record<string, number>;
      byLocation: Record<string, number>;
      byAvailability: Record<string, number>;
    };
  };
}
