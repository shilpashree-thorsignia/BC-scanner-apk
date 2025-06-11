import re
import os
# QR code scanning is disabled on Windows due to pyzbar compatibility issues
# pyzbar requires additional Windows system dependencies that are not easily installable
PYZBAR_AVAILABLE = False
print("📝 QR code scanning is disabled on this platform (Windows compatibility)")

from PIL import Image
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import check_password
from .models import BusinessCard, UserProfile, EmailConfig
from .serializers import BusinessCardSerializer, UserProfileSerializer, EmailConfigSerializer
import logging

# Load environment variables early
try:
    from dotenv import load_dotenv
    from pathlib import Path
    BASE_DIR = Path(__file__).resolve().parent.parent
    env_path = BASE_DIR / '.env'
    load_dotenv(env_path)
    print(f"🔧 Views.py: Loading .env from: {env_path}")
    print(f"🔑 Views.py: API Key loaded: {'Yes' if os.environ.get('GOOGLE_GEMINI_API_KEY') else 'No'}")
except Exception as e:
    print(f"❌ Views.py: Error loading .env: {e}")

logger = logging.getLogger(__name__)

# Initialize Gemini AI OCR
GEMINI_AI_AVAILABLE = False
gemini_ocr = None
gemini_analyzer = None

# Email imports
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.utils import formataddr
import ssl

def initialize_gemini_ai():
    """Initialize Gemini AI at runtime"""
    global GEMINI_AI_AVAILABLE, gemini_ocr, gemini_analyzer
    
    if GEMINI_AI_AVAILABLE and gemini_ocr:
        return True  # Already initialized
    
    try:
        api_key = os.environ.get('GOOGLE_GEMINI_API_KEY')
        if not api_key:
            print(f"❌ GOOGLE_GEMINI_API_KEY not found in environment variables")
            return False
        
        # Try to use the existing gemini_ocr.py first
        try:
            from .gemini_ocr import GeminiOCR, GeminiBusinessCardAnalyzer
            gemini_ocr = GeminiOCR()
            gemini_analyzer = GeminiBusinessCardAnalyzer()
            GEMINI_AI_AVAILABLE = True
            print(f"✅ Gemini AI OCR initialized successfully")
            print(f"✅ Gemini AI Analyzer initialized successfully")
            return True
        except ImportError as e:
            print(f"❌ Gemini AI OCR not available: {e}")
            # Fallback to simple implementation
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            
            # Create a simple OCR function
            def simple_gemini_ocr(image_data):
                try:
                    from PIL import Image
                    import io
                    import json
                    
                    # Convert bytes to PIL Image
                    if isinstance(image_data, bytes):
                        image = Image.open(io.BytesIO(image_data))
                    else:
                        image = image_data
                    
                    # Create model
                    model = genai.GenerativeModel('gemini-1.5-flash')
                    
                    prompt = """Extract business card info as JSON:
{"name":"","company":"","job_title":"","email":"","mobile":"","website":"","address":"","notes":""}

Rules:
- Extract only visible text
- For website: add https:// if missing
- Empty string if not found
- JSON only, no explanation"""
                    
                    response = model.generate_content([prompt, image])
                    
                    if response and response.text:
                        response_text = response.text.strip()
                        
                        # Clean response
                        if response_text.startswith('```json'):
                            response_text = response_text.replace('```json', '').replace('```', '').strip()
                        elif response_text.startswith('```'):
                            response_text = response_text.replace('```', '').strip()
                        
                        try:
                            data = json.loads(response_text)
                            return {
                                'success': True,
                                'data': data,
                                'confidence': 95,
                                'processing_time': 2.0
                            }
                        except json.JSONDecodeError:
                            return {
                                'success': False,
                                'error': 'Failed to parse JSON response',
                                'data': {},
                                'processing_time': 2.0
                            }
                    else:
                        return {
                            'success': False,
                            'error': 'No response from Gemini AI',
                            'data': {},
                            'processing_time': 2.0
                        }
                except Exception as e:
                    return {
                        'success': False,
                        'error': str(e),
                        'data': {},
                        'processing_time': 2.0
                    }
            
            # Create a simple class-like object
            class SimpleGeminiOCR:
                def extract_business_card_info(self, image_data):
                    return simple_gemini_ocr(image_data)
                
                def extract_from_dual_images(self, front_image, back_image):
                    """Extract from both sides of business card"""
                    try:
                        import google.generativeai as genai
                        import json
                        
                        # Create model
                        model = genai.GenerativeModel('gemini-1.5-flash')
                        
                        dual_prompt = """Analyze BOTH SIDES of this business card and extract ALL information as JSON:

{
  "name": "",
  "first_name": "",
  "last_name": "",
  "email": "",
  "email_secondary": "",
  "mobile": "",
  "mobile_secondary": "",
  "landline": "",
  "fax": "",
  "company": "",
  "job_title": "",
  "website": "",
  "website_secondary": "",
  "linkedin": "",
  "twitter": "",
  "facebook": "",
  "instagram": "",
  "address": "",
  "industry": "",
  "services": "",
  "specialization": "",
  "certifications": "",
  "awards": "",
  "primary_language": "",
  "notes": "",
  "scan_confidence": 95
}

FRONT SIDE: Analyze the first image (front side)
BACK SIDE: Analyze the second image (back side)

Rules:
- Combine information from both sides intelligently
- Extract social media handles, certifications, additional services
- Look for QR codes, logos, additional contact info on back
- Empty string if not found
- For websites: add https:// if missing
- Return JSON only, no explanation"""
                        
                        response = model.generate_content([dual_prompt, front_image, back_image])
                        
                        if response and response.text:
                            response_text = response.text.strip()
                            
                            # Clean response
                            if response_text.startswith('```json'):
                                response_text = response_text.replace('```json', '').replace('```', '').strip()
                            elif response_text.startswith('```'):
                                response_text = response_text.replace('```', '').strip()
                            
                            try:
                                data = json.loads(response_text)
                                return {
                                    'success': True,
                                    'data': data,
                                    'scan_method': 'simple_gemini_dual_side',
                                    'processing_time': 4.0,
                                    'metadata': {
                                        'side_analyzed': 'both',
                                        'confidence_score': data.get('scan_confidence', 95)
                                    }
                                }
                            except json.JSONDecodeError as e:
                                return {
                                    'success': False,
                                    'error': f'Failed to parse JSON response: {str(e)}',
                                    'data': {},
                                    'processing_time': 4.0
                                }
                        else:
                            return {
                                'success': False,
                                'error': 'No response from Gemini AI for dual-side scan',
                                'data': {},
                                'processing_time': 4.0
                            }
                    except Exception as e:
                        return {
                            'success': False,
                            'error': f'Dual-side extraction failed: {str(e)}',
                            'data': {},
                            'processing_time': 4.0
                        }
            
            gemini_ocr = SimpleGeminiOCR()
            GEMINI_AI_AVAILABLE = True
            print(f"✅ Simple Gemini AI OCR initialized successfully")
            return True
            
    except Exception as e:
        print(f"❌ Error initializing Gemini AI: {e}")
        GEMINI_AI_AVAILABLE = False
        gemini_ocr = None
        gemini_analyzer = None
        return False

