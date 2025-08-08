import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { telegramService } from "./services/telegram";
import { openaiService } from "./services/openai";
import { fileService } from "./services/fileService";
import { githubService } from "./services/githubService";
import { insertBotSchema, insertBotMessageSchema, insertProjectSchema, insertFileSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all bots for a user (demo user for now)
  app.get("/api/bots", async (req, res) => {
    try {
      // For demo purposes, using a fixed user ID
      const userId = "demo-user";
      const bots = await storage.getBotsByUserId(userId);
      res.json(bots);
    } catch (error) {
      console.error("Error fetching bots:", error);
      res.status(500).json({ message: "Failed to fetch bots" });
    }
  });

  // Create a new bot
  app.post("/api/bots", async (req, res) => {
    try {
      const validatedBot = insertBotSchema.parse(req.body);
      
      // For demo purposes, using a fixed user ID
      const userId = "demo-user";
      
      // Create bot in storage
      const bot = await storage.createBot(validatedBot, userId);
      
      // Initialize Telegram bot
      const success = await telegramService.createBot(bot.id, validatedBot.telegramToken);
      
      if (!success) {
        await storage.deleteBot(bot.id);
        return res.status(400).json({ message: "Failed to initialize Telegram bot. Please check your token." });
      }

      res.status(201).json(bot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bot configuration", errors: error.errors });
      }
      console.error("Error creating bot:", error);
      res.status(500).json({ message: "Failed to create bot" });
    }
  });

  // Get a specific bot
  app.get("/api/bots/:id", async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      res.json(bot);
    } catch (error) {
      console.error("Error fetching bot:", error);
      res.status(500).json({ message: "Failed to fetch bot" });
    }
  });

  // Update a bot
  app.patch("/api/bots/:id", async (req, res) => {
    try {
      const updates = req.body;
      const bot = await storage.updateBot(req.params.id, updates);
      
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }

      // If telegram token changed, restart the bot
      if (updates.telegramToken) {
        await telegramService.stopBot(bot.id);
        await telegramService.createBot(bot.id, updates.telegramToken);
      }

      res.json(bot);
    } catch (error) {
      console.error("Error updating bot:", error);
      res.status(500).json({ message: "Failed to update bot" });
    }
  });

  // Delete a bot
  app.delete("/api/bots/:id", async (req, res) => {
    try {
      await telegramService.stopBot(req.params.id);
      const success = await storage.deleteBot(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Bot not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bot:", error);
      res.status(500).json({ message: "Failed to delete bot" });
    }
  });

  // Start/stop bot
  app.post("/api/bots/:id/toggle", async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }

      let success = false;
      if (bot.isActive) {
        success = await telegramService.stopBot(bot.id);
      } else {
        success = await telegramService.createBot(bot.id, bot.telegramToken);
      }

      if (success) {
        const updatedBot = await storage.updateBot(bot.id, { isActive: !bot.isActive });
        res.json(updatedBot);
      } else {
        res.status(500).json({ message: "Failed to toggle bot status" });
      }
    } catch (error) {
      console.error("Error toggling bot:", error);
      res.status(500).json({ message: "Failed to toggle bot status" });
    }
  });

  // Test bot message
  app.post("/api/bots/:id/test", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await telegramService.testMessage(req.params.id, message);
      res.json({ response });
    } catch (error) {
      console.error("Error testing bot message:", error);
      res.status(500).json({ message: "Failed to test message" });
    }
  });

  // Get bot messages/chat history
  app.get("/api/bots/:id/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getBotMessages(req.params.id, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching bot messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Validate OpenAI configuration
  app.post("/api/validate-openai", async (req, res) => {
    try {
      const { model, temperature, maxTokens } = req.body;
      const config = {
        model: model || "gpt-5",
        temperature: parseFloat(temperature || "0.7"),
        maxTokens: parseInt(maxTokens || "150"),
      };

      const isValid = await openaiService.validateConfiguration(config);
      res.json({ valid: isValid });
    } catch (error) {
      console.error("Error validating OpenAI config:", error);
      res.status(500).json({ message: "Failed to validate configuration" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = "demo-user";
      const projects = await storage.getProjectsByUserId(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedProject = insertProjectSchema.parse(req.body);
      const userId = "demo-user";
      
      const project = await storage.createProject(validatedProject, userId);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const updates = req.body;
      const project = await storage.updateProject(req.params.id, updates);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // File routes
  app.get("/api/projects/:projectId/files", async (req, res) => {
    try {
      const files = await storage.getFilesByProjectId(req.params.projectId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/files", async (req, res) => {
    try {
      const validatedFile = insertFileSchema.parse(req.body);
      const file = await storage.createFile(validatedFile);
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid file data", errors: error.errors });
      }
      console.error("Error creating file:", error);
      res.status(500).json({ message: "Failed to create file" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.patch("/api/files/:id", async (req, res) => {
    try {
      const updates = req.body;
      const file = await storage.updateFile(req.params.id, updates);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json(file);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const success = await storage.deleteFile(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "File not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // AI File Generation routes
  app.post("/api/ai/generate-file", async (req, res) => {
    try {
      const { description, fileName, language, requirements } = req.body;
      
      if (!description || !fileName) {
        return res.status(400).json({ message: "Description and fileName are required" });
      }

      const content = await fileService.generateFileContent({
        description,
        fileName,
        language: language || fileService.getLanguageFromFileName(fileName),
        requirements,
      });

      res.json({ content });
    } catch (error) {
      console.error("Error generating file:", error);
      res.status(500).json({ message: "Failed to generate file" });
    }
  });

  app.post("/api/ai/edit-file", async (req, res) => {
    try {
      const { fileContent, editInstructions, language } = req.body;
      
      if (!fileContent || !editInstructions) {
        return res.status(400).json({ message: "FileContent and editInstructions are required" });
      }

      const content = await fileService.editFileContent({
        fileContent,
        editInstructions,
        language: language || "javascript",
      });

      res.json({ content });
    } catch (error) {
      console.error("Error editing file:", error);
      res.status(500).json({ message: "Failed to edit file" });
    }
  });

  app.post("/api/ai/analyze-code", async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }

      const analysis = await fileService.analyzeCode(code, language || "javascript");
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing code:", error);
      res.status(500).json({ message: "Failed to analyze code" });
    }
  });

  // GitHub Integration routes
  app.post("/api/github/validate-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const isValid = await githubService.validateToken(token);
      res.json({ valid: isValid });
    } catch (error) {
      console.error("Error validating GitHub token:", error);
      res.status(500).json({ message: "Failed to validate token" });
    }
  });

  app.post("/api/github/repositories", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const repositories = await githubService.getRepositories(token);
      res.json(repositories);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });

  app.post("/api/github/sync-project", async (req, res) => {
    try {
      const { projectId, repoFullName, token } = req.body;
      
      if (!projectId || !repoFullName || !token) {
        return res.status(400).json({ message: "ProjectId, repoFullName and token are required" });
      }

      const files = await storage.getFilesByProjectId(projectId);
      const filesToSync = files.map(file => ({
        path: file.path,
        content: file.content,
      }));

      await githubService.syncProjectToGitHub(repoFullName, filesToSync, token);
      res.json({ message: "Project synced successfully" });
    } catch (error) {
      console.error("Error syncing project:", error);
      res.status(500).json({ message: "Failed to sync project" });
    }
  });

  // AI Chat endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, systemPrompt, history } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await openaiService.generateResponse({
        message,
        systemPrompt: systemPrompt || "Вы умный AI помощник. Отвечайте полезно и по делу на русском языке.",
        history: history || [],
      });

      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
