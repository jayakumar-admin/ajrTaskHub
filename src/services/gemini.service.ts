import { Injectable, inject } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskReportSummary, User, TaskPriority, TaskStatus, TaskType } from '../shared/interfaces';
import { NotificationService } from './notification.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  private ai: GoogleGenAI;

  constructor() {
    // FIX: Initialize GoogleGenAI according to guidelines
    // The API key MUST be provided as an environment variable `process.env.API_KEY`
    if (!process.env.API_KEY) {
      console.error("CRITICAL: Gemini API Key is missing from environment variables (process.env.API_KEY)");
      this.notificationService.showToast("Gemini API Key is not configured.", "error", 10000);
      // Fallback to a dummy implementation to avoid crashing the app
      this.ai = { models: {} } as GoogleGenAI; 
      return;
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Parses natural language text into a structured task object.
   */
  async parseTextToTask(text: string): Promise<Partial<Omit<Task, 'id' | 'created_at'>> | null> {
    if (!this.ai.models) return null;
    const users = this.userService.users();
    const userListForPrompt = users.map(u => `${u.username} (ID: ${u.id})`).join(', ');

    const systemInstruction = `You are an intelligent task parsing assistant for a project management app. Your goal is to extract structured data from a user's natural language input.
- Today's date is ${new Date().toISOString().split('T')[0]}.
- If a date is mentioned like "tomorrow", "next Friday", or "in 2 days", calculate the absolute date in YYYY-MM-DD format.
- Identify the assignee from the following list of users: ${userListForPrompt}. If a username is mentioned, map it to their ID. If no specific user is mentioned, do not set the 'assign_to' field.
- Extract a title, description, due_date, priority, tags, duration, and assignee ID.
- The 'priority' must be one of 'Low', 'Medium', 'High', 'Urgent'. Default to 'Medium' if not specified.
- The 'tags' should be an array of strings.
- The 'duration' should be a string like "2 hours", "3 days".
`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Parse the following text into a JSON object: "${text}"`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    due_date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
                    priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Urgent'] },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    duration: { type: Type.STRING },
                    assign_to: { type: Type.STRING, description: "The user ID of the assignee" },
                }
            }
        }
      });

      const jsonString = response.text;
      return JSON.parse(jsonString) as Partial<Omit<Task, 'id' | 'created_at'>>;
    } catch (error) {
      console.error('Error parsing text to task with Gemini:', error);
      this.notificationService.showToast('AI task parsing failed.', 'error');
      return null;
    }
  }

  /**
   * Generates a comprehensive report summary based on a user prompt and task data.
   */
  async generateTaskReport(prompt: string, tasks: Task[]): Promise<TaskReportSummary | null> {
    if (!this.ai.models) return null;
    
    // Sanitize tasks to send only necessary data
    const tasksForPrompt = tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      type: t.type,
      due_date: t.due_date,
      assign_to: t.assign_to,
    }));

    const systemInstruction = `You are a data analyst assistant for a task management app. Your goal is to analyze a list of tasks and a user prompt to generate a JSON report.
- Today's date is ${new Date().toISOString().split('T')[0]}.
- Analyze the user's prompt to understand what they are asking for.
- Based on the prompt, filter and analyze the provided task data.
- Your response MUST be a single JSON object matching the provided schema.
- 'summaryText' should be a friendly, natural language summary of the findings.
- All other fields should be aggregations of the task data.
- 'tasksByDate' should only include dates for tasks that are relevant to the user's query and should be sorted by date.
`;
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User Prompt: "${prompt}"\n\nTask Data: ${JSON.stringify(tasksForPrompt)}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                totalTasks: { type: Type.NUMBER },
                completedTasks: { type: Type.NUMBER },
                inProgressTasks: { type: Type.NUMBER },
                todoTasks: { type: Type.NUMBER },
                reviewTasks: { type: Type.NUMBER },
                overdueTasks: { type: Type.NUMBER },
                priorityDistribution: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { priority: { type: Type.STRING }, count: { type: Type.NUMBER } } } },
                statusDistribution: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, count: { type: Type.NUMBER } } } },
                typeDistribution: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, count: { type: Type.NUMBER } } } },
                tasksByDate: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, count: { type: Type.NUMBER } } } },
                summaryText: { type: Type.STRING }
            }
          }
        }
      });
      
      const jsonString = response.text;
      return JSON.parse(jsonString) as TaskReportSummary;
    } catch (error) {
      console.error('Error generating task report with Gemini:', error);
      this.notificationService.showToast('AI report generation failed.', 'error');
      return null;
    }
  }

  async generateResumeSection(section: 'summary' | 'description', context: any): Promise<string | null> {
    if (!this.ai.models) return null;
    
    let prompt = '';
    if (section === 'summary') {
      prompt = `Write a professional resume summary for a person named ${context.fullName} with skills in ${context.skills}. The summary should be 2-3 sentences long.`;
    } else if (section === 'description') {
      prompt = `Write 3-4 bullet points describing the responsibilities and achievements for a ${context.jobTitle} at ${context.company}. Start each bullet point with '- '.`;
    }

    try {
      const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
      });
      return response.text;
    } catch (error) {
      console.error(`Error generating resume ${section}:`, error);
      this.notificationService.showToast(`AI failed to generate resume ${section}.`, 'error');
      return null;
    }
  }

  async generateFullResume(jobRole: string): Promise<any | null> {
    if (!this.ai.models) return null;
    
    const systemInstruction = "You are an expert resume writer. Generate a complete, realistic resume in JSON format based on the provided job role. The JSON structure should match the schema exactly.";

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a resume for a "${jobRole}" role.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              address: { type: Type.STRING },
              summary: { type: Type.STRING },
              skills: { type: Type.STRING },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    jobTitle: { type: Type.STRING },
                    company: { type: Type.STRING },
                    dates: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    degree: { type: Type.STRING },
                    school: { type: Type.STRING },
                    dates: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      
      const jsonString = response.text;
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error generating full resume with Gemini:', error);
      this.notificationService.showToast('AI resume generation failed.', 'error');
      return null;
    }
  }
}
