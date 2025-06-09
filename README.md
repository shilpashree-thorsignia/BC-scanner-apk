# Business Card Scanner App

A comprehensive React Native mobile application with Django REST API backend for scanning, managing, and organizing business cards using advanced OCR technology.

## 🚀 Features

### Core Functionality
- **Smart Business Card Scanning**: Advanced OCR with Tesseract for accurate text extraction
- **QR Code Detection**: Automatic QR code scanning with fallback to business card OCR
- **CRUD Operations**: Create, Read, Update, Delete business cards
- **Google Photos-style Restore**: Soft delete with 30-day restore functionality
- **Search & Filter**: Search cards by name, company, or any field
- **Export & Share**: Share business card information
- **Image Management**: Store and display business card images

### Advanced Features
- **Multi-configuration OCR**: Multiple preprocessing methods for optimal accuracy
- **Smart Data Extraction**: Intelligent parsing of names, emails, phones, addresses
- **Real-time Validation**: Form validation with error handling
- **Responsive UI**: Modern, clean interface with smooth animations
- **Offline Support**: Local storage with AsyncStorage

## 📱 Tech Stack

### Frontend (React Native + Expo)
- **Framework**: React Native 0.79.2 with Expo 53.0.9
- **Navigation**: Expo Router 5.0.7
- **UI Components**: Custom components with React Native Vector Icons
- **State Management**: React Context API
- **Image Processing**: Expo Camera, Image Picker
- **Storage**: AsyncStorage for local data
- **Animations**: React Native Reanimated 3.17.4

### Backend (Django REST Framework)
- **Framework**: Django 5.0.2 with DRF 3.14.0
- **Database**: MySQL 8.0+ (configurable)
- **OCR Engine**: Tesseract 4.0+ with OpenCV preprocessing
- **Image Processing**: Pillow, OpenCV, NumPy
- **QR Code**: PyZBar for QR code detection
- **Authentication**: Simple token-based auth (expandable to JWT)

## 🏗️ Project Structure

```
BC-scanner-app/
├── app/                          # React Native App (Expo Router)
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx            # Home screen with business card list
│   │   └── settings.tsx         # Settings screen
│   ├── (modals)/                # Modal screens
│   ├── components/              # Reusable UI components
│   │   ├── BusinessCardList.tsx # Main business card display component
│   │   └── ...
│   ├── screens/                 # Screen components
│   │   ├── ScannerScreen.tsx    # Camera/gallery scanning interface
│   │   ├── EditBusinessCard.tsx # Edit business card form
│   │   ├── TrashScreen.tsx      # Deleted cards management
│   │   └── ...
│   ├── lib/                     # API and utility functions
│   │   ├── api.ts              # API client with all endpoints
│   │   └── ...
│   ├── context/                 # React Context providers
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   ├── config.ts               # API configuration
│   └── _layout.tsx             # Root layout component
├── backend/                     # Django REST API
│   ├── core/                   # Django project settings
│   │   ├── settings.py         # Database, CORS, media settings
│   │   ├── urls.py            # Root URL configuration
│   │   └── ...
│   ├── scanner/                # Main Django app
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API endpoints and OCR logic
│   │   ├── serializers.py     # DRF serializers
│   │   ├── urls.py           # App URL patterns
│   │   └── migrations/       # Database migrations
│   ├── media/                 # Uploaded business card images
│   ├── requirements.txt       # Python dependencies
│   └── manage.py             # Django management script
├── assets/                    # Static assets (images, fonts)
├── components/               # Shared components
├── constants/               # App constants
├── package.json            # Node.js dependencies
└── README.md              # This file
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Python** 3.8+
- **MySQL** 8.0+ (or SQLite for development)
- **Tesseract OCR** 4.0+
- **Expo CLI**: `npm install -g @expo/cli`

### Backend Setup

1. **Clone and navigate to backend**:
```bash
cd backend
```

2. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Configure database** in `core/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'bc_scanner_db',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

