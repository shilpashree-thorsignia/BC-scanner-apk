$env:GOOGLE_GEMINI_API_KEY = "AIzaSyCMvRQsbvP3O51jB3evexSbkxRZS4v2Fno"
$env:SECRET_KEY = "django-insecure-k8#mq3v&x9p7z$w2n5@!c6r1t4y8u9i0o3p6s2a5d8f1g4h7j0k3l6m9"
$env:DEBUG = "True"

Write-Host "🚀 Starting Django server with Gemini AI..." -ForegroundColor Green
Write-Host "✅ GOOGLE_GEMINI_API_KEY set" -ForegroundColor Green
Write-Host "🌐 Server will be available at http://localhost:8000" -ForegroundColor Cyan

python manage.py runserver 0.0.0.0:8000 