import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["GROQ_API_KEY", "GITHUB_TOKEN"] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Export configuration
export const config = {
  groq: {
    apiKey: process.env.GROQ_API_KEY!,
  },
  port: process.env.PORT || 2000,
} as const;
