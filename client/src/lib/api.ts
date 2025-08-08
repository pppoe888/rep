import { apiRequest } from "./queryClient";
import type { Bot, InsertBot, BotMessage } from "@shared/schema";

export const api = {
  // Bot operations
  async getBots(): Promise<Bot[]> {
    const response = await apiRequest("GET", "/api/bots");
    return response.json();
  },

  async createBot(bot: InsertBot): Promise<Bot> {
    const response = await apiRequest("POST", "/api/bots", bot);
    return response.json();
  },

  async getBot(id: string): Promise<Bot> {
    const response = await apiRequest("GET", `/api/bots/${id}`);
    return response.json();
  },

  async updateBot(id: string, updates: Partial<Bot>): Promise<Bot> {
    const response = await apiRequest("PATCH", `/api/bots/${id}`, updates);
    return response.json();
  },

  async deleteBot(id: string): Promise<void> {
    await apiRequest("DELETE", `/api/bots/${id}`);
  },

  async toggleBot(id: string): Promise<Bot> {
    const response = await apiRequest("POST", `/api/bots/${id}/toggle`);
    return response.json();
  },

  async testBotMessage(id: string, message: string): Promise<{ response: string }> {
    const response = await apiRequest("POST", `/api/bots/${id}/test`, { message });
    return response.json();
  },

  async getBotMessages(id: string, limit?: number): Promise<BotMessage[]> {
    const url = `/api/bots/${id}/messages${limit ? `?limit=${limit}` : ''}`;
    const response = await apiRequest("GET", url);
    return response.json();
  },

  async validateOpenAI(config: { model: string; temperature: string; maxTokens: string }): Promise<{ valid: boolean }> {
    const response = await apiRequest("POST", "/api/validate-openai", config);
    return response.json();
  },
};
