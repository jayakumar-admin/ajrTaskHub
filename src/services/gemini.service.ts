import { Injectable, inject } from "@angular/core";
import { GoogleGenAI, Type } from "@google/genai";
import {
  Task,
  TaskPriority,
  User,
  TaskReportSummary,
  TaskStatus,
  TaskType,
} from "../shared/interfaces";
import { NotificationService } from "./notification.service";
import { UserService } from "./user.service";

// Define an interface for the filter criteria that Gemini will return
interface ReportFilterCriteria {
  status?: TaskStatus | "all" | "overdue";
  priority?: TaskPriority | "all";
  assigneeUsername?: string | "all";
  keywords?: string[];
  dueDateStart?: string; // YYYY-MM-DD
  dueDateEnd?: string; // YYYY-MM-DD
  type?: TaskType | "all";
}

@Injectable({
  providedIn: "root",
})
export class GeminiService {
  private ai: GoogleGenAI;
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);

  constructor() {
    if(false) {
      this.notificationService.showToast(
        "Gemini API key is not configured.",
        "error"
      );
      throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey:'AIzaSyBiwXDl3jzVVDun1iHhzWoM3-n8HSMjMjA' });
  }

  async parseTextToTask(
    text: string
  ): Promise<Partial<Omit<Task, "id" | "created_at">> | null> {
    const users = this.userService.users();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const systemInstruction = `You are an expert task parser. Your job is to analyze user text and convert it into a structured JSON object for a task management application. Adhere strictly to the provided JSON schema.
      - Today's date is ${today}. Use this to resolve relative dates like 'tomorrow' or 'next Tuesday'.
      - For the 'priority' field, you MUST use one of these exact, case-sensitive values: 'Low', 'Medium', 'High', 'Urgent'.
      - For the 'assignee_username' field, you MUST use one of these exact usernames if one is mentioned: ${users
        .map((u) => u.username)
        .join(", ")}. If no user is mentioned, omit the field.
      - The final output MUST be a single, valid JSON object and nothing else.`;

    const userPrompt = `User request: "${text}"`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0, // Deterministic parsing
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "A concise title for the task.",
              },
              description: {
                type: Type.STRING,
                description: "A detailed description of the task. Can be null.",
              },
              due_date: {
                type: Type.STRING, // YYYY-MM-DD or null
                description: "The due date in YYYY-MM-DD format. Can be null.",
              },
              priority: {
                type: Type.STRING,
                enum: ["Low", "Medium", "High", "Urgent"], // Stricter enum
                description: "The priority of the task. Omit if not specified.",
              },
              assignee_username: {
                type: Type.STRING,
                description: `The username of the person the task is assigned to. Must be one of: ${users
                  .map((u) => u.username)
                  .join(", ")}. Can be null.`,
              },
              tags: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "A list of relevant tags. Can be empty.",
              },
              duration: {
                type: Type.STRING,
                description:
                  'An estimated duration, e.g., "2 hours", "3 days". Can be null.',
              },
            },
            required: ["title"], // Title is always required
          },
        },
      });

      // Robustly extract JSON from the AI's response, handling surrounding text or markdown.
      const text = response.text ?? "";
      let jsonStr = text.trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch && jsonMatch[0]) {
        jsonStr = jsonMatch[0];
      } else {
        throw new Error("No valid JSON object found in AI response.");
      }

      const parsedJson = JSON.parse(jsonStr);

      const assignee = users.find(
        (u) =>
          u.username.toLowerCase() ===
          parsedJson.assignee_username?.toLowerCase()
      );

      // Validate and default dates, explicitly handling the string "null"
      const isValidDateString = (dateStr: any) =>
        typeof dateStr === "string" &&
        dateStr !== "null" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

      const finalDueDate = isValidDateString(parsedJson.due_date)
        ? parsedJson.due_date
        : today;
      // Assume start_date is not parsed by AI currently, always default to today
      const finalStartDate = today;

      const partialTask: Partial<Omit<Task, "id" | "created_at">> = {
        title: parsedJson.title,
        description: parsedJson.description || "",
        due_date: finalDueDate,
        priority:
          parsedJson.priority &&
          ["Low", "Medium", "High", "Urgent"].includes(parsedJson.priority)
            ? parsedJson.priority
            : "Medium", // Default priority
        assign_to: assignee ? assignee.id : undefined, // Assign ID if user found
        tags: parsedJson.tags || [],
        duration: parsedJson.duration || "",
        type: "Task", // Default type
        status: "todo", // Default status
        approval_required: false,
        reminder_option: "None",
        repeat_option: "None",
        start_date: finalStartDate, // Always default start date to today
      };

      return partialTask;
    } catch (error) {
      console.error("Error parsing text with Gemini:", error);
      this.notificationService.showToast(
        "AI Assistant failed to understand the request or returned invalid JSON.",
        "error"
      );
      return null;
    }
  }
  
  async generateResumeSection(
    sectionType: 'summary' | 'description',
    context: { [key: string]: string }
  ): Promise<string> {
    let prompt = '';
    if (sectionType === 'summary') {
      prompt = `Write a compelling and professional summary for a resume. The candidate's name is ${context.fullName} and their key skills are: ${context.skills}. The summary should be 2-3 sentences long.`;
    } else if (sectionType === 'description') {
      prompt = `Write 3 concise, action-oriented bullet points for a resume detailing the responsibilities of a ${context.jobTitle} at ${context.company}. Start each bullet point with an action verb.`;
    }

    if (!prompt) return '';

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.7 }
      });
      return response.text.trim();
    } catch (error) {
      console.error('Error generating resume section:', error);
      this.notificationService.showToast('AI failed to generate content.', 'error');
      return '';
    }
  }

  async generateFullResume(role: string): Promise<any> {
    const systemInstruction = `You are a professional resume writer. Generate a complete, high-quality, and realistic resume for a fictional person in the specified role. Populate all fields of the provided JSON schema. Ensure the experience and education are logical for the role.`;
    const userPrompt = `Generate a complete resume for a person who is a ${role}.`;

    const fullResumeSchema = {
        type: Type.OBJECT,
        properties: {
            fullName: { type: Type.STRING, description: "A realistic full name." },
            email: { type: Type.STRING, description: "A professional-looking fictional email address." },
            phone: { type: Type.STRING, description: "A fictional phone number in (xxx) xxx-xxxx format." },
            address: { type: Type.STRING, description: "A fictional address (City, State)." },
            summary: { type: Type.STRING, description: "A 2-4 sentence professional summary." },
            experience: {
                type: Type.ARRAY,
                description: "An array of 2-3 past job experiences.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        jobTitle: { type: Type.STRING },
                        company: { type: Type.STRING },
                        dates: { type: Type.STRING, description: "e.g., 'Jan 2020 - Present' or 'Jun 2018 - Dec 2019'" },
                        description: { type: Type.STRING, description: "A 3-4 line description of responsibilities, formatted with bullet points (use '\\n- ')."}
                    },
                    required: ['jobTitle', 'company', 'dates', 'description']
                }
            },
            education: {
                type: Type.ARRAY,
                description: "An array of 1-2 educational qualifications.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        degree: { type: Type.STRING },
                        school: { type: Type.STRING },
                        dates: { type: Type.STRING, description: "e.g., '2016 - 2020'" }
                    },
                    required: ['degree', 'school', 'dates']
                }
            },
            skills: { type: Type.STRING, description: "A comma-separated list of 8-12 relevant skills for the role." }
        },
        required: ['fullName', 'email', 'phone', 'address', 'summary', 'experience', 'education', 'skills']
    };

    try {
        const response = await this.ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: fullResumeSchema,
              temperature: 0.8
            }
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating full resume:", error);
        this.notificationService.showToast('AI failed to generate a full resume. Please try again.', 'error');
        return null;
    }
  }


  /**
   * Simulates an Edge Function to generate a task report summary.
   * This method filters tasks based on AI-parsed criteria and then uses Gemini to summarize and aggregates data for visualizations.
   * @param reportPrompt A natural language prompt for the report (e.g., "tasks due this week for John").
   * @param allTasks The complete list of tasks available.
   * @returns A `TaskReportSummary` object or null if an error occurs.
   */
  async generateTaskReport(
    reportPrompt: string,
    allTasks: Task[]
  ): Promise<TaskReportSummary | null> {
    const users = this.userService.users();
    const todayISO = new Date().toISOString().split("T")[0];

    // --- Step 1: Ask Gemini to infer filter criteria from the report prompt ---
    const filterInstructionPrompt = `Given the user's report request: "${reportPrompt}", infer specific filter criteria.
    Available task statuses: ${[
      "todo",
      "in-progress",
      "review",
      "completed",
    ].join(", ")}.
    Available task priorities: ${["Low", "Medium", "High", "Urgent"].join(
      ", "
    )}.
    Available task types: ${[
      "Task",
      "Order",
      "Bugfix",
      "Shopping",
      "Others",
    ].join(", ")}.
    Available user usernames: ${users.map((u) => u.username).join(", ")}.
    Today's date is ${todayISO}.
    Return ONLY a JSON object with the following structure, setting fields to 'all' or omitting if no specific criteria are inferred.
    For assignee, use the exact username if provided.
    {
      status?: "todo" | "in-progress" | "review" | "completed" | "all" | "overdue",
      priority?: "Low" | "Medium" | "High" | "Urgent" | "all",
      assigneeUsername?: string | "all",
      keywords?: string[],
      dueDateStart?: "YYYY-MM-DD",
      dueDateEnd?: "YYYY-MM-DD",
      type?: "Task" | "Order" | "Bugfix" | "Shopping" | "Others" | "all"
    }`;

    const filterSchema: { type: Type; properties: any; required: string[] } = {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          enum: [
            "todo",
            "in-progress",
            "review",
            "completed",
            "all",
            "overdue",
          ],
        },
        priority: {
          type: Type.STRING,
          enum: ["Low", "Medium", "High", "Urgent", "all"],
        },
        assigneeUsername: { type: Type.STRING },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        dueDateStart: { type: Type.STRING },
        dueDateEnd: { type: Type.STRING },
        type: {
          type: Type.STRING,
          enum: ["Task", "Order", "Bugfix", "Shopping", "Others", "all"],
        },
      },
      required: [],
    };

    let criteria: ReportFilterCriteria = {};
    try {
      const filterResponse = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: filterInstructionPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: filterSchema,
          temperature: 0.1, // Keep deterministic for filtering
        },
      });
      criteria = JSON.parse(
        filterResponse.text ?? "{}"
      ) as ReportFilterCriteria;

      // Ensure keywords is an array even if Gemini returns null
      if (criteria.keywords && !Array.isArray(criteria.keywords)) {
        criteria.keywords = [String(criteria.keywords)]; // Convert to array if it's a single string
      } else if (!criteria.keywords) {
        criteria.keywords = [];
      }
    } catch (error) {
      console.warn(
        "AI failed to parse report filter criteria, defaulting to all tasks.",
        error
      );
      criteria = { status: "all" }; // Fallback to get all tasks
    }

    // --- Step 2: Apply client-side filtering based on inferred criteria ---
    let filteredTasks = allTasks.filter((task) => {
      // Status filter
      if (criteria.status && criteria.status !== "all") {
        if (criteria.status === "overdue") {
          const today = new Date(todayISO);
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          if (
            task.status !== "completed" &&
            dueDate.getTime() < today.getTime() === false
          )
            return false;
        } else if (task.status !== criteria.status) {
          return false;
        }
      }

      // Priority filter
      if (
        criteria.priority &&
        criteria.priority !== "all" &&
        task.priority !== criteria.priority
      ) {
        return false;
      }

      // Assignee filter
      if (criteria.assigneeUsername && criteria.assigneeUsername !== "all") {
        const assignee = users.find(
          (u) =>
            u.username.toLowerCase() ===
            criteria.assigneeUsername?.toLowerCase()
        );
        if (!assignee || task.assign_to !== assignee.id) {
          return false;
        }
      }

      // Type filter
      if (
        criteria.type &&
        criteria.type !== "all" &&
        task.type !== criteria.type
      ) {
        return false;
      }

      // Keywords filter (title, description, tags)
      if (criteria.keywords && criteria.keywords.length > 0) {
        const taskText = `${task.title} ${task.description} ${task.tags.join(
          " "
        )}`.toLowerCase();
        if (
          !criteria.keywords.some((keyword) =>
            taskText.includes(keyword.toLowerCase())
          )
        ) {
          return false;
        }
      }

      // Due Date range filter
      if (criteria.dueDateStart) {
        if (task.due_date < criteria.dueDateStart) return false;
      }
      if (criteria.dueDateEnd) {
        if (task.due_date > criteria.dueDateEnd) return false;
      }

      return true; // Task passes all filters
    });

    // If the only filter was 'overdue' and no other tasks, ensure it filters
    if (criteria.status === "overdue") {
      const today = new Date(todayISO);
      today.setHours(0, 0, 0, 0);
      filteredTasks = filteredTasks.filter((task) => {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return (
          task.status !== "completed" && dueDate.getTime() < today.getTime()
        );
      });
    }

    if (filteredTasks.length === 0) {
      this.notificationService.showToast(
        "No tasks found matching your report criteria.",
        "info"
      );
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        reviewTasks: 0,
        overdueTasks: 0,
        priorityDistribution: [],
        statusDistribution: [],
        typeDistribution: [],
        tasksByDate: [],
        summaryText: "No tasks found for the specified report criteria.",
      };
    }

    // --- Step 3: Generate a human-readable summary using Gemini ---
    const tasksForSummary = filteredTasks.map((task) => ({
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      assignee: task.assigned_to_username,
      tags: task.tags,
      type: task.type,
    }));

    const summaryInstruction = `Provide a concise human-readable summary of the following tasks, considering the user's report prompt: "${reportPrompt}".
    Highlight key statistics like total tasks, completed, in-progress, and any notable trends or overdue items.
    Tasks: ${JSON.stringify(tasksForSummary)}.`;

    let summaryText = "Summary could not be generated.";
    try {
      const summaryResponse = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: summaryInstruction,
        config: {
          temperature: 0.7, // More creative for summary text
        },
      });
      summaryText = (summaryResponse.text ?? "").trim();
    } catch (error) {
      console.error("Error generating summary with Gemini:", error);
      this.notificationService.showToast(
        "Failed to generate report summary.",
        "error"
      );
    }

    // --- Step 4: Aggregate data for charts ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;
    let reviewTasks = 0;
    let overdueTasks = 0;

    const priorityMap = new Map<TaskPriority, number>();
    const statusMap = new Map<TaskStatus, number>();
    const typeMap = new Map<TaskType, number>();
    const tasksByDateMap = new Map<string, number>(); // YYYY-MM-DD -> count

    filteredTasks.forEach((task) => {
      // Status counts
      switch (task.status) {
        case "completed":
          completedTasks++;
          break;
        case "in-progress":
          inProgressTasks++;
          break;
        case "todo":
          todoTasks++;
          break;
        case "review":
          reviewTasks++;
          break;
      }

      // Overdue tasks
      if (
        task.status !== "completed" &&
        new Date(task.due_date).getTime() < today.getTime()
      ) {
        overdueTasks++;
      }

      // Priority distribution
      priorityMap.set(task.priority, (priorityMap.get(task.priority) || 0) + 1);

      // Status distribution (for charts, includes completed)
      statusMap.set(task.status, (statusMap.get(task.status) || 0) + 1);

      // Type distribution
      typeMap.set(task.type, (typeMap.get(task.type) || 0) + 1);

      // Tasks by date (for line chart, using due date)
      const dueDateStr = task.due_date; // Already in YYYY-MM-DD
      tasksByDateMap.set(dueDateStr, (tasksByDateMap.get(dueDateStr) || 0) + 1);
    });

    const priorityDistribution = Array.from(priorityMap.entries()).map(
      ([priority, count]) => ({ priority, count })
    );
    const statusDistribution = Array.from(statusMap.entries()).map(
      ([status, count]) => ({ status, count })
    );
    const typeDistribution = Array.from(typeMap.entries()).map(
      ([type, count]) => ({ type, count })
    );
    const tasksByDate = Array.from(tasksByDateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totalTasks: filteredTasks.length,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      overdueTasks,
      priorityDistribution,
      statusDistribution,
      typeDistribution,
      tasksByDate,
      summaryText,
    };
  }
}