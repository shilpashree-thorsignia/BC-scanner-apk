import re
import cv2
import numpy as np
import pytesseract
from pyzbar.pyzbar import decode
from PIL import Image, ImageEnhance, ImageFilter
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .models import BusinessCard, UserProfile, EmailConfig
from .serializers import BusinessCardSerializer, UserProfileSerializer, EmailConfigSerializer

# Set Tesseract path (update this path if Tesseract is installed elsewhere)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Import the fast OCR system
try:
    from .fast_ocr import FastOCREngine, FastBusinessCardParser
    FAST_OCR_AVAILABLE = True
    print("✅ Fast OCR system loaded")
    
    # Initialize the engines globally
    fast_ocr_engine = FastOCREngine()
    fast_business_card_parser = FastBusinessCardParser()
    
except ImportError as e:
    FAST_OCR_AVAILABLE = False
    fast_ocr_engine = None
    fast_business_card_parser = None
    print(f"❌ Fast OCR not available: {e}")
    
    # Fallback to enhanced deep OCR if available
    try:
        from .deep_ocr_enhanced import AdvancedDeepOCREngine, EnhancedBusinessCardParser
        FAST_OCR_AVAILABLE = True
        print("✅ Enhanced Deep Learning OCR system loaded as fallback")
        
        fast_ocr_engine = AdvancedDeepOCREngine()
        fast_business_card_parser = EnhancedBusinessCardParser()
        
    except ImportError as e2:
        print(f"❌ No OCR system available: {e2}")

