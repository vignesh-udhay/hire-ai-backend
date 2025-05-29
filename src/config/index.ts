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

// Email configuration validation (optional for development)
if (process.env.NODE_ENV === "production") {
  const requiredEmailVars = ["EMAIL_USER", "EMAIL_PASSWORD"] as const;
  for (const envVar of requiredEmailVars) {
    if (!process.env[envVar]) {
      console.warn(`Missing email environment variable: ${envVar}. Email functionality will use test mode.`);
    }
  }
}

// Export configuration
export const config = {
  groq: {
    apiKey: process.env.GROQ_API_KEY!,
  },
  github: {
    token: process.env.GITHUB_TOKEN!,
  },
  port: process.env.PORT || 2000,
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    from: process.env.EMAIL_FROM || "noreply@yourcompany.com",
  },
} as const;