5. **Run migrations**:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Start development server**:
```bash
python manage.py runserver 0.0.0.0:8000
```

### Frontend Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure API endpoint** in `app/config.ts`:
```typescript
export const API_BASE_URL = 'http://YOUR_IP:8000/api';
```

3. **Start Expo development server**:
```bash
npx expo start
```

4. **Run on device/emulator**:
- Scan QR code with Expo Go app (iOS/Android)
- Press `a` for Android emulator
- Press `i` for iOS simulator

## 🌐 API Endpoints

### Base URL: `http://192.168.1.26:8000/api`

### Authentication Endpoints

#### User Registration
```http
POST /register/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

#### User Login
```http
POST /login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### User Profile
```http
GET /users/{user_id}/
PATCH /users/{user_id}/
Content-Type: application/json

{
  "first_name": "Updated Name",
  "phone": "+0987654321"
}
```

### Business Card Endpoints

#### List Business Cards
```http
GET /business-cards/
GET /business-cards/?deleted=true  # Get deleted cards
```

#### Create Business Card (Manual)
```http
POST /business-cards/
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com",
  "mobile": "+1234567890",
  "company": "Tech Corp",
  "jobTitle": "Software Engineer",
  "website": "https://company.com",
  "address": "123 Main St, City, State",
  "notes": "Met at conference"
}
```

#### Scan Business Card (OCR)
```http
POST /business-cards/scan_card/
Content-Type: multipart/form-data

image: [business_card_image_file]
```

**Response:**
```json
{
  "type": "business_card",
  "data": {
    "id": 1,
    "name": "Debabrata Paul",
    "email": "debabrata.paul@apna.co",
    "mobile": "+91 8974182745",
    "company": "Apna",
    "job_title": "Business Development Executive",
    "website": null,
    "address": "Akemps Building, 1st Main Rd, Ashwini Layout, Ejipura, Bengaluru, Karnataka 560047",
    "notes": null,
    "image_url": "http://192.168.1.26:8000/media/business_card_1.jpg",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Business card processed and saved successfully",
  "extracted_info": {
    "name": "Debabrata Paul",
    "email": "debabrata.paul@apna.co",
    "mobile": "+91 8974182745",
    "company": "Apna",
    "job_title": "Business Development Executive",
    "website": null,
    "address": "Akemps Building, 1st Main Rd, Ashwini Layout, Ejipura, Bengaluru, Karnataka 560047"
  }
}
```

#### Scan QR Code
```http
POST /business-cards/scan_qr/
Content-Type: multipart/form-data

image: [qr_code_image_file]
```

#### Update Business Card
```http
PUT /business-cards/{id}/
PATCH /business-cards/{id}/
Content-Type: application/json

{
  "name": "Updated Name",
  "job_title": "Senior Developer"
}
```

#### Soft Delete Business Card
```http
DELETE /business-cards/{id}/
```

**Response:**
```json
{
  "message": "Business card moved to trash. You can restore it within 30 days.",
  "deleted_at": "2024-01-15T10:30:00Z"
}
```

### Trash Management Endpoints

#### Get Deleted Cards
```http
GET /business-cards/trash/
```

#### Restore Card
```http
POST /business-cards/{id}/restore/
```

#### Permanent Delete
```http
DELETE /business-cards/{id}/permanent_delete/
```

#### Empty Trash
```http
POST /business-cards/empty_trash/
```

### Email Configuration Endpoints

#### Get Email Config
```http
GET /email-config/
```

#### Create/Update Email Config
```http
POST /email-config/
Content-Type: application/json

{
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 587,
  "email": "your-email@gmail.com",
  "password": "app-password",
  "use_tls": true,
  "is_enabled": true
}
```

#### Test Email Configuration
```http
POST /email-config/{id}/test/
```

## 🔍 OCR Technology

