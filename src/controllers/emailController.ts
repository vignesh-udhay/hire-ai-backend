import { Request, Response } from "express";
import { sendCandidateOutreach } from "../services/emailService";
import { GroqService } from "../services/groqService";

const groqService = new GroqService();

export const generateOutreachMessage = async (req: Request, res: Response) => {
  try {
    const { candidate, roleTitle, companyName } = req.body;

    if (!candidate || !roleTitle || !companyName) {
      return res.status(400).json({
        error:
          "Missing required fields: candidate, roleTitle, and companyName are required",
      });
    }

    console.log("Generating outreach message for:", {
      candidate,
      roleTitle,
      companyName,
    });

    const { subject, message } = await groqService.generateOutreachEmail(
      candidate,
      roleTitle,
      companyName
    );

    console.log("Generated message:", { subject, message });

    res.json({
      subject,
      message,
    });
  } catch (error) {
    console.error("Error generating outreach message:", error);
    // Send more detailed error information
    res.status(500).json({
      error: "Failed to generate outreach message",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const sendOutreachEmail = async (req: Request, res: Response) => {
  try {
    const { candidateId, subject, message } = req.body;

    if (!candidateId || !subject || !message) {
      return res.status(400).json({
        error:
          "Missing required fields: candidateId, subject, and message are required",
      });
    }

    // TODO: Get candidate email from database
    // For now, we'll use a placeholder email
    const candidateEmail = `${candidateId}@example.com`;

    await sendCandidateOutreach(candidateEmail, subject, message);

    res.json({
      success: true,
      message: "Outreach email sent successfully",
    });
  } catch (error) {
    console.error("Error sending outreach email:", error);
    res.status(500).json({
      error: "Failed to send outreach email",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
