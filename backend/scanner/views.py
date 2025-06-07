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
from .models import BusinessCard, UserProfile
from .serializers import BusinessCardSerializer, UserProfileSerializer

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
    queryset = BusinessCard.objects.all()
    serializer_class = BusinessCardSerializer

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
        Advanced image preprocessing for optimal OCR results
        
        Args:
            img: PIL Image object
            
        Returns:
            PIL Image: Preprocessed image optimized for OCR
        """
        # Convert to RGB first to handle any color mode
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Convert to grayscale
        img = img.convert('L')
        
        # Resize if image is too small or too large for optimal OCR
        width, height = img.size
        if width < 800 or height < 600:
            # Upscale small images
            scale_factor = max(800/width, 600/height)
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        elif width > 3000 or height > 3000:
            # Downscale very large images
            scale_factor = min(3000/width, 3000/height)
            new_size = (int(width * scale_factor), int(height * scale_factor))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Enhance contrast adaptively
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.5)
        
        # Enhance sharpness
        sharpness_enhancer = ImageEnhance.Sharpness(img)
        img = sharpness_enhancer.enhance(1.2)
        
        # Convert to numpy array for advanced processing
        img_array = np.array(img)
        
        # Apply adaptive thresholding instead of fixed threshold
        # This works better with varying lighting conditions
        mean_val = np.mean(img_array)
        threshold = max(120, min(160, int(mean_val * 0.8)))
        
        # Apply threshold
        img_array = np.where(img_array < threshold, 0, 255)
        
        # Convert back to PIL Image
        img = Image.fromarray(img_array.astype(np.uint8))
        
        # Apply noise reduction filter
        img = img.filter(ImageFilter.MedianFilter(size=3))
        
        # Optional: Apply morphological operations to clean up text
        # This helps connect broken characters
        img_array = np.array(img)
        
        # Simple dilation to connect broken text
        try:
            from scipy import ndimage
            # If scipy is available, use morphological operations
            kernel = np.ones((2, 2))
            img_array = ndimage.binary_closing(img_array > 127, structure=kernel).astype(np.uint8) * 255
            img = Image.fromarray(img_array)
        except ImportError:
            # Fallback if scipy is not available - use OpenCV morphological operations
            try:
                kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
                img_array = cv2.morphologyEx(img_array, cv2.MORPH_CLOSE, kernel)
                img = Image.fromarray(img_array)
            except:
                pass
        
        return img

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
        
        # Extract name (look for proper name patterns)
        name_candidates = []
        for i, line in enumerate(remaining_lines):
            # More flexible name matching
            if (re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z\']+){1,3}$', line) or
                (len(line.split()) >= 2 and len(line.split()) <= 4 and 
                 all(word[0].isupper() for word in line.split() if word))):
                name_candidates.append((i, line))
        
        if name_candidates:
            # Choose the first name-like pattern
            idx, name = name_candidates[0]
            result['name'] = name
            remaining_lines.pop(idx)
        
        # Extract job title using expanded keywords
        job_keywords = [
            'manager', 'director', 'head', 'chief', 'senior', 'junior', 'lead',
            'ceo', 'cto', 'cfo', 'coo', 'president', 'vice president', 'vp',
            'founder', 'co-founder', 'owner', 'partner', 'principal',
            'engineer', 'developer', 'analyst', 'consultant', 'specialist',
            'coordinator', 'supervisor', 'administrator', 'executive',
            'associate', 'assistant', 'representative', 'agent', 'officer',
            'business head', 'team lead', 'project manager'
        ]
        
        for i, line in enumerate(remaining_lines):
            if any(keyword in line.lower() for keyword in job_keywords):
                result['job_title'] = line
                remaining_lines.pop(i)
                break
        
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
        """Extract text using multiple OCR configurations and return the best result"""
        ocr_configs = [
            r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@.-+()/', 
            r'--oem 3 --psm 4',
            r'--oem 3 --psm 11',
            r'--oem 3 --psm 3',
            r'--oem 3 --psm 1'
        ]
        
        best_text = ''
        best_confidence = 0
        
        for config in ocr_configs:
            try:
                # Preprocess image for better OCR
                processed_img = self.preprocess_image(img.copy())
                
                # Extract text with current configuration
                current_text = pytesseract.image_to_string(processed_img, config=config)
                
                # Calculate a simple confidence score based on meaningful content
                lines = [line.strip() for line in current_text.split('\n') if line.strip()]
                meaningful_lines = len([line for line in lines if len(line) > 2])
                has_email = bool(re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', current_text))
                has_phone = bool(re.search(r'\+?[\d\s\-\(\)]{10,}', current_text))
                has_website = bool(re.search(r'[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', current_text))
                
                # Simple scoring system
                confidence = meaningful_lines + (has_email * 5) + (has_phone * 3) + (has_website * 2)
                
                if confidence > best_confidence:
                    best_text = current_text
                    best_confidence = confidence
                    
            except Exception as e:
                print(f"OCR config {config} failed: {str(e)}")
                continue
        
        # If no good result, try with original image
        if not best_text.strip():
            try:
                best_text = pytesseract.image_to_string(img, config='--psm 6')
            except:
                best_text = pytesseract.image_to_string(img)
        
        return best_text

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
            print("Starting OCR text extraction...")
            best_text = self.extract_text_with_multiple_configs(img)
            
            # Clean up the extracted text
            text = '\n'.join([line.strip() for line in best_text.split('\n') if line.strip()])
            print(f"Extracted text: {text}")
            
            # Extract information from the text
            info = self.extract_info(text)
            print(f"Extracted info: {info}")
            
            # Also check for QR code (but don't prioritize it over business card data)
            qr_data = self.process_qr_code(img)
            
            # Post-processing improvements for better data extraction
            
            # If we didn't find a name but have email, try to extract name from email
            if not info['name'] and info['email']:
                name_part = info['email'].split('@')[0]
                # Remove numbers and special chars, replace dots and underscores with spaces
                name_guess = re.sub(r'[^a-zA-Z. ]+', '', name_part.replace('.', ' ').replace('_', ' ')).title()
                if len(name_guess.split()) >= 2:  # If we got something that looks like a name
                    info['name'] = name_guess
            
            # Try to find name from the first substantial line if still not found
            if not info['name'] and text:
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                for line in lines[:3]:  # Check first 3 lines
                    # Look for name-like patterns
                    if (len(line.split()) >= 2 and len(line.split()) <= 4 and 
                        len(line) > 5 and len(line) < 50 and
                        not any(char.isdigit() for char in line) and
                        not '@' in line and not '.' in line):
                        info['name'] = line
                        break
            
            # Improve company extraction
            if not info['company'] and text:
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                # Look for company-like lines (usually have distinctive patterns)
                for line in lines:
                    if (len(line) > 3 and 
                        (line.endswith('.com') or 
                         any(indicator in line.lower() for indicator in ['solutions', 'technologies', 'systems', 'services']) or
                         (sum(1 for c in line if c.isupper()) >= 2 and len(line) > 8))):
                        if line != info['name'] and line != info['job_title']:
                            info['company'] = line
                            break
            
            # Clean up the notes to avoid duplication and raw text dump
            clean_notes = None
            if info.get('notes'):
                if isinstance(info['notes'], list):
                    clean_notes_list = []
                    for note in info['notes']:
                        # Skip notes that are already captured in other fields
                        # Also skip single characters, random text, and OCR artifacts
                        if (note and 
                            note != info.get('name') and 
                            note != info.get('email') and 
                            note != info.get('mobile') and
                            note != info.get('company') and
                            note != info.get('job_title') and
                            note != info.get('website') and
                            note != info.get('address') and
                            len(note) > 10 and  # Minimum meaningful length
                            not note.isdigit() and  # Skip pure numbers
                            not re.match(r'^[^a-zA-Z]*$', note) and  # Skip non-alphabetic
                            ' ' in note):  # Must contain spaces (multiple words)
                            clean_notes_list.append(note)
                    
                    # Only keep notes if we have meaningful content
                    if clean_notes_list:
                        clean_notes = ' | '.join(clean_notes_list[:3])  # Limit to 3 most relevant notes
            
            # Build a simple notes section without raw text dump
            final_notes = []
            if qr_data:
                final_notes.append(f"QR Code: {qr_data[0]}")  # Only first QR code
            if clean_notes:
                final_notes.append(clean_notes)
            
            # Create a new BusinessCard instance with extracted data
            business_card = BusinessCard(
                name=info.get('name') or 'Unknown',
                email=info.get('email'),
                mobile=info.get('mobile'),
                company=info.get('company'),
                job_title=info.get('job_title'),
                website=info.get('website'),
                address=info.get('address'),
                notes=' | '.join(final_notes) if final_notes else None
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