import { ZodError } from "zod";
import multer from "multer";

export function errorMiddleware(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed on incoming request payload.",
      errors: formattedErrors,
    });
  }

  // 2. Multer Upload Error
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Uploaded image file exceeds the 10 MB limit.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // 3. Custom file filter error from multer
  if (err.message && err.message.includes("Unsupported file type")) {
    return res.status(415).json({
      success: false,
      message: err.message,
    });
  }

  // 4. Fallback Generic Internal Error
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error occurred.",
  });
}

