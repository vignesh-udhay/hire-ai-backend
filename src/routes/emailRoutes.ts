import { Router } from "express";
import {
  sendOutreachEmail,
  generateOutreachMessage,
} from "../controllers/emailController";

const router = Router();

router.post("/outreach", sendOutreachEmail);
router.post("/generate", generateOutreachMessage);

export default router;
