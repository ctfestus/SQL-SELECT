
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { Challenge, ChallengeDef, Difficulty, Industry, ValidationResponse, CourseOutlineItem, CourseModule, ChallengeType } from "../types";

// Helper to get client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY not found in environment variables");
  return new GoogleGenAI({ apiKey });
};

// Retry helper for 429/Quota errors
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      // Check for 429 or quota related errors
      const isQuotaError = 
        error.status === 429 || 
        error.code === 429 ||
        error.message?.includes('429') || 
        error.message?.includes('quota') || 
        error.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError && attempt < maxRetries) {
        // Exponential backoff
        const waitTime = initialDelay * Math.pow(2, attempt);
        console.warn(`Quota exceeded. Retrying in ${waitTime}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const generateChallenge = async (
  def: ChallengeDef,
  industry: Industry,
  difficulty: Difficulty,
  customContext?: string
): Promise<Challenge> => {
  const ai = getAiClient();
  
  // Use custom context if Industry is Personalized, otherwise use the standard Industry enum string
  const effectiveContext = industry === Industry.PERSONALIZED && customContext 
    ? customContext 
    : industry;

  const prompt = `
    Create a SQL assessment challenge.
    Context:
    - Industry/Domain: ${effectiveContext}
    - Difficulty: ${difficulty}
    - Technical Topic: ${def.topic}
    - Learning Objective: ${def.description}

    Requirements:
    1. Define a realistic business scenario relevant to the context "${effectiveContext}".
    2. Define a task that requires using the Technical Topic.
    3. **Constraint**: If the Technical Topic does NOT explicitly mention "JOIN", the task **MUST** be solvable using a **SINGLE table**. Do not create a schema that requires joining tables for basic concepts like "GROUP BY" or "WHERE".
    4. Define a minimal database schema (1-2 tables) with columns relevant to the task.
    5. Provide 5-8 rows of REALISTIC sample data for each table.
    6. DO NOT provide the solution query.

    Output JSON Schema:
    {
      "title": "Short business title",
      "type": "sql",
      "scenario": "1-2 sentences context",
      "task": "Specific instruction on what to query",
      "schema": [
        {
          "tableName": "Name of the table (e.g. users)",
          "columns": ["id", "name", "email"],
          "data": [ ["1", "Alice", "alice@example.com"], ["2", "Bob", "bob@example.com"] ]
        }
      ],
      "requiredConcepts": ["List of SQL keywords expected"]
    }
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING },
            scenario: { type: Type.STRING },
            task: { type: Type.STRING },
            schema: { 
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: {
                  tableName: { type: Type.STRING },
                  columns: { type: Type.ARRAY, items: { type: Type.STRING } },
                  data: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING }
                    } 
                  }
                },
                required: ["tableName", "columns", "data"]
              }
            },
            requiredConcepts: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "scenario", "task", "schema", "requiredConcepts"]
        }
      }
    }));

    const data = JSON.parse(response.text || "{}");
    return {
      id: def.id,
      difficulty,
      topic: def.topic,
      ...data
    };
  } catch (error) {
    console.error("Failed to generate challenge", error);
    // Fallback in case of API error
    return {
      id: def.id,
      title: `Error Loading Challenge ${def.id}`,
      topic: def.topic,
      type: 'sql',
      scenario: "System is temporarily unavailable due to high traffic.",
      task: "Please retry later.",
      schema: [],
      difficulty,
      requiredConcepts: []
    };
  }
};

