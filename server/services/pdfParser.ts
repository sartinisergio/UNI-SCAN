/**
 * PDF Parser Service
 * Extracts text content from PDF files
 */

import * as pdfParse from 'pdf-parse';

export interface ParsedPDF {
  text: string;
  numPages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
}

/**
 * Parse PDF buffer and extract text content
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  try {
    // pdf-parse exports a function as default
    const pdf = (pdfParse as any).default || pdfParse;
    const data = await pdf(buffer);
    
    return {
      text: data.text.trim(),
      numPages: data.numpages,
      info: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
      }
    };
  } catch (error) {
    console.error('[PDF Parser] Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Check if content is a PDF (starts with %PDF-)
 */
export function isPDF(content: string): boolean {
  return content.startsWith('%PDF-');
}

/**
 * Extract text from content - handles both plain text and PDF
 */
export async function extractText(content: string): Promise<string> {
  if (isPDF(content)) {
    // Convert string back to buffer for PDF parsing
    const buffer = Buffer.from(content, 'binary');
    const parsed = await parsePDF(buffer);
    return parsed.text;
  }
  
  // Already plain text
  return content;
}
