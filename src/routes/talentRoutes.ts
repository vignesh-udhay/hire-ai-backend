import { Router } from "express";
import { TalentController } from "../controllers/talentController";

const router = Router();
const talentController = new TalentController();

router.post("/search", talentController.searchTalent);

export default router;
