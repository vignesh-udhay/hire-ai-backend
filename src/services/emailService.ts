import nodemailer from "nodemailer";
import { config } from "../config";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: config.email.from,
      ...options,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

export const sendCandidateOutreach = async (
  candidateEmail: string,
  subject: string,
  message: string
): Promise<void> => {
  await sendEmail({
    to: candidateEmail,
    subject,
    text: message,
    html: message.replace(/\n/g, "<br>"),
  });
};
