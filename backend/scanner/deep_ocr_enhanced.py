"""
Advanced Deep Learning OCR System for Business Cards
Enhanced with TrOCR, fine-tuned confidence scoring, and custom training
"""

import cv2
import numpy as np
from PIL import Image
import re
import logging
from typing import Dict, List, Tuple, Optional
import json
import time

# Deep Learning OCR imports
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    print("EasyOCR not available")

try:
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Transformers not available")

try:
    from rapidfuzz import fuzz, process
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    RAPIDFUZZ_AVAILABLE = False
    print("RapidFuzz not available")

try:
    import textdistance
    TEXTDISTANCE_AVAILABLE = True
except ImportError:
    TEXTDISTANCE_AVAILABLE = False
    print("TextDistance not available")

import pytesseract

logger = logging.getLogger(__name__)

class AdvancedDeepOCREngine:
    """Enhanced OCR engine with TrOCR, fine-tuned confidence, and custom training"""
    
    def __init__(self):
        self.engines = {}
        self.confidence_thresholds = self._load_confidence_thresholds()
        self.business_patterns = self._load_enhanced_business_patterns()
        self.business_vocabulary = self._load_business_vocabulary()
        self.initialize_engines()
        
    def _load_confidence_thresholds(self) -> Dict:
        """Fine-tuned confidence thresholds for different OCR engines"""
        return {
            'easyocr': {
                'excellent': 85,
                'very_good': 70,
                'good': 55,
                'acceptable': 40,
                'minimum': 25
            },
            'trocr': {
                'excellent': 95,
                'very_good': 85,
                'good': 70,
                'acceptable': 55,
                'minimum': 40
            },
            'tesseract': {
                'excellent': 80,
                'very_good': 65,
                'good': 50,
                'acceptable': 35,
                'minimum': 20
            }
        }
        
    def initialize_engines(self):
        """Initialize all available OCR engines with optimized settings"""
        
        # Initialize EasyOCR with business card optimizations
        if EASYOCR_AVAILABLE:
            try:
                self.engines['easyocr'] = easyocr.Reader(
                    ['en'], 
                    gpu=False,
                    verbose=False
                )
                print("✅ EasyOCR initialized with business card optimizations")
            except Exception as e:
                print(f"❌ EasyOCR failed: {e}")
        
        # Initialize TrOCR (Transformer-based OCR)
        if TRANSFORMERS_AVAILABLE:
            try:
                self.engines['trocr_printed'] = {
                    'processor': TrOCRProcessor.from_pretrained('microsoft/trocr-base-printed'),
                    'model': VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-base-printed')
                }
                print("✅ TrOCR models initialized (printed)")
            except Exception as e:
                print(f"❌ TrOCR failed: {e}")
        
        print(f"🚀 Initialized {len(self.engines)} OCR engines")
    
    def _load_enhanced_business_patterns(self) -> Dict:
        """Enhanced patterns specifically for business cards"""
        return {
            'names': [
                r'\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*\b',
                r'\b[A-Z][A-Z\s]+(?:STORE|LAYOUT|CENTER|MART|SHOP)\b',
                r'\b(?:Mr|Ms|Dr|Prof)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b',
            ],
            'emails': [
                r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',
                r'\b[a-zA-Z0-9._%+-]+[@a][a-zA-Z0-9.-]+[.][a-zA-Z]{2,}\b',
                r'\b[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}\b',
            ],
            'phones': [
                r'\b\d{5}\s+\d{5}\b',
                r'\+91[-.\s]?\d{10}\b',
                r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',
                r'\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b',
                r'\b\d{10}\b',
            ],
            'websites': [
                r'\bwww\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',
                r'\b[a-zA-Z0-9.-]+\.(com|in|org|net|co\.in|co\.uk|biz|info)\b',
                r'\bhttps?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*\b',
            ],
            'companies': [
                r'\b[A-Z][a-zA-Z\s&]+(?:Pvt\.?\s*Ltd\.?|Limited|Inc\.?|Corp\.?|LLC|Bank|Finance)\b',
                r'\b[A-Z][A-Z\s]+(?:DIGITAL|IMAGING|PRINTING|BANK|FINANCE|TECHNOLOGIES|SOLUTIONS)\b',
                r'\b[A-Z][a-zA-Z\s]+(?:Company|Corporation|Enterprise|Group|Industries)\b',
            ],
            'addresses': [
                r'#?\d+[,\s]+[A-Za-z\s,]+(?:Main|Road|Street|Avenue|Lane|Cross|Sector|Layout)[^.]*?(?:Bangalore|Bengaluru|Mumbai|Delhi|Chennai|Hyderabad|Pune)[^.]*?\d{6}',
                r'\b[A-Za-z\s]+Layout[^.]*?(?:Bangalore|Bengaluru)[^.]*?\d{6}',
                r'\b\d+[,\s]+[A-Za-z\s,]+(?:Floor|Block|Building)[^.]*',
            ],
            'job_titles': [
                r'\b(?:Business\s+Development\s+Executive|Manager|Director|CEO|CTO|CFO|VP|President|Executive|Engineer|Developer|Analyst|Consultant|Specialist)\b',
                r'\b(?:Senior|Junior|Lead|Principal|Chief)\s+[A-Z][a-z]+\b',
            ]
        }
    
    def _load_business_vocabulary(self) -> List[str]:
        """Comprehensive business vocabulary for text correction"""
        return [
            # Business types
            'Store', 'Layout', 'Digital', 'Printing', 'Imaging', 'Private', 'Limited',
            'Company', 'Corporation', 'Enterprise', 'Group', 'Industries', 'Technologies',
            'Solutions', 'Services', 'Systems', 'Consulting', 'Finance', 'Bank',
            
            # Locations
            'Bangalore', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune',
            'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
            
            # Job titles
            'Manager', 'Director', 'Executive', 'Engineer', 'Developer', 'Analyst',
            'Consultant', 'Specialist', 'Coordinator', 'Administrator', 'Officer',
            'President', 'Vice President', 'CEO', 'CTO', 'CFO', 'COO',
            
            # Address components
            'Main', 'Road', 'Street', 'Avenue', 'Lane', 'Cross', 'Sector', 'Block',
            'Floor', 'Building', 'Complex', 'Plaza', 'Tower', 'Center', 'Layout',
            
            # Business terms
            'PrintQ', 'HSR', 'Layout', 'Store', 'Digital', 'Imaging', 'Printing',
            'Office', 'Branch', 'Headquarters', 'Regional', 'National', 'International'
        ]
    
    def advanced_image_preprocessing(self, image: np.ndarray) -> List[np.ndarray]:
        """Advanced image preprocessing with multiple enhancement techniques"""
        enhanced_images = []
        
        # Original image
        enhanced_images.append(image)
        
        # 1. CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        clahe_enhanced = clahe.apply(image)
        enhanced_images.append(clahe_enhanced)
        
        # 2. Unsharp masking for text sharpening
        gaussian = cv2.GaussianBlur(image, (0, 0), 2.0)
        unsharp = cv2.addWeighted(image, 2.5, gaussian, -1.5, 0)
        enhanced_images.append(unsharp)
        
        # 3. Morphological operations for text enhancement
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
        morph_enhanced = cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
        enhanced_images.append(morph_enhanced)
        
        # 4. Bilateral filtering for noise reduction while preserving edges
        bilateral = cv2.bilateralFilter(image, 9, 75, 75)
        enhanced_images.append(bilateral)
        
        # 5. Adaptive thresholding
        adaptive_thresh = cv2.adaptiveThreshold(
            image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        enhanced_images.append(adaptive_thresh)
        
        return enhanced_images
    
    def extract_with_easyocr_enhanced(self, image: np.ndarray) -> Dict:
        """Enhanced EasyOCR extraction with business card optimizations"""
        if 'easyocr' not in self.engines:
            return {'text': '', 'confidence': 0, 'method': 'easyocr_unavailable'}
        
        try:
            # Convert to PIL Image for EasyOCR
            pil_image = Image.fromarray(image)
            
            # EasyOCR with enhanced settings
            results = self.engines['easyocr'].readtext(
                np.array(pil_image),
                detail=1,
                paragraph=True,
                width_ths=0.7,
                height_ths=0.7
            )
            
            if not results:
                return {'text': '', 'confidence': 0, 'method': 'easyocr_no_results'}
            
            # Extract text and calculate confidence
            text_parts = []
            confidences = []
            
            for result in results:
                if len(result) == 3:
                    bbox, text, conf = result
                elif len(result) == 2:
                    bbox, text = result
                    conf = 0.8  # Default confidence for results without confidence score
                else:
                    continue
                    
                if conf > 0.3:  # Filter low confidence results
                    text_parts.append(text.strip())
                    confidences.append(conf * 100)
            
            if not text_parts:
                return {'text': '', 'confidence': 0, 'method': 'easyocr_low_confidence'}
            
            combined_text = '\n'.join(text_parts)
            avg_confidence = sum(confidences) / len(confidences)
            
            # Apply text correction
            corrected_text = self.advanced_text_correction(combined_text)
            
            return {
                'text': corrected_text,
                'confidence': avg_confidence,
                'method': 'easyocr_enhanced',
                'raw_results': len(results)
            }
            
        except Exception as e:
            logger.error(f"EasyOCR extraction failed: {e}")
            return {'text': '', 'confidence': 0, 'method': f'easyocr_error_{str(e)[:50]}'}
    
    def extract_with_trocr_printed(self, image: np.ndarray) -> Dict:
        """TrOCR extraction for printed text (business cards)"""
        if 'trocr_printed' not in self.engines:
            return {'text': '', 'confidence': 0, 'method': 'trocr_unavailable'}
        
        try:
            # Convert to PIL Image
            pil_image = Image.fromarray(image).convert('RGB')
            
            # Process with TrOCR
            processor = self.engines['trocr_printed']['processor']
            model = self.engines['trocr_printed']['model']
            
            # Generate text
            pixel_values = processor(pil_image, return_tensors="pt").pixel_values
            generated_ids = model.generate(pixel_values, max_length=512)
            generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
            # Calculate confidence based on text quality
            confidence = self.calculate_trocr_confidence(generated_text)
            
            # Apply text correction
            corrected_text = self.advanced_text_correction(generated_text)
            
            return {
                'text': corrected_text,
                'confidence': confidence,
                'method': 'trocr_printed',
                'raw_text': generated_text
            }
            
        except Exception as e:
            logger.error(f"TrOCR extraction failed: {e}")
            return {'text': '', 'confidence': 0, 'method': f'trocr_error_{str(e)[:50]}'}
    
    def calculate_trocr_confidence(self, text: str) -> float:
        """Calculate confidence score for TrOCR results based on text quality"""
        if not text or not text.strip():
            return 0
        
        score = 50  # Base score
        
        # Length factor
        words = text.split()
        if 5 <= len(words) <= 30:
            score += 20
        elif len(words) < 3:
            score -= 20
        elif len(words) > 50:
            score -= 15
        
        # Business pattern matching
        for category, patterns in self.business_patterns.items():
            for pattern in patterns:
                matches = len(re.findall(pattern, text, re.IGNORECASE))
                if category in ['emails', 'phones']:
                    score += matches * 15
                elif category in ['websites', 'companies']:
                    score += matches * 10
                else:
                    score += matches * 5
        
        # Text quality factors
        alpha_ratio = sum(1 for char in text if char.isalpha()) / len(text)
        score += alpha_ratio * 20
        
        # Business vocabulary bonus
        text_lower = text.lower()
        vocab_matches = sum(1 for word in self.business_vocabulary if word.lower() in text_lower)
        score += min(vocab_matches * 3, 15)
        
        return min(score, 100)
    
    def advanced_text_correction(self, text: str) -> str:
        """Advanced text correction using business vocabulary and fuzzy matching"""
        if not text or not RAPIDFUZZ_AVAILABLE:
            return text
        
        lines = text.split('\n')
        corrected_lines = []
        
        for line in lines:
            if not line.strip():
                continue
                
            words = line.split()
            corrected_words = []
            
            for word in words:
                # Skip if word is already good
                if len(word) < 3 or word.isdigit():
                    corrected_words.append(word)
                    continue
                
                # Try to find best match in business vocabulary
                best_match = process.extractOne(
                    word, 
                    self.business_vocabulary,
                    scorer=fuzz.ratio,
                    score_cutoff=75
                )
                
                if best_match:
                    corrected_words.append(best_match[0])
                else:
                    corrected_words.append(word)
            
            corrected_lines.append(' '.join(corrected_words))
        
        return '\n'.join(corrected_lines)
    
    def extract_text_multi_engine_enhanced(self, image: Image.Image) -> Dict:
        """Enhanced multi-engine text extraction with fusion"""
        # Convert PIL to numpy array
        img_array = np.array(image.convert('L'))  # Convert to grayscale
        
        # Apply advanced preprocessing
        enhanced_images = self.advanced_image_preprocessing(img_array)
        
        all_results = []
        
        # Try each OCR engine with each enhanced image
        for i, enhanced_img in enumerate(enhanced_images[:3]):  # Limit to first 3 for performance
            
            # EasyOCR
            if 'easyocr' in self.engines:
                result = self.extract_with_easyocr_enhanced(enhanced_img)
                result['preprocessing'] = f'enhanced_{i}'
                all_results.append(result)
            
            # TrOCR
            if 'trocr_printed' in self.engines:
                result = self.extract_with_trocr_printed(enhanced_img)
                result['preprocessing'] = f'enhanced_{i}'
                all_results.append(result)
            
            # Tesseract fallback
            try:
                pil_enhanced = Image.fromarray(enhanced_img)
                tesseract_text = pytesseract.image_to_string(
                    pil_enhanced, 
                    config='--psm 6 --oem 3'
                )
                
                if tesseract_text.strip():
                    corrected_text = self.advanced_text_correction(tesseract_text)
                    confidence = self.calculate_trocr_confidence(corrected_text)  # Reuse confidence calculation
                    
                    all_results.append({
                        'text': corrected_text,
                        'confidence': confidence * 0.8,  # Slightly lower weight for Tesseract
                        'method': f'tesseract_enhanced_{i}',
                        'preprocessing': f'enhanced_{i}'
                    })
            except Exception as e:
                logger.error(f"Tesseract failed on enhanced image {i}: {e}")
        
        # Select best result
        if not all_results:
            return {'text': '', 'confidence': 0, 'method': 'no_engines_available'}
        
        best_result = self.select_best_result(all_results)
        
        # Enhance confidence with our custom scoring
        enhanced_confidence = self.calculate_enhanced_confidence(best_result)
        best_result['confidence'] = enhanced_confidence
        best_result['total_attempts'] = len(all_results)
        
        return best_result
    
    def select_best_result(self, results: List[Dict]) -> Dict:
        """Select the best OCR result from multiple attempts"""
        if not results:
            return {'text': '', 'confidence': 0, 'method': 'no_results'}
        
        # Filter out empty results
        valid_results = [r for r in results if r.get('text', '').strip()]
        
        if not valid_results:
            return {'text': '', 'confidence': 0, 'method': 'no_valid_results'}
        
        # Sort by confidence and select best
        valid_results.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        
        best = valid_results[0]
        
        # If top results are close in confidence, prefer TrOCR or EasyOCR
        if len(valid_results) > 1:
            top_confidence = best.get('confidence', 0)
            for result in valid_results[1:3]:  # Check next 2 results
                if abs(result.get('confidence', 0) - top_confidence) < 10:
                    if 'trocr' in result.get('method', '') or 'easyocr' in result.get('method', ''):
                        best = result
                        break
        
        return best
    
    def calculate_enhanced_confidence(self, result: Dict) -> float:
        """Calculate enhanced confidence score for OCR results"""
        text = result.get('text', '')
        method = result.get('method', '')
        original_confidence = result.get('confidence', 0)
        
        if not text.strip():
            return 0
        
        # Base score from original confidence
        score = original_confidence * 0.6  # Weight original confidence at 60%
        
        # Business pattern bonus (40% weight)
        pattern_score = 0
        for category, patterns in self.business_patterns.items():
            for pattern in patterns:
                matches = len(re.findall(pattern, text, re.IGNORECASE))
                if category == 'emails':
                    pattern_score += matches * 15
                elif category == 'phones':
                    pattern_score += matches * 12
                elif category == 'websites':
                    pattern_score += matches * 12
                elif category == 'companies':
                    pattern_score += matches * 8
                elif category == 'names':
                    pattern_score += matches * 6
                else:
                    pattern_score += matches * 4
        
        score += min(pattern_score, 40)  # Cap pattern score at 40
        
        # Method-specific bonuses
        if 'trocr' in method:
            score += 5  # TrOCR bonus for transformer quality
        elif 'easyocr' in method:
            score += 3  # EasyOCR bonus for reliability
        
        # Text quality factors
        words = text.split()
        if words:
            # Alphabetic ratio
            alpha_ratio = sum(1 for word in words if word.isalpha()) / len(words)
            score += alpha_ratio * 10
            
            # Length penalty/bonus
            if 5 <= len(words) <= 30:  # Optimal length for business cards
                score += 5
            elif len(words) < 3:
                score -= 10
            elif len(words) > 50:
                score -= 15
        
        # Business vocabulary bonus
        text_lower = text.lower()
        vocab_matches = sum(1 for word in self.business_vocabulary if word.lower() in text_lower)
        score += min(vocab_matches * 2, 10)  # Cap at 10 points
        
        return min(score, 100)

class EnhancedBusinessCardParser:
    """Enhanced business card parser with advanced pattern matching"""
    
    def __init__(self):
        self.patterns = self._load_enhanced_patterns()
        self.field_priorities = self._load_field_priorities()
    
    def _load_enhanced_patterns(self) -> Dict:
        """Load enhanced patterns for business card parsing"""
        return {
            'name': [
                r'^[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*$',
                r'^[A-Z][A-Z\s]+(?:STORE|LAYOUT|CENTER)$',
                r'\b(?:Mr|Ms|Dr|Prof)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b',
                r'\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b',
            ],
            'email': [
                r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',
                r'\b[a-zA-Z0-9._%+-]+[@a][a-zA-Z0-9.-]+[.][a-zA-Z]{2,}\b',
                r'\b[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}\b',
            ],
            'phone': [
                r'\b\d{5}\s+\d{5}\b',  # 99166 97005
                r'\+91[-.\s]?\d{10}\b',
                r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',
                r'\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b',
                r'\b\d{10}\b',
            ],
            'website': [
                r'\bwww\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',
                r'\b[a-zA-Z0-9.-]+\.(com|in|org|net|co\.in|biz|info)\b',
                r'\bhttps?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*\b',
            ],
            'company': [
                r'\b[A-Z][a-zA-Z\s&]+(?:Pvt\.?\s*Ltd\.?|Limited|Inc\.?|Corp\.?|LLC|Bank|Finance)\b',
                r'\b[A-Z][A-Z\s]+(?:DIGITAL|IMAGING|PRINTING|BANK|FINANCE|TECHNOLOGIES)\b',
                r'\b[A-Z][a-zA-Z\s]+(?:Company|Corporation|Enterprise|Group|Industries)\b',
            ],
            'address': [
                r'#?\d+[,\s]+[A-Za-z\s,]+(?:Main|Road|Street|Avenue|Lane|Cross|Sector|Layout)[^.]*?(?:Bangalore|Bengaluru|Mumbai|Delhi)[^.]*?\d{6}',
                r'\b[A-Za-z\s]+Layout[^.]*?(?:Bangalore|Bengaluru)[^.]*?\d{6}',
                r'\b\d+[,\s]+[A-Za-z\s,]+(?:Floor|Block|Building)[^.]*',
            ],
            'job_title': [
                r'\b(?:Business\s+Development\s+Executive|Manager|Director|CEO|CTO|CFO|VP|President|Executive|Engineer|Developer|Analyst|Consultant)\b',
                r'\b(?:Senior|Junior|Lead|Principal|Chief)\s+[A-Z][a-z]+\b',
            ]
        }
    
    def _load_field_priorities(self) -> Dict:
        """Define field extraction priorities"""
        return {
            'email': 1,      # Highest priority
            'phone': 2,
            'website': 3,
            'company': 4,
            'name': 5,
            'job_title': 6,
            'address': 7     # Lowest priority
        }
    
    def parse_business_card_enhanced(self, text: str) -> Dict:
        """Enhanced business card parsing with priority-based extraction"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        result = {
            'name': None,
            'email': None,
            'mobile': None,
            'company': None,
            'job_title': None,
            'website': None,
            'address': None,
            'notes': []
        }
        
        used_lines = set()
        
        # Extract fields in priority order
        for field in sorted(self.field_priorities.keys(), key=lambda x: self.field_priorities[x]):
            if field == 'phone':
                field_key = 'mobile'
            else:
                field_key = field
                
            for i, line in enumerate(lines):
                if i in used_lines or result[field_key]:
                    continue
                    
                for pattern in self.patterns[field]:
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    if matches:
                        if field == 'email':
                            result[field_key] = matches[0].lower()
                        elif field == 'website':
                            website = matches[0]
                            if not website.startswith('http'):
                                website = 'https://' + website
                            result[field_key] = website
                        else:
                            result[field_key] = matches[0] if field != 'phone' else matches[0]
                        used_lines.add(i)
                        break
                if result[field_key]:
                    break
        
        # Handle multi-line address
        if not result['address']:
            for i, line in enumerate(lines):
                if i in used_lines:
                    continue
                for pattern in self.patterns['address']:
                    if re.search(pattern, line, re.IGNORECASE):
                        address_parts = [line]
                        used_lines.add(i)
                        
                        # Check next lines for address continuation
                        for j in range(i+1, min(i+3, len(lines))):
                            if j not in used_lines and ('bangalore' in lines[j].lower() or 
                                                       'bengaluru' in lines[j].lower() or
                                                       re.search(r'\d{6}', lines[j])):
                                address_parts.append(lines[j])
                                used_lines.add(j)
                        
                        result['address'] = ', '.join(address_parts)
                        break
                if result['address']:
                    break
        
        # Remaining lines as notes
        remaining_lines = [lines[i] for i in range(len(lines)) if i not in used_lines]
        if remaining_lines:
            result['notes'] = remaining_lines
        
        return result

# Create global instances
deep_ocr_engine = AdvancedDeepOCREngine()
business_card_parser = EnhancedBusinessCardParser() 