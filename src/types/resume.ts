export interface ParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  skills: {
    technical: string[];
    frameworks: string[];
    languages: string[];
    tools: string[];
    databases: string[];
    cloud: string[];
  };
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  extractedText: string;
  confidence: number;
}

export interface WorkExperience {
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
  technologies: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  duration: string;
  url?: string;
  github?: string;
  highlights: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface ResumeUploadRequest {
  file: Express.Multer.File;
}

export interface ResumeParseResponse {
  success: boolean;
  data?: ParsedResume;
  error?: string;
  fileName: string;
  fileType: string;
  processingTime: number;
}

export interface SkillExtractionResult {
  skills: {
    technical: string[];
    frameworks: string[];
    languages: string[];
    tools: string[];
    databases: string[];
    cloud: string[];
  };
  experience: {
    totalYears: number;
    seniority: "junior" | "mid" | "senior" | "lead" | "principal";
    primaryRole: string;
    industries: string[];
  };
  confidence: number;
  suggestions: string[];
}
