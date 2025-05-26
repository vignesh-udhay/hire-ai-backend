import { Request, Response, NextFunction } from "express";
import multer from "multer";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        error: "File size too large. Maximum size is 5MB.",
        code: "FILE_TOO_LARGE"
      });
      return;
    }
    
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400).json({
        success: false,
        error: "Unexpected file field. Please use 'resume' as the field name.",
        code: "UNEXPECTED_FILE"
      });
      return;
    }
  }

  if (error.message === "Unsupported file type") {
    res.status(400).json({
      success: false,
      error: "Unsupported file type. Please upload PDF, Word document, or text file.",
      code: "UNSUPPORTED_FILE_TYPE"
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR"
  });
};
