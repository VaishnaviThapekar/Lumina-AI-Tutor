from pypdf import PdfReader
from typing import List, Tuple
import re
import os

# OCR support
try:
    import pytesseract
    from pdf2image import convert_from_path
    from PIL import Image
    OCR_AVAILABLE = True
    # Set tesseract path for Windows
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
except ImportError:
    OCR_AVAILABLE = False
    print("WARNING: OCR libraries not installed. Image-based PDFs won't be processed.")


class PDFProcessor:
    """Utility class for processing PDF documents with OCR support"""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def extract_text(self, file_path: str) -> str:
        """Extract text from PDF file (supports both text and image-based PDFs)"""
        try:
            print(f"[PDF] Attempting to extract text from: {file_path}")
            
            # First, try standard text extraction
            reader = PdfReader(file_path)
            text = ""
            
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            # Clean the text
            text = self._clean_text(text)
            
            print(f"[PDF] Extracted {len(text)} characters using standard extraction")
            
            # If extracted text is too short, try OCR
            if len(text) < 100:
                print("[PDF] Text extraction yielded insufficient text, trying OCR...")
                if OCR_AVAILABLE:
                    text = self._extract_with_ocr(file_path)
                    print(f"[PDF] OCR extracted {len(text)} characters")
                else:
                    print("[PDF] ERROR: OCR libraries not available!")
                    raise Exception(
                        "Could not extract text from PDF. This might be an image-based PDF. "
                        "Please install pytesseract and pdf2image for OCR support."
                    )
            
            if not text or len(text) < 50:
                raise Exception(
                    f"Could not extract sufficient text from PDF. "
                    f"Extracted only {len(text)} characters."
                )
            
            return text
            
        except Exception as e:
            print(f"[PDF] ERROR: {str(e)}")
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def _extract_with_ocr(self, file_path: str) -> str:
        """Extract text using OCR for image-based PDFs"""
        try:
            print("[OCR] Converting PDF to images...")
            
            # Convert PDF to images
            images = convert_from_path(
    file_path, 
    dpi=300,
    poppler_path=r'C:\poppler\Library\bin'
)
            
            print(f"[OCR] Processing {len(images)} pages...")
            
            text = ""
            for i, image in enumerate(images):
                print(f"[OCR] Processing page {i+1}/{len(images)}...")
                
                # Extract text using Tesseract
                page_text = pytesseract.image_to_string(image, lang='eng')
                text += page_text + "\n"
            
            # Clean the text
            text = self._clean_text(text)
            
            return text
            
        except Exception as e:
            print(f"[OCR] ERROR: {str(e)}")
            raise Exception(f"OCR extraction failed: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?;:()\-\'"]+', '', text)
        
        return text.strip()
    
    def chunk_text(self, text: str) -> List[Tuple[str, dict]]:
        """
        Split text into overlapping chunks with metadata
        Returns: List of (chunk_text, metadata) tuples
        """
        chunks = []
        words = text.split()
        
        # Calculate words per chunk
        words_per_chunk = self.chunk_size // 5  # Approximate 5 chars per word
        overlap_words = self.chunk_overlap // 5
        
        start = 0
        chunk_id = 0
        
        while start < len(words):
            end = start + words_per_chunk
            chunk_words = words[start:end]
            chunk_text = ' '.join(chunk_words)
            
            # Create metadata
            metadata = {
                'chunk_id': chunk_id,
                'start_char': start * 5,  # Approximate
                'end_char': end * 5,
                'length': len(chunk_text)
            }
            
            chunks.append((chunk_text, metadata))
            
            # Move start position with overlap
            start = end - overlap_words
            chunk_id += 1
        
        return chunks
    
    def extract_key_concepts(self, text: str, max_concepts: int = 10) -> List[str]:
        """
        Extract key concepts from text for metadata
        Simple implementation - can be enhanced with NLP
        """
        # Remove common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                     'of', 'with', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has',
                     'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
                     'might', 'must', 'can', 'this', 'that', 'these', 'those'}
        
        # Extract words
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        
        # Filter and count
        word_freq = {}
        for word in words:
            if word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top concepts
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        concepts = [word for word, freq in sorted_words[:max_concepts]]
        
        return concepts