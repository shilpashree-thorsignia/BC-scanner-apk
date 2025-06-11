"""
Enhanced Gemini AI OCR for Dual-Side Business Card Scanning
Supports comprehensive field extraction from both sides of business cards
"""

import google.generativeai as genai
import os
import json
import re
import time
import logging
from typing import Dict, Any, Optional, List, Tuple
from PIL import Image
import base64
import io

logger = logging.getLogger(__name__)

class EnhancedGeminiAIOCR:
    """Enhanced Gemini AI OCR with dual-side support and comprehensive field extraction"""
    
    def __init__(self):
        self.model = None
        self.api_key = None
        self.initialize()
    
    def initialize(self):
        """Initialize Gemini AI with API key"""
        try:
            # Try to get API key from environment
            self.api_key = os.getenv('GOOGLE_GEMINI_API_KEY')
            
            if not self.api_key:
                # Try to load from .env file
                from dotenv import load_dotenv
                load_dotenv()
                self.api_key = os.getenv('GOOGLE_GEMINI_API_KEY')
            
            if self.api_key:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("✅ Enhanced Gemini AI OCR initialized successfully")
                return True
            else:
                logger.error("❌ GOOGLE_GEMINI_API_KEY not found")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize Enhanced Gemini AI: {e}")
            return False
    
    def get_comprehensive_prompt(self, scan_type="single"):
        """Get the comprehensive prompt for business card extraction"""
        if scan_type == "dual":
            return """
You are an expert business card data extraction AI. Analyze BOTH SIDES of this business card and extract ALL possible information with maximum accuracy.

Extract and organize the information into this comprehensive JSON structure:

{
    "personal_info": {
        "name": "Full name exactly as written",
        "first_name": "First name only",
        "last_name": "Last name only", 
        "middle_name": "Middle name if present",
        "title": "Mr/Mrs/Dr/Prof if present"
    },
    "contact_info": {
        "email": "Primary email address",
        "email_secondary": "Secondary email if present",
        "mobile": "Primary mobile number with country code",
        "mobile_secondary": "Secondary mobile if present",
        "landline": "Landline/office phone",
        "fax": "Fax number if present"
    },
    "company_info": {
        "company": "Company name (short version)",
        "company_full_name": "Full company name with Ltd/Pvt/Inc",
        "department": "Department/Division",
        "job_title": "Primary job title/position",
        "job_title_secondary": "Secondary title if present",
        "industry": "Industry/Business type",
        "services": "Services offered (from card description)",
        "specialization": "Areas of specialization"
    },
    "digital_presence": {
        "website": "Primary website URL",
        "website_secondary": "Secondary website if present",
        "linkedin": "LinkedIn profile URL",
        "twitter": "Twitter handle or URL",
        "facebook": "Facebook page URL",
        "instagram": "Instagram handle or URL",
        "skype": "Skype ID",
        "social_media_other": "Any other social media"
    },
    "address_info": {
        "address": "Complete address as written",
        "street_address": "Street address only",
        "city": "City name",
        "state": "State/Province",
        "postal_code": "ZIP/Postal code",
        "country": "Country name"
    },
    "additional_info": {
        "certifications": "Professional certifications mentioned",
        "awards": "Awards or achievements mentioned",
        "languages": "Languages mentioned",
        "timezone": "Time zone if indicated",
        "qr_code_present": "true/false if QR code visible",
        "logo_present": "true/false if company logo visible",
        "card_design": "Brief description of card design/colors"
    },
    "metadata": {
        "confidence_score": "Overall confidence 0-100",
        "text_quality": "excellent/good/fair/poor",
        "side_analyzed": "front/back/both",
        "extraction_notes": "Any extraction challenges or notes"
    }
}

IMPORTANT EXTRACTION RULES:
1. Extract EXACT text as written (preserve formatting, spelling)
2. For phone numbers, include country codes (+91, +1, etc.)
3. For emails, extract complete addresses including domains
4. For websites, include full URLs (add https:// if missing)
5. Separate multiple values clearly
6. If information spans both sides, combine intelligently
7. Mark confidence as "needs_review": true if uncertain
8. Extract ALL text even if some fields are empty
9. Look for social media handles/URLs on both sides
10. Pay attention to back side for additional services/certifications

Provide ONLY the JSON response, no other text.
"""
        else:
            return """
You are an expert business card data extraction AI. Analyze this business card image and extract ALL possible information with maximum accuracy.

Extract and organize the information into this comprehensive JSON structure:

{
    "personal_info": {
        "name": "Full name exactly as written",
        "first_name": "First name only",
        "last_name": "Last name only", 
        "middle_name": "Middle name if present",
        "title": "Mr/Mrs/Dr/Prof if present"
    },
    "contact_info": {
        "email": "Primary email address",
        "email_secondary": "Secondary email if present",
        "mobile": "Primary mobile number with country code",
        "mobile_secondary": "Secondary mobile if present",
        "landline": "Landline/office phone",
        "fax": "Fax number if present"
    },
    "company_info": {
        "company": "Company name (short version)",
        "company_full_name": "Full company name with Ltd/Pvt/Inc",
        "department": "Department/Division",
        "job_title": "Primary job title/position",
        "job_title_secondary": "Secondary title if present",
        "industry": "Industry/Business type",
        "services": "Services offered (from card description)",
        "specialization": "Areas of specialization"
    },
    "digital_presence": {
        "website": "Primary website URL",
        "website_secondary": "Secondary website if present",
        "linkedin": "LinkedIn profile URL",
        "twitter": "Twitter handle or URL",
        "facebook": "Facebook page URL",
        "instagram": "Instagram handle or URL",
        "skype": "Skype ID"
    },
    "address_info": {
        "address": "Complete address as written",
        "street_address": "Street address only",
        "city": "City name",
        "state": "State/Province",
        "postal_code": "ZIP/Postal code",
        "country": "Country name"
    },
    "additional_info": {
        "certifications": "Professional certifications mentioned",
        "awards": "Awards or achievements mentioned",
        "languages": "Languages mentioned",
        "qr_code_present": "true/false if QR code visible",
        "logo_present": "true/false if company logo visible"
    },
    "metadata": {
        "confidence_score": "Overall confidence 0-100",
        "text_quality": "excellent/good/fair/poor",
        "extraction_notes": "Any extraction challenges or notes"
    }
}

IMPORTANT EXTRACTION RULES:
1. Extract EXACT text as written (preserve formatting, spelling)
2. For phone numbers, include country codes (+91, +1, etc.)
3. For emails, extract complete addresses including domains
4. For websites, include full URLs (add https:// if missing)
5. If information is unclear, mark in extraction_notes
6. Extract ALL visible text even if some fields are empty

Provide ONLY the JSON response, no other text.
"""
    
    def extract_from_single_image(self, image: Image.Image) -> Dict[str, Any]:
        """Extract comprehensive data from a single business card image"""
        if not self.model:
            logger.error("Gemini AI model not initialized")
            return self._get_error_response("Model not initialized")
        
        try:
            start_time = time.time()
            
            # Get the comprehensive prompt
            prompt = self.get_comprehensive_prompt("single")
            
            # Generate content from image
            response = self.model.generate_content([prompt, image])
            
            processing_time = time.time() - start_time
            
            if response and response.text:
                # Parse the JSON response
                extracted_data = self._parse_gemini_response(response.text)
                extracted_data['processing_time'] = processing_time
                extracted_data['scan_method'] = 'gemini_single_side'
                
                return extracted_data
            else:
                logger.error("Empty response from Gemini AI")
                return self._get_error_response("Empty response from AI")
                
        except Exception as e:
            logger.error(f"Single image extraction failed: {e}")
            return self._get_error_response(f"Extraction failed: {str(e)}")
    
    def extract_from_dual_images(self, front_image: Image.Image, back_image: Image.Image) -> Dict[str, Any]:
        """Extract comprehensive data from both sides of a business card"""
        if not self.model:
            logger.error("Gemini AI model not initialized")
            return self._get_error_response("Model not initialized")
        
        try:
            start_time = time.time()
            
            # Get the dual-side prompt
            prompt = self.get_comprehensive_prompt("dual")
            
            # Create a combined prompt for both sides
            dual_prompt = f"""
{prompt}

FRONT SIDE OF BUSINESS CARD:
[Analyze the first image - this is the FRONT side]

BACK SIDE OF BUSINESS CARD:
[Analyze the second image - this is the BACK side]

Combine information from both sides intelligently. The front side typically has main contact info, while the back side may have additional services, certifications, or secondary contact information.
"""
            
            # Generate content from both images
            response = self.model.generate_content([dual_prompt, front_image, back_image])
            
            processing_time = time.time() - start_time
            
            if response and response.text:
                # Parse the JSON response
                extracted_data = self._parse_gemini_response(response.text)
                extracted_data['processing_time'] = processing_time
                extracted_data['scan_method'] = 'gemini_dual_side'
                
                # Ensure metadata exists and update it
                if 'metadata' not in extracted_data:
                    extracted_data['metadata'] = {}
                extracted_data['metadata']['side_analyzed'] = 'both'
                
                # Return success structure
                return {
                    'success': True,
                    'data': extracted_data,
                    'processing_time': processing_time,
                    'scan_method': 'gemini_dual_side'
                }
            else:
                logger.error("Empty response from Gemini AI for dual-side scan")
                return self._get_error_response("Empty response from AI")
                
        except Exception as e:
            logger.error(f"Dual image extraction failed: {e}")
            return self._get_error_response(f"Dual extraction failed: {str(e)}")
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and validate Gemini AI JSON response with robust error handling"""
        try:
            # Clean the response text
            cleaned_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if cleaned_text.startswith('```json'):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith('```'):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith('```'):
                cleaned_text = cleaned_text[:-3]
            
            # Additional cleaning for malformed responses
            cleaned_text = cleaned_text.strip()
            
            # Try to fix common JSON issues
            cleaned_text = self._fix_common_json_issues(cleaned_text)
            
            # Parse JSON
            data = json.loads(cleaned_text)
            
            # Validate and normalize the structure
            normalized_data = self._normalize_extracted_data(data)
            
            return normalized_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response text (first 1000 chars): {response_text[:1000]}...")
            
            # Try to extract partial data using regex as fallback
            partial_data = self._extract_partial_data_fallback(response_text)
            if partial_data:
                logger.info("Successfully extracted partial data using fallback method")
                return self._normalize_extracted_data(partial_data)
            
            return self._get_error_response(f"Failed to parse JSON response: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing response: {e}")
            return self._get_error_response(f"Processing error: {str(e)}")
    
    def _fix_common_json_issues(self, text: str) -> str:
        """Fix common JSON formatting issues from AI responses"""
        try:
            # Remove any trailing commas before closing braces/brackets
            text = re.sub(r',(\s*[}\]])', r'\1', text)
            
            # Fix unescaped newlines in strings
            text = re.sub(r'(?<!\\)\n(?=[^"]*"[^"]*$)', '\\n', text)
            
            # Fix unescaped quotes in strings (basic attempt)
            # This is a simple fix - more sophisticated handling could be added
            lines = text.split('\n')
            fixed_lines = []
            for line in lines:
                # If line contains quotes and appears to be a JSON property
                if '"' in line and ':' in line:
                    # Try to escape unescaped quotes within string values
                    # This is a basic implementation
                    fixed_lines.append(line)
                else:
                    fixed_lines.append(line)
            
            text = '\n'.join(fixed_lines)
            
            # Remove any text before the first { or [ if present
            first_brace = text.find('{')
            first_bracket = text.find('[')
            
            if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
                text = text[first_brace:]
            elif first_bracket != -1:
                text = text[first_bracket:]
            
            # Remove any text after the last } or ] if present
            last_brace = text.rfind('}')
            last_bracket = text.rfind(']')
            
            if last_brace != -1 and (last_bracket == -1 or last_brace > last_bracket):
                text = text[:last_brace + 1]
            elif last_bracket != -1:
                text = text[:last_bracket + 1]
            
            return text
            
        except Exception as e:
            logger.warning(f"Error fixing JSON issues: {e}")
            return text
    
    def _extract_partial_data_fallback(self, response_text: str) -> Dict[str, Any]:
        """Extract partial data using regex when JSON parsing fails"""
        import re
        
        fallback_data = {}
        
        try:
            # Extract common fields using regex patterns
            patterns = {
                'name': [r'"name":\s*"([^"]*)"', r'Name:\s*([^\n\r]+)'],
                'email': [r'"email":\s*"([^"]*)"', r'Email:\s*([^\s\n\r]+)'],
                'mobile': [r'"mobile":\s*"([^"]*)"', r'Phone:\s*([^\n\r]+)', r'Mobile:\s*([^\n\r]+)'],
                'company': [r'"company":\s*"([^"]*)"', r'Company:\s*([^\n\r]+)'],
                'job_title': [r'"job_title":\s*"([^"]*)"', r'Title:\s*([^\n\r]+)', r'Position:\s*([^\n\r]+)'],
                'website': [r'"website":\s*"([^"]*)"', r'Website:\s*([^\s\n\r]+)'],
                'address': [r'"address":\s*"([^"]*)"', r'Address:\s*([^\n\r]+)'],
            }
            
            for field, pattern_list in patterns.items():
                for pattern in pattern_list:
                    match = re.search(pattern, response_text, re.IGNORECASE)
                    if match:
                        fallback_data[field] = match.group(1).strip()
                        break
            
            # Only return if we found at least one meaningful field
            if any(fallback_data.get(field) for field in ['name', 'email', 'company']):
                fallback_data['success'] = True
                fallback_data['notes'] = 'Extracted using fallback method due to JSON parsing error'
                fallback_data['needs_review'] = True
                return fallback_data
            
        except Exception as e:
            logger.error(f"Fallback extraction failed: {e}")
        
        return None
    
    def _normalize_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize and validate extracted data structure"""
        normalized = {
            'success': True,
            'name': '',
            'first_name': '',
            'last_name': '',
            'middle_name': '',
            'email': '',
            'email_secondary': '',
            'mobile': '',
            'mobile_secondary': '',
            'landline': '',
            'fax': '',
            'company': '',
            'company_full_name': '',
            'department': '',
            'job_title': '',
            'job_title_secondary': '',
            'website': '',
            'website_secondary': '',
            'linkedin': '',
            'twitter': '',
            'facebook': '',
            'instagram': '',
            'skype': '',
            'address': '',
            'street_address': '',
            'city': '',
            'state': '',
            'postal_code': '',
            'country': '',
            'industry': '',
            'services': '',
            'specialization': '',
            'certifications': '',
            'awards': '',
            'primary_language': '',
            'secondary_language': '',
            'timezone': '',
            'qr_code_data': '',
            'notes': '',
            'scan_confidence': 0.0,
            'scan_method': 'gemini_enhanced',
            'processing_time': 0.0,
            'needs_review': False
        }
        
        try:
            # Extract personal info
            if 'personal_info' in data:
                personal = data['personal_info']
                normalized['name'] = personal.get('name', '')
                normalized['first_name'] = personal.get('first_name', '')
                normalized['last_name'] = personal.get('last_name', '')
                normalized['middle_name'] = personal.get('middle_name', '')
            
            # Extract contact info
            if 'contact_info' in data:
                contact = data['contact_info']
                normalized['email'] = contact.get('email', '')
                normalized['email_secondary'] = contact.get('email_secondary', '')
                normalized['mobile'] = contact.get('mobile', '')
                normalized['mobile_secondary'] = contact.get('mobile_secondary', '')
                normalized['landline'] = contact.get('landline', '')
                normalized['fax'] = contact.get('fax', '')
            
            # Extract company info
            if 'company_info' in data:
                company = data['company_info']
                normalized['company'] = company.get('company', '')
                normalized['company_full_name'] = company.get('company_full_name', '')
                normalized['department'] = company.get('department', '')
                normalized['job_title'] = company.get('job_title', '')
                normalized['job_title_secondary'] = company.get('job_title_secondary', '')
                normalized['industry'] = company.get('industry', '')
                normalized['services'] = company.get('services', '')
                normalized['specialization'] = company.get('specialization', '')
            
            # Extract digital presence
            if 'digital_presence' in data:
                digital = data['digital_presence']
                normalized['website'] = digital.get('website', '')
                normalized['website_secondary'] = digital.get('website_secondary', '')
                normalized['linkedin'] = digital.get('linkedin', '')
                normalized['twitter'] = digital.get('twitter', '')
                normalized['facebook'] = digital.get('facebook', '')
                normalized['instagram'] = digital.get('instagram', '')
                normalized['skype'] = digital.get('skype', '')
            
            # Extract address info
            if 'address_info' in data:
                address = data['address_info']
                normalized['address'] = address.get('address', '')
                normalized['street_address'] = address.get('street_address', '')
                normalized['city'] = address.get('city', '')
                normalized['state'] = address.get('state', '')
                normalized['postal_code'] = address.get('postal_code', '')
                normalized['country'] = address.get('country', '')
            
            # Extract additional info
            if 'additional_info' in data:
                additional = data['additional_info']
                normalized['certifications'] = additional.get('certifications', '')
                normalized['awards'] = additional.get('awards', '')
                normalized['primary_language'] = additional.get('languages', '')
                normalized['timezone'] = additional.get('timezone', '')
                
                # Check for QR code
                if additional.get('qr_code_present') == 'true':
                    normalized['qr_code_data'] = 'QR code detected'
            
            # Extract metadata
            if 'metadata' in data:
                metadata = data['metadata']
                try:
                    confidence = float(metadata.get('confidence_score', 0))
                    normalized['scan_confidence'] = confidence
                except (ValueError, TypeError):
                    normalized['scan_confidence'] = 75.0  # Default confidence
                
                # Check if needs review
                if metadata.get('text_quality') in ['poor', 'fair']:
                    normalized['needs_review'] = True
                
                # Add extraction notes to notes field
                extraction_notes = metadata.get('extraction_notes', '')
                if extraction_notes:
                    normalized['notes'] = extraction_notes
            
            # Ensure main name field is populated
            if not normalized['name'] and normalized['first_name'] and normalized['last_name']:
                middle = f" {normalized['middle_name']}" if normalized['middle_name'] else ""
                normalized['name'] = f"{normalized['first_name']}{middle} {normalized['last_name']}"
            
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing data: {e}")
            # Return basic structure with error note
            normalized['notes'] = f"Data normalization error: {str(e)}"
            normalized['needs_review'] = True
            return normalized
    
    def _get_error_response(self, error_message: str) -> Dict[str, Any]:
        """Get standardized error response"""
        return {
            'success': False,
            'error': error_message,
            'data': {},
            'name': '',
            'email': '',
            'mobile': '',
            'company': '',
            'job_title': '',
            'website': '',
            'address': '',
            'notes': f"Extraction failed: {error_message}",
            'scan_confidence': 0.0,
            'scan_method': 'gemini_error',
            'processing_time': 0.0,
            'needs_review': True
        }

# Global instance
enhanced_gemini_ocr = EnhancedGeminiAIOCR() 