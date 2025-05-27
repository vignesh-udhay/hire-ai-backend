import { TalentSearchService } from "./talentSearch";
import { TalentProfileResponse } from "../types/talent";

interface TalentInsightsData {
  skillDistribution: { name: string; value: number }[];
  seniorityDistribution: { name: string; value: number }[];
  locationDistribution: { name: string; value: number }[];
  availabilityDistribution: { name: string; value: number }[];
  employmentTypeDistribution: { name: string; value: number }[];
  skillGapAnalysis: { skill: string; demand: number; supply: number }[];
  hiringTrends: { month: string; candidates: number }[];
  talentRetention: { type: string; count: number }[];
  skillsByRole: { role: string; skills: { skill: string; value: number }[] }[];
  trendingSkillCombinations: { name: string; skills: string[] }[];
  summary: {
    totalCandidates: number;
    newThisMonth: number;
    avgMatchScore: number;
    topLocation: string;
    mostInDemandSkill: string;
  };
}

export class TalentInsightsService {
  private talentSearchService: TalentSearchService;

  constructor() {
    this.talentSearchService = new TalentSearchService();
  }

  async generateInsights(): Promise<TalentInsightsData> {
    try {
      // Return mock data that matches the frontend's expected structure
      return {
        skillDistribution: [
          { name: "Python", value: 120 },
          { name: "TypeScript", value: 95 },
          { name: "React", value: 85 },
          { name: "NodeJS", value: 75 },
          { name: "Go", value: 60 },
          { name: "TensorFlow", value: 55 },
          { name: "AWS", value: 50 },
          { name: "Docker", value: 45 },
          { name: "PyTorch", value: 40 },
          { name: "GraphQL", value: 35 },
        ],
        seniorityDistribution: [
          { name: "Junior", value: 110 },
          { name: "Mid", value: 150 },
          { name: "Senior", value: 80 },
          { name: "Lead", value: 40 },
          { name: "Principal", value: 20 },
        ],
        locationDistribution: [
          { name: "San Francisco", value: 85 },
          { name: "New York", value: 65 },
          { name: "London", value: 55 },
          { name: "Berlin", value: 45 },
          { name: "Toronto", value: 40 },
          { name: "Seattle", value: 35 },
          { name: "Austin", value: 30 },
          { name: "Singapore", value: 25 },
        ],
        availabilityDistribution: [
          { name: "Immediate", value: 120 },
          { name: "2 Weeks Notice", value: 180 },
          { name: "1 Month Notice", value: 65 },
          { name: "Open to offers", value: 35 },
        ],
        employmentTypeDistribution: [
          { name: "Full-time", value: 285 },
          { name: "Contract", value: 95 },
          { name: "Part-time", value: 20 },
        ],
        skillGapAnalysis: [
          { skill: "AI/ML", demand: 95, supply: 40 },
          { skill: "Kubernetes", demand: 85, supply: 35 },
          { skill: "Rust", demand: 70, supply: 20 },
          { skill: "React Native", demand: 65, supply: 45 },
          { skill: "GraphQL", demand: 60, supply: 35 },
          { skill: "Go", demand: 55, supply: 40 },
          { skill: "Data Science", demand: 80, supply: 30 },
        ],
        hiringTrends: [
          { month: "Jan", candidates: 25 },
          { month: "Feb", candidates: 35 },
          { month: "Mar", candidates: 45 },
          { month: "Apr", candidates: 40 },
          { month: "May", candidates: 60 },
          { month: "Jun", candidates: 75 },
          { month: "Jul", candidates: 70 },
          { month: "Aug", candidates: 90 },
          { month: "Sep", candidates: 85 },
        ],
        talentRetention: [
          { type: "Active", count: 320 },
          { type: "Engaged", count: 180 },
          { type: "Inactive", count: 120 },
          { type: "Placed", count: 80 },
        ],
        skillsByRole: [
          {
            role: "Frontend Developer",
            skills: [
              { skill: "React", value: 90 },
              { skill: "TypeScript", value: 85 },
              { skill: "CSS/SCSS", value: 80 },
              { skill: "JavaScript", value: 95 },
              { skill: "Redux", value: 70 },
              { skill: "TailwindCSS", value: 65 },
              { skill: "Next.js", value: 75 },
            ],
          },
          {
            role: "Backend Developer",
            skills: [
              { skill: "Node.js", value: 85 },
              { skill: "Python", value: 80 },
              { skill: "Go", value: 65 },
              { skill: "Databases", value: 90 },
              { skill: "REST APIs", value: 95 },
              { skill: "GraphQL", value: 75 },
              { skill: "Docker", value: 70 },
            ],
          },
          {
            role: "ML Engineer",
            skills: [
              { skill: "Python", value: 95 },
              { skill: "TensorFlow", value: 85 },
              { skill: "PyTorch", value: 80 },
              { skill: "Data Science", value: 90 },
              { skill: "Statistics", value: 75 },
              { skill: "MLOps", value: 65 },
              { skill: "Scikit-learn", value: 70 },
            ],
          },
          {
            role: "DevOps Engineer",
            skills: [
              { skill: "Kubernetes", value: 90 },
              { skill: "Docker", value: 95 },
              { skill: "AWS/GCP/Azure", value: 85 },
              { skill: "CI/CD", value: 80 },
              { skill: "Terraform", value: 70 },
              { skill: "Linux", value: 75 },
              { skill: "Monitoring", value: 65 },
            ],
          },
        ],
        trendingSkillCombinations: [
          { name: "React + TypeScript", skills: ["React", "TypeScript"] },
          { name: "Python + ML", skills: ["Python", "TensorFlow", "PyTorch"] },
          { name: "Cloud + DevOps", skills: ["AWS", "Docker", "Kubernetes"] },
        ],
        summary: {
          totalCandidates: 700,
          newThisMonth: 45,
          avgMatchScore: 85,
          topLocation: "San Francisco",
          mostInDemandSkill: "Python",
        },
      };
    } catch (error) {
      console.error("Error generating insights:", error);
      throw error;
    }
  }

