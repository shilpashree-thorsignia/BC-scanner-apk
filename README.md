# BC-scanner-app

A comprehensive business card management application built with React Native (Expo) for the frontend and Django for the backend. Scan, store, share, and export business cards with ease.

![BC Scanner App](https://via.placeholder.com/800x400?text=BC+Scanner+App)

## Features

### Recent Updates
- **Enhanced QR Code Support**: Now supports plain text QR codes and simple name-only QR codes
- **Improved Error Handling**: Better feedback when scanning fails
- **OCR Fallback**: Manual entry option when Tesseract OCR is not available
- **UI Improvements**: Clearer navigation between QR code scanning and physical card scanning

### Business Card Scanning
- **Physical Card Scanning**: Scan business cards using device camera or gallery
- **QR Code Scanning**: Scan QR codes in MECARD, vCard, or plain text format
- **Automatic Information Extraction**: Extract contact details from both physical cards and QR codes
- **Multi-Format Support**: Parse different QR code formats (MECARD, vCard, plain text)
- **Fallback Parsing**: Smart extraction of contact info from non-standard QR codes
- **Manual Entry Fallback**: Option to manually enter card details when OCR is unavailable

### Business Card Management
- **Card Storage**: Save and organize all your business cards
- **Contact Details**: Store name, email, phone, company, job title, website, and address
- **Card Editing**: Update card information as needed
- **Card Viewing**: Browse through your collection of business cards

### Sharing & Export
- **QR Code Generation**: Each card includes a scannable QR code with contact details
- **PDF Export**: Export all business cards as a professionally styled PDF document
- **Visual Fidelity**: Exported cards maintain the app's visual design
- **Batch Export**: Export your entire collection with a single tap

### User Interface
- **Modern Design**: Clean, intuitive interface with smooth animations
- **Dark Mode**: Comfortable viewing in all lighting conditions
- **Responsive Layout**: Works on various screen sizes
- **Visual Feedback**: Loading indicators and success/error messages

## Setup

### Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start the Expo development server
npx expo start
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install backend dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start Django server
python manage.py runserver
```

### Requirements
- Node.js 14+ and npm/yarn
- Expo CLI
- Python 3.8+
- Tesseract OCR (optional for enhanced physical card scanning)
  - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
  - Linux: `sudo apt install tesseract-ocr`
  - Mac: `brew install tesseract`
  - Note: The app will still function without Tesseract, using manual entry fallback

## Key Dependencies

### Frontend
- React Native with Expo
- Expo Camera for scanning
- Expo Print for PDF generation
- Expo Sharing for file sharing
- Expo File System for file management

### Backend
- Django REST Framework
- Tesseract OCR for image processing
- Pillow for image manipulation

## API Endpoints

### Business Card Management
- `GET /api/business-cards/` - Get all business cards
- `POST /api/business-cards/` - Create a new business card
- `GET /api/business-cards/:id/` - Get a specific business card
- `PUT /api/business-cards/:id/` - Update a business card
- `DELETE /api/business-cards/:id/` - Delete a business card

### Card Scanning
- `POST /api/business-cards/scan_card/` - Scan and extract info from card image

## Project Structure

```
BC-scanner-app/
├── app/                    # React Native app code
│   ├── (modals)/           # Modal screens (scanner, etc.)
│   ├── components/         # Reusable components
│   ├── context/            # Context providers
│   ├── lib/                # API and utility functions
│   ├── screens/            # Main screens
│   └── utils/              # Utility functions
├── assets/                 # Static assets
├── backend/                # Django backend
└── ...                     # Configuration files
```

## License

MIT