def cleanup_business_card_images():
    """Utility function to clean up all business card images from storage"""
    import os
    from django.conf import settings
    
    try:
        # Get all business cards with images
        cards_with_images = BusinessCard.objects.exclude(image__isnull=True).exclude(image='')
        deleted_count = 0
        
        for card in cards_with_images:
            if card.image:
                image_path = card.image.path
                try:
                    if os.path.exists(image_path):
                        os.remove(image_path)
                        deleted_count += 1
                        print(f"Deleted image: {image_path}")
                    
                    # Clear the image field
                    card.image = None
                    card.save()
                    
                except Exception as e:
                    print(f"Error deleting image {image_path}: {str(e)}")
        
        # Also try to clean up the entire business_cards directory if it exists
        media_root = getattr(settings, 'MEDIA_ROOT', None)
        if media_root:
            business_cards_dir = os.path.join(media_root, 'business_cards')
            if os.path.exists(business_cards_dir):
                try:
                    for filename in os.listdir(business_cards_dir):
                        file_path = os.path.join(business_cards_dir, filename)
                        if os.path.isfile(file_path):
                            os.remove(file_path)
                            deleted_count += 1
                            print(f"Cleaned up orphaned file: {file_path}")
                    
                    # Remove empty directory
                    if not os.listdir(business_cards_dir):
                        os.rmdir(business_cards_dir)
                        print(f"Removed empty directory: {business_cards_dir}")
                        
                except Exception as e:
                    print(f"Error cleaning up directory {business_cards_dir}: {str(e)}")
        
        print(f"Cleanup completed. Deleted {deleted_count} image files.")
        return deleted_count
        
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")
        return 0

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, format=None):
        try:
            # Create user directly without authentication
            user = UserProfile.objects.create(
                first_name=request.data.get('first_name', ''),
                last_name=request.data.get('last_name', ''),
                email=request.data.get('email'),
                phone=request.data.get('phone', ''),
                password=request.data.get('password', '')  # Storing plain text password as requested
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
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def patch(self, request, user_id, format=None):
        try:
            user = UserProfile.objects.get(id=user_id)
            
            # Update user fields if they are in the request
            for field in ['first_name', 'last_name', 'email', 'phone']:
                if field in request.data:
                    setattr(user, field, request.data[field])
            
            user.save()
            
            return Response({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone
            })
            
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, format=None):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = UserProfile.objects.get(email=email)
            if user.password == password:  # Simple password check (not recommended for production)
                return Response({
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone
                })
            else:
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class BusinessCardViewSet(viewsets.ModelViewSet):
    queryset = BusinessCard.objects.filter(is_deleted=False)  # Only show non-deleted cards by default
    serializer_class = BusinessCardSerializer

    def get_queryset(self):
        """Override to handle deleted/non-deleted cards based on query params"""
        queryset = BusinessCard.objects.all()
        
        # Check if we want to see deleted cards
        show_deleted = self.request.query_params.get('deleted', 'false').lower()
        if show_deleted == 'true':
            queryset = queryset.filter(is_deleted=True)
        else:
            queryset = queryset.filter(is_deleted=False)
            
        return queryset.order_by('-created_at')

    def destroy(self, request, *args, **kwargs):
        """Soft delete instead of hard delete"""
        from django.utils import timezone
        
        instance = self.get_object()
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save()
        
        return Response({
            'message': 'Business card moved to trash. You can restore it within 30 days.',
            'deleted_at': instance.deleted_at
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['POST'])
    def restore(self, request, pk=None):
        """Restore a soft-deleted business card"""
        try:
            card = BusinessCard.objects.get(pk=pk, is_deleted=True)
            card.is_deleted = False
            card.deleted_at = None
            card.save()
            
            serializer = self.get_serializer(card)
            return Response({
                'message': 'Business card restored successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except BusinessCard.DoesNotExist:
            return Response({
                'error': 'Business card not found in trash'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['DELETE'])
    def permanent_delete(self, request, pk=None):
        """Permanently delete a business card"""
        try:
            card = BusinessCard.objects.get(pk=pk, is_deleted=True)
            card.delete()  # Hard delete
            
            return Response({
                'message': 'Business card permanently deleted'
            }, status=status.HTTP_200_OK)
        except BusinessCard.DoesNotExist:
            return Response({
                'error': 'Business card not found in trash'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['GET'])
    def trash(self, request):
        """Get all deleted business cards"""
        deleted_cards = BusinessCard.objects.filter(is_deleted=True).order_by('-deleted_at')
        serializer = self.get_serializer(deleted_cards, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['POST'])
    def empty_trash(self, request):
        """Permanently delete all cards in trash"""
        deleted_cards = BusinessCard.objects.filter(is_deleted=True)
        count = deleted_cards.count()
        deleted_cards.delete()  # Hard delete
        
        return Response({
            'message': f'Permanently deleted {count} business cards from trash'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'])
    def cleanup_images(self, request):
        """Clean up all stored business card images"""
        try:
            deleted_count = cleanup_business_card_images()
            return Response({
                'message': f'Successfully cleaned up {deleted_count} image files',
                'deleted_count': deleted_count
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'Error during cleanup: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, *args, **kwargs):
        try:
            card = BusinessCard.objects.create(
                name=request.data.get('name', ''),
                email=request.data.get('email'),
                mobile=request.data.get('mobile'),
                company=request.data.get('company'),
                job_title=request.data.get('jobTitle'),  # Note the conversion from camelCase to snake_case
                website=request.data.get('website'),
                address=request.data.get('address'),
                notes=request.data.get('notes')
            )
            serializer = self.get_serializer(card)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def preprocess_image(self, img):
        """
        Adaptive preprocessing with CLAHE - good for varying lighting
        
        Args:
            img: PIL Image object
            
        Returns:
            PIL Image: Preprocessed image optimized for OCR
        """
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Resize to optimal resolution
        width, height = img.size
        target_width = 1600
        if width < target_width:
            scale_factor = target_width / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        elif width > 3200:
            scale_factor = 3200 / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Apply CLAHE for better contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        img_array = clahe.apply(img_array)
        
        # Use adaptive thresholding
        img_array = cv2.adaptiveThreshold(
            img_array, 
            255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 
            11,  # Block size
            2    # C constant
        )
        
        # Convert back to PIL Image
        img = Image.fromarray(img_array)
        
        return img

    def preprocess_simple_threshold(self, img):
        """Simple binary thresholding - often works best for clean business cards"""
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Resize to optimal resolution
        width, height = img.size
        target_width = 1600
        if width < target_width:
            scale_factor = target_width / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Simple binary threshold
        _, img_array = cv2.threshold(img_array, 127, 255, cv2.THRESH_BINARY)
        
        return Image.fromarray(img_array)
    
    def preprocess_otsu(self, img):
        """Otsu's thresholding - good for varying lighting"""
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Resize
        width, height = img.size
        target_width = 1600
        if width < target_width:
            scale_factor = target_width / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        img_array = np.array(img)
        
        # Apply slight blur to reduce noise
        img_array = cv2.GaussianBlur(img_array, (3, 3), 0)
        
        # Otsu's thresholding
        _, img_array = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(img_array)
    
    def preprocess_minimal(self, img):
        """Minimal processing - just resize and convert"""
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Resize to moderate resolution
        width, height = img.size
        target_width = 1200
        if width < target_width:
            scale_factor = target_width / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        return img
    
    def preprocess_enhanced_contrast(self, img):
        """Enhanced contrast preprocessing with noise reduction"""
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Resize to high resolution for better OCR
        width, height = img.size
        target_width = 2400
        if width < target_width:
            scale_factor = target_width / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Apply Gaussian blur to reduce noise
        img_array = cv2.GaussianBlur(img_array, (1, 1), 0)
        
        # Apply CLAHE for better contrast with smaller tiles
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4,4))
        img_array = clahe.apply(img_array)
        
        # Morphological operations to clean up text
        kernel = np.ones((1,1), np.uint8)
        img_array = cv2.morphologyEx(img_array, cv2.MORPH_CLOSE, kernel)
        
        # Adaptive threshold with fine-tuned parameters
        img_array = cv2.adaptiveThreshold(
            img_array, 
            255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 
            9,   # Smaller block size for finer details
            4    # Higher C for better separation
        )
        
        return Image.fromarray(img_array)
    
    def preprocess_sharp_binary(self, img):
        """Sharp binary preprocessing with edge enhancement"""
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Resize
        width, height = img.size
        target_width = 2000
        if width < target_width:
            scale_factor = target_width / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        img_array = np.array(img)
        
        # Apply unsharp mask for edge enhancement
        blurred = cv2.GaussianBlur(img_array, (0, 0), 1.0)
        img_array = cv2.addWeighted(img_array, 1.5, blurred, -0.5, 0)
        
        # Use Otsu's threshold with erosion/dilation
        _, img_array = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Clean up with morphological operations
        kernel = np.ones((2,2), np.uint8)
        img_array = cv2.morphologyEx(img_array, cv2.MORPH_CLOSE, kernel)
        
        return Image.fromarray(img_array)
    
    def preprocess_denoise_threshold(self, img):
        """Denoising with bilateral filter before thresholding"""
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Resize
        width, height = img.size
        target_width = 2200
        if width < target_width:
            scale_factor = target_width / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        img_array = np.array(img)
        
        # Apply bilateral filter for noise reduction while preserving edges
        img_array = cv2.bilateralFilter(img_array, 9, 75, 75)
        
        # Use adaptive threshold
        img_array = cv2.adaptiveThreshold(
            img_array, 
            255, 
            cv2.ADAPTIVE_THRESH_MEAN_C, 
            cv2.THRESH_BINARY, 
            11, 
            5
        )
        
        return Image.fromarray(img_array)
    
    def preprocess_high_contrast(self, img):
        """High contrast processing with histogram equalization"""
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Resize
        width, height = img.size
        target_width = 2400
        if width < target_width:
            scale_factor = target_width / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        img_array = np.array(img)
        
        # Apply histogram equalization
        img_array = cv2.equalizeHist(img_array)
        
        # Apply median filter to reduce noise
        img_array = cv2.medianBlur(img_array, 3)
        
        # Use multiple threshold methods and combine
        _, thresh1 = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        thresh2 = cv2.adaptiveThreshold(img_array, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # Combine the two thresholds
        img_array = cv2.bitwise_and(thresh1, thresh2)
        
        return Image.fromarray(img_array)

    def extract_info(self, text):
        """
        Enhanced extraction of structured information from OCR text
        
        Args:
            text: Raw OCR text string
            
        Returns:
            dict: Structured information dictionary
        """
        # Clean and normalize text
        lines = []
        for line in text.split('\n'):
            # Remove extra whitespace and filter out very short lines
            cleaned_line = ' '.join(line.split())
            if len(cleaned_line) > 1 and not cleaned_line.isspace():
                lines.append(cleaned_line)
        
        # Initialize result dictionary
        result = {
            'name': None,
            'email': None,
            'mobile': None,
            'company': None,
            'job_title': None,
            'website': None,
            'address': None,
            'social_media': [],
            'additional_phones': [],
            'notes': []
        }
        
        # Define job keywords at the beginning for use throughout the method
        job_keywords = [
            'manager', 'director', 'head', 'chief', 'senior', 'junior', 'lead',
            'ceo', 'cto', 'cfo', 'coo', 'president', 'vice president', 'vp',
            'founder', 'co-founder', 'owner', 'partner', 'principal',
            'engineer', 'developer', 'analyst', 'consultant', 'specialist',
            'coordinator', 'supervisor', 'administrator', 'executive',
            'associate', 'assistant', 'representative', 'agent', 'officer',
            'development', 'business development', 'sales', 'marketing',
            'operations', 'finance', 'human resources', 'hr', 'technical',
            'business head', 'team lead', 'project manager'
        ]
        
        # Enhanced regex patterns with OCR error tolerance
        patterns = {
            'email': r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',
            'email_ocr_tolerant': r'\b[a-zA-Z0-9._%+-]+[@a][a-zA-Z0-9.-]+[.][a-zA-Z]{2,}\b',  # Handle @ OCR errors
            'phone': r'(?:\+91\s?)?(?:\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4})',
            'phone_extended': r'(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})',
            'website': r'(?i)(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/\S*)?',
            'website_ocr_tolerant': r'(?i)(?:https?[:\/:\/]\/)?(?:www[.])?([a-zA-Z0-9-]+[.])+[a-zA-Z]{2,}',
            'social_media': r'(?i)(?:linkedin\.com\/in\/|twitter\.com\/|facebook\.com\/|instagram\.com\/|github\.com\/)[\w.-]+',
            'name': r'^[A-Z][a-z]+(?:\s+[A-Z][a-z\']+){1,3}$',
            'name_flexible': r'\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*\b',
            'address': r'(?i)(?:\d+[\/\-,\s]*)?[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|place|pl|nagar|colony|sector|block)',
            'indian_address': r'(?i)(?:\d+[\/\-,\s]*)?[A-Za-z\s,]+(?:nagar|colony|sector|block|road|street|bangalore|bengaluru|mumbai|delhi|hyderabad|chennai|pune|ahmedabad|kolkata|karnataka|maharashtra|gujarat|tamil nadu)',
        }
        
        processed_lines = []
        
        # First pass: Extract structured data
        for line in lines:
            original_line = line
            line_processed = False
            
            # Extract email with OCR error tolerance
            email_matches = re.findall(patterns['email'], line)
            if not email_matches:
                # Try OCR-tolerant pattern
                email_matches = re.findall(patterns['email_ocr_tolerant'], line)
                # Clean up OCR errors in email
                if email_matches:
                    email = email_matches[0]
                    # Fix common OCR errors
                    email = email.replace('@a', '@').replace('a@', '@')
                    email_matches = [email] if '@' in email else []
            
            if email_matches and not result['email']:
                email = email_matches[0].lower()
                # Validate email format
                if '@' in email and '.' in email.split('@')[1]:
                    result['email'] = email
                    line = re.sub(patterns['email'], '', line).strip()
                    line = re.sub(patterns['email_ocr_tolerant'], '', line).strip()
                    line_processed = True
            
            # Extract all phone numbers (improved for Indian and international numbers)
            phone_matches = re.findall(patterns['phone'], line)
            if not phone_matches:
                # Try extended pattern for better coverage
                phone_matches = re.findall(patterns['phone_extended'], line)
            
            if phone_matches:
                for phone in phone_matches:
                    # Clean and validate phone
                    clean_phone = re.sub(r'[^\d+]', '', phone)
                    # Additional validation for phone numbers
                    if len(clean_phone) >= 10 and len(clean_phone) <= 15:
                        # Format phone nicely
                        formatted_phone = phone.strip()
                        # Remove extra spaces and normalize
                        formatted_phone = ' '.join(formatted_phone.split())
                        
                        if not result['mobile']:
                            result['mobile'] = formatted_phone
                        else:
                            # Avoid duplicates
                            if formatted_phone not in result['additional_phones']:
                                result['additional_phones'].append(formatted_phone)
                    line = line.replace(phone, '').strip()
                line_processed = True
            
            # Extract website with enhanced OCR error tolerance
            website_matches = re.findall(patterns['website'], line)
            if not website_matches:
                # Try OCR-tolerant pattern
                website_matches = re.findall(patterns['website_ocr_tolerant'], line)
            
            # Additional patterns for common OCR errors in websites
            if not website_matches:
                # Handle missing dots before common TLDs
                ocr_website_patterns = [
                    r'(?i)www[.]?[a-zA-Z0-9-]+com\b',  # www.sitecom -> www.site.com
                    r'(?i)www[.]?[a-zA-Z0-9-]+in\b',   # www.sitein -> www.site.in
                    r'(?i)www[.]?[a-zA-Z0-9-]+org\b',  # www.siteorg -> www.site.org
                    r'(?i)[a-zA-Z0-9-]+[.]?com\b',     # sitecom -> site.com
                    r'(?i)[a-zA-Z0-9-]+[.]?in\b',      # sitein -> site.in
                ]
                
                for pattern in ocr_website_patterns:
                    matches = re.findall(pattern, line)
                    if matches:
                        website_matches = matches
                        break
            
            if website_matches and not result['website']:
                website = website_matches[0]
                
                # Clean up OCR errors in website
                website = website.replace('[.]', '.').replace(':', ':').replace('/', '/')
                
                # Fix common OCR errors in websites
                # Handle missing dot before TLD
                if not re.search(r'\.(com|in|org|net|co\.in|biz|info)$', website, re.IGNORECASE):
                    # Try to add missing dot before common TLDs
                    for tld in ['com', 'in', 'org', 'net']:
                        if website.lower().endswith(tld):
                            website = website[:-len(tld)] + '.' + tld
                            break
                
                # Ensure www prefix if it looks like it should have one
                if not website.startswith(('http', 'www')):
                    if any(tld in website.lower() for tld in ['.com', '.in', '.org', '.net']):
                        website = 'www.' + website
                
                # Validate website format
                if ('.' in website and len(website) > 4 and 
                    any(tld in website.lower() for tld in ['.com', '.in', '.org', '.net', '.co.in'])):
                    if not website.startswith('http'):
                        website = 'https://' + website
                    result['website'] = website
                    line = re.sub(patterns['website'], '', line).strip()
                    line = re.sub(patterns['website_ocr_tolerant'], '', line).strip()
                    # Also remove the OCR-error patterns we found
                    for pattern in ocr_website_patterns:
                        line = re.sub(pattern, '', line).strip()
                    line_processed = True
            
            # Extract social media
            social_matches = re.findall(patterns['social_media'], line)
            if social_matches:
                for social in social_matches:
                    full_social = 'https://' + social if not social.startswith('http') else social
                    if full_social not in result['social_media']:
                        result['social_media'].append(full_social)
                line = re.sub(patterns['social_media'], '', line).strip()
                line_processed = True
            
            # Keep remaining content for further processing
            if line.strip():
                processed_lines.append(line.strip())
            elif not line_processed and original_line.strip():
                processed_lines.append(original_line.strip())
        
        # Second pass: Extract name, company, job title, and address
        remaining_lines = processed_lines.copy()
        
        # Enhanced name extraction with OCR error tolerance
        name_candidates = []
        
        # Define keyboard keys and other non-business-card terms to exclude
        keyboard_keys = [
            'end', 'fn', 'insert', 'delete', 'ctrl', 'alt', 'shift', 'tab', 'enter', 
            'space', 'home', 'page', 'up', 'down', 'left', 'right', 'esc', 'f1', 'f2', 
            'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'print', 
            'screen', 'scroll', 'lock', 'pause', 'break', 'caps', 'num', 'gr'
        ]
        
        for i, line in enumerate(remaining_lines):
            # Clean the line first
            clean_line = ' '.join(line.split())
            words = clean_line.split()
            
            # Skip lines that are clearly not names
            if (len(clean_line) < 3 or len(clean_line) > 80 or
                '@' in clean_line or 'http' in clean_line.lower() or
                clean_line.lower().startswith(('www', 'email', 'phone', 'tel', 'mobile'))):
                continue
            
            # Skip keyboard keys and single words that are likely not names
            if (len(words) == 1 and 
                (clean_line.lower() in keyboard_keys or 
                 len(clean_line) < 4 or
                 clean_line.lower() in ['end', 'fn', 'insert', 'delete', 'ctrl', 'alt', 'shift'])):
                continue
            
            # Check for proper name patterns with OCR tolerance
            name_score = 0
            
            # Basic name structure (2-4 words preferred for full names)
            if 2 <= len(words) <= 4:
                name_score += 5  # Higher score for multi-word names
            elif len(words) == 1:
                name_score += 1  # Lower score for single words
            
            # Strong preference for 2-3 word names (first + last, or first + middle + last)
            if 2 <= len(words) <= 3:
                name_score += 5
            
            # Check for capitalization patterns
            capitalized_words = sum(1 for word in words if word and word[0].isupper())
            if capitalized_words >= len(words) * 0.7:  # Most words capitalized
                name_score += 3
            
            # Check character composition
            alpha_ratio = sum(1 for c in clean_line if c.isalpha()) / max(len(clean_line), 1)
            if alpha_ratio > 0.8:  # Mostly alphabetic
                name_score += 2
            
            # Penalty for too many digits or special characters
            digit_count = sum(1 for c in clean_line if c.isdigit())
            if digit_count <= 1:
                name_score += 1
            elif digit_count > 3:
                name_score -= 2
            
            # Check against job title keywords (penalty if found)
            if not any(keyword in clean_line.lower() for keyword in job_keywords):
                name_score += 2
            else:
                name_score -= 3
            
            # Check for common name patterns (multiple patterns for OCR tolerance)
            if re.match(r'^[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}', clean_line):
                name_score += 6  # Strong bonus for proper name pattern
            elif re.search(patterns['name_flexible'], clean_line):
                name_score += 4
            
            # Additional name validation
            if len(words) == 2:  # First name + Last name
                if all(len(word) >= 2 for word in words):
                    name_score += 4  # Higher bonus for two-word names
            elif len(words) == 3:  # First + Middle + Last or similar
                if all(len(word) >= 2 for word in words):
                    name_score += 5
            
            # Position bonus (names are often at the top, but not the very first line which might be noise)
            if 1 <= i <= 4:  # Lines 2-5 are good positions for names
                name_score += 2
            
            # Penalty for very short single words
            if len(words) == 1 and len(clean_line) < 5:
                name_score -= 3
            
            # Add to candidates if score is reasonable
            if name_score >= 7:  # Higher threshold to be more selective
                name_candidates.append((i, clean_line, name_score))
        
        # Sort by score and choose the best
        if name_candidates:
            name_candidates.sort(key=lambda x: x[2], reverse=True)
            idx, name, score = name_candidates[0]
            result['name'] = name
            remaining_lines.pop(idx)
        
        # Enhanced job title extraction with better scoring
        job_candidates = []
        for i, line in enumerate(remaining_lines):
            clean_line = ' '.join(line.split())
            line_lower = clean_line.lower()
            
            # Skip obviously non-job-title lines
            if (len(clean_line) < 3 or len(clean_line) > 100 or
                '@' in clean_line or 'http' in clean_line.lower() or
                any(c.isdigit() for c in clean_line[:3])):  # Starts with numbers
                continue
            
            job_score = 0
            
            # Check for exact keyword matches
            exact_matches = sum(1 for keyword in job_keywords if keyword in line_lower)
            job_score += exact_matches * 5
            
            # Check for partial matches and common job-related terms
            partial_keywords = ['exec', 'mgr', 'dev', 'admin', 'coord', 'spec', 'rep', 'assoc']
            partial_matches = sum(1 for keyword in partial_keywords if keyword in line_lower)
            job_score += partial_matches * 3
            
            # Check for job-related patterns
            if re.search(r'\b(executive|manager|director|head|lead|senior|junior)\b', line_lower):
                job_score += 4
            
            if re.search(r'\b(business|development|sales|marketing|technical|operations)\b', line_lower):
                job_score += 3
            
            # Prefer multi-word job titles
            word_count = len(clean_line.split())
            if 2 <= word_count <= 5:
                job_score += 2
            elif word_count > 5:
                job_score -= 1  # Too long, probably not a job title
            
            # Check capitalization (job titles often have title case)
            words = clean_line.split()
            capitalized_words = sum(1 for word in words if word and word[0].isupper())
            if capitalized_words >= len(words) * 0.6:  # Most words capitalized
                job_score += 2
            
            # Position consideration (job titles often come after names)
            if 1 <= i <= 4:  # Not first line but near top
                job_score += 1
            
            # Length consideration (reasonable job title length)
            if 10 <= len(clean_line) <= 50:
                job_score += 1
            
            # Add to candidates if score is reasonable
            if job_score >= 4:
                job_candidates.append((i, clean_line, job_score))
        
        if job_candidates:
            # Choose the highest scoring job title
            job_candidates.sort(key=lambda x: x[2], reverse=True)
            idx, job_title, score = job_candidates[0]
            result['job_title'] = job_title
            remaining_lines.pop(idx)
        
        # Extract address (improved for Indian addresses with better patterns)
        address_lines = []
        for i in reversed(range(len(remaining_lines))):
            line = remaining_lines[i]
            is_address = False
            
            # Check multiple address patterns
            if (re.search(patterns['address'], line, re.IGNORECASE) or
                re.search(patterns['indian_address'], line, re.IGNORECASE)):
                is_address = True
            
            # Additional address indicators
            address_keywords = [
                'city', 'state', 'zip', 'postal', 'pin', 'bangalore', 'bengaluru', 
                'nagar', 'colony', 'sector', 'block', 'road', 'street', 'avenue',
                'mumbai', 'delhi', 'hyderabad', 'chennai', 'pune', 'ahmedabad',
                'karnataka', 'maharashtra', 'gujarat', 'tamil nadu', 'rajasthan'
            ]
            
            if any(keyword in line.lower() for keyword in address_keywords):
                is_address = True
            
            # Check for address-like patterns (numbers + street names)
            if re.search(r'\d+.*(?:street|road|avenue|lane|nagar|colony)', line.lower()):
                is_address = True
            
            if is_address:
                address_lines.insert(0, line)
                remaining_lines.pop(i)
        
        if address_lines:
            result['address'] = ', '.join(address_lines)
        
        # Extract company name (remaining prominent lines)
        if remaining_lines:
            # Look for lines with capital letters or common company indicators
            company_indicators = [
                'inc', 'llc', 'ltd', 'corp', 'company', 'group', 'solutions', 
                'services', 'technologies', 'systems', 'enterprises', 'pvt',
                'private', 'limited', 'co', 'corporation'
            ]
            
            for i, line in enumerate(remaining_lines):
                if (any(indicator in line.lower() for indicator in company_indicators) or
                    sum(1 for c in line if c.isupper()) >= 2 or
                    (len(line) > 5 and not any(keyword in line.lower() for keyword in job_keywords))):
                    result['company'] = line
                    remaining_lines.pop(i)
                    break
            
            # If no company found with indicators, use the first substantial line
            if not result['company'] and remaining_lines:
                for i, line in enumerate(remaining_lines):
                    if len(line) > 3 and not line.lower().startswith(('the', 'and', 'or')):
                        result['company'] = line
                        remaining_lines.pop(i)
                        break
        
        # Store remaining lines as notes - ONLY meaningful remaining content
        if remaining_lines:
            # Filter out junk and very short lines
            meaningful_notes = []
            for line in remaining_lines:
                # Skip single characters, numbers, or very short meaningless text
                if (len(line) > 3 and 
                    not line.isdigit() and 
                    not re.match(r'^[^a-zA-Z]*$', line) and  # Skip non-alphabetic lines
                    len(line.split()) >= 2):  # Must have at least 2 words
                    meaningful_notes.append(line)
            
            result['notes'] = meaningful_notes if meaningful_notes else None
        else:
            result['notes'] = None
        
        # Clean up empty lists and None values for better output
        if not result['social_media']:
            del result['social_media']
        if not result['additional_phones']:
            del result['additional_phones']
        
        # Post-process: Clean up extracted data
        for key, value in result.items():
            if isinstance(value, str):
                result[key] = value.strip()
            elif isinstance(value, list):
                result[key] = [item.strip() if isinstance(item, str) else item for item in value]
        
        return result
    
    def process_qr_code(self, image):
        """Process image to detect and decode QR codes"""
        try:
            # Convert PIL Image to OpenCV format
            img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Decode QR codes
            decoded_objects = decode(img_cv)
            
            if decoded_objects:
                # Extract data from QR code
                qr_data = []
                for obj in decoded_objects:
                    qr_data.append(obj.data.decode('utf-8'))
                return qr_data
            return None
        except Exception as e:
            print(f"QR processing error: {str(e)}")
            return None

    def extract_text_with_multiple_configs(self, img):
        """EXTREME OCR with aggressive preprocessing and multiple strategies"""
        
        # First, try to detect if the image needs special handling
        original_img = img.copy()
        
        # STAGE 1: COMPREHENSIVE preprocessing for ALL card types and scenarios
        extreme_preprocessing_methods = [
            ('white_card_optimized', self.preprocess_white_card_optimized),
            ('intelligent_auto', self.preprocess_intelligent_auto),
            ('color_adaptive', self.preprocess_color_adaptive),
            ('high_contrast_boost', self.preprocess_high_contrast_boost),
            ('text_enhancement', self.preprocess_text_enhancement),
            ('purple_card_optimized', self.preprocess_purple_card_optimized),
            ('multi_threshold_combo', self.preprocess_multi_threshold_combo),
            ('clean_simple', self.preprocess_clean_simple),
            ('smart_contrast_detect', self.preprocess_smart_contrast_detect),
            ('advanced_denoise', self.preprocess_advanced_denoise),
            ('otsu_threshold', self.preprocess_otsu),
            ('inverted_colors', self.preprocess_inverted_colors),
        ]
        
        # STAGE 2: ROBUST OCR configurations - optimized for real business cards
        extreme_ocr_configs = [
            # Standard configs that work well
            ('robust_uniform_block', r'--psm 6 -c preserve_interword_spaces=1'),
            ('robust_single_column', r'--psm 4 -c preserve_interword_spaces=1'),
            ('robust_auto_detect', r'--psm 3 -c preserve_interword_spaces=1'),
            ('robust_text_lines', r'--psm 7 -c preserve_interword_spaces=1'),
            ('robust_with_whitelist', r'--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.-+/():,&\' -c preserve_interword_spaces=1'),
            ('robust_lstm_only', r'--oem 1 --psm 6 -c preserve_interword_spaces=1'),
            ('robust_legacy_only', r'--oem 0 --psm 6 -c preserve_interword_spaces=1'),
        ]
        
        best_results = []
        tried_combinations = 0
        max_combinations = 25  # Increased for better coverage
        
        print("=== ROBUST OCR MODE ACTIVATED ===")
        print(f"Image size: {original_img.size}")
        print(f"Image mode: {original_img.mode}")
        
        # STAGE 3: Comprehensive scaling approach - try more scales for better coverage
        for scale in [0.8, 1.0, 1.2, 1.5, 2.0, 2.5]:  # More scale options
            if tried_combinations >= max_combinations:
                break
                
            print(f"Trying scale factor: {scale}")
            scaled_img = self.apply_scaling(original_img, scale)
            
            for method_name, preprocess_func in extreme_preprocessing_methods:
                if tried_combinations >= max_combinations:
                    break
                    
                try:
                    processed_img = preprocess_func(scaled_img.copy())
                    
                    # Save debug images (optional)
                    # processed_img.save(f'debug_{method_name}_scale_{scale}.png')
                    
                    for config_name, config in extreme_ocr_configs:
                        if tried_combinations >= max_combinations:
                            break
                            
                        try:
                            tried_combinations += 1
                            current_text = pytesseract.image_to_string(processed_img, config=config)
                            
                            # CLEAN text cleaning - preserve real text
                            cleaned_text = self.clean_text_cleaning(current_text)
                            
                            # Calculate clean confidence score
                            confidence = self.calculate_clean_confidence(cleaned_text)
                            
                            print(f"Scale: {scale}, Method: {method_name}, Config: {config_name}")
                            print(f"Raw text: {repr(current_text[:150])}")
                            print(f"Cleaned text: {repr(cleaned_text[:150])}")
                            print(f"Confidence: {confidence}")
                            print("---")
                            
                            best_results.append({
                                'text': cleaned_text,
                                'raw_text': current_text,
                                'confidence': confidence,
                                'method': f"scale_{scale}_{method_name}_{config_name}",
                                'scale': scale,
                                'preprocessing': method_name,
                                'ocr_config': config_name
                            })
                            
                            # ROBUST early exit for excellent results
                            if confidence >= 20:
                                print(f"EXCELLENT result found: {confidence}")
                                return cleaned_text
                            elif confidence >= 12 and tried_combinations >= 8:
                                print(f"VERY GOOD result found: {confidence}")
                                return cleaned_text
                                
                        except Exception as e:
                            print(f"OCR failed for {method_name}_{config_name}: {str(e)}")
                            continue
                            
                except Exception as e:
                    print(f"Preprocessing failed for {method_name}: {str(e)}")
                    continue
        
        # STAGE 4: Analyze and return best result
        if best_results:
            best_results.sort(key=lambda x: x['confidence'], reverse=True)
            best_result = best_results[0]
            print(f"BEST METHOD: {best_result['method']}")
            print(f"FINAL CONFIDENCE: {best_result['confidence']}")
            
            # If still poor quality, try last-resort methods
            if best_result['confidence'] < 10:
                print("=== TRYING LAST-RESORT METHODS ===")
                return self.last_resort_ocr(original_img, best_result['text'])
            
            return best_result['text']
        
        # Ultimate fallback
        print("=== ALL METHODS FAILED - ULTIMATE FALLBACK ===")
        return self.last_resort_ocr(original_img, "")

    def apply_scaling(self, img, scale_factor):
        """Apply intelligent scaling"""
        width, height = img.size
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)
        
        # Use different resampling methods based on scale
        if scale_factor >= 2.0:
            return img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        else:
            return img.resize((new_width, new_height), Image.Resampling.BICUBIC)

    def preprocess_extreme_enhanced(self, img):
        """EXTREME preprocessing with all techniques combined"""
        # Convert to grayscale
        if img.mode != 'L':
            img = img.convert('L')
        
        # Ensure good resolution
        width, height = img.size
        if width < 2000:
            scale_factor = 2000 / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        img_array = np.array(img)
        
        # Step 1: Advanced noise reduction
        img_array = cv2.fastNlMeansDenoising(img_array, None, 10, 7, 21)
        
        # Step 2: Contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8,8))
        img_array = clahe.apply(img_array)
        
        # Step 3: Edge-preserving smoothing
        img_array = cv2.bilateralFilter(img_array, 9, 75, 75)
        
        # Step 4: Unsharp masking for text sharpening
        gaussian = cv2.GaussianBlur(img_array, (0, 0), 2.0)
        img_array = cv2.addWeighted(img_array, 2.0, gaussian, -1.0, 0)
        
        # Step 5: Adaptive thresholding with multiple methods
        thresh1 = cv2.adaptiveThreshold(img_array, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 4)
        thresh2 = cv2.adaptiveThreshold(img_array, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 15, 4)
        
        # Combine thresholds
        img_array = cv2.bitwise_and(thresh1, thresh2)
        
        # Step 6: Morphological operations for text cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        img_array = cv2.morphologyEx(img_array, cv2.MORPH_CLOSE, kernel)
        img_array = cv2.morphologyEx(img_array, cv2.MORPH_OPEN, kernel)
        
        return Image.fromarray(img_array)

    def preprocess_white_card_optimized(self, img):
        """Specifically optimized for white business cards with colored text"""
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        img_array = np.array(img)
        
        # For white cards, try different approaches to enhance text contrast
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Check if this is indeed a bright/white card
        avg_brightness = np.mean(gray)
        if avg_brightness < 150:
            # Not a white card, use standard grayscale
            processed = gray
        else:
            # This is a white card - try different color channels
            channels = {
                'gray': gray,
                'red': img_array[:,:,0],
                'green': img_array[:,:,1],
                'blue': img_array[:,:,2]
            }
            
            # Also try inverted channels for colored text on white background
            channels['inv_red'] = 255 - img_array[:,:,0]
            channels['inv_green'] = 255 - img_array[:,:,1]
            channels['inv_blue'] = 255 - img_array[:,:,2]
            
            # Find the channel with best text contrast
            best_channel = None
            best_contrast = 0
            
            for name, channel in channels.items():
                # Calculate contrast using standard deviation
                contrast = np.std(channel)
                if contrast > best_contrast:
                    best_contrast = contrast
                    best_channel = channel
            
            processed = best_channel
        
        # Aggressive upscaling for white cards
        height, width = processed.shape
        if width < 3000:
            scale = 3000 / width
            processed = cv2.resize(processed, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Gentle noise reduction
        processed = cv2.medianBlur(processed, 3)
        
        # Enhanced contrast for white cards
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8,8))
        processed = clahe.apply(processed)
        
        # Try multiple thresholding approaches
        _, otsu = cv2.threshold(processed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        adaptive = cv2.adaptiveThreshold(processed, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8)
        
        # Use the one that gives better text separation
        otsu_ratio = np.sum(otsu == 0) / (otsu.shape[0] * otsu.shape[1])  # Black pixels ratio
        adaptive_ratio = np.sum(adaptive == 0) / (adaptive.shape[0] * adaptive.shape[1])
        
        # Choose the threshold that gives reasonable text ratio (10-40%)
        if 0.1 <= otsu_ratio <= 0.4:
            binary = otsu
        elif 0.1 <= adaptive_ratio <= 0.4:
            binary = adaptive
        else:
            # Combine both if neither is ideal
            binary = cv2.bitwise_and(otsu, adaptive)
        
        # Morphological cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        return Image.fromarray(binary)

    def preprocess_text_enhancement(self, img):
        """Enhanced text processing for better character recognition"""
        gray = np.array(img.convert('L'))
        
        # Upscale significantly for better character recognition
        height, width = gray.shape
        if width < 3500:
            scale = 3500 / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Advanced denoising
        gray = cv2.fastNlMeansDenoising(gray, None, h=8, templateWindowSize=7, searchWindowSize=21)
        
        # Sharpening for text clarity
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        gray = cv2.filter2D(gray, -1, kernel)
        
        # Contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Multiple threshold combination
        _, thresh1 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        thresh2 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        thresh3 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # Combine thresholds intelligently
        combined = cv2.bitwise_and(thresh1, thresh2)
        combined = cv2.bitwise_or(combined, thresh3)
        
        # Text-specific morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
        
        return Image.fromarray(combined)

    def preprocess_intelligent_auto(self, img):
        """Intelligent auto-detection and processing for any card type"""
        # Convert to RGB for analysis
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        img_array = np.array(img)
        
        # Analyze the image to determine the best approach
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Check average brightness to detect card type
        avg_brightness = np.mean(gray)
        brightness_std = np.std(gray)
        
        print(f"Image analysis - Avg brightness: {avg_brightness:.1f}, Std: {brightness_std:.1f}")
        
        # Upscale first for better processing
        height, width = gray.shape
        if width < 2000:
            scale = 2000 / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Choose processing based on image characteristics
        if avg_brightness < 100:  # Dark cards (like purple)
            print("Detected: DARK CARD - applying dark card processing")
            # For dark cards, enhance contrast more aggressively
            clahe = cv2.createCLAHE(clipLimit=6.0, tileGridSize=(8,8))
            gray = clahe.apply(gray)
            
            # Use multiple thresholding approaches for dark cards
            _, thresh1 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            thresh2 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 5)
            
            # Combine them
            binary = cv2.bitwise_or(thresh1, thresh2)
            
        elif avg_brightness > 180:  # Very bright cards (like white)
            print("Detected: BRIGHT CARD - applying bright card processing")
            # For bright cards, use gentle processing
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            gray = clahe.apply(gray)
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
        else:  # Medium brightness cards
            print("Detected: MEDIUM BRIGHTNESS - applying balanced processing")
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            gray = clahe.apply(gray)
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Final cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        return Image.fromarray(binary)

    def preprocess_color_adaptive(self, img):
        """Color-adaptive preprocessing that works with any background color"""
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        img_array = np.array(img)
        
        # Try different color channels to find the best one
        channels = {
            'red': img_array[:,:,0],
            'green': img_array[:,:,1], 
            'blue': img_array[:,:,2],
            'gray': cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        }
        
        # HSV channels
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        channels['value'] = hsv[:,:,2]
        channels['saturation'] = hsv[:,:,1]
        
        # Find channel with best contrast
        best_channel = None
        best_contrast = 0
        best_name = ""
        
        for name, channel in channels.items():
            contrast = np.std(channel)
            if contrast > best_contrast:
                best_contrast = contrast
                best_channel = channel
                best_name = name
        
        print(f"Best channel: {best_name} (contrast: {best_contrast:.2f})")
        
        # Process the best channel
        gray = best_channel
        
        # Upscale
        height, width = gray.shape
        if width < 2200:
            scale = 2200 / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Enhance contrast
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Apply thresholding
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(binary)

    def preprocess_high_contrast_boost(self, img):
        """High contrast boosting for difficult cards"""
        gray = np.array(img.convert('L'))
        
        # Upscale
        height, width = gray.shape
        if width < 2500:
            scale = 2500 / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Aggressive contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=8.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Histogram stretching
        gray = cv2.equalizeHist(gray)
        
        # Multiple threshold attempts
        _, thresh1 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        thresh2 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 19, 8)
        
        # Use the one with better distribution
        white_pixels_1 = np.sum(thresh1 == 255)
        white_pixels_2 = np.sum(thresh2 == 255)
        total_pixels = thresh1.shape[0] * thresh1.shape[1]
        
        ratio_1 = white_pixels_1 / total_pixels
        ratio_2 = white_pixels_2 / total_pixels
        
        # Choose the threshold that gives reasonable text-to-background ratio
        if 0.1 <= ratio_1 <= 0.4:
            binary = thresh1
        elif 0.1 <= ratio_2 <= 0.4:
            binary = thresh2
        else:
            # Combine both if neither is ideal
            binary = cv2.bitwise_and(thresh1, thresh2)
        
        return Image.fromarray(binary)

    def preprocess_purple_card_optimized(self, img):
        """Specifically optimized for purple business cards"""
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        img_array = np.array(img)
        
        # For purple cards, the blue channel often has the best contrast
        blue_channel = img_array[:,:,2]
        
        # Also try the inverse of red channel (purple = low red)
        red_channel = img_array[:,:,0]
        inv_red = 255 - red_channel
        
        # Try both and see which works better
        candidates = {
            'blue': blue_channel,
            'inv_red': inv_red,
            'gray': cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        }
        
        best_channel = None
        best_contrast = 0
        
        for name, channel in candidates.items():
            contrast = np.std(channel)
            if contrast > best_contrast:
                best_contrast = contrast
                best_channel = channel
        
        gray = best_channel
        
        # Upscale for better OCR
        height, width = gray.shape
        if width < 2800:
            scale = 2800 / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Strong contrast enhancement for purple cards
        clahe = cv2.createCLAHE(clipLimit=6.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Noise reduction
        gray = cv2.bilateralFilter(gray, 5, 50, 50)
        
        # Adaptive thresholding works well for purple cards
        binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8)
        
        # Morphological cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        return Image.fromarray(binary)

    def preprocess_multi_threshold_combo(self, img):
        """Combines multiple thresholding methods for best results"""
        gray = np.array(img.convert('L'))
        
        # Upscale
        height, width = gray.shape
        if width < 2000:
            scale = 2000 / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Enhance contrast
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Try multiple thresholding methods
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        adaptive_gauss = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8)
        adaptive_mean = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 15, 8)
        
        # Combine the best aspects of each
        combined = cv2.bitwise_and(otsu, adaptive_gauss)
        combined = cv2.bitwise_or(combined, adaptive_mean)
        
        return Image.fromarray(combined)

    def preprocess_clean_simple(self, img):
        """Clean, simple preprocessing that focuses on accuracy over complexity"""
        # Convert to grayscale using the best method
        if img.mode == 'RGB':
            img_array = np.array(img)
            # Use the luminance formula for best grayscale conversion
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = np.array(img.convert('L'))
        
        # Simple upscaling for better OCR
        height, width = gray.shape
        target_width = 2400  # Moderate upscaling
        if width < target_width:
            scale = target_width / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Minimal noise reduction (don't over-process)
        gray = cv2.medianBlur(gray, 3)
        
        # Simple contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Simple Otsu thresholding - often the best for clean cards
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(binary)

    def preprocess_high_resolution_clean(self, img):
        """High resolution processing with minimal artifacts"""
        # Convert to grayscale
        if img.mode == 'RGB':
            img_array = np.array(img)
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = np.array(img.convert('L'))
        
        # Aggressive upscaling for high-res OCR
        height, width = gray.shape
        scale = 3000 / width if width < 3000 else 1.5  # Always upscale
        gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Very mild processing to avoid artifacts
        gray = cv2.bilateralFilter(gray, 5, 80, 80)  # Gentle noise reduction
        
        # Adaptive thresholding for varied lighting
        binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 10)
        
        return Image.fromarray(binary)

    def preprocess_smart_contrast_detect(self, img):
        """Smart contrast detection and processing"""
        # Convert to grayscale
        gray = np.array(img.convert('L'))
        
        # Detect if this is a dark card by checking average brightness
        avg_brightness = np.mean(gray)
        is_dark_card = avg_brightness < 128
        
        if is_dark_card:
            # Invert for dark cards
            gray = 255 - gray
        
        # Scale appropriately
        height, width = gray.shape
        target_width = 2000
        if width < target_width:
            scale = target_width / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Enhance contrast conservatively
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Simple thresholding
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(binary)

    def preprocess_clean_adaptive(self, img):
        """Clean adaptive thresholding approach"""
        gray = np.array(img.convert('L'))
        
        # Moderate upscaling
        height, width = gray.shape
        if width < 2200:
            scale = 2200 / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Light denoising
        gray = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)
        
        # Conservative contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Adaptive threshold with larger neighborhood
        binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 8)
        
        return Image.fromarray(binary)

    def preprocess_minimal_processing(self, img):
        """Minimal processing - just upscale and threshold"""
        gray = np.array(img.convert('L'))
        
        # Simple upscaling
        height, width = gray.shape
        if width < 1800:
            scale = 1800 / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Just Otsu thresholding - no other processing
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(binary)

    def preprocess_clean_grayscale(self, img):
        """Clean grayscale processing with careful enhancement"""
        if img.mode == 'RGB':
            img_array = np.array(img)
            # Weighted grayscale conversion for best text contrast
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = np.array(img.convert('L'))
        
        # Upscale for better recognition
        height, width = gray.shape
        if width < 2500:
            scale = 2500 / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Gentle histogram equalization
        gray = cv2.equalizeHist(gray)
        
        # Simple binary conversion
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(binary)

    def preprocess_smart_color_detection(self, img):
        """Smart preprocessing that adapts based on detected card colors"""
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        img_array = np.array(img)
        
        # Detect dominant colors in the image
        pixels = img_array.reshape(-1, 3)
        unique_colors = np.unique(pixels, axis=0)
        
        # Calculate average color
        avg_color = np.mean(pixels, axis=0)
        brightness = np.mean(avg_color)
        
        print(f"Card brightness: {brightness:.1f}, Avg color: {avg_color}")
        
        # Choose processing based on card characteristics
        if brightness < 100:  # Dark card (purple, black, dark blue, etc.)
            print("Detected: Dark card - using light text extraction")
            # Use inverted processing for dark cards
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            gray = 255 - gray  # Invert for better OCR
        elif brightness > 200:  # Light card (white, yellow, light colors)
            print("Detected: Light card - using dark text extraction")
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:  # Medium brightness
            print("Detected: Medium brightness card - using adaptive processing")
            # Use the channel with best contrast
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            gray = hsv[:,:,2]  # Value channel often works well
        
        # Common processing for all card types
        height, width = gray.shape
        target_width = 3800
        if width < target_width:
            scale = target_width / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Adaptive denoising
        gray = cv2.fastNlMeansDenoising(gray, None, h=12, templateWindowSize=7, searchWindowSize=21)
        
        # Multiple contrast enhancement passes
        for i in range(3):
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            gray = clahe.apply(gray)
        
        # Adaptive thresholding
        binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 17, 2)
        
        return Image.fromarray(binary)

    def preprocess_multi_channel_analysis(self, img):
        """Analyzes multiple color channels and combines the best results"""
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        img_array = np.array(img)
        
        # Get all useful channels
        r, g, b = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        
        channels = [
            ('red', r),
            ('green', g), 
            ('blue', b),
            ('gray', gray),
            ('hsv_value', hsv[:,:,2]),
            ('hsv_saturation', hsv[:,:,1])
        ]
        
        processed_channels = []
        
        for name, channel in channels:
            # Process each channel
            height, width = channel.shape
            if width < 3500:
                scale = 3500 / width
                channel = cv2.resize(channel, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
            
            # Enhance contrast
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            channel = clahe.apply(channel)
            
            # Threshold
            _, binary = cv2.threshold(channel, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            processed_channels.append((name, binary))
        
        # Combine the best results
        if processed_channels:
            # Start with the first channel
            combined = processed_channels[0][1]
            
            # Add beneficial parts from other channels
            for name, channel in processed_channels[1:]:
                # Use OR operation to capture text from any channel
                combined = cv2.bitwise_or(combined, channel)
        
        # Final cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
        combined = cv2.morphologyEx(combined, cv2.MORPH_OPEN, kernel)
        
        return Image.fromarray(combined)

    def preprocess_adaptive_contrast_boost(self, img):
        """Adaptive contrast boosting based on image characteristics"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img)
        
        # Analyze image characteristics
        mean_val = np.mean(img_array)
        std_val = np.std(img_array)
        
        print(f"Image stats - Mean: {mean_val:.1f}, Std: {std_val:.1f}")
        
        # Adaptive processing based on image characteristics
        if std_val < 30:  # Low contrast image
            print("Low contrast detected - applying aggressive enhancement")
            # More aggressive processing for low contrast
            clahe = cv2.createCLAHE(clipLimit=8.0, tileGridSize=(4,4))
            img_array = clahe.apply(img_array)
            
            # Histogram stretching
            p1, p99 = np.percentile(img_array, (1, 99))
            img_array = np.clip((img_array - p1) * 255 / (p99 - p1), 0, 255).astype(np.uint8)
        else:
            print("Normal contrast detected - applying standard enhancement")
            # Standard processing for normal contrast
            clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8,8))
            img_array = clahe.apply(img_array)
        
        # Upscaling
        height, width = img_array.shape
        target_width = 3600
        if width < target_width:
            scale = target_width / width
            img_array = cv2.resize(img_array, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Noise reduction
        img_array = cv2.fastNlMeansDenoising(img_array, None, h=10, templateWindowSize=7, searchWindowSize=21)
        
        # Adaptive sharpening
        if std_val < 30:
            # More aggressive sharpening for low contrast
            kernel = np.array([[-1,-1,-1,-1,-1],
                              [-1, 2, 2, 2,-1],
                              [-1, 2,16, 2,-1],
                              [-1, 2, 2, 2,-1],
                              [-1,-1,-1,-1,-1]]) / 12.0
        else:
            # Gentler sharpening for normal contrast
            kernel = np.array([[-1,-1,-1],
                              [-1, 9,-1],
                              [-1,-1,-1]])
        
        img_array = cv2.filter2D(img_array, -1, kernel)
        
        # Adaptive thresholding
        binary = cv2.adaptiveThreshold(img_array, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 2)
        
        return Image.fromarray(binary)

    def preprocess_edge_preserving_enhance(self, img):
        """Edge-preserving enhancement for any card type"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img)
        
        # Upscaling first
        height, width = img_array.shape
        target_width = 3400
        if width < target_width:
            scale = target_width / width
            img_array = cv2.resize(img_array, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Edge-preserving bilateral filtering
        img_array = cv2.bilateralFilter(img_array, 9, 80, 80)
        img_array = cv2.bilateralFilter(img_array, 13, 120, 120)
        
        # Contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=5.0, tileGridSize=(8,8))
        img_array = clahe.apply(img_array)
        
        # Edge enhancement
        laplacian = cv2.Laplacian(img_array, cv2.CV_64F)
        img_array = cv2.convertScaleAbs(img_array - 0.8 * laplacian)
        
        # Multiple thresholding
        _, otsu = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        adaptive = cv2.adaptiveThreshold(img_array, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 2)
        
        # Combine thresholds
        combined = cv2.bitwise_and(otsu, adaptive)
        
        # Morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)
        
        return Image.fromarray(combined)

    def preprocess_high_contrast_threshold(self, img):
        """High contrast processing for difficult cards"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img)
        
        # Extreme scaling
        height, width = img_array.shape
        target_width = 3600
        if width < target_width:
            scale = target_width / width
            new_size = (int(width * scale), int(height * scale))
            img_array = cv2.resize(img_array, new_size, interpolation=cv2.INTER_LANCZOS4)
        
        # Noise reduction
        img_array = cv2.medianBlur(img_array, 3)
        img_array = cv2.fastNlMeansDenoising(img_array, None, 12, 7, 21)
        
        # Extreme contrast stretching
        p1, p99 = np.percentile(img_array, (1, 99))
        img_array = np.clip((img_array - p1) * 255 / (p99 - p1), 0, 255).astype(np.uint8)
        
        # Multiple CLAHE passes
        for i in range(3):
            clahe = cv2.createCLAHE(clipLimit=10.0, tileGridSize=(8,8))
            img_array = clahe.apply(img_array)
        
        # Aggressive sharpening
        kernel = np.array([[-1,-1,-1,-1,-1],
                          [-1, 2, 2, 2,-1],
                          [-1, 2,12, 2,-1],
                          [-1, 2, 2, 2,-1],
                          [-1,-1,-1,-1,-1]]) / 8.0
        img_array = cv2.filter2D(img_array, -1, kernel)
        
        # Try very aggressive thresholding
        # Use a lower threshold to capture more text
        threshold_value = np.mean(img_array) - 20
        _, img_array = cv2.threshold(img_array, threshold_value, 255, cv2.THRESH_BINARY)
        
        # Clean up with morphology
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        img_array = cv2.morphologyEx(img_array, cv2.MORPH_CLOSE, kernel)
        img_array = cv2.morphologyEx(img_array, cv2.MORPH_OPEN, kernel)
        
        return Image.fromarray(img_array)

    def preprocess_advanced_denoise(self, img):
        """Advanced denoising while preserving text edges"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img)
        
        # Resize for better processing
        height, width = img_array.shape
        if width < 2000:
            scale = 2000 / width
            new_size = (int(width * scale), int(height * scale))
            img_array = cv2.resize(img_array, new_size, interpolation=cv2.INTER_LANCZOS4)
        
        # Advanced denoising with edge preservation
        img_array = cv2.fastNlMeansDenoising(img_array, None, h=10, templateWindowSize=7, searchWindowSize=21)
        
        # Multiple bilateral filter passes
        img_array = cv2.bilateralFilter(img_array, 5, 50, 50)
        img_array = cv2.bilateralFilter(img_array, 9, 75, 75)
        
        # Contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        img_array = clahe.apply(img_array)
        
        # Final thresholding
        _, img_array = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(img_array)

    def preprocess_purple_card_specialized(self, img):
        """Specialized preprocessing for purple/dark background business cards"""
        # Convert to numpy array for processing
        if img.mode == 'RGB':
            img_array = np.array(img)
        else:
            img_array = np.array(img.convert('RGB'))
        
        # Extract color channels
        r, g, b = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]
        
        # Purple cards often have good contrast in specific channels
        # Try different channel combinations
        channels = {
            'red': r,
            'green': g,
            'blue': b,
            'avg_rg': (r.astype(np.float32) + g.astype(np.float32)) / 2,
            'avg_rb': (r.astype(np.float32) + b.astype(np.float32)) / 2,
            'avg_gb': (g.astype(np.float32) + b.astype(np.float32)) / 2,
        }
        
        # Find channel with highest contrast
        best_channel = None
        best_contrast = 0
        
        for name, channel in channels.items():
            channel_uint8 = channel.astype(np.uint8)
            contrast = np.std(channel_uint8)
            if contrast > best_contrast:
                best_contrast = contrast
                best_channel = channel_uint8
        
        img_array = best_channel
        
        # Massive upscaling for tiny text
        height, width = img_array.shape
        target_width = 3200  # Very high resolution
        if width < target_width:
            scale = target_width / width
            new_size = (int(width * scale), int(height * scale))
            img_array = cv2.resize(img_array, new_size, interpolation=cv2.INTER_LANCZOS4)
        
        # Step 1: Extreme noise reduction
        img_array = cv2.fastNlMeansDenoising(img_array, None, h=15, templateWindowSize=7, searchWindowSize=21)
        
        # Step 2: Multiple contrast enhancement passes
        for i in range(3):
            clahe = cv2.createCLAHE(clipLimit=5.0, tileGridSize=(8,8))
            img_array = clahe.apply(img_array)
        
        # Step 3: Edge enhancement specifically for text
        kernel_sharpen = np.array([[-1,-1,-1,-1,-1],
                                   [-1, 2, 2, 2,-1],
                                   [-1, 2, 8, 2,-1],
                                   [-1, 2, 2, 2,-1],
                                   [-1,-1,-1,-1,-1]]) / 8.0
        img_array = cv2.filter2D(img_array, -1, kernel_sharpen)
        
        # Step 4: Morphological operations to clean text
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        img_array = cv2.morphologyEx(img_array, cv2.MORPH_CLOSE, kernel)
        
        # Step 5: Try multiple thresholding approaches and combine
        # Otsu thresholding
        _, otsu = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Adaptive thresholding
        adaptive = cv2.adaptiveThreshold(img_array, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 19, 2)
        
        # Mean thresholding
        mean_val = np.mean(img_array)
        _, mean_thresh = cv2.threshold(img_array, mean_val, 255, cv2.THRESH_BINARY)
        
        # Combine all thresholds with weighted average
        combined = cv2.addWeighted(otsu, 0.4, adaptive, 0.4, 0)
        combined = cv2.addWeighted(combined, 0.8, mean_thresh, 0.2, 0)
        
        return Image.fromarray(combined)

    def preprocess_inverted_colors(self, img):
        """Try inverting colors - sometimes white text on dark background works better inverted"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img)
        
        # Invert the image
        img_array = 255 - img_array
        
        # Scale up significantly
        height, width = img_array.shape
        target_width = 2800
        if width < target_width:
            scale = target_width / width
            new_size = (int(width * scale), int(height * scale))
            img_array = cv2.resize(img_array, new_size, interpolation=cv2.INTER_LANCZOS4)
        
        # Apply noise reduction
        img_array = cv2.fastNlMeansDenoising(img_array, None, 12, 7, 21)
        
        # Multiple contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8,8))
        img_array = clahe.apply(img_array)
        
        # Edge enhancement
        laplacian = cv2.Laplacian(img_array, cv2.CV_64F)
        img_array = cv2.convertScaleAbs(img_array - 0.8 * laplacian)
        
        # Final thresholding
        _, img_array = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(img_array)

    def preprocess_perspective_correction(self, img):
        """Advanced perspective correction for skewed cards"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img)
        
        # Find contours to detect card boundaries
        edges = cv2.Canny(img_array, 50, 150, apertureSize=3)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Find the largest rectangular contour
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Approximate contour to polygon
            epsilon = 0.02 * cv2.arcLength(largest_contour, True)
            approx = cv2.approxPolyDP(largest_contour, epsilon, True)
            
            # If we found a quadrilateral, apply perspective correction
            if len(approx) == 4:
                pts = approx.reshape(4, 2).astype(np.float32)
                
                # Order points: top-left, top-right, bottom-right, bottom-left
                rect = self.order_points(pts)
                
                # Calculate width and height
                width = max(np.linalg.norm(rect[0] - rect[1]), np.linalg.norm(rect[2] - rect[3]))
                height = max(np.linalg.norm(rect[0] - rect[3]), np.linalg.norm(rect[1] - rect[2]))
                
                # Define destination points
                dst = np.array([[0, 0], [width, 0], [width, height], [0, height]], dtype=np.float32)
                
                # Apply perspective transformation
                matrix = cv2.getPerspectiveTransform(rect, dst)
                img_array = cv2.warpPerspective(img_array, matrix, (int(width), int(height)))
        
        # Apply standard processing after perspective correction
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        img_array = clahe.apply(img_array)
        
        _, img_array = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(img_array)

    def order_points(self, pts):
        """Order points for perspective correction"""
        rect = np.zeros((4, 2), dtype=np.float32)
        
        # Sum and difference to find corners
        s = pts.sum(axis=1)
        diff = np.diff(pts, axis=1)
        
        rect[0] = pts[np.argmin(s)]      # top-left
        rect[2] = pts[np.argmax(s)]      # bottom-right
        rect[1] = pts[np.argmin(diff)]   # top-right
        rect[3] = pts[np.argmax(diff)]   # bottom-left
        
        return rect

    def preprocess_color_space_analysis(self, img):
        """Analyze color channels and use the best one"""
        if img.mode == 'L':
            # Already grayscale
            img_array = np.array(img)
        else:
            # Convert to different color spaces and analyze
            img_rgb = img.convert('RGB')
            img_array_rgb = np.array(img_rgb)
            
            # Try different color channels
            channels = {
                'red': img_array_rgb[:,:,0],
                'green': img_array_rgb[:,:,1],
                'blue': img_array_rgb[:,:,2],
                'gray': cv2.cvtColor(img_array_rgb, cv2.COLOR_RGB2GRAY),
                'lab_l': cv2.cvtColor(img_array_rgb, cv2.COLOR_RGB2LAB)[:,:,0],
                'hsv_v': cv2.cvtColor(img_array_rgb, cv2.COLOR_RGB2HSV)[:,:,2]
            }
            
            # Calculate contrast for each channel
            best_channel = None
            best_contrast = 0
            
            for name, channel in channels.items():
                contrast = np.std(channel)
                if contrast > best_contrast:
                    best_contrast = contrast
                    best_channel = channel
            
            img_array = best_channel
        
        # Resize for optimal OCR
        height, width = img_array.shape
        if width < 2200:
            scale = 2200 / width
            new_size = (int(width * scale), int(height * scale))
            img_array = cv2.resize(img_array, new_size, interpolation=cv2.INTER_LANCZOS4)
        
        # Advanced processing
        img_array = cv2.bilateralFilter(img_array, 11, 80, 80)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        img_array = clahe.apply(img_array)
        
        # Multiple threshold combination
        _, otsu = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        adaptive = cv2.adaptiveThreshold(img_array, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 17, 4)
        
        # Combine methods
        img_array = cv2.bitwise_and(otsu, adaptive)
        
        return Image.fromarray(img_array)

    def preprocess_multi_scale_pyramid(self, img):
        """Multi-scale processing with pyramid approach"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img)
        
        # Create image pyramid
        pyramid = [img_array]
        for i in range(3):
            img_array = cv2.pyrUp(img_array)
            pyramid.append(img_array)
        
        # Process each level
        processed_levels = []
        for level in pyramid:
            # Apply processing to each level
            processed = cv2.bilateralFilter(level, 9, 75, 75)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            processed = clahe.apply(processed)
            _, processed = cv2.threshold(processed, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            processed_levels.append(processed)
        
        # Use the largest (most detailed) level
        final_img = processed_levels[-1]
        
        return Image.fromarray(final_img)

    def preprocess_edge_enhancement(self, img):
        """Edge enhancement with multiple techniques"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img)
        
        # Resize for processing
        height, width = img_array.shape
        target_width = 2400
        if width < target_width:
            scale = target_width / width
            img_array = cv2.resize(img_array, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LANCZOS4)
        
        # Multiple edge enhancement techniques
        # 1. Laplacian sharpening
        laplacian = cv2.Laplacian(img_array, cv2.CV_64F)
        img_array = cv2.convertScaleAbs(img_array - 0.5 * laplacian)
        
        # 2. Unsharp masking
        gaussian = cv2.GaussianBlur(img_array, (0, 0), 1.5)
        img_array = cv2.addWeighted(img_array, 1.8, gaussian, -0.8, 0)
        
        # 3. High-pass filter
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        img_array = cv2.filter2D(img_array, -1, kernel)
        
        # Apply CLAHE
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        img_array = clahe.apply(img_array)
        
        # Final thresholding
        _, img_array = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(img_array)

    def preprocess_auto_deskew_v2(self, img):
        """Enhanced auto-deskew with better angle detection"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img)
        
        # Multiple methods for angle detection
        angles = []
        
        # Method 1: Hough line detection
        edges = cv2.Canny(img_array, 50, 150, apertureSize=3)
        lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=80)
        
        if lines is not None:
            for rho, theta in lines[:30]:
                angle = theta * 180 / np.pi
                if angle > 90:
                    angle = angle - 180
                elif angle > 45:
                    angle = angle - 90
                angles.append(angle)
        
        # Method 2: Projection profiles
        horizontal_projection = np.sum(img_array < 128, axis=1)
        
        # Find the angle that maximizes text line separation
        test_angles = np.arange(-10, 11, 0.5)
        max_variance = 0
        best_angle = 0
        
        for angle in test_angles:
            if abs(angle) > 0.2:
                center = (img_array.shape[1] // 2, img_array.shape[0] // 2)
                rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
                rotated = cv2.warpAffine(img_array, rotation_matrix, (img_array.shape[1], img_array.shape[0]))
                
                projection = np.sum(rotated < 128, axis=1)
                variance = np.var(projection)
                
                if variance > max_variance:
                    max_variance = variance
                    best_angle = angle
        
        if abs(best_angle) > 0.2:
            angles.append(best_angle)
        
        # Use median angle if we have multiple estimates
        if angles:
            final_angle = np.median(angles)
            if abs(final_angle) > 0.5:
                center = (img_array.shape[1] // 2, img_array.shape[0] // 2)
                rotation_matrix = cv2.getRotationMatrix2D(center, final_angle, 1.0)
                img_array = cv2.warpAffine(img_array, rotation_matrix, (img_array.shape[1], img_array.shape[0]), 
                                         flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
        # Apply enhancement after deskewing
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8,8))
        img_array = clahe.apply(img_array)
        
        _, img_array = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return Image.fromarray(img_array)

    def preprocess_adaptive_bilateral(self, img):
        """Adaptive bilateral filtering with local analysis"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img)
        
        # Analyze image characteristics
        mean_intensity = np.mean(img_array)
        std_intensity = np.std(img_array)
        
        # Adaptive parameters based on image characteristics
        if std_intensity < 30:  # Low contrast
            sigma_color = 100
            sigma_space = 100
        elif std_intensity > 80:  # High contrast
            sigma_color = 50
            sigma_space = 50
        else:  # Medium contrast
            sigma_color = 75
            sigma_space = 75
        
        # Multiple bilateral filter passes
        img_array = cv2.bilateralFilter(img_array, 5, sigma_color//2, sigma_space//2)
        img_array = cv2.bilateralFilter(img_array, 9, sigma_color, sigma_space)
        img_array = cv2.bilateralFilter(img_array, 13, sigma_color*1.5, sigma_space*1.5)
        
        # Adaptive histogram equalization
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        img_array = clahe.apply(img_array)
        
        # Adaptive thresholding
        block_size = 15 if std_intensity < 40 else 19
        C = 3 if mean_intensity > 128 else 5
        
        img_array = cv2.adaptiveThreshold(
            img_array, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block_size, C
        )
        
        return Image.fromarray(img_array)

    def preprocess_contrast_stretching(self, img):
        """Advanced contrast stretching and enhancement"""
        if img.mode != 'L':
            img = img.convert('L')
        
        img_array = np.array(img).astype(np.float32)
        
        # Calculate percentiles for robust contrast stretching
        p1, p99 = np.percentile(img_array, (1, 99))
        
        # Stretch contrast
        img_array = (img_array - p1) / (p99 - p1) * 255
        img_array = np.clip(img_array, 0, 255).astype(np.uint8)
        
        # Gamma correction
        gamma = 1.2 if np.mean(img_array) < 128 else 0.8
        img_array = np.power(img_array / 255.0, gamma) * 255
        img_array = img_array.astype(np.uint8)
        
        # CLAHE with adaptive parameters
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(6,6))
        img_array = clahe.apply(img_array)
        
        # Combined thresholding
        _, otsu = cv2.threshold(img_array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        adaptive = cv2.adaptiveThreshold(img_array, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 17, 2)
        
        # Combine with weighted average
        img_array = cv2.addWeighted(otsu, 0.7, adaptive, 0.3, 0)
        
        return Image.fromarray(img_array)

    def clean_text_cleaning(self, text):
        """Clean text cleaning that preserves real content while removing OCR artifacts"""
        if not text or not text.strip():
            return ""
        
        # Basic cleanup
        lines = text.strip().split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Remove lines that are clearly OCR artifacts (very short with mostly symbols)
            if len(line) < 2 and not any(c.isalnum() for c in line):
                continue
            
            # Remove lines with too many non-alphanumeric characters (be more lenient)
            alnum_ratio = sum(1 for c in line if c.isalnum()) / len(line) if line else 0
            if alnum_ratio < 0.2 and len(line) > 30:  # Only very long lines with very few letters
                continue
            
            # Basic character replacements for common OCR errors
            line = re.sub(r'[|\\]', 'I', line)  # Replace | and \ with I
            line = re.sub(r'[@]', '@', line)  # Keep @ as is
            line = re.sub(r'[()]', lambda m: m.group(), line)  # Keep parentheses
            
            # Remove excessive spaces
            line = ' '.join(line.split())
            
            if line:
                cleaned_lines.append(line)
        
        result = '\n'.join(cleaned_lines)
        
        # Store original for comparison
        print(f"Original text to clean: {repr(text[:200])}")
        print(f"Cleaned text result: {repr(result[:200])}")
        
        return result

    def extreme_text_cleaning(self, text):
        """EXTREME text cleaning with multiple passes for business cards"""
        if not text:
            return ""
        
        print(f"Original text to clean: {repr(text[:200])}")
        
        # Pass 1: Basic cleanup
        cleaned = text.strip()
        
        # Pass 2: Remove obvious garbage - if most of the text is artifacts, discard
        total_chars = len(cleaned.replace(' ', '').replace('\n', ''))
        if total_chars > 0:
            alpha_chars = sum(1 for c in cleaned if c.isalpha())
            # Much more aggressive filtering for this type of card
            if alpha_chars / total_chars < 0.15 or alpha_chars < 10:  # Very low threshold
                print("Text mostly artifacts, returning empty")
                return ""
        
        # Pass 3: Line-by-line filtering
        lines = cleaned.split('\n')
        good_lines = []
        
        for line in lines:
            line = line.strip()
            if len(line) < 2:
                continue
                
            # Skip lines that are mostly repeating characters or symbols
            if len(set(line)) < 4 and len(line) > 6:
                continue
            
            # Skip lines with too many special characters (likely artifacts)
            special_count = sum(1 for c in line if not c.isalnum() and c not in ' @.-+/():,&\'')
            if special_count > len(line) * 0.4:
                continue
                
            # Calculate character composition
            total_chars = len(line)
            alpha_chars = sum(1 for c in line if c.isalpha())
            digit_chars = sum(1 for c in line if c.isdigit())
            space_chars = sum(1 for c in line if c.isspace())
            valid_special = sum(1 for c in line if c in '@.-+/():,&\'')
            
            valid_chars = alpha_chars + digit_chars + space_chars + valid_special
            valid_ratio = valid_chars / total_chars
            
            # Adaptive filtering for any business card
            if valid_ratio >= 0.70 and alpha_chars >= 3:
                # Check for common business card terms (universal)
                line_lower = line.lower()
                business_terms = [
                    # Company terms
                    'ltd', 'limited', 'inc', 'corp', 'llc', 'pvt', 'bank', 'finance', 'company', 'group',
                    # Contact terms  
                    'mobile', 'phone', 'tel', 'email', 'mail', 'www', 'http', 'website',
                    # Location terms
                    'street', 'road', 'avenue', 'city', 'state', 'country', 'zip', 'pin',
                    # Job titles
                    'manager', 'director', 'ceo', 'president', 'executive', 'officer', 'head',
                    # Common words
                    'and', 'the', 'of', 'for', 'in', 'at', 'on', 'with'
                ]
                has_business_term = any(term in line_lower for term in business_terms)
                
                # Keep lines with business terms, good structure, or potential contact info
                contains_at = '@' in line  # Email
                contains_digits = any(c.isdigit() for c in line)  # Phone/address
                
                if (has_business_term or 
                    contains_at or 
                    (alpha_chars >= 5 and valid_ratio >= 0.8) or
                    (contains_digits and alpha_chars >= 3)):
                    good_lines.append(line)
        
        # Pass 4: Fix common OCR errors specifically for business cards
        cleaned_lines = []
        for line in good_lines:
            # Fix common character substitutions
            fixes = {
                'a@': '@', '@a': '@', 'aa': '@',  # Email fixes
                '0O': 'O', 'O0': 'O',
                '5S': 'S', 'S5': 'S',
                '1I': 'I', 'I1': 'I', '|I': 'I', 'I|': 'I',
                '8B': 'B', 'B8': 'B',
                '6G': 'G', 'G6': 'G',
                '][': 'II', '}{': 'II', '()': 'O',
                # Common business card specific fixes
                'LTD': 'LIMITED', 'ltd': 'LIMITED',
                'Pvt': 'PRIVATE', 'pvt': 'PRIVATE',
                'Mob': 'Mobile', 'MOB': 'Mobile',
                'Ph': 'Phone', 'PH': 'Phone',
                'www.': 'www.', 'WWW.': 'www.',
            }
            
            fixed_line = line
            for wrong, correct in fixes.items():
                fixed_line = fixed_line.replace(wrong, correct)
            
            # Remove excessive spaces and clean up
            fixed_line = ' '.join(fixed_line.split())
            
            # Only keep meaningful lines
            if len(fixed_line) >= 3 and any(c.isalpha() for c in fixed_line):
                cleaned_lines.append(fixed_line)
        
        result = '\n'.join(cleaned_lines)
        print(f"Cleaned text result: {repr(result[:200])}")
        return result

    def calculate_clean_confidence(self, text):
        """Calculate confidence based on business card content quality"""
        if not text or not text.strip():
            return 0
        
        confidence = 0
        text_lower = text.lower()
        
        # Check for business card elements (higher value for real content)
        business_indicators = [
            # Names and proper nouns
            r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b',  # Proper names
            r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b',  # Three-word names
            # Contact info
            r'\b\d{5}\s+\d{5}\b',  # Phone patterns like "99166 97005"
            r'\b\d{3,4}[-\s]?\d{3,4}[-\s]?\d{3,5}\b',  # Standard phone numbers
            r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',  # Emails
            r'\bwww\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',  # Websites
            r'\b[a-zA-Z0-9.-]+\.(com|in|org|net|co)\b',  # Domain names
            # Business terms
            r'\b(store|shop|center|centre|layout|main|sector)\b',  # Location terms
            r'\b(printing|digital|offset|format|imaging)\b',  # Business services
            r'\b(pvt|ltd|limited|company|corp|inc)\b',  # Company suffixes
            # Address components
            r'\b(bangalore|bengaluru|mumbai|delhi|hyderabad|chennai)\b',  # Indian cities
            r'\b(karnataka|maharashtra|gujarat|tamil nadu)\b',  # Indian states
            r'\b(street|road|avenue|lane|drive|building|floor|suite|apt|apartment|layout|nagar|colony|sector)\b',
            r'\b\d+\s+(street|road|avenue|lane|drive|st|rd|ave|main)\b',
            r'\b[a-zA-Z]+,\s*[A-Z][a-z]+\s*-\s*\d{6}\b',  # Indian address format
            r'\b\d{6}\b',  # PIN codes
        ]
        
        # Count matches (each real business element adds significant value)
        for pattern in business_indicators:
            matches = len(re.findall(pattern, text, re.IGNORECASE))
            confidence += matches * 3  # Higher weight for real content
        
        # Penalty for obvious OCR artifacts
        artifact_patterns = [
            r'[^\w\s@.()-]',  # Unusual characters
            r'\b[a-zA-Z]{1,2}\b',  # Too many single/double character "words"
        ]
        
        for pattern in artifact_patterns:
            matches = len(re.findall(pattern, text))
            confidence -= matches * 0.5  # Small penalty
        
        # Bonus for reasonable line structure
        lines = text.strip().split('\n')
        clean_lines = [line.strip() for line in lines if line.strip()]
        
        if 2 <= len(clean_lines) <= 8:  # Reasonable number of lines for business card
            confidence += 2
        
        # Bonus for reasonable character composition
        if text:
            alnum_ratio = sum(1 for c in text if c.isalnum()) / len(text)
            if 0.5 <= alnum_ratio <= 0.9:  # Good mix of alphanumeric characters
                confidence += 3
        
        return max(0, confidence)

    def calculate_ultra_confidence(self, text):
        """Ultra-sophisticated confidence calculation"""
        if not text or len(text.strip()) < 3:
            return 0
            
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if not lines:
            return 0
            
        # Ultra-enhanced pattern detection
        confidence = 0
        
        # 1. Business card specific patterns
        email_pattern = r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b'
        phone_pattern = r'(?:\+91\s?)?(?:\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})'
        website_pattern = r'(?:https?://)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        name_pattern = r'\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*\b'
        
        email_count = len(re.findall(email_pattern, text))
        phone_count = len(re.findall(phone_pattern, text))
        website_count = len(re.findall(website_pattern, text))
        name_count = len(re.findall(name_pattern, text))
        
        # Weight patterns heavily
        confidence += email_count * 20      # Email is most important
        confidence += phone_count * 15      # Phone is very important
        confidence += website_count * 12    # Website is important
        confidence += name_count * 10       # Names are important
        
        # 2. Text quality analysis
        total_chars = len(text.replace(' ', '').replace('\n', ''))
        if total_chars > 0:
            alpha_chars = sum(1 for c in text if c.isalpha())
            digit_chars = sum(1 for c in text if c.isdigit())
            
            alpha_ratio = alpha_chars / total_chars
            digit_ratio = digit_chars / total_chars
            
            # Good alpha ratio
            if alpha_ratio > 0.7:
                confidence += 15
            elif alpha_ratio > 0.5:
                confidence += 10
            
            # Reasonable digit ratio
            if 0.05 <= digit_ratio <= 0.3:
                confidence += 10
        
        # 3. Line structure analysis
        meaningful_lines = len([line for line in lines if len(line) > 3])
        confidence += min(meaningful_lines * 3, 15)
        
        # 4. Business indicators (especially for this AU Bank card)
        business_keywords = [
            'limited', 'ltd', 'llc', 'inc', 'corp', 'pvt', 'bank', 'finance', 'small finance',
            'manager', 'director', 'executive', 'ceo', 'founder', 'head',
            'bangalore', 'mumbai', 'delhi', 'india', 'karnataka', 'sector',
            'arcade', 'cross', 'hsr', 'layout', 'commercial', 'scheduled',
            'mobile', 'phone', 'email', 'website', 'www', 'http',
            # Specific to this card
            'au', 'sandeep', '560102', '8306366651', 'aubank'
        ]
        
        business_score = sum(5 for keyword in business_keywords if keyword in text.lower())
        confidence += min(business_score, 30)
        
        # 5. Penalty for artifacts
        artifact_patterns = [
            r'[A-Z]{10,}',  # Too many consecutive capitals
            r'[^a-zA-Z0-9\s@.-]{5,}',  # Too many special chars
            r'(.)\1{4,}',  # Repeated characters
        ]
        
        artifact_count = sum(len(re.findall(pattern, text)) for pattern in artifact_patterns)
        confidence -= artifact_count * 5
        
        return max(0, confidence)

    def last_resort_ocr(self, img, current_best):
        """Last resort methods when everything else fails"""
        print("Applying last resort methods...")
        
        try:
            # Method 1: Extreme scaling
            for scale in [4.0, 5.0, 0.5]:
                scaled = self.apply_scaling(img, scale)
                simple_processed = self.preprocess_simple_threshold(scaled)
                text = pytesseract.image_to_string(simple_processed, config='--psm 6')
                cleaned = self.extreme_text_cleaning(text)
                confidence = self.calculate_ultra_confidence(cleaned)
                
                if confidence > 15:
                    return cleaned
            
            # Method 2: Try with inverted image
            img_array = np.array(img.convert('L'))
            inverted = 255 - img_array
            inverted_img = Image.fromarray(inverted)
            processed = self.preprocess_extreme_enhanced(inverted_img)
            text = pytesseract.image_to_string(processed, config='--psm 6')
            cleaned = self.extreme_text_cleaning(text)
            confidence = self.calculate_ultra_confidence(cleaned)
            
            if confidence > 10:
                return cleaned
            
            # Method 3: Raw OCR with minimal processing
            raw_text = pytesseract.image_to_string(img, config='--psm 3')
            raw_cleaned = self.extreme_text_cleaning(raw_text)
            
            # Return the best of current best or raw
            if self.calculate_ultra_confidence(raw_cleaned) > self.calculate_ultra_confidence(current_best):
                return raw_cleaned
            
        except Exception as e:
            print(f"Last resort methods failed: {str(e)}")
        
        return current_best if current_best else "Unable to extract text from image"

    @action(detail=False, methods=['POST'])
    def scan_card(self, request):
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get the uploaded file
            image_file = request.FILES['image']
            
            # Create a copy of the file in memory to use for processing
            from io import BytesIO
            img_data = image_file.read()
            
            # Create a BytesIO object for the image
            img_bytes = BytesIO(img_data)
            img = Image.open(img_bytes)
            
            import time
            start_time = time.time()
            print("🚀 Starting Fast OCR text extraction...")
            
            # Try Fast OCR first if available
            if FAST_OCR_AVAILABLE and fast_ocr_engine:
                try:
                    print("⚡ Using Fast OCR engine...")
                    # Use fast extraction
                    ocr_result = fast_ocr_engine.extract_text_fast(img)
                    text = ocr_result.get('text', '')
                    confidence = ocr_result.get('confidence', 0)
                    method = ocr_result.get('method', 'unknown')
                    
                    print(f"🎯 Fast OCR Result: {method} (confidence: {confidence:.1f})")
                    print(f"📝 Extracted text: {text}")
                    print(f"📝 Text lines: {text.split(chr(10)) if text else 'No text'}")
                    
                    # If fast OCR has good confidence, use it
                    if confidence > 25 and text.strip():
                        print("✅ Using Fast OCR result")
                        # Parse with fast parser
                        info = fast_business_card_parser.parse_business_card_fast(text)
                    else:
                        print("⚠️ Fast OCR confidence low, falling back to traditional OCR")
                        # Fallback to traditional OCR
                        text = self.extract_text_with_multiple_configs(img)
                        info = self.extract_info(text)
                        
                except Exception as e:
                    print(f"❌ Fast OCR failed: {e}")
                    # Fallback to traditional OCR
                    text = self.extract_text_with_multiple_configs(img)
                    info = self.extract_info(text)
            else:
                print("📝 Using traditional OCR (Fast OCR not available)")
                # Use traditional OCR
                text = self.extract_text_with_multiple_configs(img)
                info = self.extract_info(text)
            
            ocr_time = time.time() - start_time
            print(f"⏱️ OCR completed in {ocr_time:.2f} seconds")
            
            # Clean up the extracted text
            text = '\n'.join([line.strip() for line in text.split('\n') if line.strip()])
            print(f"📄 Final extracted text: {text}")
            print(f"🔍 Extracted info: {info}")
            
            # Also check for QR code (but don't prioritize it over business card data)
            qr_data = self.process_qr_code(img)
            
            # Create a new BusinessCard instance with extracted data
            # Prepare notes - keep it simple
            notes_list = []
            if qr_data:
                notes_list.append(f"QR Code: {qr_data[0]}")
            if info.get('notes') and isinstance(info.get('notes'), list):
                # Only add first few meaningful notes to avoid clutter
                meaningful_notes = [note for note in info.get('notes')[:3] if note and len(note.strip()) > 5]
                notes_list.extend(meaningful_notes)
            
            business_card = BusinessCard(
                name=info.get('name') or 'Unknown',
                email=info.get('email'),
                mobile=info.get('mobile'),
                company=info.get('company'),
                job_title=info.get('job_title'),
                website=info.get('website'),
                address=info.get('address'),
                notes=' | '.join(notes_list) if notes_list else None
            )
            
            # Save the business card first to get an ID
            business_card.save()
            
            # Temporarily save the image file for processing
            img_bytes.seek(0)  # Reset file pointer
            business_card.image.save(
                f"business_card_{business_card.id}.{image_file.name.split('.')[-1]}",
                img_bytes,
                save=True
            )
            
            # Get the file path before deletion
            image_path = business_card.image.path if business_card.image else None
            
            # Update the business card with the final data
            business_card.save()
            
            serializer = self.get_serializer(business_card, context={'request': request})
            
            # Delete the image file after processing (keep only the extracted data)
            if image_path:
                try:
                    import os
                    if os.path.exists(image_path):
                        os.remove(image_path)
                        print(f"🗑️ Deleted image file: {image_path}")
                    
                    # Clear the image field in the database
                    business_card.image = None
                    business_card.save()
                    
                except Exception as e:
                    print(f"⚠️ Warning: Could not delete image file {image_path}: {str(e)}")
            
            # Update serializer data to reflect that image was removed
            serializer = self.get_serializer(business_card, context={'request': request})
            
            response_data = {
                'type': 'business_card',
                'data': serializer.data,
                'message': 'Business card processed and saved successfully',
                'extracted_info': info
            }
            
            # Add QR code info if present
            if qr_data:
                response_data['qr_code_data'] = qr_data
                response_data['message'] += ' (QR code also detected)'
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"❌ Error processing image: {error_trace}")
            return Response({
                'error': str(e),
                'traceback': error_trace,
                'message': 'Error processing the image'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['POST'])
    def scan_qr(self, request):
        """Smart scanner: Try QR code first, fallback to business card OCR"""
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get the uploaded file
            image_file = request.FILES['image']
            
            # Create a copy of the file in memory to use for processing
            from io import BytesIO
            img_data = image_file.read()
            
            # Create a BytesIO object for the image
            img_bytes = BytesIO(img_data)
            img = Image.open(img_bytes)
            
            # First, try to process QR code
            print("Starting QR code detection...")
            qr_data = self.process_qr_code(img)
            
            if qr_data:
                # QR code found - process as QR code ONLY
                print(f"QR Code detected: {qr_data[0]}")
                
                # Parse QR code data to extract business card information
                qr_text = qr_data[0]  # Get the first QR code
                info = self.parse_qr_business_card(qr_text)
                
                # If no structured data found, treat the QR content as notes
                if not any(info.values()):
                    info = {
                        'name': 'QR Code Data',
                        'notes': qr_text
                    }
                
                # Ensure we have at least a name
                if not info.get('name'):
                    info['name'] = 'QR Code Data'
                
                # If it's a web URL, ensure it's properly formatted
                if info.get('website') and not info['website'].startswith(('http://', 'https://')):
                    if info['website'].startswith('www.') or '.' in info['website']:
                        info['website'] = f"https://{info['website']}"
                
                print(f"Parsed QR info: {info}")
                
                # Create a new BusinessCard instance with extracted data
                business_card = BusinessCard(
                    name=info.get('name') or 'QR Code Data',
                    email=info.get('email'),
                    mobile=info.get('mobile'),
                    company=info.get('company'),
                    job_title=info.get('job_title'),
                    website=info.get('website'),
                    address=info.get('address'),
                    notes=info.get('notes'),
                    type='qr_business_card'
                )
                
                # Save the business card first to get an ID
                business_card.save()
                
                # Temporarily save the image file for processing
                img_bytes.seek(0)  # Reset file pointer
                business_card.image.save(
                    f"qr_business_card_{business_card.id}.{image_file.name.split('.')[-1]}",
                    img_bytes,
                    save=True
                )
                
                # Get the file path before deletion
                image_path = business_card.image.path if business_card.image else None
                
                # Update the business card with the final data
                business_card.save()
                
                serializer = self.get_serializer(business_card, context={'request': request})
                
                # Delete the image file after processing (keep only the extracted data)
                if image_path:
                    try:
                        import os
                        if os.path.exists(image_path):
                            os.remove(image_path)
                            print(f"Deleted QR image file: {image_path}")
                        
                        # Clear the image field in the database
                        business_card.image = None
                        business_card.save()
                        
                    except Exception as e:
                        print(f"Warning: Could not delete QR image file {image_path}: {str(e)}")
                
                # Update serializer data to reflect that image was removed
                serializer = self.get_serializer(business_card, context={'request': request})
                
                response_data = {
                    'type': 'qr_business_card',
                    'data': serializer.data,
                    'message': 'QR code processed and saved successfully',
                    'qr_code_data': qr_data,
                    'extracted_info': info,
                    'is_web_link': bool(info.get('website'))
                }
                
                return Response(response_data, status=status.HTTP_201_CREATED)
            
            else:
                # No QR code found - reject the image
                return Response({
                    'error': 'No QR code found in the image',
                    'message': 'This scanner only accepts QR codes. Please ensure the QR code is clearly visible and try again.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error processing image: {error_trace}")
            return Response({
                'error': str(e),
                'traceback': error_trace,
                'message': 'Error processing the image'
            }, status=status.HTTP_400_BAD_REQUEST)

    def parse_qr_business_card(self, qr_text):
        """Parse QR code text to extract business card information"""
        info = {
            'name': None,
            'email': None,
            'mobile': None,
            'company': None,
            'job_title': None,
            'website': None,
            'address': None,
            'notes': None
        }
        
        try:
            # Check if it's a web URL
            if self.is_web_url(qr_text):
                return {
                    'name': 'Web Link',
                    'website': qr_text,
                    'notes': f'QR Code Link: {qr_text}'
                }
            
            # Check if it's a vCard format (BEGIN:VCARD)
            elif qr_text.upper().startswith('BEGIN:VCARD'):
                return self.parse_vcard(qr_text)
            
            # Check if it's a MECARD format
            elif qr_text.upper().startswith('MECARD:'):
                return self.parse_mecard(qr_text)
            
            # Check if it's structured data (JSON-like or key-value pairs)
            elif any(delimiter in qr_text for delimiter in [':', '=', '\n', ';']):
                return self.parse_structured_qr(qr_text)
            
            # If it's just plain text, try to extract information using regex
            else:
                return self.extract_info_from_plain_text(qr_text)
                
        except Exception as e:
            print(f"Error parsing QR code: {str(e)}")
            # If parsing fails, return the raw text as notes
            return {'notes': qr_text}
    
    def is_web_url(self, text):
        """Check if the text is a web URL"""
        import re
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        # Also check for common URL patterns without protocol
        if not url_pattern.match(text):
            # Check for www.domain.com or domain.com patterns
            domain_pattern = re.compile(
                r'^(?:www\.)?'  # optional www.
                r'(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}'  # domain
                r'(?:/\S*)?$', re.IGNORECASE)  # optional path
            
            if domain_pattern.match(text):
                return True
        
        return bool(url_pattern.match(text))
    
    def parse_vcard(self, vcard_text):
        """Parse vCard format QR code"""
        info = {}
        lines = vcard_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.upper()
                
                if key == 'FN' or key == 'N':
                    info['name'] = value
                elif key.startswith('EMAIL'):
                    info['email'] = value
                elif key.startswith('TEL'):
                    info['mobile'] = value
                elif key == 'ORG':
                    info['company'] = value
                elif key == 'TITLE':
                    info['job_title'] = value
                elif key == 'URL':
                    info['website'] = value
                elif key.startswith('ADR'):
                    info['address'] = value.replace(';', ', ')
        
        return info
    
    def parse_mecard(self, mecard_text):
        """Parse MECARD format QR code"""
        info = {}
        # Remove MECARD: prefix
        data = mecard_text[7:] if mecard_text.upper().startswith('MECARD:') else mecard_text
        
        # Split by semicolon
        parts = data.split(';')
        
        for part in parts:
            if ':' in part:
                key, value = part.split(':', 1)
                key = key.upper()
                
                if key == 'N':
                    info['name'] = value
                elif key == 'EMAIL':
                    info['email'] = value
                elif key == 'TEL':
                    info['mobile'] = value
                elif key == 'ORG':
                    info['company'] = value
                elif key == 'TITLE':
                    info['job_title'] = value
                elif key == 'URL':
                    info['website'] = value
                elif key == 'ADR':
                    info['address'] = value
        
        return info
    
    def parse_structured_qr(self, qr_text):
        """Parse structured QR code data (key-value pairs)"""
        info = {}
        
        # Try different delimiters
        lines = []
        if '\n' in qr_text:
            lines = qr_text.split('\n')
        elif ';' in qr_text:
            lines = qr_text.split(';')
        else:
            lines = [qr_text]
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Try different separators
            for separator in [':', '=']:
                if separator in line:
                    key, value = line.split(separator, 1)
                    key = key.strip().lower()
                    value = value.strip()
                    
                    if any(name_key in key for name_key in ['name', 'full', 'fn']):
                        info['name'] = value
                    elif 'email' in key or 'mail' in key:
                        info['email'] = value
                    elif any(phone_key in key for phone_key in ['phone', 'tel', 'mobile', 'cell']):
                        info['mobile'] = value
                    elif any(company_key in key for company_key in ['company', 'org', 'organization']):
                        info['company'] = value
                    elif any(title_key in key for title_key in ['title', 'job', 'position']):
                        info['job_title'] = value
                    elif any(web_key in key for web_key in ['website', 'url', 'web']):
                        info['website'] = value
                    elif any(addr_key in key for addr_key in ['address', 'addr', 'location']):
                        info['address'] = value
                    break
        
        return info
    
    def extract_info_from_plain_text(self, text):
        """Extract information from plain text using regex patterns"""
        info = {}
        
        # Use the same extraction logic as the main extract_info method
        extracted = self.extract_info(text)
        
        # Map the extracted info to our format
        info['name'] = extracted.get('name')
        info['email'] = extracted.get('email')
        info['mobile'] = extracted.get('mobile')
        info['company'] = extracted.get('company')
        info['job_title'] = extracted.get('job_title')
        info['website'] = extracted.get('website')
        info['address'] = extracted.get('address')
        
        # If we couldn't extract much, store as notes
        if not any([info['name'], info['email'], info['mobile']]):
            info['notes'] = text
        
        return info


class EmailConfigViewSet(viewsets.ModelViewSet):
    queryset = EmailConfig.objects.all()
    serializer_class = EmailConfigSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Get the email configuration (there should only be one)"""
        try:
            config = EmailConfig.objects.first()
            if config:
                serializer = self.get_serializer(config)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'No email configuration found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def create(self, request, *args, **kwargs):
        """Create or update email configuration (singleton pattern)"""
        try:
            # Check if configuration already exists
            existing_config = EmailConfig.objects.first()
            
            if existing_config:
                # Update existing configuration
                serializer = self.get_serializer(existing_config, data=request.data, partial=False)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # Create new configuration
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """Update email configuration"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=False)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def partial_update(self, request, *args, **kwargs):
        """Partially update email configuration"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['POST'])
    def test(self, request, pk=None):
        """Test email configuration by sending a test email"""
        try:
            config = self.get_object()
            
            if not config.is_enabled:
                return Response(
                    {'success': False, 'message': 'Email configuration is disabled'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Test email sending
            success, message = self.send_test_email(config)
            
            return Response({
                'success': success,
                'message': message
            }, status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'success': False, 'message': f'Test failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def send_test_email(self, config):
        """
        Send a test email using the provided configuration
        
        Args:
            config: EmailConfig instance
            
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = config.sender_email
            msg['To'] = config.recipient_email
            msg['Subject'] = f"Test - {config.email_subject}"
            
            # Email body
            body = f"""
This is a test email from your Business Card Scanner app.

Configuration Details:
- SMTP Host: {config.smtp_host}
- SMTP Port: {config.smtp_port}
- Sender: {config.sender_email}
- Recipient: {config.recipient_email}

Template Message:
{config.email_template}

If you received this email, your automated email configuration is working correctly!

---
Business Card Scanner App
            """.strip()
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Create SMTP session
            server = smtplib.SMTP(config.smtp_host, int(config.smtp_port))
            server.starttls()  # Enable security
            server.login(config.sender_email, config.sender_password)
            
            # Send email
            text = msg.as_string()
            server.sendmail(config.sender_email, config.recipient_email, text)
            server.quit()
            
            return True, "Test email sent successfully!"
            
        except smtplib.SMTPAuthenticationError:
            return False, "Authentication failed. Please check your email and password."
        except smtplib.SMTPRecipientsRefused:
            return False, "Recipient email address was refused by the server."
        except smtplib.SMTPServerDisconnected:
            return False, "Connection to SMTP server was lost."
        except smtplib.SMTPConnectError:
            return False, f"Could not connect to SMTP server {config.smtp_host}:{config.smtp_port}"
        except Exception as e:
            return False, f"Email sending failed: {str(e)}"