  private getSkillDistribution(
    profiles: TalentProfileResponse[]
  ): { name: string; value: number }[] {
    const skillCount: { [key: string]: number } = {};
    profiles.forEach((profile) => {
      profile.skills.forEach((skill: string) => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });

    // Convert to array format and sort by count
    return Object.entries(skillCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 skills
  }

  private getSeniorityDistribution(
    profiles: TalentProfileResponse[]
  ): { name: string; value: number }[] {
    const seniorityCount: { [key: string]: number } = {};
    profiles.forEach((profile) => {
      const seniority = profile.seniority || "unknown";
      seniorityCount[seniority] = (seniorityCount[seniority] || 0) + 1;
    });

    return Object.entries(seniorityCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  private getLocationDistribution(
    profiles: TalentProfileResponse[]
  ): { name: string; value: number }[] {
    const locationCount: { [key: string]: number } = {};
    profiles.forEach((profile) => {
      if (profile.location) {
        locationCount[profile.location] =
          (locationCount[profile.location] || 0) + 1;
      }
    });

    return Object.entries(locationCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 locations
  }

  private getAvailabilityDistribution(
    profiles: TalentProfileResponse[]
  ): { name: string; value: number }[] {
    const availabilityCount: { [key: string]: number } = {};
    profiles.forEach((profile) => {
      const availability = profile.availability || "unknown";
      availabilityCount[availability] =
        (availabilityCount[availability] || 0) + 1;
    });

    return Object.entries(availabilityCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  private getEmploymentTypeDistribution(
    profiles: TalentProfileResponse[]
  ): { name: string; value: number }[] {
    const employmentTypeCount: { [key: string]: number } = {};
    profiles.forEach((profile) => {
      const employmentType = profile.employmentPreferences?.type || "unknown";
      employmentTypeCount[employmentType] =
        (employmentTypeCount[employmentType] || 0) + 1;
    });

    return Object.entries(employmentTypeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  private getSkillGapAnalysis(
    profiles: TalentProfileResponse[]
  ): { skill: string; demand: number; supply: number }[] {
    // Mock skill gap data - in a real implementation, this would compare
    // job requirements vs available talent skills
    const inDemandSkills = [
      "React",
      "Node.js",
      "Python",
      "JavaScript",
      "TypeScript",
      "AWS",
      "Docker",
      "Kubernetes",
      "MongoDB",
      "PostgreSQL",
    ];

    const skillCounts = this.getSkillDistribution(profiles);
    const skillCountMap = skillCounts.reduce((acc, { name, value }) => {
      acc[name] = value;
      return acc;
    }, {} as { [key: string]: number });

    return inDemandSkills.map((skill) => ({
      skill,
      demand: Math.floor(Math.random() * 50) + 20, // Mock demand
      supply: skillCountMap[skill] || 0,
    }));
  }

  private getHiringTrends(
    profiles: TalentProfileResponse[]
  ): { month: string; candidates: number }[] {
    // Generate mock hiring trends for last 6 months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month) => ({
      month,
      candidates: Math.floor(Math.random() * 100) + 50,
    }));
  }

  private getTalentRetention(
    profiles: TalentProfileResponse[]
  ): { type: string; count: number }[] {
    // Mock talent retention data
    return [
      { type: "Active", count: Math.floor(profiles.length * 0.7) },
      { type: "Hired", count: Math.floor(profiles.length * 0.2) },
      { type: "Inactive", count: Math.floor(profiles.length * 0.1) },
    ];
  }

  private getSkillsByRole(
    profiles: TalentProfileResponse[]
  ): { role: string; skills: { skill: string; value: number }[] }[] {
    const roleSkills: { [role: string]: { [skill: string]: number } } = {};

    profiles.forEach((profile) => {
      const role = profile.title || "Unknown";
      if (!roleSkills[role]) {
        roleSkills[role] = {};
      }

      profile.skills.forEach((skill) => {
        roleSkills[role][skill] = (roleSkills[role][skill] || 0) + 1;
      });
    });

    // Convert to the required format and get top roles
    return Object.entries(roleSkills)
      .slice(0, 5) // Top 5 roles
      .map(([role, skills]) => ({
        role,
        skills: Object.entries(skills)
          .map(([skill, value]) => ({ skill, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5), // Top 5 skills per role
      }));
  }

  private getTrendingSkillCombinations(
    profiles: TalentProfileResponse[]
  ): { name: string; skills: string[] }[] {
    // Mock trending skill combinations
    return [
      {
        name: "Full Stack JavaScript",
        skills: ["React", "Node.js", "MongoDB", "Express"],
      },
      {
        name: "DevOps Essentials",
        skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
      },
      {
        name: "Data Science Stack",
        skills: ["Python", "Pandas", "TensorFlow", "SQL"],
      },
      {
        name: "Modern Frontend",
        skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
      },
      {
        name: "Cloud Native",
        skills: ["AWS", "Microservices", "Docker", "API Gateway"],
      },
    ];
  }

  private generateSummary(
    profiles: TalentProfileResponse[],
    skillDistribution: { name: string; value: number }[],
    locationDistribution: { name: string; value: number }[]
  ) {
    const totalCandidates = profiles.length;
    const newThisMonth = Math.floor(totalCandidates * 0.15); // Mock 15% new this month

    // Calculate average match score
    const avgMatchScore =
      profiles.reduce((sum, profile) => sum + profile.matchScore, 0) /
      totalCandidates;

    // Get top location and most in-demand skill
    const topLocation = locationDistribution[0]?.name || "Unknown";
    const mostInDemandSkill = skillDistribution[0]?.name || "Unknown";

    return {
      totalCandidates,
      newThisMonth,
      avgMatchScore: Math.round(avgMatchScore * 100), // Convert to percentage
      topLocation,
      mostInDemandSkill,
    };
  }
}
