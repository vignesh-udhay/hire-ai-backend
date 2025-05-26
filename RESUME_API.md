# AI Recruiter Backend - Resume Parsing & Skill Extraction API

## Overview

This API provides auto resume parsing and skill extraction capabilities for the AI Recruiter platform. It can parse resumes in multiple formats (PDF, Word, TXT) and extract structured information including personal details, skills, experience, education, and projects.

## Features

- **Auto Resume Parsing**: Parse resumes from PDF, Word documents, and text files
- **Skill Extraction**: Extract and categorize technical skills, frameworks, tools, and technologies
- **Skill Matching**: Compare resume skills against job requirements
- **Batch Processing**: Process multiple resumes simultaneously
- **AI-Powered Analysis**: Uses advanced LLM for intelligent content extraction
- **Talent Profile Conversion**: Convert parsed resumes to searchable talent profiles

## API Endpoints

### Resume Parsing

#### `POST /api/resume/parse`

Parse a single resume file and extract structured information.

**Request:**

- Content-Type: `multipart/form-data`
- Body: Form data with `resume` file field

**Supported Formats:**

- PDF (`.pdf`)
- Word Documents (`.docx`, `.doc`)
- Plain Text (`.txt`)
- Max file size: 5MB

**Response:**

```json
{
  "success": true,
  "data": {
    "personalInfo": {
      "name": "John Doe",
      "email": "john.doe@email.com",
      "phone": "+1-234-567-8900",
      "location": "San Francisco, CA",
      "linkedin": "https://linkedin.com/in/johndoe",
      "github": "https://github.com/johndoe",
      "portfolio": "https://johndoe.dev"
    },
    "summary": "Experienced software engineer...",
    "skills": {
      "technical": ["JavaScript", "Python", "React"],
      "frameworks": ["Express.js", "Django", "Next.js"],
      "languages": ["JavaScript", "Python", "TypeScript"],
      "tools": ["Git", "Docker", "VS Code"],
      "databases": ["PostgreSQL", "MongoDB"],
      "cloud": ["AWS", "Azure"]
    },
    "experience": [
      {
        "company": "Tech Corp",
        "position": "Senior Software Engineer",
        "location": "San Francisco, CA",
        "startDate": "2022-01-01",
        "endDate": "2024-12-31",
        "current": false,
        "description": ["Led development of...", "Implemented..."],
        "technologies": ["React", "Node.js", "AWS"]
      }
    ],
    "education": [...],
    "projects": [...],
    "certifications": [...],
    "extractedText": "Raw text content...",
    "confidence": 0.85
  },
  "fileName": "john_doe_resume.pdf",
  "fileType": "application/pdf",
  "processingTime": 2340
}
```

#### `POST /api/resume/batch-parse`

Parse multiple resume files in a single request.

**Request:**

