import express, { Request, Response } from "express";
import cors from "cors";
import talentRoutes from "./routes/talentRoutes";
import resumeRoutes from "./routes/resumeRoutes";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const port = config.port;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/api/talent", talentRoutes);
app.use("/api/resume", resumeRoutes);

// Test route
app.get("/", (req: Request, res: Response) => {
  res.json({ 
    message: "Welcome to the AI Recruiter API!",
    features: [
      "Talent Search & Discovery",
      "Resume Parsing & Skill Extraction", 
      "AI-Powered Candidate Matching",
      "Automated Skill Analysis"
    ],
    endpoints: {
      talent: "/api/talent",
      resume: "/api/resume"
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`🚀 AI Recruiter API is running on port ${port}`);
  console.log(`📄 Resume parsing available at http://localhost:${port}/api/resume`);
  console.log(`🔍 Talent search available at http://localhost:${port}/api/talent`);
});
