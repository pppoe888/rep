interface GitHubFile {
  name: string;
  path: string;
  content?: string;
  download_url?: string;
  type: 'file' | 'dir';
}

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
}

class GitHubService {
  private async makeRequest(url: string, token: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`https://api.github.com${url}`, {
      ...options,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API ошибка: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await this.makeRequest('/user', token);
      return true;
    } catch (error) {
      console.error('Ошибка валидации токена GitHub:', error);
      return false;
    }
  }

  async getRepositories(token: string): Promise<GitHubRepo[]> {
    try {
      const repos = await this.makeRequest('/user/repos?sort=updated&per_page=50', token);
      return repos.map((repo: any) => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || '',
        private: repo.private,
        html_url: repo.html_url,
      }));
    } catch (error) {
      console.error('Ошибка получения репозиториев:', error);
      throw new Error('Не удалось получить список репозиториев');
    }
  }

  async getRepositoryFiles(repoFullName: string, token: string, path: string = ''): Promise<GitHubFile[]> {
    try {
      const files = await this.makeRequest(`/repos/${repoFullName}/contents/${path}`, token);
      
      if (Array.isArray(files)) {
        return files.map((file: any) => ({
          name: file.name,
          path: file.path,
          content: file.content ? atob(file.content) : undefined,
          download_url: file.download_url,
          type: file.type,
        }));
      } else {
        // Единственный файл
        return [{
          name: files.name,
          path: files.path,
          content: files.content ? atob(files.content) : undefined,
          download_url: files.download_url,
          type: files.type,
        }];
      }
    } catch (error) {
      console.error('Ошибка получения файлов:', error);
      throw new Error('Не удалось получить файлы репозитория');
    }
  }

  async getFileContent(repoFullName: string, filePath: string, token: string): Promise<string> {
    try {
      const file = await this.makeRequest(`/repos/${repoFullName}/contents/${filePath}`, token);
      return atob(file.content);
    } catch (error) {
      console.error('Ошибка получения содержимого файла:', error);
      throw new Error('Не удалось получить содержимое файла');
    }
  }

  async createOrUpdateFile(
    repoFullName: string,
    filePath: string,
    content: string,
    message: string,
    token: string,
    sha?: string
  ): Promise<void> {
    try {
      const body: any = {
        message,
        content: btoa(content),
      };

      if (sha) {
        body.sha = sha;
      }

      await this.makeRequest(`/repos/${repoFullName}/contents/${filePath}`, token, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Ошибка создания/обновления файла:', error);
      throw new Error('Не удалось создать/обновить файл');
    }
  }

  async deleteFile(
    repoFullName: string,
    filePath: string,
    message: string,
    sha: string,
    token: string
  ): Promise<void> {
    try {
      await this.makeRequest(`/repos/${repoFullName}/contents/${filePath}`, token, {
        method: 'DELETE',
        body: JSON.stringify({
          message,
          sha,
        }),
      });
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      throw new Error('Не удалось удалить файл');
    }
  }

  async createRepository(name: string, description: string, isPrivate: boolean, token: string): Promise<GitHubRepo> {
    try {
      const repo = await this.makeRequest('/user/repos', token, {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          private: isPrivate,
          auto_init: true,
        }),
      });

      return {
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || '',
        private: repo.private,
        html_url: repo.html_url,
      };
    } catch (error) {
      console.error('Ошибка создания репозитория:', error);
      throw new Error('Не удалось создать репозиторий');
    }
  }

  async syncProjectToGitHub(
    repoFullName: string,
    files: { path: string; content: string }[],
    token: string
  ): Promise<void> {
    try {
      for (const file of files) {
        await this.createOrUpdateFile(
          repoFullName,
          file.path,
          file.content,
          `Обновление ${file.path} через AI помощника`,
          token
        );
      }
    } catch (error) {
      console.error('Ошибка синхронизации проекта:', error);
      throw new Error('Не удалось синхронизировать проект с GitHub');
    }
  }
}

export const githubService = new GitHubService();