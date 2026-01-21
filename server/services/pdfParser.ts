/**
 * PDF Parser Service
 * Extracts text content from PDF files using robust OCR
 */

import { extractPDFWithOCR } from './pdfOcrExtractor';

const DEFAULT_MAX_CHARACTERS = 60000; // Maximum characters to extract from PDF

export interface ParsedPDF {
  text: string;
  numPages: number;
  isTruncated: boolean;
  characterCount: number;
  extractionMethod: 'digital' | 'ocr' | 'failed';
}

/**
 * Parse PDF buffer and extract text content using OCR
 * @param buffer - PDF file buffer
 * @param maxCharacters - Maximum characters to extract (default: 60000)
 */
export async function parsePDF(buffer: Buffer, maxCharacters: number = 60000): Promise<ParsedPDF> {
  try {
    const result = await extractPDFWithOCR(buffer);
    
    return {
      text: result.text,
      numPages: result.numPages,
      isTruncated: result.isTruncated,
      characterCount: result.characterCount,
      extractionMethod: result.extractionMethod,
    };
  } catch (error) {
    console.error('[PDF Parser] Error parsing PDF:', error);
    return {
      text: '',
      numPages: 0,
      isTruncated: false,
      characterCount: 0,
      extractionMethod: 'failed',
    };
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
 * @param content - Content string or PDF buffer as string
 * @param maxCharacters - Maximum characters to extract (default: 60000)
 */
export async function extractText(content: string, maxCharacters: number = 60000): Promise<string> {
  if (isPDF(content)) {
    // Convert string back to buffer for PDF parsing
    const buffer = Buffer.from(content, 'binary');
    const parsed = await parsePDF(buffer, maxCharacters);
    return parsed.text;
  }
  
  // Already plain text - truncate if necessary
  if (content.length > maxCharacters) {
    return content.substring(0, maxCharacters);
  }
  
  return content;
}