### Image Preprocessing Pipeline
1. **Color Space Conversion**: RGB → Grayscale
2. **Noise Reduction**: Gaussian blur filtering
3. **Resolution Optimization**: Upscale to 2000px width for accuracy
4. **Contrast Enhancement**: CLAHE (Contrast Limited Adaptive Histogram Equalization)
5. **Binarization**: Adaptive thresholding for varying lighting
6. **Morphological Operations**: Text cleanup and noise removal

### OCR Configurations
- **Primary**: PSM 6 with character whitelist for clean business cards
- **Secondary**: PSM 4 with word preservation for structured layouts
- **Fallback**: PSM 3 for mixed content

### Smart Data Extraction
- **Name Detection**: Multi-word name prioritization with validation
- **Email Parsing**: RFC-compliant email regex
- **Phone Extraction**: International format support (+91, +1, etc.)
- **Address Recognition**: Indian address patterns with landmarks
- **Company Identification**: Corporate indicators and capitalization patterns
- **Job Title Matching**: Extensive keyword database with partial matching

## 📊 Database Schema

### BusinessCard Model
```python
class BusinessCard(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    mobile = models.CharField(max_length=20, blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    job_title = models.CharField(max_length=255, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='business_cards/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)
```

### UserProfile Model
```python
class UserProfile(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### EmailConfig Model
```python
class EmailConfig(models.Model):
    smtp_server = models.CharField(max_length=255)
    smtp_port = models.IntegerField(default=587)
    email = models.EmailField()
    password = models.CharField(max_length=255)
    use_tls = models.BooleanField(default=True)
    is_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

## 🎯 Application Flow

### 1. User Registration/Login
```
User opens app → Registration/Login screen → API authentication → Home screen
```

### 2. Business Card Scanning
```
Home screen → Camera/Gallery → Image capture → OCR processing → Data extraction → 
Review/Edit → Save to database → Display in list
```

### 3. QR Code Scanning
```
Scanner → QR detection → Parse format (vCard/MECARD/JSON) → Extract data → 
Save business card → Display result
```

### 4. Card Management
```
Card list → Select card → View details → Edit/Delete/Share options → 
Update database → Refresh list
```

### 5. Trash Management
```
Delete card → Soft delete → Move to trash → 30-day retention → 
Restore option → Permanent delete
```

## 🔧 Configuration

### Current API Configuration
- **Base URL**: `http://192.168.1.26:8000/api`
- **Database**: MySQL (bc_scanner_db)
- **Media Files**: Stored in `backend/media/business_cards/`

### Tesseract Configuration
Ensure Tesseract is installed and accessible:
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

## 🐛 Troubleshooting

### Common Issues

#### OCR Accuracy Problems
- Ensure good lighting when capturing images
- Hold camera steady and focus properly
- Clean business card surface
- Try different angles if text is skewed

#### Network Connection Issues
- Verify API endpoint URL in `app/config.ts`
- Check backend server is running on correct port
- Ensure device and server are on same network

#### Database Connection Issues
- Verify MySQL service is running
- Check database credentials in `settings.py`
- Ensure database exists and user has permissions

## 📈 Performance Optimization

### OCR Performance
- **Image Resolution**: Optimized to 2000px for balance of speed/accuracy
- **Preprocessing**: Streamlined pipeline with essential operations only
- **Configuration Limit**: Maximum 3 OCR attempts with early exit
- **Caching**: Processed images cached for repeated operations

### API Performance
- **Database Indexing**: Indexed on frequently queried fields
- **Pagination**: Implemented for large datasets
- **Image Optimization**: Compressed images for faster loading
- **Lazy Loading**: Images loaded on demand

## 🔒 Security Considerations

### Current Implementation
- **CORS**: Enabled for development (restrict in production)
- **Authentication**: Basic email/password (upgrade to JWT recommended)
- **File Upload**: Limited to image files with size restrictions
- **SQL Injection**: Protected by Django ORM

### Production Recommendations
- Implement JWT authentication
- Add rate limiting for API endpoints
- Use HTTPS for all communications
- Implement proper file validation and scanning
- Add user permissions and role-based access

---

**Built with ❤️ using React Native, Django, and advanced OCR technology** 