#!/usr/bin/env python3
"""
Robust PDF text extraction with OCR fallback
Handles both digital PDFs and scanned documents
"""

import sys
import json
import tempfile
import os
from pathlib import Path

try:
    import pdfplumber
    import pytesseract
    from pdf2image import convert_from_bytes
    import cv2
    import numpy as np
except ImportError as e:
    print(json.dumps({"error": f"Missing dependency: {e}"}))
    sys.exit(1)


def preprocess_image(image_array):
    """Preprocess image for better OCR results"""
    # Convert PIL Image to numpy array if needed
    if hasattr(image_array, 'convert'):
        image_array = image_array.convert('RGB')
        image_array = np.array(image_array)
    
    # Convert to grayscale
    if len(image_array.shape) == 3:
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = image_array
    
    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)
    
    # Threshold for better contrast
    _, thresh = cv2.threshold(denoised, 150, 255, cv2.THRESH_BINARY)
    
    # Dilate to connect broken characters
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    
    return dilated


def extract_text_digital_pdf(pdf_buffer):
    """Extract text from digital PDF (with embedded text)"""
    try:
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(pdf_buffer)
            tmp_path = tmp.name
        
        try:
            text = ""
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            # If we got substantial text, return it
            if len(text.strip()) > 100:
                return text.strip(), len(pdf.pages)
            return None, None
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        print(f"[DEBUG] Digital extraction failed: {e}", file=sys.stderr)
        return None, None


def extract_text_ocr(pdf_buffer):
    """Extract text from scanned PDF using OCR"""
    try:
        # Convert PDF to images
        images = convert_from_bytes(pdf_buffer, dpi=300)
        
        text = ""
        for i, image in enumerate(images):
            # Preprocess image
            processed = preprocess_image(image)
            
            # Run OCR
            page_text = pytesseract.image_to_string(processed, lang='ita+eng')
            if page_text:
                text += page_text + "\n"
        
        return text.strip(), len(images)
    except Exception as e:
        print(f"[DEBUG] OCR extraction failed: {e}", file=sys.stderr)
        return None, None


def extract_pdf_text(pdf_buffer):
    """Extract text from PDF with fallback to OCR"""
    # Try digital extraction first
    text, num_pages = extract_text_digital_pdf(pdf_buffer)
    
    if text and len(text) > 100:
        return text, num_pages, "digital"
    
    # Fallback to OCR
    text, num_pages = extract_text_ocr(pdf_buffer)
    
    if text:
        return text, num_pages, "ocr"
    
    return "", 0, "failed"


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: extract_pdf_ocr.py <pdf_file_path>"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    try:
        with open(pdf_path, 'rb') as f:
            pdf_buffer = f.read()
        
        text, num_pages, method = extract_pdf_text(pdf_buffer)
        
        # Truncate to 60000 characters
        max_chars = 60000
        is_truncated = len(text) > max_chars
        if is_truncated:
            text = text[:max_chars]
        
        result = {
            "text": text,
            "num_pages": num_pages,
            "is_truncated": is_truncated,
            "character_count": len(text),
            "extraction_method": method
        }
        
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
