import { ParsedResume, SkillExtractionResult } from "../types/resume";
import { TalentProfile } from "../types/talent";

export class SkillMatchingService {
  private static skillCategories = {
    frontend: [
      "react",
      "vue",
      "angular",
      "javascript",
      "typescript",
      "html",
      "css",
      "sass",
      "scss",
      "redux",
      "vuex",
      "next.js",
      "nuxt.js",
      "svelte",
      "webpack",
      "vite",
      "tailwind",
    ],
    backend: [
      "node.js",
      "express",
      "fastify",
      "python",
      "django",
      "flask",
      "java",
      "spring",
      "c#",
      ".net",
      "php",
      "laravel",
      "ruby",
      "rails",
      "go",
      "rust",
      "kotlin",
    ],
    database: [
      "mysql",
      "postgresql",
      "mongodb",
      "redis",
      "elasticsearch",
      "sqlite",
      "oracle",
      "sql server",
      "cassandra",
      "dynamodb",
      "firebase",
      "supabase",
    ],
    cloud: [
      "aws",
      "azure",
      "gcp",
      "docker",
      "kubernetes",
      "terraform",
      "jenkins",
      "gitlab ci",
      "github actions",
      "circleci",
      "heroku",
      "vercel",
      "netlify",
    ],
    ai_ml: [
      "tensorflow",
      "pytorch",
      "scikit-learn",
      "pandas",
      "numpy",
      "keras",
      "opencv",
      "langchain",
      "openai",
      "hugging face",
      "transformers",
      "machine learning",
      "deep learning",
      "natural language processing",
      "computer vision",
      "data science",
    ],
    mobile: [
      "react native",
      "flutter",
      "swift",
      "kotlin",
      "ionic",
      "xamarin",
      "cordova",
    ],
  };
  /**
   * Extract skills from a job description
   */
  static extractSkillsFromJobDescription(jobDescription: string): string[] {
    // Convert to lowercase for better matching
    const description = jobDescription.toLowerCase();

    // Initialize an array to store found skills
    const foundSkills: string[] = [];

    // Check each category for skills
    Object.values(this.skillCategories).forEach((categorySkills) => {
      categorySkills.forEach((skill) => {
        if (description.includes(skill.toLowerCase())) {
          foundSkills.push(skill);
        }
      });
    });

    // Remove duplicates and return
    return [...new Set(foundSkills)];
  }

  /**
   * Calculate skill match percentage between resume and job description
   */
  static calculateSkillMatch(
    resumeSkills: ParsedResume["skills"],
    jobDescription: string
  ): {
    overallMatch: number;
    matchedSkills: Array<{
      skill: string;
      required: boolean;
      candidateLevel: string;
      requiredLevel: string;
      match: number;
    }>;
    missingSkills: Array<{
      skill: string;
      importance: string;
      alternatives: string[];
    }>;
    strengthAreas: string[];
    improvementAreas: string[];
    recommendations: string[];
    fitScore: {
      technical: number;
      experience: number;
      overall: number;
    };
    // Legacy fields for backward compatibility
    matchPercentage: number;
    categoryBreakdown: Record<string, { matched: number; total: number }>;
  } {
    // Extract required skills from job description
    const requiredSkills = this.extractSkillsFromJobDescription(jobDescription);

    const allResumeSkills = [
      ...resumeSkills.technical,
      ...resumeSkills.frameworks,
      ...resumeSkills.languages,
      ...resumeSkills.tools,
      ...resumeSkills.databases,
      ...resumeSkills.cloud,
    ].map((skill) => skill.toLowerCase());

    const matchedSkills: Array<{
      skill: string;
      required: boolean;
      candidateLevel: string;
      requiredLevel: string;
      match: number;
    }> = [];

    const missingSkills: Array<{
      skill: string;
      importance: string;
      alternatives: string[];
    }> = [];

    // Analyze each required skill
    requiredSkills.forEach((required) => {
      const originalRequired = requiredSkills[requiredSkills.indexOf(required)];
      const matchedResumeSkill = allResumeSkills.find(
        (resume) => resume.includes(required) || required.includes(resume)
      );

      if (matchedResumeSkill) {
        // Calculate match percentage based on skill similarity
        const similarity = this.calculateSkillSimilarity(
          matchedResumeSkill,
          required
        );
        matchedSkills.push({
          skill: originalRequired,
          required: true,
          candidateLevel: this.inferSkillLevel(
            matchedResumeSkill,
            resumeSkills
          ),
          requiredLevel: this.inferRequiredLevel(required),
          match: similarity,
        });
      } else {
        // Find alternatives for missing skills
        const alternatives = this.findSkillAlternatives(
          required,
          allResumeSkills
        );
        missingSkills.push({
          skill: originalRequired,
          importance: this.determineSkillImportance(required),
          alternatives,
        });
      }
    });

    const matchPercentage =
      requiredSkills.length > 0
        ? (matchedSkills.length / requiredSkills.length) * 100
        : 0;

    // Category breakdown
    const categoryBreakdown = this.getCategoryBreakdown(
      matchedSkills.map((s) => s.skill.toLowerCase()),
      requiredSkills
    );

    // Analyze strengths and areas for improvement
    const strengthAreas = this.identifyStrengthAreas(
      resumeSkills,
      matchedSkills
    );
    const improvementAreas = this.identifyImprovementAreas(
      missingSkills,
      categoryBreakdown
    );
    const recommendations = this.generateRecommendations(
      missingSkills,
      strengthAreas,
      resumeSkills
    );

    // Calculate fit scores
    const technicalFit = this.calculateTechnicalFit(
      matchedSkills,
      requiredSkills
    );
    const experienceFit = this.calculateExperienceFit(resumeSkills);
    const overallFit = (technicalFit + experienceFit) / 2;

    return {
      overallMatch: Math.round(matchPercentage),
      matchedSkills,
      missingSkills,
      strengthAreas,
      improvementAreas,
      recommendations,
      fitScore: {
        technical: Math.round(technicalFit),
        experience: Math.round(experienceFit),
        overall: Math.round(overallFit),
      },
      // Legacy fields for backward compatibility
      matchPercentage: Math.round(matchPercentage),
      categoryBreakdown,
    };
  }

