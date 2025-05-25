import Groq from "groq-sdk";
import { config } from "../config";

export class GroqService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: config.groq.apiKey,
    });
  }

  async parseQuery(query: string): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that converts natural language queries into concise GitHub search queries.
            Follow these rules:
            1. Extract key technical skills and programming languages
            2. Handle common location variations (e.g., Bangalore/Bengaluru)
            3. Convert experience requirements to appropriate GitHub search terms
            4. Focus on the most important keywords
            5. Keep the query under 256 characters
            6. Use GitHub's search syntax (e.g., language:javascript, location:bangalore)
            
            Example conversions:
            - "javascript developer with 10 years experience in bangalore" -> "language:javascript location:bangalore created:>2013"
            - "python developer in mumbai" -> "language:python location:mumbai"
            - "senior react developer" -> "language:javascript language:react stars:>10"
            
            Return only the search query without any explanations.`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 150,
      });

      const parsedQuery = completion.choices[0]?.message?.content || query;

      // Ensure the query is under 256 characters
      if (parsedQuery.length > 256) {
        return parsedQuery.substring(0, 256);
      }

      return parsedQuery;
    } catch (error) {
      console.error("Error parsing query with Groq:", error);
      return query; // Fallback to original query if parsing fails
    }
  }

  async parseTalentQuery(query: string): Promise<{
    extractedSkills: string[];
    extractedRequirements: string[];
    confidence: number;
    derivedFilters: {
      experience?: number;
      skills?: string[];
      location?: string;
      availability?: "immediate" | "notice" | "open";
      employmentType?: "full-time" | "contract" | "part-time";
      seniority?: "junior" | "mid" | "senior" | "lead" | "principal";
      aiExperience?: {
        frameworks?: string[];
        domains?: string[];
        years?: number;
      };
    };
  }> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that analyzes job search queries to extract structured information. 
            For the given query, extract:
            1. Technical skills and programming languages
            2. Job requirements and preferences
            3. Derive appropriate filters for the search
            
            Return the response in the following JSON format:
            {
              "extractedSkills": string[],
              "extractedRequirements": string[],
              "confidence": number,
              "derivedFilters": {
                "experience": number,
                "skills": string[],
                "location": string,
                "availability": "immediate" | "notice" | "open",
                "employmentType": "full-time" | "contract" | "part-time",
                "seniority": "junior" | "mid" | "senior" | "lead" | "principal",
                "aiExperience": {
                  "frameworks": string[],
                  "domains": string[],
                  "years": number
                }
              }
            }
            
            Only include fields that are explicitly mentioned or can be reasonably inferred from the query.
            The confidence score should be between 0 and 1, representing how confident you are in the extraction.
            Do not include any explanations or markdown formatting.`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from Groq");
      }

      // Parse the JSON response
      const parsedResponse = JSON.parse(response);
      return parsedResponse;
    } catch (error) {
      console.error("Error parsing talent query with Groq:", error);
      // Return a default response if parsing fails
      return {
        extractedSkills: [],
        extractedRequirements: [],
        confidence: 0,
        derivedFilters: {},
      };
    }
  }
}
