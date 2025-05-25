export interface TalentSearchQuery {
  query: string;
  filters?: {
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

export interface TalentProfile {
  id: string;
  name: string;
  title: string;
  experience: number;
  skills: string[];
  location: string;
  availability: "immediate" | "notice" | "open";
  source: "linkedin" | "github" | "portfolio" | "resume";
  matchScore: number;
  highlights: string[];
  aiExperience: {
    years: number;
    frameworks: string[];
    domains: string[];
    projects: AIProject[];
  };
  employmentPreferences: {
    type: "full-time" | "contract" | "part-time";
    remote: boolean;
    relocation: boolean;
  };
  seniority: "junior" | "mid" | "senior" | "lead" | "principal";
  screeningStatus: {
    automated: boolean;
    score: number;
    notes: string[];
    recommended: boolean;
  };
}

export interface TalentSearchResponse {
  results: TalentProfile[];
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