export const generateAdminChallenge = async (
  topic: string,
  industry: string,
  difficulty: string,
  context: string
): Promise<Challenge> => {
  const ai = getAiClient();
  
  const prompt = `
    Act as a Senior Data Science Lead and Technical Content Architect.
    You are an industry expert in SQL, Python, and Analytics, creating job-ready training content.
    
    Create a detailed SQL assessment challenge.
    
    Input Parameters:
    - Target Industry: ${industry}
    - Role Context: ${context}
    - Key Skill Focus: ${topic}
    - Difficulty Level: ${difficulty}

    **STRICT CONTENT RULES:**
    1. **Topic Isolation:** The challenge MUST test the "Key Skill Focus" (${topic}). Do NOT introduce unrelated concepts.
    2. **Professional Realism:** The scenario must replicate a real-world business problem faced by data teams.
    3. **Schema Quality:** Generate a schema (1-3 tables) with realistic column names.
    4. **Data:** Provide 5-10 rows of realistic sample data per table (timestamps, categorical codes, realistic metrics).
    5. **Solvability:** Ensure the task is clear and solvable with standard SQL.

    Output JSON Schema:
    {
      "title": "Professional Challenge Title",
      "type": "sql",
      "scenario": "Detailed background story explaining the business value of this analysis.",
      "task": "Precise technical instruction for the analyst.",
      "schema": [
        {
          "tableName": "users",
          "columns": ["id", "name", "role"],
          "data": [ ["1", "Admin", "System"] ]
        }
      ],
      "requiredConcepts": ["SQL keywords expected"],
      "topic": "${topic}"
    }
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING },
            scenario: { type: Type.STRING },
            task: { type: Type.STRING },
            schema: { 
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: {
                  tableName: { type: Type.STRING },
                  columns: { type: Type.ARRAY, items: { type: Type.STRING } },
                  data: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING }
                    } 
                  }
                },
                required: ["tableName", "columns", "data"]
              }
            },
            requiredConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            topic: { type: Type.STRING }
          },
          required: ["title", "scenario", "task", "schema", "requiredConcepts", "topic"]
        }
      }
    }));

    const data = JSON.parse(response.text || "{}");
    return {
      id: Date.now(),
      difficulty: difficulty as Difficulty,
      ...data
    };
  } catch (error) {
    console.error("Failed to generate admin challenge", error);
    throw error;
  }
};

// --- Course Generation Methods ---

export const generateCourseOutline = async (
  title: string,
  industry: string,
  role: string,
  level: string,
  promptText: string
): Promise<{ scenario: string; modules: CourseOutlineItem[] }> => {
  const ai = getAiClient();
  const prompt = `
    Act as a World-Class Data Science Instructor and Curriculum Architect (ex-FAANG).
    Your goal is to design a compelling, job-ready SQL learning path.
    
    Input Parameters:
    - Course Title: ${title}
    - Industry: ${industry}
    - Target Role: ${role}
    - Skill Level: ${level}
    - User's Specific Topic Request: ${promptText}

    Task:
    1. Write a professional "Business Scenario" (2-3 sentences) describing a high-performance data team environment and the mission.
    2. Define a structured SQL curriculum (6-10 modules).
    
    Output JSON Schema:
    {
      "scenario": "The generated business scenario text...",
      "modules": [
        {
          "title": "Action-Oriented Title",
          "skillFocus": "Main SQL concept (e.g., INNER JOIN)",
          "taskDescription": "Short description of the business task",
          "expectedOutcome": "What the learner produces",
          "difficulty": "Difficulty label",
          "estimatedTime": "e.g., 10 mins"
        }
      ]
    }
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: { type: Type.STRING },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  skillFocus: { type: Type.STRING },
                  taskDescription: { type: Type.STRING },
                  expectedOutcome: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  estimatedTime: { type: Type.STRING }
                },
                required: ["title", "skillFocus", "taskDescription", "expectedOutcome", "difficulty", "estimatedTime"]
              }
            }
          },
          required: ["scenario", "modules"]
        }
      }
    }));

    const data = JSON.parse(response.text || "{}");
    return {
        scenario: data.scenario || promptText,
        modules: data.modules || []
    };
  } catch (error) {
    console.error("Failed to generate outline", error);
    return { scenario: promptText, modules: [] };
  }
};

export const refineCourseModule = async (
  module: CourseModule,
  courseContext: string,
  instruction: string
): Promise<CourseModule[]> => {
  const ai = getAiClient();
  const prompt = `
    Act as a Curriculum Editor.
    Refine the following course module based on the Admin's specific instruction.
    
    Course Context: ${courseContext}
    Admin Instruction: "${instruction}"
    
    Current Module:
    Title: ${module.title}
    Skill Focus: ${module.skill_focus}
    Task: ${module.task_description}
    Outcome: ${module.expected_outcome}
    Estimated Time: ${module.estimated_time}
    
    Requirements:
    1. Execute the Admin's instruction precisely.
    2. If the instruction implies splitting the lesson, return multiple modules.
    
    Output JSON Schema:
    {
      "modules": [
        {
          "title": "String",
          "skill_focus": "String",
          "task_description": "String",
          "expected_outcome": "String",
          "estimated_time": "String"
        }
      ]
    }
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  skill_focus: { type: Type.STRING },
                  task_description: { type: Type.STRING },
                  expected_outcome: { type: Type.STRING },
                  estimated_time: { type: Type.STRING }
                },
                required: ["title", "skill_focus", "task_description", "expected_outcome", "estimated_time"]
              }
            }
          },
          required: ["modules"]
        }
      }
    }));

    const data = JSON.parse(response.text || "{}");
    return data.modules || [module];
  } catch (error) {
    console.error("Failed to refine module", error);
    return [module];
  }
};

export const refineChallengeContent = async (
  challenge: Challenge,
  instruction: string
): Promise<Challenge> => {
  const ai = getAiClient();
  const prompt = `
    Act as a SQL Content Developer.
    Modify the following SQL Challenge JSON based on the user instruction.
    
    User Instruction: "${instruction}"
    
    Current Challenge JSON:
    ${JSON.stringify(challenge)}
    
    Tasks:
    1. Apply the user's instruction to the challenge content.
    2. Ensure the JSON structure remains valid and matches the schema.
    3. Respect the existing 'type' (${challenge.type || 'sql'}).
    
    Output JSON Schema:
    {
      "title": "...",
      "topic": "...",
      "type": "${challenge.type || 'sql'}",
      "scenario": "...",
      "task": "...",
      "schema": [ ... ],
      "requiredConcepts": [ ... ],
      "difficulty": "...",
      "options": ["..."], // Only if type is mcq
      "correctAnswer": "...", // Only if type is mcq
      "initialCode": "..." // Only if type is debug or completion
    }
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    }));

    const data = JSON.parse(response.text || "{}");
    return {
        ...challenge,
        ...data,
        id: challenge.id 
    };
  } catch (error) {
    console.error("Failed to refine challenge", error);
    throw error;
  }
};

