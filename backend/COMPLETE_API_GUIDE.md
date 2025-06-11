# BC Scanner API - Complete Guide

## 🚀 All React Native Issues Fixed!

### ✅ **Recently Fixed Issues:**
- ❌ **JSON Parse Error**: DELETE endpoints now return proper JSON
- ❌ **400 Bad Request**: API supports multiple image formats (multipart, base64, alternative field names)
- ❌ **Failed to scan**: Enhanced error handling and debugging
- ❌ **404 Trash Endpoint**: Added complete trash/recycle bin functionality

## 📡 API Base URL
```
http://your-server:8000/api/
```

---

## 🔍 **Business Card Scanning**

### POST `/business-cards/scan_card/`
**Ultra-fast business card scanning with Gemini AI (3-5 seconds)**

#### Supported Request Formats:

**Option 1: Multipart Form Data (Recommended)**
```javascript
const formData = new FormData();
formData.append('image', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'business_card.jpg'
});
formData.append('user_id', '123'); // Optional

const response = await fetch('http://your-server:8000/api/business-cards/scan_card/', {
  method: 'POST',
  body: formData,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

**Option 2: Base64 JSON (React Native Friendly)**
```javascript
const base64Image = 'iVBORw0KGgoAAAANSUhEUgAA...'; // Your base64 string

const response = await fetch('http://your-server:8000/api/business-cards/scan_card/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image: base64Image,
    user_id: '123' // Optional
  }),
});
```

**Option 3: Alternative Field Names**
```javascript
// API accepts both 'image' and 'photo' field names
const formData = new FormData();
formData.append('photo', imageFile); // 'photo' also works!
```

#### Response:
```json
{
  "message": "Business card scanned successfully with Gemini AI",
  "confidence": 95,
  "processing_time": "2.34s",
  "business_card": {
    "id": 123,
    "name": "John Smith",
    "company": "TechCorp Solutions",
    "job_title": "Senior Software Engineer",
    "email": "john.smith@techcorp.com",
    "mobile": "+1 (555) 123-4567",
    "website": "https://www.techcorp.com",
    "address": "123 Tech Street, Silicon Valley, CA 94000",
    "created_at": "2025-06-11T10:30:00Z"
  }
}
```

### POST `/business-cards/scan_card_advanced/`
**Advanced scanning with context and industry analysis**

```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('context', 'This is from a tech conference'); // Optional
formData.append('user_id', '123'); // Optional

const response = await fetch('http://your-server:8000/api/business-cards/scan_card_advanced/', {
  method: 'POST',
  body: formData,
});
```

### POST `/business-cards/scan_qr/`
**QR code business card scanning**

```javascript
// Same format as scan_card
const response = await fetch('http://your-server:8000/api/business-cards/scan_qr/', {
  method: 'POST',
  body: formData,
});
```

### POST `/business-cards/scan_card_dual_side/`
**Dual-side business card scanning with enhanced information extraction**

#### Request Format:

```javascript
const formData = new FormData();

// Add front side image
formData.append('front_image', {
  uri: frontImageUri,
  type: 'image/jpeg',
  name: 'front_side.jpg'
});

// Add back side image
formData.append('back_image', {
  uri: backImageUri,
  type: 'image/jpeg',
  name: 'back_side.jpg'
});

formData.append('user_id', '123'); // Optional

