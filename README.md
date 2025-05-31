# BC-scanner-app

A business card scanner application built with React Native (frontend) and Django (backend).

## Setup

### Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start the frontend application
npm start
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
pip install --only-binary=:all: -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start Django server
python manage.py runserver
```

### Requirements
- Node.js and npm
- Python 3.8+
- Tesseract OCR (required for scanning)
  - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
  - Linux: `sudo apt install tesseract-ocr`
  - Mac: `brew install tesseract`

## Features
- Scan business cards using device camera or gallery
- Extract name, email, and phone number automatically
- View scanned card history
- Preview scanned card images

## API Endpoints
- POST `/api/business-cards/scan_card/` - Scan and extract info from card image
- GET `/api/business-cards/` - Get all scanned cards