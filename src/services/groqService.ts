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

      // Strip markdown code blocks if present (Groq sometimes wraps JSON in ```json...```)
      const cleanedResponse = this.stripMarkdownCodeBlocks(response);

      // Parse the JSON response
      const parsedResponse = JSON.parse(cleanedResponse);
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

  async parseResumeContent(prompt: string): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert resume parser. Analyze resume text and extract structured information accurately. Always return valid JSON without any markdown formatting or explanations.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from Groq");
      }

      return response;
    } catch (error) {
      console.error("Error parsing resume content with Groq:", error);
      throw error;
    }
  }

  /**
   * Strip markdown code blocks from AI response
   * Handles cases where Groq returns JSON wrapped in ```json...```
   */
  private stripMarkdownCodeBlocks(response: string): string {
    // Remove markdown code blocks (```json...``` or ```...```)
    const codeBlockPattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
    const match = response.trim().match(codeBlockPattern);

    if (match) {
      return match[1].trim();
    }

    // If no code blocks found, return the original response
    return response.trim();
  }

  async generateOutreachEmail(
    candidate: {
      name: string;
      role: string;
      company: string;
      skills: string[];
      summary: string;
    },
    roleTitle: string,
    companyName: string,
    recruiterName: string = "Alex Johnson",
    recruiterTitle: string = "Senior Technical Recruiter"
  ): Promise<{ subject: string; message: string }> {
    try {
      console.log("Starting email generation with Groq...");

      const prompt = `Generate a personalized outreach email for a candidate with the following profile:
Name: ${candidate.name}
Current Role: ${candidate.role} at ${candidate.company}
Skills: ${candidate.skills.join(", ")}
Summary: ${candidate.summary}

The email should be for a ${roleTitle} position at ${companyName}.
The email will be sent by ${recruiterName}, ${recruiterTitle} at ${companyName}.

Generate both a subject line and the email body. The email should:
1. Be personalized based on their experience and skills
2. Highlight relevant aspects of their background
3. Be concise but engaging
4. Include a clear call to action
5. Be professional but conversational
6. End with a proper signature using the recruiter's name and title

IMPORTANT: The email signature must be properly formatted with line breaks. The message should end with two line breaks before the signature, then the signature should have line breaks between each line.

Return the response in the following JSON format:
{
  "subject": "string",
  "message": "string"
}

The message should end with a properly formatted signature like this:

[email body content]

Best regards,
${recruiterName}
${recruiterTitle}
${companyName}

Make sure there are proper line breaks (\\n) in the message string to separate the signature from the body and between signature lines.

Do not include any markdown formatting or explanations.`;

      console.log("Sending request to Groq...");
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an expert recruiter who writes compelling, personalized outreach emails. Always return valid JSON without any markdown formatting or explanations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1000,
      });

      console.log("Received response from Groq");
      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response content from Groq");
      }

      console.log("Raw response:", response);

      // Strip markdown code blocks if present
      const cleanedResponse = this.stripMarkdownCodeBlocks(response);
      console.log("Cleaned response:", cleanedResponse);

      try {
        const parsedResponse = JSON.parse(cleanedResponse);
        if (!parsedResponse.subject || !parsedResponse.message) {
          throw new Error(
            "Response missing required fields (subject or message)"
          );
        }

        // Post-process the message to ensure proper signature formatting
        let message = parsedResponse.message;

        // Ensure proper signature formatting
        const signaturePattern =
          /(Best regards,?\s*)([^\n]*)\s*([^\n]*)\s*([^\n]*)/i;
        if (signaturePattern.test(message)) {
          // If signature exists but not properly formatted, fix it
          message = message.replace(
            signaturePattern,
            (
              _match: string,
              _greeting: string,
              name: string,
              title: string,
              company: string
            ) => {
              const cleanName = name?.trim() || recruiterName;
              const cleanTitle = title?.trim() || recruiterTitle;
              const cleanCompany = company?.trim() || companyName;

              return `\n\nBest regards,\n${cleanName}\n${cleanTitle}\n${cleanCompany}`;
            }
          );
        } else {
          // If no signature found, add one
          message =
            message.trim() +
            `\n\nBest regards,\n${recruiterName}\n${recruiterTitle}\n${companyName}`;
        }

        return {
          subject: parsedResponse.subject,
          message: message,
        };
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        console.error("Failed to parse response:", cleanedResponse);
        throw new Error(
          `Failed to parse generated email content: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error in generateOutreachEmail:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate email: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Verify candidate information using AI
   */
  async verifyCandidateInfo(
    resumeText: string,
    jobDescription: string
  ): Promise<{
    verificationSummary: string;
    flaggedItems: string[];
  }> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert HR analyst specializing in candidate verification. Your task is to analyze a resume against a job description and identify potential inconsistencies, exaggerations, or red flags.

            Analyze the following aspects:
            1. Skills claims vs. experience level
            2. Job progression and timeline consistency
            3. Educational background alignment
            4. Technology combinations that make sense
            5. Experience duration vs. claimed expertise level
            6. Gap analysis between claimed skills and job descriptions

            Provide your response in JSON format:
            {
              "verificationSummary": "A comprehensive summary of your analysis (2-3 sentences)",
              "flaggedItems": ["Array of specific concerns or inconsistencies found"]
            }

            If no major concerns are found, state that in the summary and provide an empty array for flaggedItems.`,
          },
          {
            role: "user",
            content: `Resume/Skills: ${resumeText}

Job Description: ${jobDescription}

Please analyze this candidate's profile and provide verification insights.`,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 1500,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      console.log("Raw AI response:", responseText);
      console.log("Response length:", responseText.length);

      try {
        const parsed = JSON.parse(responseText);
        return {
          verificationSummary:
            parsed.verificationSummary ||
            "Analysis completed with no specific concerns identified.",
          flaggedItems: parsed.flaggedItems || [],
        };
      } catch (parseError) {
        console.warn(
          "JSON parsing failed, attempting to extract data:",
          parseError
        );

        // Try to extract JSON from potentially truncated response
        try {
          // Strip markdown code blocks if present
          const cleanedResponse = this.stripMarkdownCodeBlocks(responseText);

          // Try to find and parse incomplete JSON
          let jsonStartIndex = cleanedResponse.indexOf(
            '{"verificationSummary"'
          );
          if (jsonStartIndex === -1) {
            jsonStartIndex = cleanedResponse.indexOf('"verificationSummary"');
            if (jsonStartIndex !== -1) {
              jsonStartIndex = cleanedResponse.lastIndexOf("{", jsonStartIndex);
            }
          }

          if (jsonStartIndex !== -1) {
            let jsonString = cleanedResponse.substring(jsonStartIndex);

            // Try to complete truncated JSON
            if (!jsonString.endsWith("}") && !jsonString.endsWith("]")) {
              const openBraces = (jsonString.match(/\{/g) || []).length;
              const closeBraces = (jsonString.match(/\}/g) || []).length;
              const openBrackets = (jsonString.match(/\[/g) || []).length;
              const closeBrackets = (jsonString.match(/\]/g) || []).length;

              // Add missing closing brackets/braces
              for (let i = 0; i < openBrackets - closeBrackets; i++) {
                jsonString += "]";
              }
              for (let i = 0; i < openBraces - closeBraces; i++) {
                jsonString += "}";
              }
            }

            const reconstructedParsed = JSON.parse(jsonString);
            return {
              verificationSummary:
                reconstructedParsed.verificationSummary ||
                "Analysis completed with no specific concerns identified.",
              flaggedItems: reconstructedParsed.flaggedItems || [],
            };
          }

          // Fallback to regex extraction
          const summaryMatch = responseText.match(
            /"verificationSummary":\s*"([^"]*)/
          );
          const flaggedMatch = responseText.match(
            /"flaggedItems":\s*\[\s*"([^"]*)/
          );

          return {
            verificationSummary: summaryMatch
              ? summaryMatch[1]
              : "Analysis completed with no specific concerns identified.",
            flaggedItems: flaggedMatch ? [flaggedMatch[1]] : [],
          };
        } catch (reconstructionError) {
          console.warn("Failed to reconstruct JSON:", reconstructionError);

          // Last resort: extract readable text from the response
          const cleanText = responseText
            .replace(/[{}"\[\]]/g, "")
            .replace(/verificationSummary:|flaggedItems:/g, "")
            .trim();

          return {
            verificationSummary:
              cleanText.length > 0
                ? cleanText.substring(0, 500)
                : "Analysis completed with no specific concerns identified.",
            flaggedItems: [],
          };
        }
      }
    } catch (error) {
      console.error("Error in candidate verification:", error);
      throw new Error("Failed to verify candidate information");
    }
  }

  /**
   * Generate screening questions and answers using AI
   */
  async generateScreeningQA(
    resumeText: string,
    jobDescription: string
  ): Promise<{
    questions: Array<{
      question: string;
      expectedAnswer: string;
    }>;
  }> {
    try {
      console.log(
        "Generating screening Q&A with resume text length:",
        resumeText.length
      );
      console.log("Job description length:", jobDescription.length);

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert technical interviewer. Generate 5 relevant screening questions based on the candidate's resume and the job requirements.

            Guidelines:
            1. Create questions that assess both technical knowledge and experience
            2. Include questions about specific technologies mentioned in both resume and job description
            3. Ask about problem-solving scenarios relevant to the role
            4. Include at least one behavioral question related to the candidate's experience
            5. Make questions challenging but fair based on the candidate's background

            For each question, provide an expected answer that demonstrates competency.

            Return your response in JSON format:
            {
              "questions": [
                {
                  "question": "Your interview question here",
                  "expectedAnswer": "What a competent candidate should cover in their answer"
                }
              ]
            }`,
          },
          {
            role: "user",
            content: `Candidate Resume/Skills: ${resumeText}

Job Description: ${jobDescription}

Please generate 5 screening questions with expected answers for this candidate.`,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      console.log("Raw AI response:", responseText);
      console.log("Response length:", responseText.length);

      try {
        // Strip markdown code blocks if present
        const cleanedResponse = this.stripMarkdownCodeBlocks(responseText);
        console.log("Cleaned response:", cleanedResponse);

        const parsed = JSON.parse(cleanedResponse);
        console.log("Parsed response:", parsed);
        return {
          questions: parsed.questions || [],
        };
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        console.log("Failed to parse response:", responseText);
        // Fallback if JSON parsing fails
        return {
          questions: [],
        };
      }
    } catch (error) {
      console.error("Error generating screening Q&A:", error);
      throw new Error("Failed to generate screening questions");
    }
  }
}
