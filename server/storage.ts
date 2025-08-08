import { type User, type InsertUser, type Bot, type InsertBot, type BotMessage, type InsertBotMessage, type Project, type InsertProject, type File, type InsertFile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getBot(id: string): Promise<Bot | undefined>;
  getBotsByUserId(userId: string): Promise<Bot[]>;
  createBot(bot: InsertBot, userId: string): Promise<Bot>;
  updateBot(id: string, bot: Partial<Bot>): Promise<Bot | undefined>;
  deleteBot(id: string): Promise<boolean>;
  
  getBotMessages(botId: string, limit?: number): Promise<BotMessage[]>;
  createBotMessage(message: InsertBotMessage): Promise<BotMessage>;
  
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUserId(userId: string): Promise<Project[]>;
  createProject(project: InsertProject, userId: string): Promise<Project>;
  updateProject(id: string, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  getFile(id: string): Promise<File | undefined>;
  getFilesByProjectId(projectId: string): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: string, file: Partial<File>): Promise<File | undefined>;
  deleteFile(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private bots: Map<string, Bot>;
  private botMessages: Map<string, BotMessage>;
  private projects: Map<string, Project>;
  private files: Map<string, File>;

  constructor() {
    this.users = new Map();
    this.bots = new Map();
    this.botMessages = new Map();
    this.projects = new Map();
    this.files = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBot(id: string): Promise<Bot | undefined> {
    return this.bots.get(id);
  }

  async getBotsByUserId(userId: string): Promise<Bot[]> {
    return Array.from(this.bots.values()).filter(bot => bot.userId === userId);
  }

  async createBot(insertBot: InsertBot, userId: string): Promise<Bot> {
    const id = randomUUID();
    const bot: Bot = {
      ...insertBot,
      id,
      userId,
      createdAt: new Date(),
      description: insertBot.description || null,
      gptModel: insertBot.gptModel || "gpt-5",
      personality: insertBot.personality || null,
      temperature: insertBot.temperature || "0.7",
      maxTokens: insertBot.maxTokens || "150",
      isActive: insertBot.isActive || false,
    };
    this.bots.set(id, bot);
    return bot;
  }

  async updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined> {
    const bot = this.bots.get(id);
    if (!bot) return undefined;
    
    const updatedBot = { ...bot, ...updates };
    this.bots.set(id, updatedBot);
    return updatedBot;
  }

  async deleteBot(id: string): Promise<boolean> {
    return this.bots.delete(id);
  }

  async getBotMessages(botId: string, limit = 50): Promise<BotMessage[]> {
    return Array.from(this.botMessages.values())
      .filter(message => message.botId === botId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createBotMessage(insertMessage: InsertBotMessage): Promise<BotMessage> {
    const id = randomUUID();
    const message: BotMessage = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      response: insertMessage.response || null,
    };
    this.botMessages.set(id, message);
    return message;
  }

  // Project methods
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }

  async createProject(insertProject: InsertProject, userId: string): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      userId,
      createdAt: new Date(),
      description: insertProject.description || null,
      githubRepo: insertProject.githubRepo || null,
      githubToken: insertProject.githubToken || null,
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updates };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    // Удаляем все файлы проекта
    const projectFiles = Array.from(this.files.values()).filter(file => file.projectId === id);
    projectFiles.forEach(file => this.files.delete(file.id));
    
    return this.projects.delete(id);
  }

  // File methods
  async getFile(id: string): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByProjectId(projectId: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(file => file.projectId === projectId);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = randomUUID();
    const file: File = {
      ...insertFile,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      language: insertFile.language || "javascript",
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: string, updates: Partial<File>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...updates, updatedAt: new Date() };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: string): Promise<boolean> {
    return this.files.delete(id);
  }
}

export const storage = new MemStorage();