# Try to initialize at import time, but don't fail if it doesn't work
try:
    initialize_gemini_ai()
except Exception as e:
    print(f"⚠️ Gemini AI initialization deferred: {e}")


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, format=None):
        try:
            print(f"📝 Registration request received from {request.META.get('REMOTE_ADDR', 'unknown')}")
            print(f"📋 Registration data: {dict(request.data)}")
            
            # Use the proper serializer for validation and user creation
            serializer = UserProfileSerializer(data=request.data)
            
            if serializer.is_valid():
                # Save the user using the serializer (this will hash the password)
                user = serializer.save()
                
                print(f"✅ User created successfully: {user.email}")
                
                return Response({
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'message': 'User registered successfully'
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"❌ Registration validation errors: {serializer.errors}")
                return Response({
                    'error': 'Validation failed',
                    'validation_errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"❌ Registration error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, user_id, format=None):
        try:
            user = UserProfile.objects.get(id=user_id)
            return Response({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone
            })
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class UserLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, format=None):
        email = request.data.get('email')
        password = request.data.get('password')
        
        print(f"🔐 Login attempt from {request.META.get('REMOTE_ADDR', 'unknown')} for email: {email}")
        
        try:
            user = UserProfile.objects.get(email=email)
            if check_password(password, user.password):
                print(f"✅ Login successful for user: {email}")
                return Response({
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone
                })
            else:
                print(f"❌ Invalid password for user: {email}")
                return Response({'error': 'Invalid password'}, status=status.HTTP_401_UNAUTHORIZED)
        except UserProfile.DoesNotExist:
            print(f"❌ User not found: {email}")
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class BusinessCardViewSet(viewsets.ModelViewSet):
    queryset = BusinessCard.objects.filter(is_deleted=False)
    serializer_class = BusinessCardSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = BusinessCard.objects.filter(is_deleted=False)
        # Note: BusinessCard model doesn't have user_id field
        # TODO: Add user relationship to BusinessCard model in future migration
        return queryset

    def create(self, request, *args, **kwargs):
        """Override create to add email notifications for manually created business cards"""
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                business_card = serializer.save()
                
                # Send automated email notification if enabled
                try:
                    email_result = EmailService.send_business_card_notification(business_card)
                    if email_result['success']:
                        print(f"✅ Email notification sent: {email_result['message']}")
                    else:
                        print(f"⚠️ Email notification failed: {email_result['message']}")
                except Exception as e:
                    print(f"❌ Error sending email notification: {e}")
                
                headers = self.get_success_headers(serializer.data)
                return Response({
                    'message': 'Business card created successfully!',
                    'business_card': serializer.data
                }, status=status.HTTP_201_CREATED, headers=headers)
            else:
                return Response({
                    'error': 'Validation failed',
                    'validation_errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'error': f'Error creating business card: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        """Override destroy to perform soft delete and return JSON response"""
        try:
            instance = self.get_object()
            business_card_id = instance.id
            business_card_name = instance.name or "Unknown"
            
            # Perform soft delete instead of hard delete
            from django.utils import timezone
            instance.is_deleted = True
            instance.deleted_at = timezone.now()
            instance.save()
            
            # Return JSON response instead of empty 204
            return Response({
                'message': f'Business card "{business_card_name}" moved to trash',
                'deleted_id': business_card_id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"❌ Error deleting business card: {str(e)}")
            return Response({
                'error': f'Error deleting business card: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['POST'])
    def scan_card(self, request):
        """Scan business card using Gemini AI OCR - supports both multipart and base64"""
        try:
            print(f"🔍 Scan card request received")
            print(f"📁 Files in request: {list(request.FILES.keys())}")
            print(f"📋 Data in request: {dict(request.data)}")
            print(f"🔧 Content-Type: {request.content_type}")
            
            image_data = None
            image_file = None
            
            # Try to get image from different sources
            if 'image' in request.FILES:
                # Standard multipart form data
                image_file = request.FILES['image']
                print(f"📷 Found image file: {image_file.name}, Size: {image_file.size} bytes")
            elif 'photo' in request.FILES:
                # Alternative field name
                image_file = request.FILES['photo']
                print(f"📷 Found photo file: {image_file.name}, Size: {image_file.size} bytes")
            elif 'image' in request.data and isinstance(request.data['image'], str):
                # Base64 encoded image
                try:
                    import base64
                    image_b64 = request.data['image']
                    # Remove data URL prefix if present
                    if image_b64.startswith('data:image'):
                        image_b64 = image_b64.split(',')[1]
                    image_data = base64.b64decode(image_b64)
                    print(f"📷 Found base64 image, decoded size: {len(image_data)} bytes")
                except Exception as e:
                    print(f"❌ Failed to decode base64 image: {e}")
                    return Response({'error': f'Invalid base64 image: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                print("❌ No image found in request")
                available_fields = list(request.FILES.keys()) + list(request.data.keys())
                return Response({
                    'error': 'No image file provided. Expected "image" field in multipart form or base64 string.',
                    'available_fields': available_fields,
                    'help': 'Send image as multipart form-data with field name "image" or as base64 string in JSON body'
                }, status=status.HTTP_400_BAD_REQUEST)

            user_id = request.data.get('user_id')
            
            print(f"👤 User ID: {user_id}")
            print(f"🤖 Gemini AI Available: {GEMINI_AI_AVAILABLE}")
            print(f"🔧 Gemini OCR Instance: {gemini_ocr is not None}")
            
            # Try to initialize Gemini AI if not available
            if not GEMINI_AI_AVAILABLE or not gemini_ocr:
                print("🔄 Attempting to initialize Gemini AI...")
                if not initialize_gemini_ai():
                    error_msg = f'Gemini AI OCR not available. Available: {GEMINI_AI_AVAILABLE}, Instance: {gemini_ocr is not None}'
                    print(f"❌ {error_msg}")
                    return Response({
                        'error': error_msg
                    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                else:
                    print("✅ Gemini AI initialized successfully at runtime")
            
            # Read image data if not already available
            if image_data is None and image_file is not None:
                image_data = image_file.read()
            
            print(f"📊 Image data size: {len(image_data)} bytes")
            
            # Extract business card info using Gemini AI
            print("🚀 Starting Gemini AI extraction...")
            result = gemini_ocr.extract_business_card_info(image_data)
            print(f"📋 Gemini AI result: {result}")
            
            if not result['success']:
                error_msg = result.get('error', 'Failed to extract business card information')
                print(f"❌ Gemini AI extraction failed: {error_msg}")
                return Response({
                    'error': error_msg,
                    'details': result
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the extracted data
            parsed_data = result['data']
            
            # Normalize website URL if present
            if parsed_data.get('website') and not parsed_data['website'].startswith(('http://', 'https://')):
                website = parsed_data['website'].strip()
                if website.startswith('www.'):
                    parsed_data['website'] = f'https://{website}'
                elif '.' in website:
                    parsed_data['website'] = f'https://www.{website}'
            
            # Add user_id if provided
            if user_id:
                # Note: BusinessCard model doesn't have user_id field
                # TODO: Add user relationship to BusinessCard model in future migration
                pass  # Skip user_id assignment for now
            
            # Save the business card
            serializer = BusinessCardSerializer(data=parsed_data)
            if serializer.is_valid():
                business_card = serializer.save()
                
                # Send automated email notification if enabled
                try:
                    email_result = EmailService.send_business_card_notification(business_card)
                    if email_result['success']:
                        print(f"✅ Email notification sent: {email_result['message']}")
                    else:
                        print(f"⚠️ Email notification failed: {email_result['message']}")
                except Exception as e:
                    print(f"❌ Error sending email notification: {e}")
                
                return Response({
                    'message': 'Business card scanned and saved successfully!',
                    'business_card': BusinessCardSerializer(business_card).data,
                    'extracted_info': parsed_data,
                    'processing_time': f"{result['processing_time']:.2f}s",
                    'scan_method': 'single_image_ocr'
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"❌ Serializer validation failed: {serializer.errors}")
                return Response({
                    'message': 'OCR successful but validation failed',
                    'extracted_data': parsed_data,
                    'validation_errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            error_msg = f"Error processing business card: {str(e)}"
            print(f"❌ {error_msg}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': error_msg
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['POST'])
    def scan_card_advanced(self, request):
        """Advanced business card scanning with context using Gemini AI"""
        try:
            if 'image' not in request.FILES:
                return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

            image_file = request.FILES['image']
            user_id = request.data.get('user_id')
            context = request.data.get('context', '')  # Optional context
            
            if not GEMINI_AI_AVAILABLE or not gemini_analyzer:
                return Response({
                    'error': 'Gemini AI analyzer not available. Please check GOOGLE_GEMINI_API_KEY.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Read image data
            image_data = image_file.read()
            
            # Analyze with context using advanced Gemini analyzer
            result = gemini_analyzer.analyze_business_card_with_context(image_data, context)
            
            if not result['success']:
                return Response({
                    'error': result.get('error', 'Failed to analyze business card'),
                    'details': result
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the analyzed data
            analyzed_data = result['data']
            
            # Map to our business card model fields
            mapped_data = {
                'name': analyzed_data.get('name', ''),
                'company': analyzed_data.get('company', ''),
                'job_title': analyzed_data.get('job_title', ''),
                'email': analyzed_data.get('email', ''),
                'mobile': analyzed_data.get('mobile', '') or analyzed_data.get('phone_office', ''),
                'website': analyzed_data.get('website', ''),
                'address': analyzed_data.get('address', ''),
                'notes': f"Industry: {analyzed_data.get('industry', 'Unknown')} | Quality: {analyzed_data.get('card_quality', 'Unknown')} | Social: {analyzed_data.get('social_media', '')}"
            }
            
            # Add user_id if provided
            if user_id:
                # Note: BusinessCard model doesn't have user_id field
                # TODO: Add user relationship to BusinessCard model in future migration
                pass  # Skip user_id assignment for now
            
            # Save the business card
            serializer = BusinessCardSerializer(data=mapped_data)
            if serializer.is_valid():
                business_card = serializer.save()
                return Response({
                    'message': 'Business card analyzed successfully with advanced Gemini AI',
                    'confidence_score': analyzed_data.get('confidence_score', 95),
                    'industry': analyzed_data.get('industry', 'Unknown'),
                    'card_quality': analyzed_data.get('card_quality', 'Unknown'),
                    'business_card': BusinessCardSerializer(business_card).data,
                    'full_analysis': analyzed_data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'AI analysis successful but validation failed',
                    'analyzed_data': mapped_data,
                    'validation_errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                'error': f'Error analyzing business card: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['POST'])
    def scan_qr(self, request):
        """Scan QR code and extract business card information"""
        # QR code scanning is disabled on Windows due to pyzbar compatibility issues
        return Response({
            'error': 'QR code scanning is not available on this platform',
            'message': 'QR code scanning requires pyzbar library which has Windows compatibility issues',
            'suggestion': 'Use the regular business card scanning feature instead, which works great with Gemini AI'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['POST'])
    def scan_card_dual_side(self, request):
        """Scan both sides of a business card using Gemini AI OCR"""
        try:
            print(f"🔍 Dual-side scan card request received")
            print(f"📁 Files in request: {list(request.FILES.keys())}")
            print(f"📋 Data in request: {dict(request.data)}")
            
            # Check for both front and back images
            front_image_file = None
            back_image_file = None
            
            if 'front_image' in request.FILES:
                front_image_file = request.FILES['front_image']
                print(f"📷 Found front image: {front_image_file.name}, Size: {front_image_file.size} bytes")
            
            if 'back_image' in request.FILES:
                back_image_file = request.FILES['back_image']
                print(f"📷 Found back image: {back_image_file.name}, Size: {back_image_file.size} bytes")
            
            # Validate that we have both images
            if not front_image_file or not back_image_file:
                return Response({
                    'error': 'Both front_image and back_image files are required for dual-side scanning.',
                    'available_fields': list(request.FILES.keys()),
                    'help': 'Send both images as multipart form-data with field names "front_image" and "back_image"'
                }, status=status.HTTP_400_BAD_REQUEST)

            user_id = request.data.get('user_id')
            
            print(f"👤 User ID: {user_id}")
            print(f"🤖 Gemini AI Available: {GEMINI_AI_AVAILABLE}")
            print(f"🔧 Gemini OCR Instance: {gemini_ocr is not None}")
            
            # Try to initialize Gemini AI if not available
            if not GEMINI_AI_AVAILABLE or not gemini_ocr:
                print("🔄 Attempting to initialize Gemini AI...")
                if not initialize_gemini_ai():
                    error_msg = f'Gemini AI OCR not available. Available: {GEMINI_AI_AVAILABLE}, Instance: {gemini_ocr is not None}'
                    print(f"❌ {error_msg}")
                    return Response({
                        'error': error_msg
                    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                else:
                    print("✅ Gemini AI initialized successfully at runtime")
            
            # Process images using PIL
            from PIL import Image as PILImage
            import io
            
            # Read and process front image
            front_image_data = front_image_file.read()
            front_image = PILImage.open(io.BytesIO(front_image_data))
            
            # Read and process back image
            back_image_data = back_image_file.read()
            back_image = PILImage.open(io.BytesIO(back_image_data))
            
            print(f"📊 Front image size: {len(front_image_data)} bytes")
            print(f"📊 Back image size: {len(back_image_data)} bytes")
            
            # Extract business card info using dual-side Gemini AI
            print("🚀 Starting dual-side Gemini AI extraction...")
            result = gemini_ocr.extract_from_dual_images(front_image, back_image)
            print(f"📋 Dual-side Gemini AI result: {result}")
            
            if not result.get('success', False):
                error_msg = result.get('error', 'Failed to extract business card information from both sides')
                print(f"❌ Gemini AI dual-side extraction failed: {error_msg}")
                return Response({
                    'error': error_msg,
                    'details': result
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the extracted data
            parsed_data = result['data'] if 'data' in result else result
            
            # Helper function to truncate fields to model limits
            def truncate_field(value, max_length):
                if not value:
                    return ''
                return str(value)[:max_length] if len(str(value)) > max_length else str(value)

            # Map the comprehensive data to our business card fields with proper truncation
            mapped_data = {
                # Personal Information
                'name': parsed_data.get('name', '') or f"{parsed_data.get('first_name', '')} {parsed_data.get('last_name', '')}".strip(),
                'first_name': truncate_field(parsed_data.get('first_name', ''), 100),
                'last_name': truncate_field(parsed_data.get('last_name', ''), 100),
                'middle_name': truncate_field(parsed_data.get('middle_name', ''), 100),
                
                # Contact Information
                'email': parsed_data.get('email', ''),
                'email_secondary': parsed_data.get('email_secondary', ''),
                'mobile': truncate_field(parsed_data.get('mobile', ''), 20),
                'mobile_secondary': truncate_field(parsed_data.get('mobile_secondary', ''), 20),
                'landline': truncate_field(parsed_data.get('landline', ''), 20),
                'fax': truncate_field(parsed_data.get('fax', ''), 20),
                
                # Company Information
                'company': truncate_field(parsed_data.get('company', ''), 200),
                'company_full_name': truncate_field(parsed_data.get('company_full_name', ''), 300),
                'department': truncate_field(parsed_data.get('department', ''), 200),
                'job_title': truncate_field(parsed_data.get('job_title', ''), 200),
                'job_title_secondary': truncate_field(parsed_data.get('job_title_secondary', ''), 200),
                
                # Digital Presence
                'website': parsed_data.get('website', ''),
                'website_secondary': parsed_data.get('website_secondary', ''),
                'linkedin': parsed_data.get('linkedin', ''),
                'twitter': parsed_data.get('twitter', ''),
                'facebook': parsed_data.get('facebook', ''),
                'instagram': parsed_data.get('instagram', ''),
                'skype': truncate_field(parsed_data.get('skype', ''), 100),
                
                # Address Information
                'address': parsed_data.get('address', ''),
                'street_address': truncate_field(parsed_data.get('street_address', ''), 300),
                'city': truncate_field(parsed_data.get('city', ''), 100),
                'state': truncate_field(parsed_data.get('state', ''), 100),
                'postal_code': truncate_field(parsed_data.get('postal_code', ''), 20),
                'country': truncate_field(parsed_data.get('country', ''), 100),
                
                # Business Information
                'industry': truncate_field(parsed_data.get('industry', ''), 200),
                'services': parsed_data.get('services', ''),
                'specialization': parsed_data.get('specialization', ''),
                'certifications': parsed_data.get('certifications', ''),
                'awards': parsed_data.get('awards', ''),
                
                # QR Code and Languages
                'qr_code_data': parsed_data.get('qr_code_data', ''),
                'primary_language': truncate_field(parsed_data.get('primary_language', ''), 50),
                'secondary_language': truncate_field(parsed_data.get('secondary_language', ''), 50),
                'timezone': truncate_field(parsed_data.get('timezone', ''), 50),
                
                # Metadata
                'notes': self._build_notes_from_dual_scan(parsed_data),
                'type': 'dual_side',
                'scan_confidence': parsed_data.get('scan_confidence', 0),
                'scan_method': result.get('scan_method', 'gemini_dual_side'),
                'processing_time': result.get('processing_time', 0),
                
                # Images
                'image_front': front_image,
                'image_back': back_image,
            }
            
            # Store any truncated data in notes for reference
            truncated_info = []
            if len(str(parsed_data.get('landline', ''))) > 20:
                truncated_info.append(f"Full Landline: {parsed_data.get('landline', '')}")
            if len(str(parsed_data.get('mobile', ''))) > 20:
                truncated_info.append(f"Full Mobile: {parsed_data.get('mobile', '')}")
            if len(str(parsed_data.get('fax', ''))) > 20:
                truncated_info.append(f"Full Fax: {parsed_data.get('fax', '')}")
            
            # Add truncated info to notes if any
            if truncated_info:
                existing_notes = mapped_data.get('notes', '')
                additional_notes = " | ".join(truncated_info)
                mapped_data['notes'] = f"{existing_notes} | {additional_notes}" if existing_notes else additional_notes
            
            # Normalize website URL if present
            if mapped_data.get('website') and not mapped_data['website'].startswith(('http://', 'https://')):
                website = mapped_data['website'].strip()
                if website.startswith('www.'):
                    mapped_data['website'] = f'https://{website}'
                elif '.' in website:
                    mapped_data['website'] = f'https://www.{website}'
            
            # Add user_id if provided
            if user_id:
                # Note: BusinessCard model doesn't have user_id field
                # TODO: Add user relationship to BusinessCard model in future migration
                pass  # Skip user_id assignment for now
            
            # Create data without images first for validation
            data_without_images = {k: v for k, v in mapped_data.items() if k not in ['image_front', 'image_back']}
            
            # Save the business card without images first
            serializer = BusinessCardSerializer(data=data_without_images)
            if serializer.is_valid():
                business_card = serializer.save()
                
                # Now add the images to the saved business card
                # Use the original uploaded files, not the PIL Image objects
                try:
                    if front_image_file:
                        business_card.image_front.save(
                            front_image_file.name,
                            front_image_file,
                            save=False
                        )
                    if back_image_file:
                        business_card.image_back.save(
                            back_image_file.name,
                            back_image_file,
                            save=False
                        )
                    
                    # Save the business card with only the image fields updated
                    business_card.save(update_fields=['image_front', 'image_back'])
                    
                    print(f"✅ Dual-side business card saved successfully: {business_card.id}")
                except Exception as image_error:
                    print(f"⚠️ Could not save images: {image_error}")
                    # Continue without images - the text data is still saved
                
                # Send automated email notification if enabled
                try:
                    email_result = EmailService.send_business_card_notification(business_card)
                    if email_result['success']:
                        print(f"✅ Email notification sent: {email_result['message']}")
                    else:
                        print(f"⚠️ Email notification failed: {email_result['message']}")
                except Exception as e:
                    print(f"❌ Error sending email notification: {e}")
                
                # Create a clean response with serialized business card data
                response_data = BusinessCardSerializer(business_card).data
                
                return Response({
                    'message': 'Dual-side business card scanned successfully',
                    'scan_type': 'dual_side',
                    'confidence_score': parsed_data.get('scan_confidence', 95),
                    'processing_time': parsed_data.get('processing_time', 0),
                    'business_card': response_data,
                    'extraction_details': {
                        'success': result.get('success', True),
                        'scan_method': result.get('scan_method', 'gemini_dual_side'),
                        'processing_time': result.get('processing_time', 0),
                        'metadata': result.get('metadata', {})
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"❌ Serializer validation failed: {serializer.errors}")
                return Response({
                    'message': 'Dual-side OCR successful but validation failed',
                    'extracted_data': data_without_images,
                    'validation_errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            error_msg = f"Error processing dual-side business card: {str(e)}"
            print(f"❌ {error_msg}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': error_msg
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _build_notes_from_dual_scan(self, parsed_data):
        """Build comprehensive notes from dual-side scan data"""
        notes_parts = []
        
        # Add additional contact info
        if parsed_data.get('fax'):
            notes_parts.append(f"Fax: {parsed_data['fax']}")
        
        # Add social media
        social_media = []
        if parsed_data.get('linkedin'):
            social_media.append(f"LinkedIn: {parsed_data['linkedin']}")
        if parsed_data.get('twitter'):
            social_media.append(f"Twitter: {parsed_data['twitter']}")
        if parsed_data.get('facebook'):
            social_media.append(f"Facebook: {parsed_data['facebook']}")
        if parsed_data.get('instagram'):
            social_media.append(f"Instagram: {parsed_data['instagram']}")
        
        if social_media:
            notes_parts.append("Social Media: " + ", ".join(social_media))
        
        # Add professional info
        if parsed_data.get('industry'):
            notes_parts.append(f"Industry: {parsed_data['industry']}")
        if parsed_data.get('specialization'):
            notes_parts.append(f"Specialization: {parsed_data['specialization']}")
        if parsed_data.get('services'):
            notes_parts.append(f"Services: {parsed_data['services']}")
        if parsed_data.get('certifications'):
            notes_parts.append(f"Certifications: {parsed_data['certifications']}")
        if parsed_data.get('awards'):
            notes_parts.append(f"Awards: {parsed_data['awards']}")
        
        # Add languages
        if parsed_data.get('primary_language'):
            notes_parts.append(f"Languages: {parsed_data['primary_language']}")
        
        # Add scan metadata
        if parsed_data.get('scan_confidence'):
            notes_parts.append(f"Scan Confidence: {parsed_data['scan_confidence']}%")
        
        return " | ".join(notes_parts) if notes_parts else ""

    def parse_qr_business_card(self, qr_text):
        """Simple QR code parsing"""
        parsed_data = {
            'name': '',
            'company': '',
            'job_title': '',
            'email': '',
            'mobile': '',
            'website': '',
            'address': '',
            'notes': qr_text
        }
        
        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', qr_text)
        if email_match:
            parsed_data['email'] = email_match.group()
        
        # Extract phone
        phone_match = re.search(r'[\+]?[1-9]?[0-9]{7,14}', qr_text)
        if phone_match:
            parsed_data['mobile'] = phone_match.group()
        
        return parsed_data

    @action(detail=False, methods=['GET'])
    def trash(self, request):
        """Get all deleted business cards (trash/recycle bin)"""
        try:
            # Note: BusinessCard model doesn't have user_id field
            # TODO: Add user relationship to BusinessCard model in future migration
            
            # Get deleted business cards
            queryset = BusinessCard.objects.filter(is_deleted=True)
            
            # Order by deletion date (most recent first)
            queryset = queryset.order_by('-deleted_at')
            
            serializer = BusinessCardSerializer(queryset, many=True)
            
            return Response({
                'message': f'Found {len(serializer.data)} items in trash',
                'count': len(serializer.data),
                'business_cards': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error getting trash: {str(e)}")
            return Response({
                'error': f'Error retrieving trash: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['POST'])
    def restore(self, request, pk=None):
        """Restore a business card from trash"""
        try:
            # Get the business card (including deleted ones)
            business_card = BusinessCard.objects.get(id=pk)
            
            if not business_card.is_deleted:
                return Response({
                    'error': 'Business card is not in trash'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Restore the business card
            business_card.is_deleted = False
            business_card.deleted_at = None
            business_card.save()
            
            return Response({
                'message': f'Business card "{business_card.name}" restored successfully',
                'business_card': BusinessCardSerializer(business_card).data
            }, status=status.HTTP_200_OK)
            
        except BusinessCard.DoesNotExist:
            return Response({
                'error': 'Business card not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Error restoring business card: {str(e)}")
            return Response({
                'error': f'Error restoring business card: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['DELETE'])
    def permanent_delete(self, request, pk=None):
        """Permanently delete a business card (hard delete)"""
        try:
            # Get the business card (including deleted ones)
            business_card = BusinessCard.objects.get(id=pk)
            business_card_name = business_card.name or "Unknown"
            
            # Permanently delete
            business_card.delete()
            
            return Response({
                'message': f'Business card "{business_card_name}" permanently deleted',
                'deleted_id': int(pk)
            }, status=status.HTTP_200_OK)
            
        except BusinessCard.DoesNotExist:
            return Response({
                'error': 'Business card not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Error permanently deleting business card: {str(e)}")
            return Response({
                'error': f'Error permanently deleting business card: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['POST'])
    def empty_trash(self, request):
        """Empty the entire trash (permanently delete all deleted items)"""
        try:
            # Note: BusinessCard model doesn't have user_id field
            # TODO: Add user relationship to BusinessCard model in future migration
            
            # Get deleted business cards
            queryset = BusinessCard.objects.filter(is_deleted=True)
            
            count = queryset.count()
            
            # Permanently delete all
            queryset.delete()
            
            return Response({
                'message': f'Trash emptied successfully. {count} items permanently deleted.',
                'deleted_count': count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error emptying trash: {str(e)}")
            return Response({
                'error': f'Error emptying trash: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['GET'])
    def debug_gemini(self, request):
        """Debug endpoint to check Gemini AI status"""
        try:
            import os
            api_key = os.environ.get('GOOGLE_GEMINI_API_KEY')
            
            debug_info = {
                'api_key_present': bool(api_key),
                'api_key_length': len(api_key) if api_key else 0,
                'gemini_ai_available': GEMINI_AI_AVAILABLE,
                'gemini_ocr_instance': gemini_ocr is not None,
                'environment_vars': {
                    'DATABASE_URL': bool(os.environ.get('DATABASE_URL')),
                    'DEBUG': os.environ.get('DEBUG'),
                    'GOOGLE_GEMINI_API_KEY': f"{api_key[:10]}..." if api_key else None
                }
            }
            
            # Try to initialize Gemini AI
            try:
                init_result = initialize_gemini_ai()
                debug_info['initialization_attempt'] = {
                    'success': init_result,
                    'gemini_ai_available_after': GEMINI_AI_AVAILABLE,
                    'gemini_ocr_instance_after': gemini_ocr is not None
                }
            except Exception as e:
                debug_info['initialization_attempt'] = {
                    'success': False,
                    'error': str(e)
                }
            
            # Try direct Gemini AI test
            try:
                import google.generativeai as genai
                if api_key:
                    genai.configure(api_key=api_key)
                    model = genai.GenerativeModel('gemini-1.5-flash')
                    debug_info['direct_gemini_test'] = 'Success'
                else:
                    debug_info['direct_gemini_test'] = 'No API key'
            except Exception as e:
                debug_info['direct_gemini_test'] = f'Error: {str(e)}'
            
            # Check available methods on OCR instance
            if gemini_ocr:
                debug_info['available_methods'] = {
                    'extract_business_card_info': hasattr(gemini_ocr, 'extract_business_card_info'),
                    'extract_from_dual_images': hasattr(gemini_ocr, 'extract_from_dual_images')
                }
            
            return Response(debug_info)
            
        except Exception as e:
            return Response({
                'error': f'Debug endpoint error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailConfigViewSet(viewsets.ModelViewSet):
    queryset = EmailConfig.objects.all()
    serializer_class = EmailConfigSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = EmailConfig.objects.all()
        return queryset

    def list(self, request, *args, **kwargs):
        """Get the email configuration (return first one if exists)"""
        try:
            config = EmailConfig.objects.first()
            if config:
                serializer = self.get_serializer(config)
                return Response(serializer.data)
            else:
                return Response(status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {'error': f'Error retrieving email configuration: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Create email configuration (only allow one)"""
        try:
            # Check if configuration already exists
            if EmailConfig.objects.exists():
                return Response(
                    {'error': 'Email configuration already exists. Use PUT to update.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response(
                {'error': f'Error creating email configuration: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_enabled = False
        instance.save()
        return Response({'message': 'Email configuration disabled'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['POST'])
    def test(self, request, pk=None):
        """Test email configuration by sending a test email"""
        try:
            config = self.get_object()
            
            if not config.is_enabled:
                return Response(
                    {'success': False, 'message': 'Email notifications are disabled'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Send test email
            subject = "✅ Business Card Scanner - Test Email"
            message = """🎉 Congratulations! Your email configuration is working correctly.

This is a test email to verify that your Business Card Scanner app can successfully send automated notifications.

📧 Email Configuration Details:
• SMTP Server: {smtp_host}:{smtp_port}
• From: {sender_email}
• To: {recipient_email}

If you received this email, your automated business card notifications are now active!

Best regards,
Business Card Scanner App""".format(
                smtp_host=config.smtp_host,
                smtp_port=config.smtp_port,
                sender_email=config.sender_email,
                recipient_email=config.recipient_email
            )
            
            result = EmailService.send_email(
                config=config,
                subject=subject,
                message=message
            )
            
            if result['success']:
                return Response({
                    'success': True,
                    'message': f"Test email sent successfully to {config.recipient_email}!"
                })
            else:
                return Response({
                    'success': False,
                    'message': result['message']
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error sending test email: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['POST'])
    def send_email(self, request):
        """Send an email using the email configuration"""
        try:
            config = EmailConfig.objects.filter(is_enabled=True).first()
            
            if not config:
                return Response(
                    {'error': 'No enabled email configuration found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            subject = request.data.get('subject')
            message = request.data.get('message')
            recipient_email = request.data.get('recipient_email')
            business_card_id = request.data.get('business_card_id')
            
            if not subject or not message:
                return Response(
                    {'error': 'Subject and message are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            business_card = None
            if business_card_id:
                try:
                    business_card = BusinessCard.objects.get(id=business_card_id)
                except BusinessCard.DoesNotExist:
                    return Response(
                        {'error': 'Business card not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            result = EmailService.send_email(
                config=config,
                subject=subject,
                message=message,
                recipient_email=recipient_email,
                business_card=business_card
            )
            
            return Response(result)
            
        except Exception as e:
            return Response(
                {'error': f'Error sending email: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['POST'])
    def send_business_card_notification(self, request):
        """Send an automated follow-up email to the business card owner"""
        try:
            business_card_id = request.data.get('business_card_id')
            
            if not business_card_id:
                return Response(
                    {'error': 'Business card ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                business_card = BusinessCard.objects.get(id=business_card_id)
            except BusinessCard.DoesNotExist:
                return Response(
                    {'error': 'Business card not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            result = EmailService.send_business_card_notification(business_card)
            
            return Response(result)
            
        except Exception as e:
            return Response(
                {'error': f'Error sending business card notification: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmailService:
    """Service class for sending emails using SMTP"""
    
    @staticmethod
    def send_email(config, subject, message, recipient_email=None, business_card=None):
        """
        Send email using the provided configuration
        
        Args:
            config: EmailConfig object
            subject: Email subject
            message: Email message body
            recipient_email: Override recipient email (optional)
            business_card: BusinessCard object for attachments (optional)
        
        Returns:
            dict: {'success': bool, 'message': str}
        """
        try:
            if not config.is_enabled:
                return {'success': False, 'message': 'Email notifications are disabled'}
            
            # Use provided recipient or default from config
            to_email = recipient_email or config.recipient_email
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = formataddr(('Business Card Scanner', config.sender_email))
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Create HTML and plain text versions
            text_content = message
            html_content = f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                    Business Card Scanner Notification
                  </h2>
                  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    {message.replace('\n', '<br>')}
                  </div>
                  
                  {EmailService._format_business_card_html(business_card) if business_card else ''}
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                    <p>This is an automated message from your Business Card Scanner App.</p>
                    <p>Time: {EmailService._get_formatted_datetime()}</p>
                  </div>
                </div>
              </body>
            </html>
            """
            
            # Attach both versions
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            
            # Attach business card image if available
            if business_card and business_card.image:
                try:
                    with open(business_card.image.path, 'rb') as f:
                        img_data = f.read()
                    img = MIMEImage(img_data)
                    img.add_header('Content-Disposition', 'attachment', filename=f'business_card_{business_card.id}.jpg')
                    msg.attach(img)
                except Exception as e:
                    print(f"⚠️ Could not attach business card image: {e}")
            
            # Send email
            smtp_port = int(config.smtp_port)
            
            # Create SSL context
            context = ssl.create_default_context()
            
            with smtplib.SMTP(config.smtp_host, smtp_port) as server:
                server.starttls(context=context)  # Enable security
                server.login(config.sender_email, config.sender_password)
                server.send_message(msg)
            
            return {
                'success': True, 
                'message': f'Email sent successfully to {to_email}'
            }
            
        except smtplib.SMTPAuthenticationError as e:
            return {
                'success': False,
                'message': f'Authentication failed. Please check your email and password. Error: {str(e)}'
            }
        except smtplib.SMTPConnectError as e:
            return {
                'success': False,
                'message': f'Could not connect to SMTP server. Please check your SMTP settings. Error: {str(e)}'
            }
        except smtplib.SMTPException as e:
            return {
                'success': False,
                'message': f'SMTP error occurred: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to send email: {str(e)}'
            }
    
    @staticmethod
    def _format_business_card_html(business_card):
        """Format business card data as HTML"""
        if not business_card:
            return ""
        
        return f"""
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">📋 Business Card Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; font-weight: bold; color: #374151;">Name:</td><td style="padding: 5px 0;">{business_card.name or 'N/A'}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold; color: #374151;">Company:</td><td style="padding: 5px 0;">{business_card.company or 'N/A'}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold; color: #374151;">Job Title:</td><td style="padding: 5px 0;">{business_card.job_title or 'N/A'}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold; color: #374151;">Email:</td><td style="padding: 5px 0;">{business_card.email or 'N/A'}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold; color: #374151;">Mobile:</td><td style="padding: 5px 0;">{business_card.mobile or 'N/A'}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold; color: #374151;">Website:</td><td style="padding: 5px 0;">{business_card.website or 'N/A'}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold; color: #374151;">Address:</td><td style="padding: 5px 0;">{business_card.address or 'N/A'}</td></tr>
          </table>
        </div>
        """
    
    @staticmethod
    def _get_formatted_datetime():
        """Get formatted current datetime"""
        from django.utils import timezone
        return timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    @staticmethod
    def send_business_card_notification(business_card):
        """
        Send automated follow-up email to the business card owner
        
        Args:
            business_card: BusinessCard object
            
        Returns:
            dict: {'success': bool, 'message': str}
        """
        try:
            # Get email configuration
            config = EmailConfig.objects.filter(is_enabled=True).first()
            
            if not config:
                return {'success': False, 'message': 'No email configuration found or email is disabled'}
            
            # Check if business card has an email address
            if not business_card.email:
                return {'success': False, 'message': f'No email address found for {business_card.name}. Cannot send follow-up email.'}
            
            # Create follow-up email content
            subject = f"Nice meeting you, {business_card.name}!"
            
            # Create personalized follow-up message
            message = f"""Hello {business_card.name},

It was great meeting you! I've added your contact information to my network.

Your details I have on file:
• Name: {business_card.name}
• Company: {business_card.company or 'Not specified'}
• Position: {business_card.job_title or 'Not specified'}
• Phone: {business_card.mobile or 'Not specified'}

I look forward to staying in touch and exploring potential opportunities for collaboration.

Best regards,
{config.sender_email.split('@')[0].title()}

---
This is an automated message sent from our Business Card Scanner system.
If you received this in error, please disregard this message."""
            
            # Send email TO the business card owner (not to a fixed recipient)
            return EmailService.send_email(
                config=config,
                subject=subject,
                message=message,
                recipient_email=business_card.email,  # Send TO the card owner
                business_card=business_card
            )
            
        except Exception as e:
            return {'success': False, 'message': f'Error sending follow-up email: {str(e)}'} 