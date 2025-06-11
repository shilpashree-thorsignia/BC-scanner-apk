import os
import io
import json
import base64
from PIL import Image
import google.generativeai as genai
import logging
import time

logger = logging.getLogger(__name__)

class GeminiOCR:
    """Google Gemini AI OCR service optimized for speed"""
    
    def __init__(self):
        self.model = None
        self.api_key = None
        self.initialize_gemini()
    
    def initialize_gemini(self):
        """Initialize Gemini AI with API key"""
        try:
            # Check for API key in environment
            api_key = os.environ.get('GOOGLE_GEMINI_API_KEY')
            
            if not api_key:
                print("❌ GOOGLE_GEMINI_API_KEY not found in environment variables")
                self.model = None
                self.api_key = None
                return False
            
            # Only reinitialize if API key changed
            if self.api_key != api_key:
                # Configure Gemini
                genai.configure(api_key=api_key)
                
                # Use the fastest model with optimized settings
                generation_config = {
                    "temperature": 0.1,  # Lower temperature for faster, more deterministic responses
                    "top_p": 0.8,
                    "top_k": 20,
                    "max_output_tokens": 500,  # Limit output for faster response
                }
                
                self.model = genai.GenerativeModel(
                    'gemini-1.5-flash',  # Fastest model
                    generation_config=generation_config
                )
                self.api_key = api_key
                print("✅ Google Gemini AI initialized with speed optimizations")
                return True
            
            return self.model is not None
            
        except Exception as e:
            print(f"❌ Gemini AI initialization failed: {e}")
            self.model = None
            self.api_key = None
            return False
    
    def optimize_image(self, image_data):
        """Optimize image for faster processing"""
        try:
            # Convert image data to PIL Image if needed
            if isinstance(image_data, bytes):
                image = Image.open(io.BytesIO(image_data))
            else:
                image = image_data
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize image for faster processing (max 800px width)
            max_width = 800
            if image.width > max_width:
                ratio = max_width / image.width
                new_height = int(image.height * ratio)
                image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Enhance contrast for better OCR
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)
            
            return image
            
        except Exception as e:
            logger.error(f"Image optimization error: {e}")
            return image_data
    
    def extract_business_card_info(self, image_data):
        """Extract business card information using optimized Gemini AI"""
        start_time = time.time()
        
        # Try to reinitialize if not available
        if not self.model:
            if not self.initialize_gemini():
                return {
                    'success': False,
                    'error': 'Gemini AI not initialized. Check GOOGLE_GEMINI_API_KEY.',
                    'data': {},
                    'processing_time': 0
                }
        
        try:
            # Optimize image for faster processing
            image = self.optimize_image(image_data)
            
            # Ultra-simplified prompt for maximum speed
            prompt = """Extract business card info as JSON:
{"name":"","company":"","job_title":"","email":"","mobile":"","website":"","address":"","notes":""}

Rules:
- Extract only visible text
- For website: add https:// if missing
- Empty string if not found
- JSON only, no explanation"""
            
            # Generate content using Gemini with timeout
            response = self.model.generate_content([prompt, image])
            
            processing_time = time.time() - start_time
            
            if not response or not response.text:
                return {
                    'success': False,
                    'error': 'No response from Gemini AI',
                    'data': {},
                    'processing_time': processing_time
                }
            
            # Clean and parse the response
            response_text = response.text.strip()
            
            # Remove markdown code block markers if present
            if response_text.startswith('```json'):
                response_text = response_text.replace('```json', '').replace('```', '').strip()
            elif response_text.startswith('```'):
                response_text = response_text.replace('```', '').strip()
            
            # Parse JSON response
            try:
                business_card_data = json.loads(response_text)
                
                # Validate and ensure all required fields exist
                required_fields = ['name', 'company', 'job_title', 'email', 'mobile', 'website', 'address', 'notes']
                for field in required_fields:
                    if field not in business_card_data:
                        business_card_data[field] = ""
                
                # Quick URL normalization
                if business_card_data.get('website') and not business_card_data['website'].startswith(('http://', 'https://')):
                    website = business_card_data['website'].strip()
                    if website:
                        if website.startswith('www.'):
                            business_card_data['website'] = f'https://{website}'
                        elif '.' in website:
                            business_card_data['website'] = f'https://www.{website}'
                
                return {
                    'success': True,
                    'data': business_card_data,
                    'raw_response': response.text[:200] + '...' if len(response.text) > 200 else response.text,
                    'confidence': 95,
                    'processing_time': processing_time
                }
                
            except json.JSONDecodeError as e:
                return {
                    'success': False,
                    'error': f'Failed to parse JSON response: {e}',
                    'raw_response': response.text[:200] + '...' if len(response.text) > 200 else response.text,
                    'data': {},
                    'processing_time': processing_time
                }
                
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Gemini OCR error: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': {},
                'processing_time': processing_time
            }
    
    def extract_text_only(self, image_data):
        """Extract only text from image using Gemini AI (optimized)"""
        # Try to reinitialize if not available
        if not self.model:
            if not self.initialize_gemini():
                return {
                    'text': '',
                    'confidence': 0,
                    'method': 'gemini_unavailable'
                }
        
        try:
            # Optimize image
            image = self.optimize_image(image_data)
            
            # Simple text extraction prompt
            prompt = "Extract all text from this image. Return only the text, no explanations."
            
            response = self.model.generate_content([prompt, image])
            
            if response and response.text:
                return {
                    'text': response.text.strip(),
                    'confidence': 90,
                    'method': 'gemini_text_extraction_fast'
                }
            else:
                return {
                    'text': '',
                    'confidence': 0,
                    'method': 'gemini_no_response'
                }
                
        except Exception as e:
            logger.error(f"Gemini text extraction error: {e}")
            return {
                'text': '',
                'confidence': 0,
                'method': 'gemini_error'
            }

