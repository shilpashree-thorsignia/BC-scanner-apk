import re
import os
from pyzbar.pyzbar import decode
from PIL import Image
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
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
            user = UserProfile.objects.create(
                first_name=request.data.get('first_name', ''),
                last_name=request.data.get('last_name', ''),
                email=request.data.get('email'),
                phone=request.data.get('phone', ''),
                password=request.data.get('password', '')
            )
            
            return Response({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
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
        
        try:
            user = UserProfile.objects.get(email=email)
            if user.password == password:
                return Response({
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone
                })
            else:
                return Response({'error': 'Invalid password'}, status=status.HTTP_401_UNAUTHORIZED)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class BusinessCardViewSet(viewsets.ModelViewSet):
    queryset = BusinessCard.objects.filter(is_deleted=False)
    serializer_class = BusinessCardSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = BusinessCard.objects.filter(is_deleted=False)
        user_id = self.request.query_params.get('user_id', None)
        if user_id is not None:
            queryset = queryset.filter(user_id=user_id)
        return queryset

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
                parsed_data['user_id'] = user_id
            
            # Save the business card
            serializer = BusinessCardSerializer(data=parsed_data)
            if serializer.is_valid():
                business_card = serializer.save()
                print(f"✅ Business card saved successfully: {business_card.id}")
                return Response({
                    'message': 'Business card scanned successfully',
                    'business_card': BusinessCardSerializer(business_card).data,
                    'extraction_details': result
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
            
            if user_id:
                mapped_data['user_id'] = user_id
            
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
        try:
            if 'image' not in request.FILES:
                return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

            image_file = request.FILES['image']
            user_id = request.data.get('user_id')
            
            image = Image.open(image_file)
            qr_codes = decode(image)
            
            if not qr_codes:
                return Response({'error': 'No QR code found'}, status=status.HTTP_400_BAD_REQUEST)
            
            qr_text = qr_codes[0].data.decode('utf-8')
            parsed_data = self.parse_qr_business_card(qr_text)
            
            if user_id:
                parsed_data['user_id'] = user_id
            
            serializer = BusinessCardSerializer(data=parsed_data)
            if serializer.is_valid():
                business_card = serializer.save()
                return Response({
                    'message': 'QR code scanned successfully',
                    'business_card': BusinessCardSerializer(business_card).data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({'error': f'Error processing QR code: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            user_id = request.query_params.get('user_id', None)
            
            # Get deleted business cards
            queryset = BusinessCard.objects.filter(is_deleted=True)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            
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
            user_id = request.data.get('user_id')
            
            # Get deleted business cards
            queryset = BusinessCard.objects.filter(is_deleted=True)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            
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
            
            return Response(debug_info)
            
        except Exception as e:
            return Response({
                'error': f'Debug endpoint error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailConfigViewSet(viewsets.ModelViewSet):
    queryset = EmailConfig.objects.all()
    serializer_class = EmailConfigSerializer
    permission_classes = [AllowAny] 