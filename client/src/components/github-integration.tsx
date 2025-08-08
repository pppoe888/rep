import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Github, Key, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface GitHubIntegrationProps {
  projectId: string;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
}

export function GitHubIntegration({ projectId }: GitHubIntegrationProps) {
  const [githubToken, setGithubToken] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);
  
  const { toast } = useToast();

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
    onSuccess: (data) => {
      if (data.githubToken) {
        setGithubToken(data.githubToken);
        setIsTokenValid(true);
      }
      if (data.githubRepo) {
        setSelectedRepo(data.githubRepo);
      }
    },
  });

  const { data: repositories = [], refetch: refetchRepositories } = useQuery<GitHubRepo[]>({
    queryKey: ["/api/github/repositories", githubToken],
    enabled: isTokenValid && !!githubToken,
    queryFn: async () => {
      const response = await fetch("/api/github/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: githubToken }),
      });
      if (!response.ok) throw new Error("Failed to fetch repositories");
      return response.json();
    },
  });

  const validateTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch("/api/github/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error("Failed to validate token");
      return response.json();
    },
    onSuccess: (data) => {
      setIsTokenValid(data.valid);
      if (data.valid) {
        toast({
          title: "Успешно",
          description: "GitHub токен валиден.",
        });
        refetchRepositories();
      } else {
        toast({
          title: "Ошибка",
          description: "Неверный GitHub токен.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setIsTokenValid(false);
      toast({
        title: "Ошибка",
        description: "Не удалось проверить токен.",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (updates: Partial<Project>) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update project");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Настройки GitHub обновлены.",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить настройки.",
        variant: "destructive",
      });
    },
  });

  const syncProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/github/sync-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          repoFullName: selectedRepo,
          token: githubToken,
        }),
      });
      if (!response.ok) throw new Error("Failed to sync project");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Проект синхронизирован с GitHub.",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось синхронизировать проект.",
        variant: "destructive",
      });
    },
  });

  const handleValidateToken = () => {
    if (!githubToken) {
      toast({
        title: "Ошибка",
        description: "Введите GitHub токен.",
        variant: "destructive",
      });
      return;
    }
    validateTokenMutation.mutate(githubToken);
  };

  const handleSaveSettings = () => {
    updateProjectMutation.mutate({
      githubToken,
      githubRepo: selectedRepo,
    });
  };

  const handleSyncProject = () => {
    if (!selectedRepo) {
      toast({
        title: "Ошибка",
        description: "Выберите репозиторий для синхронизации.",
        variant: "destructive",
      });
      return;
    }
    syncProjectMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Github className="w-5 h-5 mr-2" />
          GitHub Интеграция
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="githubToken">GitHub Personal Access Token</Label>
            <div className="flex space-x-2">
              <Input
                id="githubToken"
                type="password"
                value={githubToken}
                onChange={(e) => {
                  setGithubToken(e.target.value);
                  setIsTokenValid(false);
                }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="flex-1"
              />
              <Button
                onClick={handleValidateToken}
                disabled={validateTokenMutation.isPending || !githubToken}
                variant="outline"
              >
                <Key className="w-4 h-4 mr-2" />
                {validateTokenMutation.isPending ? "Проверка..." : "Проверить"}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Получите токен в настройках GitHub: Settings → Developer settings → Personal access tokens
            </p>
            {isTokenValid && (
              <div className="flex items-center mt-2 text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Токен валиден</span>
              </div>
            )}
            {githubToken && !isTokenValid && !validateTokenMutation.isPending && (
              <div className="flex items-center mt-2 text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Требуется проверка токена</span>
              </div>
            )}
          </div>
        </div>

        {/* Repository Selection */}
        {isTokenValid && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="repository">Выберите репозиторий</Label>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите репозиторий" />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo.full_name} value={repo.full_name}>
                      <div className="flex items-center">
                        <span>{repo.full_name}</span>
                        {repo.private && (
                          <span className="ml-2 text-xs bg-gray-200 px-1 rounded">приватный</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRepo && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Выбранный репозиторий: <strong>{selectedRepo}</strong>
                </p>
                {repositories.find(r => r.full_name === selectedRepo)?.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {repositories.find(r => r.full_name === selectedRepo)?.description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            onClick={handleSaveSettings}
            disabled={updateProjectMutation.isPending || !isTokenValid}
            variant="outline"
            className="flex-1"
          >
            {updateProjectMutation.isPending ? "Сохранение..." : "Сохранить настройки"}
          </Button>
          
          {selectedRepo && (
            <Button
              onClick={handleSyncProject}
              disabled={syncProjectMutation.isPending || !selectedRepo}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {syncProjectMutation.isPending ? "Синхронизация..." : "Синхронизировать"}
            </Button>
          )}
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Что делает синхронизация:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Загружает все файлы проекта в выбранный GitHub репозиторий</li>
            <li>• Создает коммиты с описанием изменений</li>
            <li>• Сохраняет структуру файлов и папок</li>
            <li>• Позволяет работать с кодом совместно с командой</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}