# Express Backend Application

A TypeScript-based Express.js backend application.

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

## API Endpoints

- `GET /`: Welcome message

## Project Structure

- `src/` - TypeScript source files
- `dist/` - Compiled JavaScript files (generated after build)
- `tsconfig.json` - TypeScript configuration
