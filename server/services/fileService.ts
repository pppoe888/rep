import { openaiService } from './openai.js';
import type { InsertFile, File } from '@shared/schema';

export interface FileGenerationRequest {
  description: string;
  fileName: string;
  language: string;
  requirements?: string;
}

export interface FileEditRequest {
  fileContent: string;
  editInstructions: string;
  language: string;
}

class FileService {
  async generateFileContent(request: FileGenerationRequest): Promise<string> {
    const prompt = `Создай файл ${request.fileName} на языке ${request.language}.
    
Описание: ${request.description}
${request.requirements ? `Требования: ${request.requirements}` : ''}

Верни только код без дополнительных объяснений. Код должен быть готов к использованию и следовать лучшим практикам.`;

    try {
      const response = await openaiService.generateResponse(
        prompt,
        "Ты опытный разработчик, создающий качественный код. Отвечай только кодом без объяснений.",
        {
          model: "gpt-5",
          temperature: 0.3,
          maxTokens: 2000,
        }
      );

      return response;
    } catch (error) {
      console.error('Ошибка генерации файла:', error);
      throw new Error('Не удалось сгенерировать файл');
    }
  }

  async editFileContent(request: FileEditRequest): Promise<string> {
    const prompt = `Отредактируй следующий код согласно инструкциям.

Текущий код:
\`\`\`${request.language}
${request.fileContent}
\`\`\`

Инструкции по редактированию: ${request.editInstructions}

Верни только обновленный код без дополнительных объяснений.`;

    try {
      const response = await openaiService.generateResponse(
        prompt,
        "Ты опытный разработчик, редактирующий код. Отвечай только кодом без объяснений.",
        {
          model: "gpt-5",
          temperature: 0.2,
          maxTokens: 2000,
        }
      );

      return response;
    } catch (error) {
      console.error('Ошибка редактирования файла:', error);
      throw new Error('Не удалось отредактировать файл');
    }
  }

  async analyzeCode(code: string, language: string): Promise<string> {
    const prompt = `Проанализируй следующий код на языке ${language} и дай рекомендации по улучшению:

\`\`\`${language}
${code}
\`\`\`

Предоставь анализ в формате:
- Качество кода
- Возможные проблемы
- Рекомендации по улучшению
- Соответствие лучшим практикам`;

    try {
      const response = await openaiService.generateResponse(
        prompt,
        "Ты опытный код-ревьюер, анализирующий качество кода.",
        {
          model: "gpt-5",
          temperature: 0.1,
          maxTokens: 1000,
        }
      );

      return response;
    } catch (error) {
      console.error('Ошибка анализа кода:', error);
      throw new Error('Не удалось проанализировать код');
    }
  }

  getLanguageFromFileName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'xml': 'xml',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
    };

    return languageMap[extension || ''] || 'text';
  }
}

export const fileService = new FileService();