const response = await fetch('http://your-server:8000/api/business-cards/scan_card_dual_side/', {
  method: 'POST',
  body: formData,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

#### Response:
```json
{
  "message": "Dual-side business card scanned successfully",
  "scan_type": "dual_side",
  "confidence_score": 97,
  "processing_time": "4.2s",
  "business_card": {
    "id": 124,
    "name": "Dr. Sarah Johnson",
    "company": "MedTech Solutions Inc.",
    "job_title": "Chief Technology Officer",
    "email": "sarah.johnson@medtech.com",
    "mobile": "+1 (555) 987-6543",
    "website": "https://www.medtech-solutions.com",
    "address": "456 Innovation Drive, Tech Park, CA 94105",
    "notes": "Fax: +1 (555) 987-6544 | Social Media: LinkedIn: linkedin.com/in/sarahjohnson, Twitter: @sarahjohnson_cto | Industry: Healthcare Technology | Specialization: AI-Powered Medical Devices | Services: AI Development, Medical Software, Consulting | Languages: English | Scan Confidence: 97%",
    "type": "dual_side_scan",
    "created_at": "2025-06-11T10:45:00Z"
  },
  "extraction_details": {
    "success": true,
    "scan_method": "gemini_dual_side",
    "processing_time": 4.2,
    "metadata": {
      "side_analyzed": "both",
      "confidence_score": 97,
      "text_quality": "excellent"
    }
  }
}
```

#### Features:
- **Enhanced Data Extraction**: Analyzes both front and back sides for comprehensive information
- **Social Media Detection**: Extracts LinkedIn, Twitter, Facebook, Instagram profiles
- **Professional Details**: Captures certifications, awards, specializations, services
- **Contact Information**: Multiple phone numbers, email addresses, fax numbers
- **Language Detection**: Identifies primary and secondary languages
- **Industry Analysis**: Determines business industry and specialization
- **Higher Accuracy**: Combines information from both sides for better results

---

## 📋 **CRUD Operations**

### GET `/business-cards/`
**List all active business cards**

```javascript
// Get all business cards
const response = await fetch('http://your-server:8000/api/business-cards/');

// Filter by user
const response = await fetch('http://your-server:8000/api/business-cards/?user_id=123');
```

### POST `/business-cards/`
**Create new business card manually**

```javascript
const response = await fetch('http://your-server:8000/api/business-cards/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "John Smith",
    company: "TechCorp",
    email: "john@techcorp.com",
    mobile: "+1-555-123-4567",
    job_title: "Software Engineer",
    website: "https://techcorp.com",
    address: "123 Tech St, CA",
    user_id: "123"
  }),
});
```

### GET `/business-cards/{id}/`
**Get specific business card**

```javascript
const response = await fetch('http://your-server:8000/api/business-cards/123/');
```

### PUT `/business-cards/{id}/`
**Update business card**

```javascript
const response = await fetch('http://your-server:8000/api/business-cards/123/', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "John Smith Updated",
    company: "TechCorp Solutions",
    // ... other fields
  }),
});
```

### DELETE `/business-cards/{id}/`
**Move business card to trash (soft delete)**

```javascript
const response = await fetch('http://your-server:8000/api/business-cards/123/', {
  method: 'DELETE',
})
.then(response => response.json()) // ✅ Now works! No more JSON parse error
.then(data => {
  console.log(data.message); // "Business card moved to trash"
});
```

**Response:**
```json
{
  "message": "Business card \"John Smith\" moved to trash",
  "deleted_id": 123
}
```

---

## 🗑️ **Trash/Recycle Bin Management**

### GET `/business-cards/trash/`
**Get all deleted business cards**

```javascript
// Get all deleted items
const response = await fetch('http://your-server:8000/api/business-cards/trash/');

// Filter by user
const response = await fetch('http://your-server:8000/api/business-cards/trash/?user_id=123');
```

**Response:**
```json
{
  "message": "Found 5 items in trash",
  "count": 5,
  "business_cards": [
    {
      "id": 123,
      "name": "John Smith",
      "email": "john@example.com",
      "is_deleted": true,
      "deleted_at": "2025-06-11T10:30:00Z",
      // ... other fields
    }
  ]
}
```

### POST `/business-cards/{id}/restore/`
**Restore business card from trash**

```javascript
const response = await fetch('http://your-server:8000/api/business-cards/123/restore/', {
  method: 'POST',
});
```

**Response:**
```json
{
  "message": "Business card \"John Smith\" restored successfully",
  "business_card": {
    "id": 123,
    "name": "John Smith",
    "is_deleted": false,
    "deleted_at": null,
    // ... other fields
  }
}
```