  /**
   * Generate skill suggestions based on current skills and market trends
   */
  static generateSkillSuggestions(skills: ParsedResume["skills"]): {
    recommended: string[];
    trending: string[];
    complementary: string[];
  } {
    const allSkills = [
      ...skills.technical,
      ...skills.frameworks,
      ...skills.languages,
      ...skills.tools,
      ...skills.databases,
      ...skills.cloud,
    ].map((skill) => skill.toLowerCase());

    const recommended: string[] = [];
    const trending = [
      "AI/ML",
      "Kubernetes",
      "GraphQL",
      "TypeScript",
      "Next.js",
      "Rust",
      "Go",
    ];
    const complementary: string[] = [];

    // Frontend developers should learn backend
    if (this.hasSkillsInCategory(allSkills, this.skillCategories.frontend)) {
      recommended.push("Node.js", "Express", "MongoDB", "REST APIs");
    }

    // Backend developers should learn cloud
    if (this.hasSkillsInCategory(allSkills, this.skillCategories.backend)) {
      recommended.push("Docker", "AWS", "Kubernetes", "CI/CD");
    }

    // Add AI/ML suggestions for developers
    if (!this.hasSkillsInCategory(allSkills, this.skillCategories.ai_ml)) {
      complementary.push(
        "Machine Learning",
        "TensorFlow",
        "Python Data Science"
      );
    }

    return {
      recommended: recommended.slice(0, 5),
      trending: trending.slice(0, 5),
      complementary: complementary.slice(0, 5),
    };
  }

  /**
   * Convert parsed resume to talent profile format
   */
  static convertToTalentProfile(
    resume: ParsedResume,
    source: "resume" = "resume"
  ): Partial<TalentProfile> {
    const allSkills = [
      ...resume.skills.technical,
      ...resume.skills.frameworks,
      ...resume.skills.languages,
      ...resume.skills.tools,
      ...resume.skills.databases,
      ...resume.skills.cloud,
    ];

    // Calculate experience years from work history
    const experienceYears = this.calculateExperienceYears(resume.experience);

    // Determine seniority
    const seniority = this.determineSeniority(
      experienceYears,
      resume.experience
    );

    // Create highlights from experience and projects
    const highlights = [
      ...resume.experience
        .slice(0, 2)
        .map(
          (exp) =>
            `${exp.position} at ${exp.company} - ${exp.description[0] || ""}`
        ),
      ...resume.projects
        .slice(0, 2)
        .map((proj) => `${proj.name}: ${proj.description}`),
    ].filter(Boolean);

    return {
      id: `resume_${Date.now()}`,
      name: resume.personalInfo.name,
      title: resume.experience[0]?.position || "Professional",
      experience: experienceYears,
      skills: allSkills,
      location: resume.personalInfo.location,
      availability: "open" as const,
      source,
      matchScore: 0,
      highlights: highlights.slice(0, 3),
      avatar: "",
      summary: resume.summary,
      seniority,
      employmentPreferences: {
        type: "full-time" as const,
        remote: true,
        relocation: false,
      },
      screeningStatus: {
        automated: true,
        score: resume.confidence * 100,
        notes: ["Resume parsed automatically", "Skills extracted using AI"],
        recommended: resume.confidence > 0.7,
      },
    };
  }

