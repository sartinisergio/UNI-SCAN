/**
 * PDF OCR Extractor Service
 * Calls Python script for robust PDF text extraction with OCR fallback
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export interface PDFExtractionResult {
  text: string;
  numPages: number;
  isTruncated: boolean;
  characterCount: number;
  extractionMethod: 'digital' | 'ocr' | 'failed';
}

/**
 * Extract text from PDF buffer using Python OCR script
 */
export async function extractPDFWithOCR(pdfBuffer: Buffer): Promise<PDFExtractionResult> {
  const tempDir = os.tmpdir();
  const tempPdfPath = path.join(tempDir, `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`);
  
  try {
    // Write PDF buffer to temporary file
    await fs.promises.writeFile(tempPdfPath, pdfBuffer);
    
    // Call Python script
    const scriptPath = path.join(__dirname, '../scripts/extract_pdf_ocr.py');
    const { stdout, stderr } = await execFileAsync('python3', [scriptPath, tempPdfPath], {
      timeout: 120000, // 2 minutes
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    
    // Parse JSON output
    const result = JSON.parse(stdout);
    
    if (result.error) {
      console.error('[PDF OCR] Extraction error:', result.error);
      return {
        text: '',
        numPages: 0,
        isTruncated: false,
        characterCount: 0,
        extractionMethod: 'failed',
      };
    }
    
    return {
      text: result.text || '',
      numPages: result.num_pages || 0,
      isTruncated: result.is_truncated || false,
      characterCount: result.character_count || 0,
      extractionMethod: result.extraction_method || 'failed',
    };
  } catch (error) {
    console.error('[PDF OCR] Error:', error);
    return {
      text: '',
      numPages: 0,
      isTruncated: false,
      characterCount: 0,
      extractionMethod: 'failed',
    };
  } finally {
    // Clean up temporary file
    try {
      await fs.promises.unlink(tempPdfPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
