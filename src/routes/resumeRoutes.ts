import { Router } from "express";
import multer from "multer";
import { ResumeController } from "../controllers/resumeController";

const router = Router();
const resumeController = new ResumeController();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

// Used endpoints only
router.post("/parse", upload.single("resume"), resumeController.parseResume);
router.post(
  "/extract-skills-from-file",
  upload.single("resume"),
  resumeController.extractSkillsFromFile
);
router.post(
  "/analyze-skill-match-from-file",
  upload.single("resume"),
  resumeController.analyzeSkillMatchFromFile
);
router.post(
  "/batch-analyze",
  upload.array("resumes", 10),
  resumeController.batchAnalyzeResumes
);

export default router;
