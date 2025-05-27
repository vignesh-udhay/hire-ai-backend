import { Router } from "express";
import { TalentController } from "../controllers/talentController";

const router = Router();
const talentController = new TalentController();

router.post("/search", talentController.searchTalent);
router.get("/details/:id", talentController.getTalentDetails);
router.get("/insights", talentController.getTalentInsights);

export default router;