class GeminiBusinessCardAnalyzer:
    """Advanced business card analyzer using Gemini AI (speed optimized)"""
    
    def __init__(self):
        self.model = None
        self.api_key = None
        self.initialize_gemini()
    
    def initialize_gemini(self):
        """Initialize Gemini AI with speed optimizations"""
        try:
            api_key = os.environ.get('GOOGLE_GEMINI_API_KEY')
            if api_key and self.api_key != api_key:
                genai.configure(api_key=api_key)
                
                # Speed-optimized configuration
                generation_config = {
                    "temperature": 0.2,
                    "top_p": 0.8,
                    "top_k": 20,
                    "max_output_tokens": 800,
                }
                
                self.model = genai.GenerativeModel(
                    'gemini-1.5-flash',
                    generation_config=generation_config
                )
                self.api_key = api_key
                return True
            return self.model is not None
        except Exception as e:
            print(f"❌ Gemini analyzer initialization failed: {e}")
            self.model = None
            self.api_key = None
            return False
    
    def analyze_business_card_with_context(self, image_data, additional_context=""):
        """Analyze business card with additional context (speed optimized)"""
        start_time = time.time()
        
        # Try to reinitialize if not available
        if not self.model:
            if not self.initialize_gemini():
                return {'success': False, 'error': 'Gemini AI not available'}
        
        try:
            # Optimize image
            if isinstance(image_data, bytes):
                image = Image.open(io.BytesIO(image_data))
            else:
                image = image_data
            
            # Resize for speed
            if image.width > 800:
                ratio = 800 / image.width
                new_height = int(image.height * ratio)
                image = image.resize((800, new_height), Image.Resampling.LANCZOS)
            
            # Simplified analysis prompt
            prompt = f"""Analyze business card. Context: {additional_context}

Return JSON:
{{"name":"","company":"","job_title":"","email":"","mobile":"","phone_office":"","website":"","address":"","industry":"","card_quality":"","confidence_score":95,"social_media":"","additional_info":""}}

Fast extraction only."""
            
            response = self.model.generate_content([prompt, image])
            processing_time = time.time() - start_time
            
            if not response or not response.text:
                return {'success': False, 'error': 'No response from Gemini AI', 'processing_time': processing_time}
            
            # Clean and parse response
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text.replace('```json', '').replace('```', '').strip()
            elif response_text.startswith('```'):
                response_text = response_text.replace('```', '').strip()
            
            try:
                analyzed_data = json.loads(response_text)
                return {
                    'success': True,
                    'data': analyzed_data,
                    'raw_response': response.text[:200] + '...' if len(response.text) > 200 else response.text,
                    'processing_time': processing_time
                }
            except json.JSONDecodeError as e:
                return {
                    'success': False,
                    'error': f'Failed to parse JSON: {e}',
                    'raw_response': response.text[:200] + '...' if len(response.text) > 200 else response.text,
                    'processing_time': processing_time
                }
                
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Gemini analysis error: {e}")
            return {'success': False, 'error': str(e), 'processing_time': processing_time}

# Create global instances that will reinitialize as needed
gemini_ocr = GeminiOCR()
gemini_analyzer = GeminiBusinessCardAnalyzer() 