- Content-Type: `multipart/form-data`
- Body: Form data with `resumes` file array (max 10 files)

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "fileName": "resume1.pdf",
        "success": true,
        "data": {
          "parsedResume": {...},
          "talentProfile": {...}
        }
      },
      {
        "fileName": "resume2.pdf",
        "success": false,
        "error": "Failed to extract text from PDF"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 1,
      "failed": 1
    }
  }
}
```

### Skill Analysis

#### `POST /api/resume/extract-skills`

Extract skills from resume text.

**Request:**

```json
{
  "resumeText": "I am a software engineer with experience in React, Node.js..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "skills": {
      "technical": ["React", "Node.js", "JavaScript"],
      "frameworks": ["Express.js", "React"],
      "languages": ["JavaScript", "TypeScript"],
      "tools": ["Git", "Docker"],
      "databases": ["MongoDB"],
      "cloud": ["AWS"]
    },
    "experience": {
      "totalYears": 5,
      "seniority": "senior",
      "primaryRole": "Full Stack Developer",
      "industries": ["Technology", "E-commerce"]
    },
    "confidence": 0.92,
    "suggestions": ["Learn Kubernetes", "Consider GraphQL"]
  }
}
```

#### `POST /api/resume/analyze-skill-match`

Analyze skill match between resume and job requirements.

**Request:**

```json
{
  "resumeSkills": {
    "technical": ["React", "Node.js", "JavaScript"],
    "frameworks": ["Express.js"],
    "languages": ["JavaScript", "TypeScript"],
    "tools": ["Git"],
    "databases": ["MongoDB"],
    "cloud": ["AWS"]
  },
  "requiredSkills": ["React", "Node.js", "TypeScript", "Docker", "Kubernetes"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "matchAnalysis": {
      "matchPercentage": 60,
      "matchedSkills": ["React", "Node.js", "TypeScript"],
      "missingSkills": ["Docker", "Kubernetes"],
      "categoryBreakdown": {
        "frontend": { "matched": 1, "total": 1 },
        "backend": { "matched": 1, "total": 1 },
        "cloud": { "matched": 0, "total": 2 }
      }
    },
    "suggestions": {
      "recommended": ["Docker", "Kubernetes"],
      "trending": ["GraphQL", "Next.js"],
      "complementary": ["Python", "PostgreSQL"]
    },
    "timestamp": "2024-12-19T10:30:00.000Z"
  }
}
```

### Profile Conversion

#### `POST /api/resume/convert-to-profile`

Convert parsed resume to talent profile format.

**Request:**

```json
{
  "parsedResume": {
    "personalInfo": {...},
    "skills": {...},
    "experience": [...],
    "education": [...],
    "projects": [...],
    "summary": "..."
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "resume_1703000000000",
    "name": "John Doe",
    "title": "Senior Software Engineer",
    "experience": 5.2,
    "skills": ["React", "Node.js", "JavaScript", "AWS"],
    "location": "San Francisco, CA",
    "availability": "open",
    "source": "resume",
    "matchScore": 0,
    "highlights": ["Led development of...", "Implemented..."],
    "avatar": "",
    "summary": "Experienced software engineer...",
    "seniority": "senior",
    "employmentPreferences": {
      "type": "full-time",
      "remote": true,
      "relocation": false
    },
    "screeningStatus": {
      "automated": true,
      "score": 85,
      "notes": ["Resume parsed automatically", "Skills extracted using AI"],
      "recommended": true
    }
  }
}
```

### Utility Endpoints

#### `GET /api/resume/supported-formats`

Get information about supported file formats and features.

**Response:**

```json
{
  "formats": [
    {
      "extension": ".pdf",
      "mimeType": "application/pdf",
      "description": "Portable Document Format"
    },
    {
      "extension": ".docx",
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "description": "Microsoft Word Document (2007+)"
    },
    {
      "extension": ".doc",
      "mimeType": "application/msword",
      "description": "Microsoft Word Document (Legacy)"
    },
    {
      "extension": ".txt",
      "mimeType": "text/plain",
      "description": "Plain Text File"
    }
  ],
  "maxFileSize": "5MB",
  "features": [
    "Personal information extraction",
    "Skills categorization",
    "Work experience parsing",
    "Education details extraction",
    "Project information parsing",
    "Certification extraction",
    "AI-powered skill analysis",
    "Seniority level detection"
  ]
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `FILE_TOO_LARGE`: File exceeds 5MB limit
- `UNSUPPORTED_FILE_TYPE`: File format not supported
- `UNEXPECTED_FILE`: Wrong form field name used
- `VALIDATION_ERROR`: Request validation failed
- `INTERNAL_ERROR`: Server-side error

## Rate Limiting

- Single file parsing: No specific limits
- Batch processing: Maximum 10 files per request
- File size: Maximum 5MB per file

## Integration Examples

### JavaScript/Node.js

```javascript
const formData = new FormData();
formData.append("resume", fileInput.files[0]);

const response = await fetch("/api/resume/parse", {
  method: "POST",
  body: formData,
});

const result = await response.json();
if (result.success) {
  console.log("Parsed resume:", result.data);
}
```

### Python

```python
import requests

with open('resume.pdf', 'rb') as file:
    files = {'resume': file}
    response = requests.post('/api/resume/parse', files=files)

if response.status_code == 200:
    result = response.json()
    if result['success']:
        print('Parsed resume:', result['data'])
```

### cURL

```bash
curl -X POST \
  -F "resume=@/path/to/resume.pdf" \
  http://localhost:3000/api/resume/parse
```

## Development Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Add your GROQ_API_KEY
```

3. Start development server:

```bash
pnpm run dev
```

4. Build for production:

```bash
pnpm run build
pnpm start
```

## Dependencies

- **pdf-parse**: PDF text extraction
- **mammoth**: Word document parsing
- **multer**: File upload handling
- **groq-sdk**: AI-powered text analysis
- **express**: Web framework
- **typescript**: Type safety

## Architecture

The resume parsing system consists of several key components:

1. **ResumeParserService**: Core parsing logic
2. **SkillMatchingService**: Skill analysis and matching
3. **GroqService**: AI-powered text understanding
4. **ResumeController**: HTTP request handling
5. **Error Middleware**: Centralized error handling

## Performance Considerations

- Text extraction is performed in memory for security
- AI processing is batched when possible
- Large files are rejected to prevent memory issues
- Parallel processing for batch operations
- Confidence scoring for quality assessment
