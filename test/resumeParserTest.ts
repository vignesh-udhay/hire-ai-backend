import { ResumeParserService } from "../src/services/resumeParserService";
import { SkillMatchingService } from "../src/services/skillMatchingService";
import fs from "fs";
import path from "path";

// Sample resume text for testing
const sampleResumeText = `
John Doe
Software Engineer
Email: john.doe@example.com
Phone: (555) 123-4567
Location: San Francisco, CA
LinkedIn: linkedin.com/in/johndoe
GitHub: github.com/johndoe

SUMMARY
Experienced full-stack software engineer with 5+ years of experience in building scalable web applications using modern technologies. Passionate about clean code, user experience, and continuous learning.

TECHNICAL SKILLS
Programming Languages: JavaScript, TypeScript, Python, Java
Frontend: React, Vue.js, HTML5, CSS3, Sass, Tailwind CSS
Backend: Node.js, Express.js, Django, Spring Boot
Databases: PostgreSQL, MongoDB, Redis
Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, CI/CD
Tools: Git, VS Code, Postman, Jira

WORK EXPERIENCE

Senior Software Engineer | TechCorp Inc. | San Francisco, CA | Jan 2022 - Present
• Led development of a microservices architecture serving 1M+ users
• Implemented real-time features using WebSocket and Redis
• Mentored junior developers and conducted code reviews
• Technologies: React, Node.js, AWS, Kubernetes, PostgreSQL

Software Engineer | StartupXYZ | San Francisco, CA | Jun 2020 - Dec 2021
• Developed and maintained e-commerce platform using React and Django
• Optimized database queries resulting in 40% performance improvement
• Implemented automated testing pipeline reducing bugs by 60%
• Technologies: React, Django, PostgreSQL, Docker

Junior Software Engineer | WebDev Solutions | San Jose, CA | Aug 2019 - May 2020
• Built responsive web applications using JavaScript and CSS
• Collaborated with design team to implement UI/UX requirements
• Fixed bugs and maintained legacy codebase
• Technologies: JavaScript, HTML, CSS, jQuery, PHP

EDUCATION
Bachelor of Science in Computer Science | Stanford University | 2019
GPA: 3.8/4.0
Relevant Coursework: Data Structures, Algorithms, Database Systems, Software Engineering

PROJECTS

E-Commerce Platform | 2021
• Built full-stack e-commerce platform with React frontend and Node.js backend
• Implemented payment processing with Stripe API
• Technologies: React, Node.js, Express, MongoDB, Stripe
• GitHub: github.com/johndoe/ecommerce-platform

Task Management App | 2020
• Developed collaborative task management application
• Real-time updates using Socket.io
• Technologies: Vue.js, Node.js, Socket.io, PostgreSQL
• Live Demo: taskapp.johndoe.dev

CERTIFICATIONS
AWS Certified Solutions Architect - Associate | Amazon Web Services | 2022
MongoDB Certified Developer | MongoDB Inc. | 2021
`;

async function testResumeParser() {
  console.log("🧪 Testing Resume Parser Service...\n");
  
  try {
    const resumeParser = new ResumeParserService();
    
    // Create a mock file object
    const mockFile = {
      buffer: Buffer.from(sampleResumeText, 'utf-8'),
      mimetype: 'text/plain',
      originalname: 'john_doe_resume.txt',
      size: Buffer.byteLength(sampleResumeText, 'utf-8')
    } as Express.Multer.File;
    
    console.log("📄 Parsing sample resume...");
    const startTime = Date.now();
    
    // Test resume parsing
    const parsedResume = await resumeParser.parseResume(mockFile);
    const parsingTime = Date.now() - startTime;
    
    console.log(`✅ Resume parsed successfully in ${parsingTime}ms`);
    console.log(`📊 Confidence Score: ${(parsedResume.confidence * 100).toFixed(1)}%\n`);
    
    // Display parsed information
    console.log("👤 Personal Information:");
    console.log(`   Name: ${parsedResume.personalInfo.name}`);
    console.log(`   Email: ${parsedResume.personalInfo.email}`);
    console.log(`   Location: ${parsedResume.personalInfo.location}\n`);
    
    console.log("🛠️  Skills Summary:");
    console.log(`   Technical: ${parsedResume.skills.technical.length} skills`);
    console.log(`   Frameworks: ${parsedResume.skills.frameworks.length} frameworks`);
    console.log(`   Languages: ${parsedResume.skills.languages.length} languages`);
    console.log(`   Tools: ${parsedResume.skills.tools.length} tools\n`);
    
    console.log("💼 Experience:");
    console.log(`   ${parsedResume.experience.length} work experiences found\n`);
    
    console.log("🎓 Education:");
    console.log(`   ${parsedResume.education.length} education entries found\n`);
    
    console.log("🚀 Projects:");
    console.log(`   ${parsedResume.projects.length} projects found\n`);
    
    // Test skill extraction
    console.log("🔍 Testing Skill Extraction...");
    const skillExtraction = await resumeParser.extractSkills(sampleResumeText);
    
    console.log(`📈 Experience Analysis:`);
    console.log(`   Total Years: ${skillExtraction.experience.totalYears}`);
    console.log(`   Seniority: ${skillExtraction.experience.seniority}`);
    console.log(`   Primary Role: ${skillExtraction.experience.primaryRole}\n`);
    
    // Test skill matching
    console.log("🎯 Testing Skill Matching...");
    const jobRequirements = [
      "React", "Node.js", "TypeScript", "AWS", "Docker", 
      "Kubernetes", "GraphQL", "PostgreSQL", "Redis"
    ];
    
    const skillMatch = SkillMatchingService.calculateSkillMatch(
      parsedResume.skills,
      jobRequirements
    );
    
    console.log(`🎯 Skill Match Results:`);
    console.log(`   Match Percentage: ${skillMatch.matchPercentage}%`);
    console.log(`   Matched Skills: ${skillMatch.matchedSkills.join(", ")}`);
    console.log(`   Missing Skills: ${skillMatch.missingSkills.join(", ")}\n`);
    
    // Test talent profile conversion
    console.log("🔄 Testing Talent Profile Conversion...");
    const talentProfile = SkillMatchingService.convertToTalentProfile(parsedResume);
    
    console.log(`👨‍💻 Talent Profile:`);
    console.log(`   Name: ${talentProfile.name}`);
    console.log(`   Title: ${talentProfile.title}`);
    console.log(`   Experience: ${talentProfile.experience} years`);
    console.log(`   Seniority: ${talentProfile.seniority}`);
    console.log(`   Skills: ${talentProfile.skills?.length} total skills`);
    console.log(`   Screening Score: ${talentProfile.screeningStatus?.score}%\n`);
    
    // Generate skill suggestions
    const suggestions = SkillMatchingService.generateSkillSuggestions(parsedResume.skills);
    console.log(`💡 Skill Suggestions:`);
    console.log(`   Recommended: ${suggestions.recommended.join(", ")}`);
    console.log(`   Trending: ${suggestions.trending.join(", ")}`);
    console.log(`   Complementary: ${suggestions.complementary.join(", ")}\n`);
    
    console.log("✅ All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testResumeParser();
}

export { testResumeParser };
