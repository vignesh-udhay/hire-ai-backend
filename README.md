# AI Recruiter Backend

A powerful TypeScript-based Express.js backend application that provides AI-powered talent search and resume parsing capabilities.

## Features

🔍 **Talent Search & Discovery**
- GitHub profile search and analysis
- Natural language query processing
- AI-powered candidate matching and scoring
- Advanced filtering and ranking algorithms

📄 **Auto Resume Parsing & Skill Extraction**
- Multi-format support (PDF, Word, TXT)
- AI-powered content extraction
- Structured skill categorization
- Experience analysis and seniority detection
- Batch processing capabilities
- Skill matching against job requirements

🤖 **AI-Powered Analysis**
- Natural language understanding using Groq LLM
- Intelligent skill extraction and categorization
- Automated candidate screening and scoring
- Confidence-based quality assessment

## API Endpoints

### Talent Search
- `POST /api/talent/search` - Search for talent using natural language queries
- `GET /api/talent/details/:id` - Get detailed candidate profile

### Resume Processing
- `POST /api/resume/parse` - Parse single resume file
- `POST /api/resume/batch-parse` - Parse multiple resume files
- `POST /api/resume/extract-skills` - Extract skills from resume text
- `POST /api/resume/analyze-skill-match` - Analyze skill compatibility
- `POST /api/resume/convert-to-profile` - Convert resume to talent profile
- `GET /api/resume/supported-formats` - Get supported file formats

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env` file in the root directory with the following content:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here

# Groq Configuration
GROQ_API_KEY=your_groq_api_key_here
```

Make sure to replace:

- `your_github_token_here` with your GitHub Personal Access Token
- `your_groq_api_key_here` with your Groq API key

## Running the Application

Development mode (with hot reload):

```bash
pnpm dev
```

Build the application:

```bash
pnpm build
```

Production mode:

```bash
pnpm start
```

Type checking:

```bash
pnpm typecheck
```

The server will start on port 3000 by default (or the port specified in your .env file).

## Testing

Test the resume parsing functionality:

```bash
pnpm run test:resume
```

This will run comprehensive tests on the resume parsing service with sample data.

## API Documentation

### Talent Search API
- `POST /api/talent/search` - Search for talent using natural language queries
- `GET /api/talent/details/:id` - Get detailed candidate profile

### Resume Processing API
For detailed information about the resume processing endpoints, see [RESUME_API.md](./RESUME_API.md).

- `POST /api/resume/parse` - Parse single resume file (PDF/Word/TXT)
- `POST /api/resume/batch-parse` - Parse multiple resume files
- `POST /api/resume/extract-skills` - Extract skills from resume text
- `POST /api/resume/analyze-skill-match` - Analyze skill compatibility with job requirements
- `POST /api/resume/convert-to-profile` - Convert parsed resume to talent profile
- `GET /api/resume/supported-formats` - Get supported file formats and limits

## Project Structure

```
hire-backend/
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── config/
│   │   └── index.ts             # Configuration settings
│   ├── controllers/
│   │   ├── resumeController.ts  # Resume processing endpoints
│   │   └── talentController.ts  # Talent search endpoints
│   ├── middleware/
│   │   └── errorHandler.ts      # Error handling middleware
│   ├── routes/
│   │   ├── resumeRoutes.ts      # Resume API routes
│   │   └── talentRoutes.ts      # Talent search routes
│   ├── services/
│   │   ├── githubService.ts     # GitHub API integration
│   │   ├── groqService.ts       # Groq LLM service
│   │   ├── resumeParserService.ts # Resume parsing logic
│   │   ├── skillMatchingService.ts # Skill analysis service
│   │   └── talentSearch.ts      # Talent search algorithms
│   └── types/
│       ├── resume.ts            # Resume-related type definitions
│       └── talent.ts            # Talent-related type definitions
├── test/
│   └── resumeParserTest.ts      # Resume parser tests
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── README.md                   # This file
└── RESUME_API.md              # Detailed resume API documentation
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# GitHub Configuration (for talent search)
GITHUB_TOKEN=your_github_token_here

# Groq Configuration (for AI processing)
GROQ_API_KEY=your_groq_api_key_here
```

## Dependencies

### Core Dependencies
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **groq-sdk**: Groq LLM integration
- **octokit**: GitHub API client

### Resume Processing
- **multer**: File upload handling
- **pdf-parse**: PDF text extraction
- **docx**: Word document parsing
- **mammoth**: Alternative Word document parsing

### Development
- **typescript**: TypeScript support
- **ts-node**: TypeScript execution
- **ts-node-dev**: Development server with hot reload

## Usage Examples

### Search for Talent
```bash
curl -X POST http://localhost:3000/api/talent/search \
  -H "Content-Type: application/json" \
  -d '{"query": "React developer with 3+ years experience"}'
```

### Parse a Resume
```bash
curl -X POST http://localhost:3000/api/resume/parse \
  -F "resume=@path/to/resume.pdf"
```

### Extract Skills
```bash
curl -X POST http://localhost:3000/api/resume/extract-skills \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "Software engineer with experience in React, Node.js, Python..."}'
```

## Error Handling

The API includes comprehensive error handling for:
- File upload validation (size, format)
- Resume parsing failures
- AI service errors
- Invalid request parameters
- Rate limiting (GitHub API)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

- `src/` - TypeScript source files
- `dist/` - Compiled JavaScript files (generated after build)
- `tsconfig.json` - TypeScript configuration
