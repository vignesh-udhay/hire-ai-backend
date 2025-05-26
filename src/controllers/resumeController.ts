import { Request, Response } from "express";
import { ResumeParserService } from "../services/resumeParserService";
import { SkillMatchingService } from "../services/skillMatchingService";
import { ResumeParseResponse } from "../types/resume";

export class ResumeController {
  private resumeParserService: ResumeParserService;

  constructor() {
    this.resumeParserService = new ResumeParserService();
  }

  /**
   * Upload and parse resume
   * Used by: ResumeUpload.tsx
   */
  parseResume = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded. Please upload a resume file.",
          fileName: "",
          fileType: "",
          processingTime: 0,
        } as ResumeParseResponse);
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          error:
            "Unsupported file type. Please upload PDF, Word document, or text file.",
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          processingTime: Date.now() - startTime,
        } as ResumeParseResponse);
        return;
      }

      // Validate file size (5MB limit)
      if (req.file.size > 5 * 1024 * 1024) {
        res.status(400).json({
          success: false,
          error: "File size too large. Please upload a file smaller than 5MB.",
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          processingTime: Date.now() - startTime,
        } as ResumeParseResponse);
        return;
      }

      // Parse the resume
      const parsedResume = await this.resumeParserService.parseResume(req.file);

      const processingTime = Date.now() - startTime;

      const response: ResumeParseResponse = {
        success: true,
        data: parsedResume,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        processingTime,
      };

      res.json(response);
    } catch (error) {
      console.error("Error parsing resume:", error);

      const processingTime = Date.now() - startTime;

      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to parse resume",
        fileName: req.file?.originalname || "",
        fileType: req.file?.mimetype || "",
        processingTime,
      } as ResumeParseResponse);
    }
  };

  /**
   * Extract skills from uploaded resume file
   * Used by: SkillExtractor.tsx
   */
  extractSkillsFromFile = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded. Please upload a resume file.",
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          error:
            "Unsupported file type. Please upload PDF, Word document, or text file.",
        });
        return;
      }

      // Parse the resume to get the text
      const parsedResume = await this.resumeParserService.parseResume(req.file);
      const resumeText = parsedResume.extractedText;

      if (!resumeText || resumeText.length < 50) {
        res.status(400).json({
          success: false,
          error:
            "Resume text is too short or could not be extracted. Please provide a longer text.",
        });
        return;
      }

      // Extract skills from the text
      const skillsData = await this.resumeParserService.extractSkills(
        resumeText
      );

      res.json({
        success: true,
        data: skillsData,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error extracting skills from file:", error);

      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract skills from file",
      });
    }
  };

  /**
   * Analyze skill match between uploaded resume file and job requirements
   * Used by: SkillMatcher.tsx
   */
  analyzeSkillMatchFromFile = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded. Please upload a resume file.",
        });
        return;
      }

      const { requiredSkills } = req.body;

      if (!requiredSkills) {
        res.status(400).json({
          success: false,
          error: "requiredSkills is required",
        });
        return;
      }

      if (!Array.isArray(requiredSkills)) {
        res.status(400).json({
          success: false,
          error: "requiredSkills must be an array of strings",
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          error:
            "Unsupported file type. Please upload PDF, Word document, or text file.",
        });
        return;
      }

      // Parse the resume to get skills
      const parsedResume = await this.resumeParserService.parseResume(req.file);

      // Extract skills from the resume text for more comprehensive analysis
      const skillsData = await this.resumeParserService.extractSkills(
        parsedResume.extractedText
      );

      // Combine skills from both parsed resume and extracted skills
      const resumeSkills = {
        ...parsedResume.skills,
        ...skillsData,
      };

      const matchAnalysis = SkillMatchingService.calculateSkillMatch(
        resumeSkills,
        requiredSkills
      );

      const suggestions =
        SkillMatchingService.generateSkillSuggestions(resumeSkills);

      res.json({
        success: true,
        data: {
          matchAnalysis,
          suggestions,
          resumeSkills,
          timestamp: new Date().toISOString(),
        },
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error analyzing skill match from file:", error);

      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze skill match from file",
      });
    }
  };

  /**
   * Unified batch resume analysis - processes multiple resumes with full analysis
   * Used by: BatchProcessor.tsx
   */
  batchAnalyzeResumes = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      if (!req.files || !Array.isArray(req.files)) {
        res.status(400).json({
          success: false,
          error: "No files uploaded. Please upload resume files.",
        });
        return;
      }

      const files = req.files as Express.Multer.File[];

      if (files.length > 10) {
        res.status(400).json({
          success: false,
          error: "Maximum 10 files allowed per batch",
        });
        return;
      }

      // Optional required skills for batch matching
      const { requiredSkills } = req.body;
      const shouldAnalyzeSkillMatch =
        requiredSkills &&
        Array.isArray(requiredSkills) &&
        requiredSkills.length > 0;

      const results = await Promise.allSettled(
        files.map(async (file, index) => {
          const fileStartTime = Date.now();

          try {
            // 1. Parse the resume
            const parsedResume = await this.resumeParserService.parseResume(
              file
            );

            // 2. Extract enhanced skills
            const enhancedSkills = await this.resumeParserService.extractSkills(
              parsedResume.extractedText
            );

            // 3. Combine skills
            const combinedSkills = {
              ...parsedResume.skills,
              ...enhancedSkills,
            };

            // 4. Generate talent profile
            const talentProfile = SkillMatchingService.convertToTalentProfile({
              ...parsedResume,
              skills: combinedSkills,
            });

            // 5. Optional skill matching
            let skillMatchAnalysis = null;
            let skillSuggestions = null;

            if (shouldAnalyzeSkillMatch) {
              skillMatchAnalysis = SkillMatchingService.calculateSkillMatch(
                combinedSkills,
                requiredSkills
              );
              skillSuggestions =
                SkillMatchingService.generateSkillSuggestions(combinedSkills);
            }

            const fileProcessingTime = Date.now() - fileStartTime;

            return {
              fileName: file.originalname,
              fileSize: file.size,
              fileType: file.mimetype,
              success: true,
              processingTime: fileProcessingTime,
              data: {
                parsedResume: {
                  ...parsedResume,
                  skills: combinedSkills,
                },
                skillsAnalysis: enhancedSkills,
                talentProfile,
                ...(skillMatchAnalysis && {
                  skillMatch: {
                    analysis: skillMatchAnalysis,
                    suggestions: skillSuggestions,
                  },
                }),
              },
            };
          } catch (error) {
            const fileProcessingTime = Date.now() - fileStartTime;

            return {
              fileName: file.originalname,
              fileSize: file.size,
              fileType: file.mimetype,
              success: false,
              processingTime: fileProcessingTime,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to analyze resume",
            };
          }
        })
      );

      const processedResults = results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            fileName: files[index].originalname,
            fileSize: files[index].size,
            fileType: files[index].mimetype,
            success: false,
            processingTime: 0,
            error: result.reason?.message || "Unknown error",
          };
        }
      });

      const successCount = processedResults.filter((r) => r.success).length;
      const totalProcessingTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          results: processedResults,
          summary: {
            total: files.length,
            successful: successCount,
            failed: files.length - successCount,
            totalProcessingTime,
            averageProcessingTime: Math.round(
              totalProcessingTime / files.length
            ),
            ...(shouldAnalyzeSkillMatch && { requiredSkills }),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in batch resume analysis:", error);

      const totalProcessingTime = Date.now() - startTime;

      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process batch",
        processingTime: totalProcessingTime,
      });
    }
  };
}
