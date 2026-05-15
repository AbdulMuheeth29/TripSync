/**
 * File Upload Routes
 * Handles image and document uploads to cloud storage
 */

import type { Express, Request, Response } from "express";
import multer from "multer";
import { cloudStorage } from "./cloud-storage";
import { requireAuth } from "./auth";
import { getParam } from "./route-utils";

// File size limits
const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/webp",
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
});

/**
 * Validate file type
 */
function validateFileType(
  file: Express.Multer.File,
  allowedTypes: string[]
): void {
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(
      `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
    );
  }
}

export function registerUploadRoutes(app: Express) {
  /**
   * Upload a trip photo
   */
  app.post(
    "/api/upload/photo",
    requireAuth,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!cloudStorage.isAvailable()) {
          return res.status(503).json({
            error: "File upload not configured",
            code: "UPLOAD_UNAVAILABLE",
          });
        }

        const file = req.file;
        if (!file) {
          return res.status(400).json({
            error: "No file provided",
            code: "NO_FILE",
          });
        }

        // Validate file type
        validateFileType(file, ALLOWED_IMAGE_TYPES);

        // Upload to cloud storage
        const result = await cloudStorage.uploadFile(
          file.buffer,
          file.originalname,
          {
            folder: "photos",
            contentType: file.mimetype,
            maxSizeBytes: MAX_IMAGE_SIZE,
          }
        );

        res.json({
          url: result.publicUrl || result.url,
          key: result.key,
        });
      } catch (error) {
        console.error("Photo upload error:", error);
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Failed to upload photo",
          code: "UPLOAD_FAILED",
        });
      }
    }
  );

  /**
   * Upload a document (receipt, confirmation, boarding pass, etc.)
   */
  app.post(
    "/api/upload/document",
    requireAuth,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!cloudStorage.isAvailable()) {
          return res.status(503).json({
            error: "File upload not configured",
            code: "UPLOAD_UNAVAILABLE",
          });
        }

        const file = req.file;
        if (!file) {
          return res.status(400).json({
            error: "No file provided",
            code: "NO_FILE",
          });
        }

        // Validate file type
        validateFileType(file, ALLOWED_DOCUMENT_TYPES);

        // Upload to cloud storage
        const result = await cloudStorage.uploadFile(
          file.buffer,
          file.originalname,
          {
            folder: "documents",
            contentType: file.mimetype,
            maxSizeBytes: MAX_DOCUMENT_SIZE,
          }
        );

        res.json({
          url: result.publicUrl || result.url,
          key: result.key,
        });
      } catch (error) {
        console.error("Document upload error:", error);
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : "Failed to upload document",
          code: "UPLOAD_FAILED",
        });
      }
    }
  );

  /**
   * Upload a receipt image
   */
  app.post(
    "/api/upload/receipt",
    requireAuth,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!cloudStorage.isAvailable()) {
          return res.status(503).json({
            error: "File upload not configured",
            code: "UPLOAD_UNAVAILABLE",
          });
          }

        const file = req.file;
        if (!file) {
          return res.status(400).json({
            error: "No file provided",
            code: "NO_FILE",
          });
        }

        // Validate file type
        validateFileType(file, ALLOWED_IMAGE_TYPES);

        // Upload to cloud storage
        const result = await cloudStorage.uploadFile(
          file.buffer,
          file.originalname,
          {
            folder: "receipts",
            contentType: file.mimetype,
            maxSizeBytes: MAX_DOCUMENT_SIZE,
          }
        );

        res.json({
          url: result.publicUrl || result.url,
          key: result.key,
        });
      } catch (error) {
        console.error("Receipt upload error:", error);
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Failed to upload receipt",
          code: "UPLOAD_FAILED",
        });
      }
    }
  );

  /**
   * Upload multiple photos at once (batch upload)
   */
  app.post(
    "/api/upload/photos/batch",
    requireAuth,
    upload.array("files", 50), // Max 50 photos at once
    async (req: Request, res: Response) => {
      try {
        if (!cloudStorage.isAvailable()) {
          return res.status(503).json({
            error: "File upload not configured",
            code: "UPLOAD_UNAVAILABLE",
          });
        }

        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return res.status(400).json({
            error: "No files provided",
            code: "NO_FILES",
          });
        }

        // Validate all file types
        files.forEach((file) => validateFileType(file, ALLOWED_IMAGE_TYPES));

        // Upload all files
        const results = await cloudStorage.uploadFiles(
          files.map((file) => ({
            buffer: file.buffer,
            filename: file.originalname,
          })),
          {
            folder: "photos",
            maxSizeBytes: MAX_IMAGE_SIZE,
          }
        );

        res.json({
          uploads: results.map((r) => ({
            url: r.publicUrl || r.url,
            key: r.key,
          })),
          count: results.length,
        });
      } catch (error) {
        console.error("Batch photo upload error:", error);
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Failed to upload photos",
          code: "UPLOAD_FAILED",
        });
      }
    }
  );

  /**
   * Delete an uploaded file
   */
  app.delete(
    "/api/upload/:key",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!cloudStorage.isAvailable()) {
          return res.status(503).json({
            error: "File upload not configured",
            code: "UPLOAD_UNAVAILABLE",
          });
        }

        const key = getParam(req.params.key);
        if (!key) {
          return res.status(400).json({
            error: "File key required",
            code: "KEY_REQUIRED",
          });
        }

        // Decode the key (may be URL-encoded)
        const decodedKey = decodeURIComponent(key);

        await cloudStorage.deleteFile(decodedKey);

        res.json({ success: true });
      } catch (error) {
        console.error("File deletion error:", error);
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Failed to delete file",
          code: "DELETE_FAILED",
        });
      }
    }
  );

  /**
   * Get a fresh signed URL for a file
   */
  app.get(
    "/api/upload/signed-url/:key",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!cloudStorage.isAvailable()) {
          return res.status(503).json({
            error: "File upload not configured",
            code: "UPLOAD_UNAVAILABLE",
          });
        }

        const key = getParam(req.params.key);
        const expiresIn = parseInt(req.query.expiresIn as string) || 3600;

        if (!key) {
          return res.status(400).json({
            error: "File key required",
            code: "KEY_REQUIRED",
          });
        }

        const decodedKey = decodeURIComponent(key);
        const url = await cloudStorage.getSignedUrl(decodedKey, expiresIn);

        res.json({ url });
      } catch (error) {
        console.error("Signed URL generation error:", error);
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Failed to generate URL",
          code: "URL_GENERATION_FAILED",
        });
      }
    }
  );
}
