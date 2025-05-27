import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { GroqService } from "./groqService";
import {
  ParsedResume,
  WorkExperience,
  Education,
  Project,
  Certification,
  SkillExtractionResult,
} from "../types/resume";

export class ResumeParserService {
  private groqService: GroqService;

  constructor() {
    this.groqService = new GroqService();
  }

  /**
   * Parse resume from uploaded file
   */
  async parseResume(file: Express.Multer.File): Promise<ParsedResume> {
    const startTime = Date.now();

    try {
      // Extract text from file based on type
      let extractedText: string;

      if (file.mimetype === "application/pdf") {
        extractedText = await this.extractTextFromPDF(file.buffer);
      } else if (
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "application/msword"
      ) {
        extractedText = await this.extractTextFromWord(file.buffer);
      } else if (file.mimetype === "text/plain") {
        extractedText = file.buffer.toString("utf-8");
      } else {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
      }

      // Parse resume using AI
      const parsedData = await this.parseResumeWithAI(extractedText);

      const processingTime = Date.now() - startTime;

      return {
        ...parsedData,
        extractedText,
        confidence: this.calculateConfidence(parsedData, extractedText),
      };
    } catch (error) {
      throw new Error(
        `Failed to parse resume: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Extract skills from resume text
   */
  async extractSkills(resumeText: string): Promise<SkillExtractionResult> {
    try {
      const skillsData = await this.extractSkillsWithAI(resumeText);
      return skillsData;
    } catch (error) {
      throw new Error(
        `Failed to extract skills: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Extract text from PDF file
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error("Failed to extract text from PDF");
    }
  }

  /**
   * Extract text from Word document
   */
  private async extractTextFromWord(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error("Failed to extract text from Word document");
    }
  }

  /**
   * Parse resume content using AI
   */
  private async parseResumeWithAI(
    text: string
  ): Promise<Omit<ParsedResume, "extractedText" | "confidence">> {
    try {
      const prompt = `
        Parse the following resume text and extract structured information. Return a JSON response with the following structure:

        {
          "personalInfo": {
            "name": "string",
            "email": "string",
            "phone": "string", 
            "location": "string",
            "linkedin": "string (optional)",
            "github": "string (optional)",
            "portfolio": "string (optional)"
          },
          "summary": "string",
          "skills": {
            "technical": ["array of technical skills"],
            "frameworks": ["array of frameworks/libraries"],
            "languages": ["array of programming languages"],
            "tools": ["array of tools/software"],
            "databases": ["array of databases"],
            "cloud": ["array of cloud platforms/services"]
          },
          "experience": [
            {
              "company": "string",
              "position": "string",
              "location": "string",
              "startDate": "string",
              "endDate": "string", 
              "current": "boolean",
              "description": ["array of job responsibilities"],
              "technologies": ["array of technologies used"]
            }
          ],
          "education": [
            {
              "institution": "string",
              "degree": "string",
              "field": "string",
              "location": "string",
              "startDate": "string",
              "endDate": "string",
              "gpa": "string (optional)",
              "achievements": ["array of achievements"]
            }
          ],
          "projects": [
            {
              "name": "string",
              "description": "string",
              "technologies": ["array of technologies"],
              "duration": "string",
              "url": "string (optional)",
              "github": "string (optional)",
              "highlights": ["array of key highlights"]
            }
          ],
          "certifications": [
            {
              "name": "string",
              "issuer": "string",
              "date": "string",
              "expiryDate": "string (optional)",
              "credentialId": "string (optional)",
              "url": "string (optional)"
            }
          ]
        }        Extract as much information as possible. If information is not available, use empty strings or arrays. For dates, use YYYY-MM-DD format when possible, or the closest approximation.

        Resume text:
        ${text}
      `;

      const response = await this.groqService.parseResumeContent(prompt);

      // Strip markdown code blocks if present (Groq sometimes wraps JSON in ```json...```)
      const cleanedResponse = this.stripMarkdownCodeBlocks(response);

      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Error parsing resume with AI:", error);
      // Return basic structure if AI parsing fails
      return {
        personalInfo: {
          name: "",
          email: "",
          phone: "",
          location: "",
        },
        summary: "",
        skills: {
          technical: [],
          frameworks: [],
          languages: [],
          tools: [],
          databases: [],
          cloud: [],
        },
        experience: [],
        education: [],
        projects: [],
        certifications: [],
      };
    }
  }

