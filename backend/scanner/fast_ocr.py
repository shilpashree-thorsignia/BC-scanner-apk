"""
Fast and Accurate OCR System for Business Cards
Optimized for speed and accuracy without heavy transformer models
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import re
import logging
from typing import Dict, List, Tuple, Optional
import pytesseract

# Lightweight OCR imports
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False

logger = logging.getLogger(__name__)

class FastOCREngine:
    """Fast OCR engine optimized for business cards"""
    
    def __init__(self):
        self.easyocr_reader = None
        self.business_patterns = self._load_business_patterns()
        self.initialize_easyocr()
        
    def initialize_easyocr(self):
        """Initialize EasyOCR only (fast and accurate)"""
        if EASYOCR_AVAILABLE:
            try:
                self.easyocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
                print("✅ Fast EasyOCR initialized")
            except Exception as e:
                print(f"❌ EasyOCR failed: {e}")
    
    def _load_business_patterns(self) -> Dict:
        """Universal business card patterns for any business card"""
        return {
            'email': [
                r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',
                r'\b[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}\b',
            ],
            'phone': [
                r'\b\+\d{1,3}[-.\s]?\d{8,15}\b',  # International format
                r'\b\d{5}\s+\d{5}\b',  # 5+5 format
                r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # 3-3-4 format
                r'\b\d{10,15}\b',  # 10-15 consecutive digits
                r'\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b',  # (xxx) xxx-xxxx format
            ],
            'website': [
                r'\bwww\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',
                r'\b[a-zA-Z0-9.-]+\.(com|in|org|net|co\.in|biz|info|edu|gov)\b',
                r'\bhttps?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*\b',
            ],
            'company': [
                r'\b[A-Z][a-zA-Z\s&]+(?:Pvt\.?\s*Ltd\.?|Limited|Inc\.?|Corp\.?|LLC|Bank|Finance|Store|Digital|Solutions|Technologies|Services|Group|Company|Enterprises|Industries|Systems|Consulting|Trading|Manufacturing)\b',
                r'\b[A-Z][A-Z\s]+(?:DIGITAL|IMAGING|PRINTING|BANK|FINANCE|TECHNOLOGIES|SOLUTIONS|STORE|LAYOUT|SYSTEMS|CONSULTING|TRADING|MANUFACTURING)\b',
                r'\b[A-Z][a-zA-Z\s]+(?:Company|Corporation|Enterprise|Group|Industries|Systems|Consulting|Trading|Manufacturing)\b',
            ],
            'name': [
                r'\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*\b',
                r'\b(?:Mr|Ms|Mrs|Dr|Prof)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b',
            ],
            'address': [
                r'#?\d+[,\s]+[A-Za-z\s,]+(?:Main|Road|Street|Avenue|Lane|Cross|Sector|Layout|Block|Nagar|Colony|Area|Park|Plaza|Tower|Building|Floor)[^.]*?(?:Bangalore|Bengaluru|Mumbai|Delhi|Chennai|Hyderabad|Pune|Kolkata|Ahmedabad|Surat|Jaipur|Lucknow|Kanpur|Nagpur|Indore|Thane|Bhopal|Visakhapatnam|Pimpri|Patna|Vadodara|Ghaziabad|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Kalyan|Vasai|Varanasi|Srinagar|Aurangabad|Dhanbad|Amritsar|Navi Mumbai|Allahabad|Ranchi|Howrah|Coimbatore|Jabalpur|Gwalior|Vijayawada|Jodhpur|Madurai|Raipur|Kota|Guwahati|Chandigarh|Solapur|Hubli|Tiruchirappalli|Bareilly|Mysore|Tiruppur|Gurgaon|Aligarh|Jalandhar|Bhubaneswar|Salem|Warangal|Guntur|Bhiwandi|Saharanpur|Gorakhpur|Bikaner|Amravati|Noida|Jamshedpur|Bhilai|Cuttack|Firozabad|Kochi|Nellore|Bhavnagar|Dehradun|Durgapur|Asansol|Rourkela|Nanded|Kolhapur|Ajmer|Akola|Gulbarga|Jamnagar|Ujjain|Loni|Siliguri|Jhansi|Ulhasnagar|Jammu|Sangli-Miraj|Mangalore|Erode|Belgaum|Ambattur|Tirunelveli|Malegaon|Gaya|Jalgaon|Udaipur|Maheshtala)[^.]*?\d{6}',
                r'\b[A-Za-z\s\d,.-]+(?:Layout|Road|Street|Avenue|Lane|Cross|Sector|Block|Nagar|Colony|Area|Park|Plaza|Tower|Building|Floor)[^.]*?\d{6}',
            ],
            'job_title': [
                r'\b(?:Business\s+(?:Head|Development\s+Executive|Manager|Director)|Manager|Director|CEO|CTO|CFO|COO|VP|Vice\s+President|President|Executive|Senior\s+Executive|Engineer|Senior\s+Engineer|Developer|Senior\s+Developer|Analyst|Senior\s+Analyst|Consultant|Senior\s+Consultant|Specialist|Coordinator|Supervisor|Administrator|Officer|Assistant|Associate|Partner|Founder|Owner|Proprietor)\b',
                r'\b(?:Sales|Marketing|HR|Finance|Operations|Technical|Account|Project)\s+(?:Manager|Executive|Head|Representative)\b',
                r'\b(?:Senior|Junior|Lead|Principal|Chief)\s+[A-Z][a-z]+\b',
                r'\b(?:Team\s+(?:Lead|Leader)|Chief\s+(?:Executive|Technology|Financial|Operating)\s+Officer|Principal|Architect|Designer)\b',
            ]
        }
    
    def fast_preprocess(self, image: np.ndarray) -> List[np.ndarray]:
        """Fast preprocessing - only the most effective methods"""
        processed_images = []
        
        # Original
        processed_images.append(image)
        
        # High contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        contrast_enhanced = clahe.apply(image)
        processed_images.append(contrast_enhanced)
        
        # Sharpened
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(image, -1, kernel)
        processed_images.append(sharpened)
        
        return processed_images
    
    def extract_with_easyocr_fast(self, image: np.ndarray) -> Dict:
        """Fast EasyOCR extraction"""
        if not self.easyocr_reader:
            return {'text': '', 'confidence': 0, 'method': 'easyocr_unavailable'}
        
        try:
            # Direct EasyOCR extraction
            results = self.easyocr_reader.readtext(image, detail=1, paragraph=False)
            
            if not results:
                return {'text': '', 'confidence': 0, 'method': 'easyocr_no_results'}
            
            # Extract text and confidence
            text_parts = []
            confidences = []
            
            for result in results:
                if len(result) >= 2:
                    bbox, text = result[0], result[1]
                    conf = result[2] if len(result) > 2 else 0.8
                    
                    if conf > 0.4 and len(text.strip()) > 1:
                        text_parts.append(text.strip())
                        confidences.append(conf * 100)
            
            if not text_parts:
                return {'text': '', 'confidence': 0, 'method': 'easyocr_low_confidence'}
            
            combined_text = '\n'.join(text_parts)
            avg_confidence = sum(confidences) / len(confidences)
            
            return {
                'text': combined_text,
                'confidence': avg_confidence,
                'method': 'easyocr_fast',
                'total_detections': len(results)
            }
            
        except Exception as e:
            logger.error(f"EasyOCR extraction failed: {e}")
            return {'text': '', 'confidence': 0, 'method': f'easyocr_error'}
    
    def extract_with_tesseract_fast(self, image: np.ndarray) -> Dict:
        """Fast Tesseract extraction with business card config"""
        try:
            pil_image = Image.fromarray(image)
            
            # Business card optimized config
            config = '--psm 6 --oem 3'
            text = pytesseract.image_to_string(pil_image, config=config)
            
            if not text.strip():
                return {'text': '', 'confidence': 0, 'method': 'tesseract_no_text'}
            
            # Calculate confidence based on text quality
            confidence = self.calculate_text_confidence(text)
            
            return {
                'text': text.strip(),
                'confidence': confidence,
                'method': 'tesseract_fast'
            }
            
        except Exception as e:
            logger.error(f"Tesseract extraction failed: {e}")
            return {'text': '', 'confidence': 0, 'method': 'tesseract_error'}
    
    def calculate_text_confidence(self, text: str) -> float:
        """Calculate confidence based on business card patterns"""
        if not text or not text.strip():
            return 0
        
        score = 30  # Base score
        
        # Business pattern matching
        for category, patterns in self.business_patterns.items():
            for pattern in patterns:
                matches = len(re.findall(pattern, text, re.IGNORECASE))
                if category == 'email':
                    score += matches * 20
                elif category == 'phone':
                    score += matches * 15
                elif category == 'website':
                    score += matches * 15
                elif category == 'company':
                    score += matches * 10
                elif category == 'name':
                    score += matches * 8
                else:
                    score += matches * 5
        
        # Text quality factors
        words = text.split()
        if len(words) >= 5:
            score += 10
        if len(words) >= 10:
            score += 10
        
        # Alphabetic content
        alpha_chars = sum(1 for char in text if char.isalpha())
        total_chars = len(text)
        if total_chars > 0:
            alpha_ratio = alpha_chars / total_chars
            score += alpha_ratio * 20
        
        return min(score, 100)
    
    def extract_text_fast(self, image: Image.Image) -> Dict:
        """Fast text extraction using the best available method"""
        # Convert to numpy array
        img_array = np.array(image.convert('L'))
        
        # Fast preprocessing
        processed_images = self.fast_preprocess(img_array)
        
        best_result = {'text': '', 'confidence': 0, 'method': 'no_text'}
        
        # Try EasyOCR first (usually the best)
        if self.easyocr_reader:
            for i, proc_img in enumerate(processed_images[:2]):  # Only try first 2 preprocessing methods
                result = self.extract_with_easyocr_fast(proc_img)
                if result['confidence'] > best_result['confidence']:
                    best_result = result
                    best_result['preprocessing'] = f'method_{i}'
                
                # If we get good confidence, use it
                if result['confidence'] > 70:
                    break
        
        # Try Tesseract if EasyOCR didn't work well
        if best_result['confidence'] < 50:
            for i, proc_img in enumerate(processed_images[:2]):
                result = self.extract_with_tesseract_fast(proc_img)
                if result['confidence'] > best_result['confidence']:
                    best_result = result
                    best_result['preprocessing'] = f'tesseract_method_{i}'
        
        return best_result

class FastBusinessCardParser:
    """Fast business card parser optimized for speed"""
    
    def __init__(self):
        self.patterns = self._load_patterns()
    
    def _load_patterns(self) -> Dict:
        """Load universal patterns for business card parsing"""
        return {
            'email': r'\b[a-zA-Z0-9._%+-]+[@a]\s*[a-zA-Z0-9.-]+\s*[.]\s*[a-zA-Z]{2,}\b',
            'phone': r'\b(?:\+\d{1,3}[-.\s]?)?\d{8,15}\b',
            'website': r'\b(?:www\.?|w{2,3}\.?)\s*[a-zA-Z0-9.-]+\s*\.?\s*(com|in|org|net|co\.in|biz|info|edu|gov)\b',
            'company': r'\b[A-Z][a-zA-Z\s&]+(?:Pvt\.?\s*Ltd\.?|Limited|Inc\.?|Corp\.?|LLC|Bank|Finance|Store|Digital|Solutions|Technologies|Services|Group|Company|Enterprises|Industries|Systems|Consulting|Trading|Manufacturing)\b',
            'name': r'^\s*[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?\s*$',
            'address': r'\b[A-Za-z\s\d,.-]+(?:Layout|Road|Street|Avenue|Lane|Cross|Sector|Block|Nagar|Colony|Area|Park|Plaza|Tower|Building|Floor)[^.]*?(?:Bangalore|Bengaluru|Mumbai|Delhi|Chennai|Hyderabad|Pune|Kolkata|Ahmedabad|Surat|Jaipur|Lucknow|Kanpur|Nagpur|Indore|Thane|Bhopal|Visakhapatnam|Pimpri|Patna|Vadodara|Ghaziabad|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Kalyan|Vasai|Varanasi|Srinagar|Aurangabad|Dhanbad|Amritsar|Navi Mumbai|Allahabad|Ranchi|Howrah|Coimbatore|Jabalpur|Gwalior|Vijayawada|Jodhpur|Madurai|Raipur|Kota|Guwahati|Chandigarh|Solapur|Hubli|Tiruchirappalli|Bareilly|Mysore|Tiruppur|Gurgaon|Aligarh|Jalandhar|Bhubaneswar|Salem|Warangal|Guntur|Bhiwandi|Saharanpur|Gorakhpur|Bikaner|Amravati|Noida|Jamshedpur|Bhilai|Cuttack|Firozabad|Kochi|Nellore|Bhavnagar|Dehradun|Durgapur|Asansol|Rourkela|Nanded|Kolhapur|Ajmer|Akola|Gulbarga|Jamnagar|Ujjain|Loni|Siliguri|Jhansi|Ulhasnagar|Jammu|Sangli-Miraj|Mangalore|Erode|Belgaum|Ambattur|Tirunelveli|Malegaon|Gaya|Jalgaon|Udaipur|Maheshtala)[^.]*?\d{6}',
            'job_title': r'\b(?:Business\s+(?:Head|Development\s+Executive|Manager|Director)|Manager|Director|CEO|CTO|CFO|COO|VP|Vice\s+President|President|Executive|Senior\s+Executive|Engineer|Senior\s+Engineer|Developer|Senior\s+Developer|Analyst|Senior\s+Analyst|Consultant|Senior\s+Consultant|Specialist|Coordinator|Supervisor|Administrator|Officer|Assistant|Associate|Partner|Founder|Owner|Proprietor|Sales\s+(?:Manager|Executive|Representative)|Marketing\s+(?:Manager|Executive|Head)|HR\s+(?:Manager|Executive|Head)|Finance\s+(?:Manager|Executive|Head)|Operations\s+(?:Manager|Executive|Head)|Technical\s+(?:Manager|Lead|Head)|Account\s+(?:Manager|Executive)|Project\s+(?:Manager|Lead)|Team\s+(?:Lead|Leader)|Chief\s+(?:Executive|Technology|Financial|Operating)\s+Officer|Principal|Architect|Designer)\b'
        }
    
    def parse_business_card_fast(self, text: str) -> Dict:
        """Fast business card parsing with improved OCR text handling"""
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
        
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        used_lines = set()
        
        # First, let's identify what each line likely represents based on patterns
        line_classifications = {}
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            line_clean = line.strip()
            
            # Skip lines that are just labels or prefixes
            if line_clean.lower() in ['deputed at:', 'address:', 'phone:', 'email:', 'mobile:']:
                line_classifications[i] = 'label'
                continue
            
            # Classify each line
            if '@' in line or re.search(r'[a-zA-Z0-9._%+-]+\s*[@a]\s*[a-zA-Z0-9.-]*\s*[.]\s*[a-zA-Z]{2,}', line):
                line_classifications[i] = 'email'
            elif re.search(r'\b(?:\+91[-.\s]?)?\d{8,15}\b', line):
                line_classifications[i] = 'phone'
            elif any(pattern in line_lower for pattern in ['www', 'http', '.com', '.in', '.org', '.net']):
                line_classifications[i] = 'website'
            elif re.search(r'(?:road|street|avenue|lane|cross|sector|block|layout|nagar|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|koramangala|whitefield|electronic city|mg road|brigade|forum|mall|tower|terraces|\d{6})', line_lower):
                line_classifications[i] = 'address'
            elif re.search(r'\b(?:corporate|senior|junior|assistant|deputy)\s+(?:sales|marketing|business|development|manager|director|executive|officer|engineer|analyst|consultant)\b', line_lower):
                # Specific multi-word job titles
                line_classifications[i] = 'job_title'
            elif any(title in line_lower for title in ['manager', 'director', 'executive', 'head', 'ceo', 'cto', 'officer', 'lead', 'engineer', 'developer', 'analyst', 'consultant', 'coordinator', 'supervisor']):
                # Check if it's a proper job title (not just containing business words)
                if (len(line_clean.split()) <= 5 and 
                    not re.search(r'[@\d{10}]', line_clean) and
                    not any(addr_word in line_lower for addr_word in ['road', 'street', 'bangalore', 'mumbai', 'delhi', 'tata', 'services', 'business services', 'solutions'])):
                    line_classifications[i] = 'job_title'
                else:
                    line_classifications[i] = 'unknown'
            elif (any(indicator in line_lower for indicator in ['pvt', 'ltd', 'limited', 'inc', 'corp', 'llc', 'tata', 'business services', 'solutions', 'technologies', 'bank', 'finance', 'digital', 'group', 'company', 'enterprises']) or
                  (len([c for c in line_clean if c.isupper()]) >= 3 and len(line_clean) <= 50 and 'services' in line_lower)):
                line_classifications[i] = 'company'
            elif (re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$', line_clean) and 
                  len(line_clean.split()) >= 1 and len(line_clean.split()) <= 3 and
                  len(line_clean) <= 40 and
                  # Must not contain business or location keywords
                  not any(word in line_lower for word in ['road', 'street', 'bangalore', 'mumbai', 'delhi', 'koramangala', 'block', 'sector', 'layout', 'nagar', 'tata', 'business', 'services', 'solutions', 'technologies', 'corporate', 'sales', 'executive', 'manager', 'director'])):
                line_classifications[i] = 'name'
            else:
                line_classifications[i] = 'unknown'
        
        # Extract email (highest priority)
        for i, line in enumerate(lines):
            if line_classifications.get(i) == 'email':
                # Look for email patterns in the line
                if '@' in line:
                    # Fix common OCR issues
                    cleaned = line.replace(' ', '').lower()
                    
                    # Try multiple email reconstruction approaches
                    if '@' in cleaned:
                        # First try normal email pattern
                        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', cleaned)
                        if email_match:
                            result['email'] = email_match.group()
                            used_lines.add(i)
                            break
                        else:
                            # Try to fix missing dot in domain (common OCR error)
                            email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*)(com|in|org|net|co\.in|gmail|yahoo|hotmail)', cleaned)
                            if email_match:
                                email_part = email_match.group(1)
                                domain_ext = email_match.group(2)
                                # Add missing dot if needed
                                if not email_part.endswith('.'):
                                    email_part += '.'
                                result['email'] = email_part + domain_ext
                                used_lines.add(i)
                                break
                    
                    # Try to reconstruct email from OCR errors
                    elif re.search(r'[a-zA-Z0-9._%+-]+\s*[@a]\s*[a-zA-Z0-9.-]*\s*(com|in|org|net)', line, re.IGNORECASE):
                        # Handle spaced out emails like "user @ domain . com"
                        email_parts = re.search(r'([a-zA-Z0-9._%+-]+)\s*[@a]\s*([a-zA-Z0-9.-]*)\s*\.?\s*(com|in|org|net)', line, re.IGNORECASE)
                        if email_parts:
                            username = email_parts.group(1)
                            domain = email_parts.group(2)
                            extension = email_parts.group(3)
                            result['email'] = f"{username}@{domain}.{extension}".lower()
                            used_lines.add(i)
                            break
        
        # Extract phone
        for i, line in enumerate(lines):
            if line_classifications.get(i) == 'phone':
                # Look for various phone patterns
                phone_patterns = [
                    r'\+91[-.\s]?\d{10}',  # +91 followed by 10 digits
                    r'\+91[-.\s]?\d{5}[-.\s]?\d{5}',  # +91 with 5+5 format
                    r'\b\d{5}[-.\s]+\d{5}\b',  # 5+5 format
                    r'\b\d{10}\b',  # 10 consecutive digits
                    r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # 3-3-4 format
                    r'\+\d{1,3}[-.\s]?\d{8,12}',  # International format
                    r'\b\d{2,4}[-.\s]?\d{6,8}\b'  # Other formats
                ]
                
                for pattern in phone_patterns:
                    phone_matches = re.findall(pattern, line)
                    if phone_matches:
                        # Prefer the first valid phone number
                        for phone in phone_matches:
                            clean_phone = re.sub(r'[^\d+]', '', phone)
                            # Must have at least 10 digits (excluding country code +)
                            if len(clean_phone.replace('+', '')) >= 10:
                                result['mobile'] = phone.strip()
                                used_lines.add(i)
                                break
                        if result['mobile']:
                            break
                if result['mobile']:
                    break
        
        # Extract website with enhanced OCR error tolerance
        for i, line in enumerate(lines):
            if line_classifications.get(i) == 'website':
                line_lower = line.lower().replace(' ', '')
                original_line = line.strip()
                
                # Try different website patterns
                if 'http' in line_lower:
                    url_match = re.search(r'https?://[^\s]+', line_lower)
                    if url_match:
                        result['website'] = url_match.group()
                        used_lines.add(i)
                        break
                elif 'www' in line_lower:
                    url_match = re.search(r'www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', line_lower)
                    if url_match:
                        result['website'] = 'https://' + url_match.group()
                        used_lines.add(i)
                        break
                elif re.search(r'[a-zA-Z0-9.-]+\.(com|in|org|net|co\.in)', line_lower):
                    # Extract domain pattern
                    domain_match = re.search(r'([a-zA-Z0-9.-]+\.(com|in|org|net|co\.in))', line_lower)
                    if domain_match:
                        domain = domain_match.group(1)
                        # Don't add www if it's already there or if it looks like an email
                        if not domain.startswith('www.') and '@' not in line:
                            result['website'] = f'https://www.{domain}'
                        else:
                            result['website'] = f'https://{domain}'
                        used_lines.add(i)
                        break
                else:
                    # Handle OCR errors like missing dots before TLD
                    # Check for patterns like "wwwaxisbankcom" or "axisbankcom"
                    ocr_patterns = [
                        r'(?i)www[a-zA-Z0-9-]+com\b',  # wwwsitecom
                        r'(?i)www[a-zA-Z0-9-]+in\b',   # wwwsitein
                        r'(?i)[a-zA-Z0-9-]+com\b',     # sitecom
                        r'(?i)[a-zA-Z0-9-]+in\b',      # sitein
                    ]
                    
                    for pattern in ocr_patterns:
                        match = re.search(pattern, original_line)
                        if match:
                            website = match.group()
                            
                            # Fix the website by adding missing dots
                            if website.lower().startswith('www'):
                                # Handle wwwsitecom -> www.site.com
                                if website.lower().endswith('com'):
                                    website = website[:3] + '.' + website[3:-3] + '.com'
                                elif website.lower().endswith('in'):
                                    website = website[:3] + '.' + website[3:-2] + '.in'
                            else:
                                # Handle sitecom -> site.com
                                if website.lower().endswith('com'):
                                    website = website[:-3] + '.com'
                                elif website.lower().endswith('in'):
                                    website = website[:-2] + '.in'
                                # Add www prefix
                                website = 'www.' + website
                            
                            # Add https prefix
                            result['website'] = 'https://' + website
                            used_lines.add(i)
                            break
                    
                    if result.get('website'):
                        break
        
        # Extract job title - prioritize lines classified as job_title
        job_title_candidates = []
        for i, line in enumerate(lines):
            if line_classifications.get(i) == 'job_title' and i not in used_lines:
                job_title_candidates.append((i, line.strip()))
        
        # Pick the best job title candidate
        if job_title_candidates:
            # Prefer longer, more complete job titles
            best_job_title = max(job_title_candidates, key=lambda x: len(x[1].split()))
            result['job_title'] = best_job_title[1]
            used_lines.add(best_job_title[0])
        
        # Extract company - look for company-classified lines or construct from multiple lines
        company_candidates = []
        for i, line in enumerate(lines):
            if line_classifications.get(i) == 'company' and i not in used_lines:
                company_candidates.append((i, line.strip()))
        
        if company_candidates:
            # Try to construct complete company name from adjacent lines
            for i, candidate_line in company_candidates:
                company_parts = [candidate_line]
                
                # Check if the next line is also a company part (like "Business Services" after "TATA Tele")
                if (i + 1 < len(lines) and 
                    line_classifications.get(i + 1) in ['company', 'unknown'] and 
                    i + 1 not in used_lines):
                    next_line = lines[i + 1].strip()
                    if (any(word in next_line.lower() for word in ['services', 'solutions', 'technologies', 'business', 'systems', 'consulting', 'finance', 'bank', 'digital']) and
                        len(next_line.split()) <= 3 and
                        not any(job_word in next_line.lower() for job_word in ['executive', 'manager', 'director', 'officer'])):
                        company_parts.append(next_line)
                        used_lines.add(i + 1)
                
                # Check previous line too
                if (i - 1 >= 0 and 
                    line_classifications.get(i - 1) in ['company', 'unknown'] and 
                    i - 1 not in used_lines):
                    prev_line = lines[i - 1].strip()
                    if (any(word in prev_line.lower() for word in ['tata', 'infosys', 'wipro', 'tech', 'mahindra', 'reliance']) and
                        len(prev_line.split()) <= 3):
                        company_parts.insert(0, prev_line)
                        used_lines.add(i - 1)
                
                result['company'] = ' '.join(company_parts)
                used_lines.add(i)
                break
        
        # If no company found through classification, try a broader approach
        if not result['company']:
            # Look for patterns like "COMPANY NAME" followed by "Business Services"
            for i in range(len(lines) - 1):
                if i in used_lines or i + 1 in used_lines:
                    continue
                
                current_line = lines[i].strip()
                next_line = lines[i + 1].strip()
                
                # Check if first line looks like a company name and second line is a business descriptor
                if (len([c for c in current_line if c.isupper()]) >= 2 and
                    len(current_line.split()) <= 3 and
                    any(word in next_line.lower() for word in ['business', 'services', 'solutions', 'technologies']) and
                    len(next_line.split()) <= 3 and
                    not any(job_word in next_line.lower() for job_word in ['executive', 'manager', 'director', 'officer'])):
                    
                    result['company'] = f"{current_line} {next_line}"
                    used_lines.add(i)
                    used_lines.add(i + 1)
                    break
        
        # Extract name - prioritize lines classified as name, but avoid address components
        name_candidates = []
        
        # Define keyboard keys and other non-business-card terms to exclude
        keyboard_keys = [
            'end', 'fn', 'insert', 'delete', 'ctrl', 'alt', 'shift', 'tab', 'enter', 
            'space', 'home', 'page', 'up', 'down', 'left', 'right', 'esc', 'f1', 'f2', 
            'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'print', 
            'screen', 'scroll', 'lock', 'pause', 'break', 'caps', 'num', 'gr'
        ]
        
        for i, line in enumerate(lines):
            if line_classifications.get(i) == 'name' and i not in used_lines:
                clean_line = line.strip()
                words = clean_line.split()
                
                # Skip keyboard keys and other non-name content
                if (len(words) == 1 and 
                    (clean_line.lower() in keyboard_keys or 
                     len(clean_line) < 4 or
                     clean_line.lower() in ['end', 'fn', 'insert', 'delete', 'ctrl', 'alt', 'shift'])):
                    continue
                
                # Score the name candidate
                name_score = 0
                
                # Prefer 2-3 word names
                if 2 <= len(words) <= 3:
                    name_score += 5
                elif len(words) == 1:
                    name_score += 1
                
                # Check for proper name pattern
                if re.match(r'^[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}', clean_line):
                    name_score += 6
                
                # Add to candidates with score
                name_candidates.append((i, clean_line, name_score))
        
        if name_candidates:
            # Sort by score first
            name_candidates.sort(key=lambda x: x[2], reverse=True)
            
            # Prefer names that don't contain location words
            location_words = ['road', 'street', 'koramangala', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'block', 'sector', 'layout', 'nagar', 'avenue', 'lane']
            best_name = None
            
            for i, candidate_name, score in name_candidates:
                if not any(word in candidate_name.lower() for word in location_words):
                    best_name = (i, candidate_name)
                    break
            
            if not best_name and name_candidates:
                # If all names contain location words, pick the highest scoring one
                best_name = (name_candidates[0][0], name_candidates[0][1])
            
            if best_name:
                result['name'] = best_name[1]
                used_lines.add(best_name[0])
        
        # Extract address - combine address-classified lines
        address_parts = []
        for i, line in enumerate(lines):
            if line_classifications.get(i) == 'address' and i not in used_lines:
                address_parts.append(line.strip())
                used_lines.add(i)
        
        if address_parts:
            result['address'] = ', '.join(address_parts)
        
        # If no company found in first pass, try a second pass with more relaxed criteria
        if not result['company']:
            for i, line in enumerate(lines):
                if i in used_lines:
                    continue
                line_lower = line.lower()
                line_clean = line.strip()
                
                # Look for any line that could be a company (more relaxed criteria)
                if (len(line_clean) > 3 and len(line_clean) < 100 and
                    # Has some business indicators or looks like a company name
                    (any(word in line_lower for word in ['store', 'digital', 'imaging', 'printing', 'layout', 'pvt', 'ltd', 'limited', 'inc', 'corp', 'bank', 'finance', 'solutions', 'technologies', 'services', 'group', 'company', 'enterprises']) or
                     # Or contains multiple capital letters (likely company name)
                     len([c for c in line_clean if c.isupper()]) >= 2) and
                    # But not email, phone, or address
                    not re.search(r'[@\d{10}]', line_clean) and
                    not any(addr_word in line_lower for addr_word in ['road', 'street', 'avenue', 'lane', 'cross', 'sector', 'block', 'nagar', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'koramangala'])):
                    
                    result['company'] = line_clean
                    used_lines.add(i)
                    break
        
        # If no name found, try a second pass with different criteria
        if not result['name']:
            for i, line in enumerate(lines):
                if i in used_lines:
                    continue
                line_clean = line.strip()
                words = line_clean.split()
                
                # Skip keyboard keys and other non-name content
                if (len(words) == 1 and 
                    (line_clean.lower() in keyboard_keys or 
                     len(line_clean) < 4 or
                     line_clean.lower() in ['end', 'fn', 'insert', 'delete', 'ctrl', 'alt', 'shift'])):
                    continue
                
                # Look for proper names (more flexible criteria)
                if (len(words) >= 1 and len(line_clean) < 50 and 
                    not re.search(r'[@\d+]', line_clean) and 
                    re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$', line_clean) and
                    # Exclude business terms and address components
                    not any(word.lower() in line_clean.lower() for word in ['business', 'services', 'solutions', 'technologies', 'pvt', 'ltd', 'limited', 'inc', 'corp', 'bank', 'finance', 'group', 'company', 'enterprises', 'www', '.com', '.in', '.org', 'road', 'street', 'koramangala', 'bangalore', 'mumbai', 'delhi', 'block', 'sector']) and
                    # Exclude job titles but allow names with common titles
                    not re.match(r'^(Mr|Mrs|Ms|Dr|Prof)\.?\s+', line_clean, re.IGNORECASE)):
                    result['name'] = line_clean
                    used_lines.add(i)
                    break
        
        # Add remaining lines as notes (but limit them)
        notes = []
        for i, line in enumerate(lines):
            if i not in used_lines and len(line) > 3:
                notes.append(line)
        
        if notes:
            result['notes'] = notes[:3]  # Increase to 3 notes to capture more context
        
        return result

# Create global instances
fast_ocr_engine = FastOCREngine()
fast_business_card_parser = FastBusinessCardParser() 