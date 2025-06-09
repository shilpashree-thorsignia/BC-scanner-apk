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
        deleted_count = BusinessCard.objects.filter(is_deleted=True).count()
        BusinessCard.objects.filter(is_deleted=True).delete()
        
        return Response({
            'message': f'Permanently deleted {deleted_count} business cards from trash'
        }, status=status.HTTP_200_OK)

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
        
        # Enhanced regex patterns
        patterns = {
            'email': r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',
            'phone': r'(?:\+91\s?)?(?:\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4})',
            'website': r'(?i)(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/\S*)?',
            'social_media': r'(?i)(?:linkedin\.com\/in\/|twitter\.com\/|facebook\.com\/|instagram\.com\/|github\.com\/)[\w.-]+',
            'name': r'^[A-Z][a-z]+(?:\s+[A-Z][a-z\']+){1,3}$',
            'address': r'(?i)(?:\d+[\/\-,\s]*)?[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|place|pl|nagar|colony|sector|block)',
        }
        
        processed_lines = []
        
        # First pass: Extract structured data
        for line in lines:
            original_line = line
            line_processed = False
            
            # Extract email
            email_matches = re.findall(patterns['email'], line)
            if email_matches and not result['email']:
                result['email'] = email_matches[0].lower()
                line = re.sub(patterns['email'], '', line).strip()
                line_processed = True
            
            # Extract all phone numbers (improved for Indian numbers)
            phone_matches = re.findall(patterns['phone'], line)
            if phone_matches:
                for phone in phone_matches:
                    # Clean and validate phone
                    clean_phone = re.sub(r'[^\d+]', '', phone)
                    if len(clean_phone) >= 10:
                        formatted_phone = phone.strip()
                        if not result['mobile']:
                            result['mobile'] = formatted_phone
                        else:
                            result['additional_phones'].append(formatted_phone)
                    line = line.replace(phone, '').strip()
                line_processed = True
            
            # Extract website
            website_matches = re.findall(patterns['website'], line)
            if website_matches and not result['website']:
                website = website_matches[0]
                if not website.startswith('http'):
                    website = 'https://' + website
                result['website'] = website
                line = re.sub(patterns['website'], '', line).strip()
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
        for i, line in enumerate(remaining_lines):
            # Clean the line first
            clean_line = ' '.join(line.split())
            words = clean_line.split()
            
            # Skip lines that are clearly not names
            if (len(clean_line) < 3 or len(clean_line) > 80 or
                '@' in clean_line or 'http' in clean_line.lower() or
                clean_line.lower().startswith(('www', 'email', 'phone', 'tel', 'mobile'))):
                continue
            
            # Check for proper name patterns with OCR tolerance
            name_score = 0
            
            # Basic name structure (1-4 words)
            if 1 <= len(words) <= 4:
                name_score += 2
            
            # Prefer 2-3 word names (first + last, or first + middle + last)
            if 2 <= len(words) <= 3:
                name_score += 3
            
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
            
            # Check for common name patterns
            if re.match(r'^[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}', clean_line):
                name_score += 4
            
            # Position bonus (names are often at the top)
            if i <= 2:  # First 3 lines
                name_score += 2
            
            # Add to candidates if score is reasonable
            if name_score >= 5:
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
        
        # Extract address (improved for Indian addresses)
        address_lines = []
        for i in reversed(range(len(remaining_lines))):
            line = remaining_lines[i]
            if (re.search(patterns['address'], line, re.IGNORECASE) or
                any(indicator in line.lower() for indicator in 
                    ['city', 'state', 'zip', 'postal', 'pin', 'bangalore', 'bengaluru', 
                     'nagar', 'colony', 'sector', 'block', 'road', 'street'])):
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
        """Advanced OCR with enhanced preprocessing and character recognition"""
        
        # Balanced preprocessing strategies - keep what works, add targeted improvements
        preprocessing_methods = [
            ('simple_threshold', self.preprocess_simple_threshold),
            ('adaptive_threshold', self.preprocess_image),
            ('otsu_threshold', self.preprocess_otsu),
            ('minimal_processing', self.preprocess_minimal)
        ]
        
        # OCR configurations - start with basic, add enhancements
        ocr_configs = [
            ('psm6_basic', r'--oem 3 --psm 6'),
            ('psm4_basic', r'--oem 3 --psm 4'),
            ('psm3_basic', r'--oem 3 --psm 3'),
            ('psm6_enhanced', r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.-+/: '),
            ('psm4_enhanced', r'--oem 3 --psm 4 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.-+/: ')
        ]
        
        best_results = []
        
        # Test all combinations and collect results
        for method_name, preprocess_func in preprocessing_methods:
            try:
                processed_img = preprocess_func(img.copy())
                
                # Save processed image for debugging
                #processed_img.save(f'debug_{method_name}.png')
                
                for config_name, config in ocr_configs:
                    try:
                        current_text = pytesseract.image_to_string(processed_img, config=config)
                        
                        # Calculate enhanced confidence score
                        confidence = self.calculate_enhanced_confidence(current_text)
                        
                        # Also calculate basic confidence for comparison
                        basic_confidence = self.calculate_text_confidence(current_text)
                        
                        # Use the higher of the two confidence scores
                        confidence = max(confidence, basic_confidence)
                        
                        print(f"Method: {method_name}, Config: {config_name}")
                        print(f"Text: {repr(current_text[:100])}")
                        print(f"Confidence: {confidence}")
                        print("---")
                        
                        best_results.append({
                            'text': current_text,
                            'confidence': confidence,
                            'method': f"{method_name}_{config_name}",
                            'preprocessing': method_name,
                            'ocr_config': config_name
                        })
                        
                        # Early exit for good results
                        if confidence >= 15:
                            print(f"Good result found with {method_name}_{config_name}")
                            return current_text
                            
                    except Exception as e:
                        print(f"OCR failed for {method_name}_{config_name}: {str(e)}")
                        continue
                        
            except Exception as e:
                print(f"Preprocessing failed for {method_name}: {str(e)}")
                continue
        
        # Sort results by confidence and return the best
        if best_results:
            best_results.sort(key=lambda x: x['confidence'], reverse=True)
            best_result = best_results[0]
            print(f"Best method: {best_result['method']}, Final confidence: {best_result['confidence']}")
            return best_result['text']
        
        # Fallback to basic OCR if all methods fail
        print("All methods failed, trying basic OCR")
        try:
            return pytesseract.image_to_string(img, config='--psm 6')
        except:
            return pytesseract.image_to_string(img)
    
    def calculate_text_confidence(self, text):
        """Calculate confidence score for extracted text"""
        if not text or len(text.strip()) < 5:
            return 0
            
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        meaningful_lines = len([line for line in lines if len(line) > 2])
        
        # Check for specific patterns
        has_email = bool(re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text))
        has_phone = bool(re.search(r'\+?[\d\s\-\(\)]{10,}', text))
        has_website = bool(re.search(r'[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text))
        has_name_pattern = bool(re.search(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', text))
        
        # Check text quality (ratio of alphabetic characters)
        total_chars = len(text.replace(' ', '').replace('\n', ''))
        alpha_chars = sum(1 for c in text if c.isalpha())
        alpha_ratio = alpha_chars / max(total_chars, 1)
        
        # Calculate confidence
        confidence = (
            meaningful_lines * 1 +
            has_email * 8 +
            has_phone * 5 +
            has_website * 3 +
            has_name_pattern * 4 +
            alpha_ratio * 10
        )
        
        return confidence
    
    def calculate_enhanced_confidence(self, text):
        """Enhanced confidence calculation with better business card recognition"""
        if not text or len(text.strip()) < 3:
            return 0
            
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        meaningful_lines = len([line for line in lines if len(line) > 2])
        
        # Enhanced pattern matching
        email_pattern = r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b'
        phone_pattern = r'(?:\+91\s?)?(?:\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})'
        website_pattern = r'(?:https?://)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        name_pattern = r'\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*\b'
        
        # Count valid patterns
        email_matches = len(re.findall(email_pattern, text))
        phone_matches = len(re.findall(phone_pattern, text))
        website_matches = len(re.findall(website_pattern, text))
        name_matches = len(re.findall(name_pattern, text))
        
        # Job title indicators
        job_indicators = [
            'manager', 'director', 'executive', 'officer', 'head', 'lead', 'senior', 'junior',
            'ceo', 'cto', 'cfo', 'president', 'founder', 'developer', 'engineer', 'analyst',
            'consultant', 'coordinator', 'administrator', 'representative', 'specialist',
            'development', 'business', 'sales', 'marketing', 'operations', 'technical'
        ]
        has_job_title = any(indicator in text.lower() for indicator in job_indicators)
        
        # Company indicators
        company_indicators = ['ltd', 'llc', 'inc', 'corp', 'pvt', 'solutions', 'services', 'technologies', 'systems']
        has_company = any(indicator in text.lower() for indicator in company_indicators)
        
        # Text quality analysis
        total_chars = len(text.replace(' ', '').replace('\n', ''))
        alpha_chars = sum(1 for c in text if c.isalpha())
        digit_chars = sum(1 for c in text if c.isdigit())
        special_chars = sum(1 for c in text if not c.isalnum() and c not in ' \n\t')
        
        # Quality ratios
        alpha_ratio = alpha_chars / max(total_chars, 1)
        digit_ratio = digit_chars / max(total_chars, 1)
        special_ratio = special_chars / max(total_chars, 1)
        
        # Check for OCR artifacts (repeated characters, nonsense patterns)
        artifact_patterns = [
            r'([a-zA-Z])\1{3,}',  # Repeated characters
            r'[^a-zA-Z0-9@.\s\-+()]{3,}',  # Consecutive special chars
            r'\b[a-zA-Z]{1,2}\b(?:\s+[a-zA-Z]{1,2}\b){3,}',  # Too many short words
        ]
        artifact_count = sum(len(re.findall(pattern, text)) for pattern in artifact_patterns)
        
        # Calculate comprehensive confidence score
        confidence = (
            meaningful_lines * 2 +           # More weight on meaningful content
            email_matches * 15 +             # Email is highly valuable
            phone_matches * 10 +             # Phone is valuable
            website_matches * 8 +            # Website is valuable
            name_matches * 12 +              # Proper names are very important
            (has_job_title * 8) +            # Job titles are important
            (has_company * 6) +              # Company info is valuable
            (alpha_ratio * 15) +             # High alphabetic ratio is good
            (digit_ratio * 5) +              # Some digits are normal
            max(0, (0.2 - special_ratio) * 10) + # Too many special chars is bad
            max(0, (10 - artifact_count) * 2)    # Penalize OCR artifacts
        )
        
        # Bonus for reasonable line count (business cards typically have 4-10 meaningful lines)
        if 4 <= meaningful_lines <= 10:
            confidence += 5
        
        # Penalty for very short or very long text
        if len(text.strip()) < 20:
            confidence *= 0.5
        elif len(text.strip()) > 1000:
            confidence *= 0.7
        
        return max(0, confidence)

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
            
            # ALWAYS try OCR first for business card data extraction
            import time
            start_time = time.time()
            print("Starting OCR text extraction...")
            best_text = self.extract_text_with_multiple_configs(img)
            ocr_time = time.time() - start_time
            print(f"OCR completed in {ocr_time:.2f} seconds")
            
            # Clean up the extracted text
            text = '\n'.join([line.strip() for line in best_text.split('\n') if line.strip()])
            print(f"Extracted text: {text}")
            
            # Check if the text is completely garbled (too many artifacts)
            if text:
                # Calculate the ratio of meaningful characters
                total_chars = len(text.replace(' ', '').replace('\n', ''))
                alpha_chars = sum(1 for c in text if c.isalpha())
                alpha_ratio = alpha_chars / max(total_chars, 1) if total_chars > 0 else 0
                
                # If text is heavily garbled (less than 40% alphabetic), try basic OCR
                if alpha_ratio < 0.4 and total_chars > 50:
                    print("Text appears garbled, trying basic OCR...")
                    text = pytesseract.image_to_string(img, config='--psm 6')
                    text = '\n'.join([line.strip() for line in text.split('\n') if line.strip()])
                    print(f"Basic OCR text: {text}")
            
            # Extract information from the text
            info = self.extract_info(text)
            print(f"Extracted info: {info}")
            
            # Also check for QR code (but don't prioritize it over business card data)
            qr_data = self.process_qr_code(img)
            
            # Post-processing improvements for better data extraction
            
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
            
            # Save the image file
            img_bytes.seek(0)  # Reset file pointer
            business_card.image.save(
                f"business_card_{business_card.id}.{image_file.name.split('.')[-1]}",
                img_bytes,
                save=True
            )
            
            # Update the business card with the final data
            business_card.save()
            
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
            print(f"Error processing image: {error_trace}")
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
                    notes=info.get('notes')
                )
                
                # Save the business card first to get an ID
                business_card.save()
                
                # Save the image file
                img_bytes.seek(0)  # Reset file pointer
                business_card.image.save(
                    f"qr_business_card_{business_card.id}.{image_file.name.split('.')[-1]}",
                    img_bytes,
                    save=True
                )
                
                # Update the business card with the final data
                business_card.save()
                
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