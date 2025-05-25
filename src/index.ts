import express, { Request, Response } from "express";
import cors from "cors";
import talentRoutes from "./routes/talentRoutes";
import { config } from "./config";

const app = express();
const port = config.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/talent", talentRoutes);

// Test route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Express application!" });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
