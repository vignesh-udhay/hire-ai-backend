import { Request, Response } from "express";
import { TalentSearchService } from "../services/talentSearch";
import { TalentSearchQuery } from "../types/talent";

export class TalentController {
  private talentSearchService: TalentSearchService;

  constructor() {
    this.talentSearchService = new TalentSearchService();
  }

  searchTalent = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate required fields
      if (!req.body.query) {
        res.status(400).json({
          error: "Missing required field",
          details: "The 'query' field is required",
        });
        return;
      }

      // Validate and sanitize input
      const query: TalentSearchQuery = {
        query: req.body.query.trim(),
        filters: req.body.filters
          ? {
              experience: req.body.filters.experience
                ? Number(req.body.filters.experience)
                : undefined,
              skills: Array.isArray(req.body.filters.skills)
                ? req.body.filters.skills
                : undefined,
              location: req.body.filters.location
                ? req.body.filters.location.trim()
                : undefined,
              availability: req.body.filters.availability,
              employmentType: req.body.filters.employmentType,
              seniority: req.body.filters.seniority,
              aiExperience: req.body.filters.aiExperience
                ? {
                    frameworks: Array.isArray(
                      req.body.filters.aiExperience.frameworks
                    )
                      ? req.body.filters.aiExperience.frameworks
                      : undefined,
                    domains: Array.isArray(
                      req.body.filters.aiExperience.domains
                    )
                      ? req.body.filters.aiExperience.domains
                      : undefined,
                    years: req.body.filters.aiExperience.years
                      ? Number(req.body.filters.aiExperience.years)
                      : undefined,
                  }
                : undefined,
            }
          : undefined,
        limit: req.body.limit ? Number(req.body.limit) : 10,
        offset: req.body.offset ? Number(req.body.offset) : 0,
      };

      const results = await this.talentSearchService.searchTalent(query);
      res.json(results);
    } catch (error) {
      console.error("Error in talent search:", error);
      res.status(500).json({
        error: "An error occurred while searching for talent",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
