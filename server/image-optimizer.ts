/**
 * Image optimization service
 * Provides server-side image compression and format conversion
 *
 * Note: This requires 'sharp' package to be installed
 * Run: npm install sharp
 */

import type { Request, Response, NextFunction } from 'express';

// Interface for optimization options
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  stripMetadata?: boolean;
}

// Default optimization settings
const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 2400,
  maxHeight: 2400,
  quality: 85,
  format: 'webp',
  stripMetadata: true,
};

/**
 * Check if sharp is available
 */
let sharp: any = null;
let isSharpAvailable = false;

try {
  sharp = require('sharp');
  isSharpAvailable = true;
  console.log('[Image Optimizer] Sharp library loaded successfully');
} catch (err) {
  console.warn('[Image Optimizer] Sharp not installed. Image optimization disabled.');
  console.warn('[Image Optimizer] Install with: npm install sharp');
}

/**
 * Optimize image buffer
 */
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  if (!isSharpAvailable || !sharp) {
    console.warn('[Image Optimizer] Returning original image (Sharp not available)');
    return buffer;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    let pipeline = sharp(buffer);

    // Resize if dimensions specified
    if (opts.maxWidth || opts.maxHeight) {
      pipeline = pipeline.resize({
        width: opts.maxWidth,
        height: opts.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Strip metadata (EXIF data) for privacy and file size
    if (opts.stripMetadata) {
      pipeline = pipeline.rotate(); // Auto-rotate based on EXIF
    }

    // Convert format and apply quality
    switch (opts.format) {
      case 'webp':
        pipeline = pipeline.webp({ quality: opts.quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({
          quality: opts.quality,
          compressionLevel: 9,
        });
        break;
    }

    const optimized = await pipeline.toBuffer();

    const originalSize = buffer.length;
    const optimizedSize = optimized.length;
    const savings = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1);

    console.log(
      `[Image Optimizer] Optimized: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% savings)`
    );

    return optimized;
  } catch (error) {
    console.error('[Image Optimizer] Optimization failed:', error);
    return buffer; // Return original on error
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<any> {
  if (!isSharpAvailable || !sharp) {
    return null;
  }

  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  } catch (error) {
    console.error('[Image Optimizer] Failed to read metadata:', error);
    return null;
  }
}

/**
 * Generate thumbnail
 */
export async function generateThumbnail(
  buffer: Buffer,
  width: number = 300,
  height: number = 300
): Promise<Buffer> {
  if (!isSharpAvailable || !sharp) {
    return buffer;
  }

  try {
    return await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('[Image Optimizer] Thumbnail generation failed:', error);
    return buffer;
  }
}

/**
 * Express middleware to optimize uploaded images
 */
export function imageOptimizationMiddleware(options: ImageOptimizationOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file || !req.file.buffer) {
      return next();
    }

    // Only optimize image files
    const isImage = req.file.mimetype.startsWith('image/');
    if (!isImage) {
      return next();
    }

    try {
      const optimized = await optimizeImage(req.file.buffer, options);
      req.file.buffer = optimized;
      req.file.size = optimized.length;

      // Update mimetype if format changed
      if (options.format) {
        req.file.mimetype = `image/${options.format}`;
      }
    } catch (error) {
      console.error('[Image Optimizer] Middleware error:', error);
      // Continue with original file on error
    }

    next();
  };
}

/**
 * Check if image optimization is available
 */
export function isOptimizationAvailable(): boolean {
  return isSharpAvailable;
}

export default {
  optimizeImage,
  getImageMetadata,
  generateThumbnail,
  imageOptimizationMiddleware,
  isOptimizationAvailable,
};
