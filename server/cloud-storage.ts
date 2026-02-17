/**
 * Cloud Storage Service
 * Supports AWS S3 and Cloudflare R2 (S3-compatible)
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export interface UploadOptions {
  folder?: string;
  contentType?: string;
  maxSizeBytes?: number;
}

export interface UploadResult {
  key: string;
  url: string;
  publicUrl?: string;
}

class CloudStorageService {
  private client: S3Client | null = null;
  private bucket: string;
  private publicBaseUrl?: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId =
      process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || "auto";

    this.bucket =
      process.env.R2_BUCKET_NAME ||
      process.env.AWS_S3_BUCKET ||
      "tripsync-uploads";

    // Cloudflare R2 endpoint
    const endpoint = accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : undefined;

    // Optional: Public URL for R2 custom domain
    this.publicBaseUrl = process.env.R2_PUBLIC_URL;

    if (accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region,
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      console.log("✓ Cloud storage initialized");
    } else {
      console.warn(
        "⚠ Cloud storage not configured. File uploads will be disabled."
      );
    }
  }

  /**
   * Check if cloud storage is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Generate a unique file key
   */
  private generateKey(
    originalFilename: string,
    folder: string = "uploads"
  ): string {
    const timestamp = Date.now();
    const uuid = randomUUID().substring(0, 8);
    const ext = originalFilename.split(".").pop();
    const sanitizedFilename = originalFilename
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 50);
    return `${folder}/${timestamp}-${uuid}-${sanitizedFilename}`;
  }

  /**
   * Upload a file to cloud storage
   */
  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.client) {
      throw new Error("Cloud storage not configured");
    }

    const { folder = "uploads", contentType = "application/octet-stream", maxSizeBytes } = options;

    // Validate file size
    if (maxSizeBytes && buffer.length > maxSizeBytes) {
      throw new Error(
        `File too large. Maximum size: ${maxSizeBytes / 1024 / 1024}MB`
      );
    }

    const key = this.generateKey(originalFilename, folder);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        originalFilename,
        uploadedAt: new Date().toISOString(),
      },
    });

    await this.client.send(command);

    // Generate signed URL (expires in 1 hour)
    const url = await this.getSignedUrl(key, 3600);

    // Return public URL if configured (for R2 custom domains)
    const publicUrl = this.publicBaseUrl
      ? `${this.publicBaseUrl}/${key}`
      : undefined;

    return {
      key,
      url,
      publicUrl,
    };
  }

  /**
   * Generate a signed URL for viewing a file
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.client) {
      throw new Error("Cloud storage not configured");
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Delete a file from cloud storage
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.client) {
      throw new Error("Cloud storage not configured");
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Array<{ buffer: Buffer; filename: string }>,
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    return Promise.all(
      files.map((file) => this.uploadFile(file.buffer, file.filename, options))
    );
  }
}

// Export singleton instance
export const cloudStorage = new CloudStorageService();
