import re
import pytesseract
from PIL import Image
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import BusinessCard
from .serializers import BusinessCardSerializer

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

    def extract_info(self, text):
        # Extract email
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        email = re.search(email_pattern, text)
        email = email.group(0) if email else None

        # Extract phone number (various formats)
        phone_pattern = r'(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phone = re.search(phone_pattern, text)
        phone = phone.group(0) if phone else None

        # Extract name (assuming it's the first line or before email/phone)
        lines = text.split('\n')
        name = None
        for line in lines:
            line = line.strip()
            if line and not re.search(email_pattern, line) and not re.search(phone_pattern, line):
                name = line
                break

        return {
            'name': name,
            'email': email,
            'mobile': phone
        }

    @action(detail=False, methods=['POST'])
    def scan_card(self, request):
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        image = request.FILES['image']
        
        try:
            # Open and process the image
            img = Image.open(image)
            # Extract text from image using pytesseract
            text = pytesseract.image_to_string(img)
            
            # Extract information from the text
            info = self.extract_info(text)
            
            # Create a new BusinessCard instance
            business_card = BusinessCard.objects.create(
                image=image,
                name=info['name'] or 'Unknown',
                email=info['email'],
                mobile=info['mobile']
            )
            
            serializer = self.get_serializer(business_card)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST) 