  private static hasSkillsInCategory(
    userSkills: string[],
    categorySkills: string[]
  ): boolean {
    return categorySkills.some((catSkill) =>
      userSkills.some(
        (userSkill) =>
          userSkill.includes(catSkill) || catSkill.includes(userSkill)
      )
    );
  }

  private static getCategoryBreakdown(
    matchedSkills: string[],
    requiredSkills: string[]
  ) {
    const breakdown: Record<string, { matched: number; total: number }> = {};

    Object.entries(this.skillCategories).forEach(
      ([category, categorySkills]) => {
        const categoryRequired = requiredSkills.filter((skill) =>
          categorySkills.some(
            (catSkill) => skill.includes(catSkill) || catSkill.includes(skill)
          )
        );

        const categoryMatched = matchedSkills.filter((skill) =>
          categorySkills.some(
            (catSkill) => skill.includes(catSkill) || catSkill.includes(skill)
          )
        );

        if (categoryRequired.length > 0) {
          breakdown[category] = {
            matched: categoryMatched.length,
            total: categoryRequired.length,
          };
        }
      }
    );

    return breakdown;
  }

  private static calculateExperienceYears(
    experiences: ParsedResume["experience"]
  ): number {
    if (experiences.length === 0) return 0;

    let totalMonths = 0;

    experiences.forEach((exp) => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.current ? new Date() : new Date(exp.endDate);

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const months =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth());
        totalMonths += Math.max(0, months);
      }
    });

    return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal place
  }

  private static determineSeniority(
    years: number,
    experiences: ParsedResume["experience"]
  ): "junior" | "mid" | "senior" | "lead" | "principal" {
    const hasLeadership = experiences.some(
      (exp) =>
        exp.position.toLowerCase().includes("lead") ||
        exp.position.toLowerCase().includes("manager") ||
        exp.position.toLowerCase().includes("principal") ||
        exp.description.some(
          (desc) =>
            desc.toLowerCase().includes("team") ||
            desc.toLowerCase().includes("mentor")
        )
    );

    if (years >= 8 && hasLeadership) return "principal";
    if (years >= 6 && hasLeadership) return "lead";
    if (years >= 4) return "senior";
    if (years >= 2) return "mid";
    return "junior";
  }

  private static calculateSkillSimilarity(
    candidateSkill: string,
    requiredSkill: string
  ): number {
    const candidate = candidateSkill.toLowerCase();
    const required = requiredSkill.toLowerCase();

    // Exact match
    if (candidate === required) return 100;

    // Partial match
    if (candidate.includes(required) || required.includes(candidate)) {
      return 80;
    }

    // Similar technologies (basic similarity)
    const similarityMap: Record<string, string[]> = {
      javascript: ["js", "node.js", "typescript", "ts"],
      python: ["py", "django", "flask"],
      java: ["spring", "kotlin"],
      react: ["react.js", "reactjs", "next.js"],
      vue: ["vue.js", "vuejs", "nuxt.js"],
      angular: ["angularjs"],
      aws: ["amazon web services", "ec2", "s3"],
      docker: ["containers", "containerization"],
      kubernetes: ["k8s", "orchestration"],
    };

    for (const [key, alternatives] of Object.entries(similarityMap)) {
      if (
        (candidate === key && alternatives.includes(required)) ||
        (required === key && alternatives.includes(candidate))
      ) {
        return 70;
      }
    }

    return 0;
  }

  private static inferSkillLevel(
    skill: string,
    resumeSkills: ParsedResume["skills"]
  ): string {
    // Simple heuristic: if skill appears in multiple categories, likely advanced
    const skillLower = skill.toLowerCase();
    let appearances = 0;

    if (
      resumeSkills.technical.some((s) => s.toLowerCase().includes(skillLower))
    )
      appearances++;
    if (
      resumeSkills.frameworks.some((s) => s.toLowerCase().includes(skillLower))
    )
      appearances++;
    if (resumeSkills.tools.some((s) => s.toLowerCase().includes(skillLower)))
      appearances++;

    if (appearances >= 2) return "Advanced";
    if (appearances === 1) return "Intermediate";
    return "Beginner";
  }

  private static inferRequiredLevel(skill: string): string {
    // Default assumption for required skills
    return "Required";
  }

  private static findSkillAlternatives(
    missingSkill: string,
    candidateSkills: string[]
  ): string[] {
    const missing = missingSkill.toLowerCase();
    const alternatives: string[] = [];

    // Technology alternatives
    const alternativeMap: Record<string, string[]> = {
      react: ["vue", "angular", "svelte"],
      vue: ["react", "angular"],
      angular: ["react", "vue"],
      mysql: ["postgresql", "mongodb"],
      postgresql: ["mysql", "mongodb"],
      aws: ["azure", "gcp"],
      azure: ["aws", "gcp"],
      docker: ["podman"],
      kubernetes: ["docker swarm"],
    };

    if (alternativeMap[missing]) {
      alternatives.push(
        ...alternativeMap[missing].filter((alt) =>
          candidateSkills.some((skill) => skill.toLowerCase().includes(alt))
        )
      );
    }

    return alternatives.slice(0, 3);
  }

  private static determineSkillImportance(skill: string): string {
    const criticalSkills = [
      "javascript",
      "python",
      "java",
      "react",
      "node.js",
      "sql",
    ];
    const important = ["docker", "aws", "git", "api", "database"];

    const skillLower = skill.toLowerCase();

    if (criticalSkills.some((critical) => skillLower.includes(critical))) {
      return "Critical";
    }
    if (important.some((imp) => skillLower.includes(imp))) {
      return "Important";
    }
    return "Nice to have";
  }

  private static identifyStrengthAreas(
    resumeSkills: ParsedResume["skills"],
    matchedSkills: any[]
  ): string[] {
    const strengths: string[] = [];

    // Identify categories where candidate is strong
    Object.entries(this.skillCategories).forEach(
      ([category, categorySkills]) => {
        const userSkillsInCategory = [
          ...resumeSkills.technical,
          ...resumeSkills.frameworks,
          ...resumeSkills.tools,
        ].filter((skill) =>
          categorySkills.some(
            (catSkill) =>
              skill.toLowerCase().includes(catSkill) ||
              catSkill.includes(skill.toLowerCase())
          )
        );

        if (userSkillsInCategory.length >= 3) {
          strengths.push(category.charAt(0).toUpperCase() + category.slice(1));
        }
      }
    );

    return strengths.slice(0, 3);
  }

  private static identifyImprovementAreas(
    missingSkills: any[],
    categoryBreakdown: any
  ): string[] {
    const improvements: string[] = [];

    // Find categories with many missing skills
    Object.entries(categoryBreakdown).forEach(
      ([category, data]: [string, any]) => {
        const matchRate = data.matched / data.total;
        if (matchRate < 0.5 && data.total >= 2) {
          improvements.push(
            category.charAt(0).toUpperCase() + category.slice(1)
          );
        }
      }
    );

    // Add high-importance missing skills
    missingSkills.forEach((missing) => {
      if (missing.importance === "Critical" && improvements.length < 5) {
        improvements.push(`Learn ${missing.skill}`);
      }
    });

    return improvements.slice(0, 5);
  }

  private static generateRecommendations(
    missingSkills: any[],
    strengthAreas: string[],
    resumeSkills: ParsedResume["skills"]
  ): string[] {
    const recommendations: string[] = [];

    // Prioritize critical missing skills
    const criticalMissing = missingSkills.filter(
      (skill) => skill.importance === "Critical"
    );
    if (criticalMissing.length > 0) {
      recommendations.push(
        `Focus on learning ${criticalMissing[0].skill} as it's critical for this role`
      );
    }

    // Leverage strengths
    if (strengthAreas.length > 0) {
      recommendations.push(
        `Leverage your ${strengthAreas[0].toLowerCase()} expertise to stand out`
      );
    }

    // Suggest complementary skills
    const allSkills = [
      ...resumeSkills.technical,
      ...resumeSkills.frameworks,
      ...resumeSkills.tools,
    ].map((s) => s.toLowerCase());

    if (allSkills.some((skill) => skill.includes("react"))) {
      recommendations.push(
        "Consider learning Next.js to enhance your React skills"
      );
    }

    if (allSkills.some((skill) => skill.includes("javascript"))) {
      recommendations.push(
        "TypeScript would be a valuable addition to your JavaScript skills"
      );
    }

    return recommendations.slice(0, 4);
  }

  private static calculateTechnicalFit(
    matchedSkills: any[],
    requiredSkills: string[]
  ): number {
    if (requiredSkills.length === 0) return 100;

    const weightedScore = matchedSkills.reduce((total, skill) => {
      return total + (skill.match || 0);
    }, 0);

    return Math.min(100, weightedScore / requiredSkills.length);
  }

  private static calculateExperienceFit(
    resumeSkills: ParsedResume["skills"]
  ): number {
    // Simple heuristic based on number of technologies known
    const totalSkills = [
      ...resumeSkills.technical,
      ...resumeSkills.frameworks,
      ...resumeSkills.tools,
      ...resumeSkills.databases,
    ].length;

    // Scale: 0-10 skills = 0-60%, 10+ skills = 60-100%
    if (totalSkills >= 15) return 100;
    if (totalSkills >= 10) return 80;
    if (totalSkills >= 5) return 60;
    return Math.max(20, totalSkills * 10);
  }
}
