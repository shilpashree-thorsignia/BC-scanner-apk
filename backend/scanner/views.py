import re
import cv2
import numpy as np
import pytesseract
from pyzbar.pyzbar import decode
from PIL import Image, ImageEnhance, ImageFilter
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import BusinessCard
from .serializers import BusinessCardSerializer

# Set Tesseract path (update this path if Tesseract is installed elsewhere)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

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
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        img = img.convert('L')
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2)
        
        # Apply threshold to get black and white image
        img = img.point(lambda x: 0 if x < 140 else 255)
        
        # Apply slight blur to reduce noise
        img = img.filter(ImageFilter.MedianFilter())
        
        return img

    def extract_info(self, text):
        """Extract structured information from OCR text"""
        # Clean up the text
        text = ' '.join(text.split())
        
        # Extract email
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        email_match = re.search(email_pattern, text)
        email = email_match.group(0) if email_match else None

        # Extract phone numbers (various formats)
        phone_pattern = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phone_matches = re.findall(phone_pattern, text)
        phone = phone_matches[0] if phone_matches else None

        # Extract name (look for title case words that might be names)
        name_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b'
        name_matches = re.findall(name_pattern, text)
        name = name_matches[0] if name_matches else None

        # Extract company (look for all caps words that might be company names)
        company_pattern = r'\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b'
        company_matches = [m for m in re.findall(company_pattern, text) 
                          if not any(word in m.lower() for word in ['llc', 'inc', 'ltd', 'corp'])]
        company = company_matches[0] if company_matches else None

        # Extract website
        website_pattern = r'(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?'
        website_match = re.search(website_pattern, text)
        website = website_match.group(0) if website_match else None

        return {
            'name': name,
            'email': email,
            'mobile': phone,
            'company': company,
            'website': website
        }

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
            
            # First try to detect and process QR code
            qr_data = self.process_qr_code(img)
            if qr_data:
                # Save QR code data to database
                business_card = BusinessCard.objects.create(
                    name=f"QR Code - {qr_data[0][:20]}..." if qr_data else "QR Code",
                    notes="QR Code Data: " + "\n".join(qr_data) if qr_data else "QR Code"
                )
                
                # Save the image file
                img_bytes.seek(0)  # Reset file pointer
                business_card.image.save(
                    f"qr_code_{business_card.id}.{image_file.name.split('.')[-1]}",
                    img_bytes,
                    save=True
                )
                
                serializer = self.get_serializer(business_card, context={'request': request})
                return Response({
                    'type': 'qr_code',
                    'data': qr_data,
                    'business_card': serializer.data,
                    'message': 'QR code detected and saved successfully'
                }, status=status.HTTP_201_CREATED)
            
            # If no QR code, process as business card
            # Preprocess image for better OCR
            processed_img = self.preprocess_image(img)
            
            # Extract text using Tesseract with custom configuration
            custom_config = r'--oem 3 --psd 6 -c preserve_interword_spaces=1'
            text = pytesseract.image_to_string(processed_img, config=custom_config)
            
            # If no text detected, try with different configurations
            if not text.strip():
                text = pytesseract.image_to_string(img, config='--psm 6')
            
            # Extract information from the text
            info = self.extract_info(text)
            
            # Create a new BusinessCard instance
            business_card = BusinessCard(
                name=info.get('name', 'Unknown'),
                email=info.get('email'),
                mobile=info.get('mobile'),
                company=info.get('company'),
                website=info.get('website'),
                notes=f"Extracted text:\n{text}"
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
            
            # Update the business card with the extracted information
            business_card.save()
            
            serializer = self.get_serializer(business_card, context={'request': request})
            return Response({
                'type': 'business_card',
                'data': serializer.data,
                'message': 'Business card processed and saved successfully',
                'extracted_text': text
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc(),
                'message': 'Error processing the image'
            }, status=status.HTTP_400_BAD_REQUEST)