import { Request, Response } from "express";
import { sendCandidateOutreach } from "../services/emailService";
import { GroqService } from "../services/groqService";

const groqService = new GroqService();

export const generateOutreachMessage = async (req: Request, res: Response) => {
  try {
    const { candidate, roleTitle, companyName, recruiterName, recruiterTitle } =
      req.body;

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
      recruiterName,
      recruiterTitle,
    });

    const { subject, message } = await groqService.generateOutreachEmail(
      candidate,
      roleTitle,
      companyName,
      recruiterName,
      recruiterTitle
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
    const { candidateId, recipientEmail, subject, message } = req.body;

    if (!candidateId || !recipientEmail || !subject || !message) {
      return res.status(400).json({
        error:
          "Missing required fields: candidateId, recipientEmail, subject, and message are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({
        error: "Invalid email format for recipientEmail",
      });
    }

    await sendCandidateOutreach(recipientEmail, subject, message);

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
