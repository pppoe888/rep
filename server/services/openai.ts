import OpenAI from "openai";

interface GPTConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || process.env.GPT_OSS_API_KEY || "your-api-key-here"
    });
  }

  async generateResponse(
    message: string, 
    personality: string, 
    config: GPTConfig
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: config.model, // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: personality
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate response from GPT");
    }
  }

  async generateResponse(chatParams: {
    message: string;
    systemPrompt: string;
    history: Array<{ role: string; content: string }>;
  }): Promise<string> {
    try {
      const messages = [
        { role: "system", content: chatParams.systemPrompt },
        ...chatParams.history,
        { role: "user", content: chatParams.message }
      ];

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0].message.content || "Извините, не удалось сгенерировать ответ.";
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate response from GPT");
    }
  }

  async validateConfiguration(config: GPTConfig): Promise<boolean> {
    try {
      await this.openai.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1,
      });
      return true;
    } catch (error) {
      console.error("OpenAI configuration validation failed:", error);
      return false;
    }
  }
}

export const openaiService = new OpenAIService();