export const generateCourseChallenge = async (
  item: CourseOutlineItem,
  industry: string,
  context: string,
  type: ChallengeType = 'sql'
): Promise<Challenge> => {
  const ai = getAiClient();
  
  let instructions = `
    Context:
    - Domain: ${industry}
    - Course Context: ${context}
    - Module Title: ${item.title}
    - Skill Focus: ${item.skillFocus}
    - Task Description: ${item.taskDescription}
    - Difficulty: ${item.difficulty}
    
    Generate a ${type.toUpperCase()} Challenge.
  `;

  if (type === 'mcq') {
    instructions += `
    Requirements for MCQ:
    1. Create a multiple choice question testing the Skill Focus.
    2. Provide 4 realistic options.
    3. Indicate the correct answer.
    4. No SQL schema is required for execution, but you can provide a small schema for context if needed.
    `;
  } else if (type === 'debug') {
    instructions += `
    Requirements for Debugging Task:
    1. Provide a scenario and a specific task.
    2. Provide 'initialCode' which MUST contain a broken/incorrect SQL query related to the task.
    3. The query should have syntax errors or logical errors common for beginners.
    4. Provide schema and data to test the fixed query.
    `;
  } else if (type === 'completion') {
    instructions += `
    Requirements for Code Completion:
    1. Provide a scenario and a task.
    2. Provide 'initialCode' which is a partial SQL query.
    3. Use comments (e.g. -- TODO) or blanks to indicate missing parts.
    4. Ensure indentation is proper (not one line).
    5. Provide schema and data.
    `;
  } else {
    instructions += `
    Requirements for Standard SQL Task:
    1. Provide scenario, task, schema, and data.
    2. Task must be solvable with standard SQL.
    `;
  }

  const prompt = `
    ${instructions}

    Output JSON Schema:
    {
      "title": "Professional Challenge Title",
      "type": "${type}",
      "scenario": "Business context...",
      "task": "Instruction...",
      "schema": [
        {
          "tableName": "users",
          "columns": ["id", "name"],
          "data": [ ["1", "Alice"] ]
        }
      ],
      "requiredConcepts": ["list"],
      "topic": "${item.skillFocus}",
      "options": ["A", "B", "C", "D"], // Only for MCQ
      "correctAnswer": "A", // Only for MCQ
      "initialCode": "SELECT * FROM..." // Only for debug/completion
    }
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    }));

    const data = JSON.parse(response.text || "{}");
    return {
      id: Date.now(),
      difficulty: item.difficulty as Difficulty,
      ...data,
      type: type 
    };
  } catch (error) {
    console.error("Failed to generate course challenge", error);
    throw error;
  }
};

export const validateSubmission = async (
  challenge: Challenge,
  userQuery: string,
  industry: Industry,
  customContext?: string
): Promise<ValidationResponse> => {
  const ai = getAiClient();

  const effectiveContext = industry === Industry.PERSONALIZED && customContext 
    ? customContext 
    : industry;

  // Handle MCQ Validation locally if needed, but here we assume validation call handles it or UI handles it. 
  // If type is MCQ, userQuery is the selected option.
  if (challenge.type === 'mcq') {
      const isCorrect = userQuery === challenge.correctAnswer;
      return {
          isCorrect,
          feedback: isCorrect ? "Correct! Well done." : `Incorrect. The correct answer was ${challenge.correctAnswer}.`,
          bestPractice: "Review the concept to strengthen understanding.",
          data: [],
          points: isCorrect ? 50 : 0
      };
  }

  const schemaDescription = challenge.schema.map(table => {
    const header = table.columns.join(" | ");
    const rows = table.data.map(row => row.join(" | ")).join("\n");
    return `Table: ${table.tableName}\n${header}\n${rows}`;
  }).join("\n\n");

  const prompt = `
    Act as a Senior Data Engineer and SQL Instructor.
    
    Context:
    - Domain: ${effectiveContext}
    - Challenge Type: ${challenge.type || 'sql'}
    - Task: ${challenge.task}
    - Schema (Sample Data):
    ${schemaDescription}
    - Required Concepts: ${challenge.requiredConcepts.join(", ")}
    
    User Submission:
    \`\`\`sql
    ${userQuery}
    \`\`\`

    Tasks:
    1. Validate if the SQL is syntactically correct.
    2. Check if the query solves the business task.
    3. Check if the query uses the required concepts.
    4. Generate a dummy result set.
    5. Assign points (0-100).
    6. Provide a "Best Practice" tip.

    Output JSON Schema:
    {
      "isCorrect": boolean,
      "feedback": "Concise feedback.",
      "bestPractice": "Professional SQL tip.",
      "points": number,
      "data": [ { "col1": "val1", ... } ]
    }
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    }));

    return JSON.parse(response.text || "{}") as ValidationResponse;
  } catch (error) {
    console.error("Validation failed", error);
    return {
      isCorrect: false,
      feedback: "System error during validation.",
      bestPractice: "Verify syntax.",
      data: [],
      points: 0
    };
  }
};

export const createExpertChat = (
  challenge: Challenge,
  industry: Industry,
  customContext?: string
): Chat => {
  const ai = getAiClient();
  const effectiveContext = industry === Industry.PERSONALIZED && customContext 
    ? customContext 
    : industry;

  const schemaDescription = challenge.schema.map(table => {
    const header = table.columns.join(" | ");
    const rows = table.data.map(row => row.join(" | ")).join("\n");
    return `Table: ${table.tableName}\n${header}\n${rows}`;
  }).join("\n\n");

  const systemInstruction = `
    You are an expert SQL Instructor.
    Context:
    - Industry: ${effectiveContext}
    - Topic: ${challenge.topic}
    - Type: ${challenge.type || 'sql'}
    - Task: ${challenge.task}
    - Schema: 
    ${schemaDescription}

    If Type is MCQ: Help them reason about the options.
    If Type is Debug: Help them find the bug without giving the fixed code immediately.
    If Type is Completion: Guide them on what goes in the blanks.
    
    Goal: Guide to solution without giving full answer. Be conversational.
  `;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction,
    }
  });
};

export const getLiveExpertSystemInstruction = (
  challenge: Challenge,
  industry: Industry,
  customContext?: string,
  currentCode?: string
): string => {
  const effectiveContext = industry === Industry.PERSONALIZED && customContext 
    ? customContext 
    : industry;

  return `
    You are a patient SQL Mentor for ${effectiveContext}.
    Challenge: "${challenge.title}" (${challenge.type || 'sql'}).
    Task: "${challenge.task}".
    Topic: "${challenge.topic}".
    User Code: "${currentCode || 'None'}"

    Guide them to the solution. If debug/completion, hint at the specific error or missing part.
  `;
};

export const generateBusinessBrief = async (customContext: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `
    Role: Technical Content Generator.
    Task: Create a professional, immersive mission brief (2-3 sentences).
    Context: "${customContext}".
    Output: Just the text.
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    }));
    return response.text?.trim() || customContext;
  } catch (error) {
    console.error("Failed to generate brief", error);
    return customContext;
  }
};

export const generateBundleMetadata = async (topic: string): Promise<{ title: string, industry: string, target_role: string, description: string }> => {
  const ai = getAiClient();
  const prompt = `
    Act as a Senior Curriculum Architect.
    Based on the topic: "${topic}", generate metadata for a SQL Learning Path Bundle.
    
    Output JSON Schema:
    {
      "title": "Professional title",
      "industry": "Industry string",
      "target_role": "Role",
      "description": "Description"
    }
  `;
  
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                industry: { type: Type.STRING },
                target_role: { type: Type.STRING },
                description: { type: Type.STRING }
            },
            required: ["title", "industry", "target_role", "description"]
        }
      }
    }));
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Failed to generate bundle metadata", error);
    throw error;
  }
};