  /**
   * Extract skills using AI
   */
  private async extractSkillsWithAI(
    text: string
  ): Promise<SkillExtractionResult> {
    try {
      const prompt = `
        Analyze the following resume text and extract detailed skill information. Return a JSON response with this structure:

        {
          "skills": {
            "technical": ["array of core technical skills"],
            "frameworks": ["array of frameworks and libraries"],
            "languages": ["array of programming languages"],
            "tools": ["array of development tools and software"],
            "databases": ["array of database technologies"],
            "cloud": ["array of cloud platforms and services"]
          },
          "experience": {
            "totalYears": "number of total years of experience",
            "seniority": "junior|mid|senior|lead|principal",
            "primaryRole": "string describing primary role/specialization",
            "industries": ["array of industries worked in"]
          },
          "confidence": "number between 0 and 1",
          "suggestions": ["array of skill development suggestions"]
        }        Be thorough in skill extraction and classify them appropriately. Determine seniority based on years of experience and complexity of projects.

        Resume text:
        ${text}
      `;

      const response = await this.groqService.parseResumeContent(prompt);

      // Strip markdown code blocks if present (Groq sometimes wraps JSON in ```json...```)
      const cleanedResponse = this.stripMarkdownCodeBlocks(response);

      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Error extracting skills with AI:", error);
      return {
        skills: {
          technical: [],
          frameworks: [],
          languages: [],
          tools: [],
          databases: [],
          cloud: [],
        },
        experience: {
          totalYears: 0,
          seniority: "junior",
          primaryRole: "",
          industries: [],
        },
        confidence: 0,
        suggestions: [],
      };
    }
  }

  /**
   * Calculate confidence score for parsed resume
   */
  private calculateConfidence(
    parsedData: Omit<ParsedResume, "extractedText" | "confidence">,
    text: string
  ): number {
    let score = 0;
    const maxScore = 100;

    // Personal info completeness (20 points)
    if (parsedData.personalInfo.name) score += 5;
    if (parsedData.personalInfo.email) score += 5;
    if (parsedData.personalInfo.phone) score += 5;
    if (parsedData.personalInfo.location) score += 5;

    // Skills extraction (25 points)
    const totalSkills = Object.values(parsedData.skills).flat().length;
    score += Math.min(25, totalSkills * 2);

    // Experience section (25 points)
    if (parsedData.experience.length > 0) {
      score += 15;
      if (parsedData.experience.some((exp) => exp.description.length > 0))
        score += 10;
    }

    // Education section (15 points)
    if (parsedData.education.length > 0) {
      score += 10;
      if (parsedData.education.some((edu) => edu.degree && edu.institution))
        score += 5;
    }

    // Projects section (10 points)
    if (parsedData.projects.length > 0) score += 10; // Summary section (5 points)
    if (parsedData.summary && parsedData.summary.length > 50) score += 5;

    return Math.min(1, score / maxScore);
  }

  /**
   * Strip markdown code blocks from AI response
   * Handles cases where Groq returns JSON wrapped in ```json...```
   */
  private stripMarkdownCodeBlocks(response: string): string {
    // Remove markdown code blocks (```json...``` or ```...```)
    const codeBlockPattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
    const match = response.trim().match(codeBlockPattern);

    if (match) {
      return match[1].trim();
    }

    // If no code blocks found, return the original response
    return response.trim();
  }
}
