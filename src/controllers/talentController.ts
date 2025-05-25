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
                ? {
                    min: Number(req.body.filters.experience.min) || 0,
                    max: Number(req.body.filters.experience.max) || 0,
                  }
                : undefined,
              skills: Array.isArray(req.body.filters.skills)
                ? req.body.filters.skills
                : undefined,
              location: req.body.filters.location
                ? {
                    city: req.body.filters.location.city?.trim() || "",
                    remote: Boolean(req.body.filters.location.remote),
                  }
                : undefined,
              employmentType: req.body.filters.employmentType,
              seniority: req.body.filters.seniority,
            }
          : undefined,
        limit: req.body.limit ? Number(req.body.limit) : 10,
        offset: req.body.offset ? Number(req.body.offset) : 0,
      };

      const results = await this.talentSearchService.searchTalent(query);

      // Return only the minimal data needed for the candidate cards
      const minimalResults = {
        results: results.results.map((profile) => ({
          id: profile.id,
          name: profile.name,
          role: profile.title,
          company: profile.source === "github" ? "GitHub" : profile.source,
          location: profile.location,
          experience: `${profile.experience} years`,
          skills: profile.skills,
          matchScore: profile.matchScore,
          avatar: profile.avatar, // Use the avatar from the profile (GitHub avatar_url)
          summary: profile.highlights[0] || profile.summary || "",
          seniority: profile.seniority,
          employmentPreferences: profile.employmentPreferences,
          screeningStatus: profile.screeningStatus,
        })),
        total: results.total,
        page: results.page,
        limit: results.limit,
        searchMetadata: results.searchMetadata,
      };

      res.json(minimalResults);
    } catch (error) {
      console.error("Error in talent search:", error);
      res.status(500).json({
        error: "An error occurred while searching for talent",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getTalentDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          error: "Missing required field",
          details: "The 'id' parameter is required",
        });
        return;
      }

      // For GitHub profiles, the id parameter is actually the username
      const profile = await this.talentSearchService.getTalentDetails(id);
      if (!profile) {
        res.status(404).json({
          error: "Not found",
          details: "Talent profile not found",
        });
        return;
      }

      // Transform the profile to match the expected response format
      const detailedProfile = {
        id: profile.id,
        name: profile.name,
        title: profile.title,
        experience: `${profile.experience} years`, // Format experience as string
        skills: profile.skills,
        location: profile.location,
        availability: profile.availability,
        source: profile.source,
        matchScore: profile.matchScore,
        highlights: profile.highlights,
        avatar: profile.avatar,
        summary: profile.summary,
        aiExperience: profile.aiExperience,
        employmentPreferences: profile.employmentPreferences,
        seniority: profile.seniority,
        screeningStatus: profile.screeningStatus,
      };

      res.json(detailedProfile);
    } catch (error) {
      console.error("Error fetching talent details:", error);
      res.status(500).json({
        error: "An error occurred while fetching talent details",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
