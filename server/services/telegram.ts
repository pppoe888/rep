import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { openaiService } from './openai.js';

class TelegramService {
  private bots: Map<string, TelegramBot> = new Map();

  async createBot(botId: string, token: string): Promise<boolean> {
    try {
      // Validate token format
      if (!token || !token.startsWith('bot') || token.length < 20) {
        console.log(`Invalid token format for bot ${botId}`);
        await storage.updateBot(botId, { isActive: false });
        return false;
      }

      const bot = new TelegramBot(token, { 
        polling: { 
          interval: 5000,
          autoStart: false 
        }
      });
      
      // Test the bot token first
      const botInfo = await bot.getMe();
      console.log(`Bot validated: ${botInfo.username}`);
      
      // Set up error handler before starting polling
      bot.on('polling_error', (error) => {
        console.log(`Bot ${botId} polling error: ${error.message}`);
        // Don't log 404 errors repeatedly
        if (error.message.includes('404 Not Found')) {
          this.stopBot(botId);
        }
      });
      
      // Set up message handler
      bot.on('message', async (msg) => {
        await this.handleMessage(botId, bot, msg);
      });

      // Start polling after setup
      await bot.startPolling();
      this.bots.set(botId, bot);
      
      // Update bot status to active
      await storage.updateBot(botId, { isActive: true });
      
      return true;
    } catch (error) {
      console.log(`Bot ${botId} creation failed: ${error.message}`);
      await storage.updateBot(botId, { isActive: false });
      return false;
    }
  }

  async stopBot(botId: string): Promise<boolean> {
    const bot = this.bots.get(botId);
    if (bot) {
      try {
        await bot.stopPolling();
      } catch (error) {
        console.log(`Error stopping bot ${botId}: ${error.message}`);
      }
      this.bots.delete(botId);
      await storage.updateBot(botId, { isActive: false });
      return true;
    }
    return false;
  }

  async stopAllBots(): Promise<void> {
    const botIds = Array.from(this.bots.keys());
    for (const botId of botIds) {
      await this.stopBot(botId);
    }
  }

  async sendMessage(botId: string, chatId: number, message: string): Promise<boolean> {
    const bot = this.bots.get(botId);
    if (bot) {
      try {
        await bot.sendMessage(chatId, message);
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    }
    return false;
  }

  private async handleMessage(botId: string, bot: TelegramBot, msg: any) {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    if (!userMessage) return;

    try {
      // Get bot configuration
      const botConfig = await storage.getBot(botId);
      if (!botConfig) return;

      // Store the user message
      await storage.createBotMessage({
        botId,
        message: userMessage,
        response: null,
      });

      // Generate response using OpenAI
      const response = await openaiService.generateResponse(
        userMessage,
        botConfig.personality || "You are a helpful assistant.",
        {
          model: botConfig.gptModel || "gpt-5",
          temperature: parseFloat(botConfig.temperature || "0.7"),
          maxTokens: parseInt(botConfig.maxTokens || "150"),
        }
      );

      // Send response back to user
      await bot.sendMessage(chatId, response);

      // Store the bot response
      await storage.createBotMessage({
        botId,
        message: userMessage,
        response,
      });

    } catch (error) {
      console.error('Error handling message:', error);
      await bot.sendMessage(chatId, 'Sorry, I encountered an error processing your message.');
    }
  }

  async testMessage(botId: string, message: string): Promise<string> {
    try {
      const botConfig = await storage.getBot(botId);
      if (!botConfig) throw new Error('Bot not found');

      const response = await openaiService.generateResponse(
        message,
        botConfig.personality || "You are a helpful assistant.",
        {
          model: botConfig.gptModel || "gpt-5",
          temperature: parseFloat(botConfig.temperature || "0.7"),
          maxTokens: parseInt(botConfig.maxTokens || "150"),
        }
      );

      // Store test message
      await storage.createBotMessage({
        botId,
        message,
        response,
      });

      return response;
    } catch (error) {
      console.error('Error testing message:', error);
      throw error;
    }
  }
}

export const telegramService = new TelegramService();
