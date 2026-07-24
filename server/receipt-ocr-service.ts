import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';

/**
 * Receipt OCR service using Claude Haiku for fast, cost-effective text extraction.
 *
 * Pro feature: Automatically extracts receipt data from uploaded images.
 */

const anthropic = new Anthropic({
  apiKey: env.anthropicApiKey,
});

export interface ReceiptData {
  amount?: number; // Total amount in cents
  currency?: string; // Currency code (USD, EUR, etc.)
  description?: string; // Merchant name or description
  location?: string; // Store location/address
  date?: string; // Receipt date (ISO format)
  items?: {
    // Individual line items
    name: string;
    amount: number;
  }[];
  confidence: number; // OCR confidence score (0-1)
  rawText?: string; // Raw extracted text for debugging
}

/**
 * Process a receipt image using Claude Haiku vision.
 * Returns extracted receipt data or null if processing fails.
 */
export async function processReceiptImage(imageUrl: string): Promise<ReceiptData | null> {
  try {
    // Fetch the image as base64 if it's a URL
    let imageData: string;
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Download image and convert to base64
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error('Failed to fetch receipt image:', response.statusText);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      imageData = Buffer.from(arrayBuffer).toString('base64');

      // Determine media type from content-type header
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('png')) {
        mediaType = 'image/png';
      } else if (contentType?.includes('gif')) {
        mediaType = 'image/gif';
      } else if (contentType?.includes('webp')) {
        mediaType = 'image/webp';
      }
    } else if (imageUrl.startsWith('data:')) {
      // Handle data URLs
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        console.error('Invalid data URL format');
        return null;
      }
      mediaType = matches[1] as any;
      imageData = matches[2];
    } else {
      console.error('Unsupported image URL format');
      return null;
    }

    // Use Claude Haiku for fast, cheap OCR
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: 'text',
              text: `Extract the following information from this receipt image:
1. Total amount (number only, no currency symbols)
2. Currency (3-letter code like USD, EUR, GBP)
3. Merchant/store name (short description)
4. Location (store address or city)
5. Date (YYYY-MM-DD format if available)
6. Individual line items (name and amount)

Return ONLY a JSON object with this exact structure:
{
  "amount": <number in cents, e.g., 4250 for $42.50>,
  "currency": "<3-letter code>",
  "description": "<merchant name>",
  "location": "<store location or address>",
  "date": "<YYYY-MM-DD or null>",
  "items": [
    {"name": "<item name>", "amount": <amount in cents>}
  ],
  "confidence": <0.0 to 1.0>
}

If you cannot find a field, use null. For confidence, estimate how clear and readable the receipt is (1.0 = perfect, 0.5 = partially readable, 0.1 = very unclear).`,
            },
          ],
        },
      ],
    });

    // Parse the response
    const content = message.content[0];
    if (content.type !== 'text') {
      console.error('Unexpected response type from Claude');
      return null;
    }

    const responseText = content.text;

    // Extract JSON from the response (Claude might add markdown formatting)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Claude response:', responseText);
      return {
        amount: undefined,
        currency: undefined,
        description: undefined,
        location: undefined,
        date: undefined,
        items: undefined,
        confidence: 0.1,
        rawText: responseText,
      };
    }

    const data = JSON.parse(jsonMatch[0]);

    // Validate and normalize the data
    const receiptData: ReceiptData = {
      amount: typeof data.amount === 'number' ? Math.round(data.amount) : undefined,
      currency: data.currency || 'USD',
      description: data.description || undefined,
      location: data.location || undefined,
      date: data.date || undefined,
      items: Array.isArray(data.items)
        ? data.items.map((item: any) => ({
            name: item.name || 'Unknown item',
            amount: typeof item.amount === 'number' ? Math.round(item.amount) : 0,
          }))
        : undefined,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
      rawText: responseText,
    };

    return receiptData;
  } catch (error) {
    console.error('Receipt OCR error:', error);
    return null;
  }
}

/**
 * Batch process multiple receipts.
 * Returns array of results in the same order as input.
 */
export async function processReceiptBatch(imageUrls: string[]): Promise<(ReceiptData | null)[]> {
  // Process in parallel with concurrency limit
  const BATCH_SIZE = 3;
  const results: (ReceiptData | null)[] = [];

  for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
    const batch = imageUrls.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(processReceiptImage));
    results.push(...batchResults);
  }

  return results;
}
