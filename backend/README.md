# Business Card Scanner - Django Backend

A Django REST API backend for the Business Card Scanner application with OCR capabilities.

## Features

- 🔍 **OCR Text Extraction**: Extract text from business card images using Tesseract
- 📱 **QR Code Support**: Scan and decode QR codes from business cards
- 🗃️ **Business Card Management**: CRUD operations for business cards
- 👤 **User Management**: User registration, login, and profile management
- 📧 **Email Configuration**: Automated email notifications
- 🗑️ **Soft Delete**: Trash/restore functionality for business cards
- 🌐 **CORS Support**: Cross-origin resource sharing for frontend integration

## Tech Stack

- **Backend**: Django 4.2.7, Django REST Framework
- **Database**: PostgreSQL (production), SQLite (development)
- **OCR**: Tesseract, OpenCV, Pillow
- **QR Codes**: pyzbar
- **Deployment**: Vercel (serverless)

## Local Development Setup

### Prerequisites

- Python 3.9+
- Tesseract OCR installed on your system

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/`

## Vercel Deployment

### Prerequisites

- [Vercel CLI](https://vercel.com/cli) installed: `npm i -g vercel`
- Vercel account
- PostgreSQL database (recommended: [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or [Railway](https://railway.app/))

### Deployment Steps

1. **Prepare for deployment**
   ```bash
   python deploy.py
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Configure environment variables** in the Vercel dashboard:
   - `SECRET_KEY`: Django secret key
   - `DATABASE_URL`: PostgreSQL connection string
   - `DEBUG`: Set to `False`
   - `DOMAIN`: Your Vercel domain
   - Other variables from `env.example`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Django secret key | Yes |
| `DEBUG` | Debug mode (False for production) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DOMAIN` | Your Vercel domain | Yes |
| `EMAIL_HOST` | SMTP host for emails | No |
| `EMAIL_HOST_USER` | SMTP username | No |
| `EMAIL_HOST_PASSWORD` | SMTP password | No |
| `TESSERACT_CMD` | Path to Tesseract binary | No |

### Database Setup

For production, use a managed PostgreSQL service:

1. **Neon (Recommended)**
   ```bash
   # Sign up at https://neon.tech/
   # Create a database and get the connection string
   DATABASE_URL=postgresql://username:password@hostname/database
   ```

2. **Supabase**
   ```bash
   # Sign up at https://supabase.com/
   # Create a project and get the connection string
   DATABASE_URL=postgresql://postgres:password@hostname:5432/postgres
   ```

## API Endpoints

### Authentication
- `POST /api/register/` - User registration
- `POST /api/login/` - User login
- `GET /api/users/{id}/` - Get user details
- `PATCH /api/users/{id}/` - Update user

### Business Cards
- `GET /api/business-cards/` - List business cards
- `POST /api/business-cards/` - Create business card
- `GET /api/business-cards/{id}/` - Get business card
- `PUT /api/business-cards/{id}/` - Update business card
- `DELETE /api/business-cards/{id}/` - Soft delete business card
- `POST /api/business-cards/{id}/restore/` - Restore deleted card
- `DELETE /api/business-cards/{id}/permanent_delete/` - Permanently delete

### Scanning
- `POST /api/business-cards/scan_card/` - Scan business card image
- `POST /api/business-cards/scan_qr/` - Scan QR code

### Email Configuration
- `GET /api/email-config/` - Get email configuration
- `POST /api/email-config/` - Create/update email configuration
- `POST /api/email-config/{id}/test/` - Test email configuration

### Utilities
- `GET /api/business-cards/trash/` - Get deleted cards
- `POST /api/business-cards/empty_trash/` - Empty trash
- `POST /api/business-cards/cleanup_images/` - Clean up stored images

## Troubleshooting

### Common Issues

1. **Tesseract not found**
   ```bash
   # Install Tesseract
   # Ubuntu/Debian: sudo apt-get install tesseract-ocr
   # macOS: brew install tesseract
   # Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
   ```

2. **OpenCV issues**
   ```bash
   # Use headless version for serverless
   pip uninstall opencv-python
   pip install opencv-python-headless
   ```

3. **Database connection errors**
   - Check DATABASE_URL format
   - Ensure database server is accessible
   - Verify credentials

4. **Static files not loading**
   ```bash
   python manage.py collectstatic --noinput
   ```

### Vercel-Specific Issues

1. **Function timeout**
   - Large images may cause timeouts
   - Consider image compression before processing

2. **Memory limits**
   - Serverless functions have memory limits
   - Heavy ML libraries commented out in requirements.txt

3. **Cold start performance**
   - First request may be slow
   - Consider Vercel Pro for better performance

## Development

### Project Structure
```
backend/
├── core/                 # Django project settings
│   ├── settings.py      # Development settings
│   ├── settings_production.py  # Production settings
│   ├── urls.py          # URL configuration
│   └── wsgi.py          # WSGI application
├── scanner/             # Main application
│   ├── models.py        # Database models
│   ├── views.py         # API views
│   ├── serializers.py   # DRF serializers
│   └── urls.py          # App URLs
├── requirements.txt     # Python dependencies
├── vercel.json         # Vercel configuration
├── build_files.sh      # Build script
└── deploy.py           # Deployment helper
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Vercel deployment logs 