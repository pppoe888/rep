import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderOpen, Github, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { ProjectCreationForm } from "@/components/project-creation-form";
import { ProjectFileManager } from "@/components/project-file-manager";
import { GitHubIntegration } from "@/components/github-integration";
import { AIChat } from "@/components/ai-chat";
import type { Project } from "@shared/schema";

export default function Projects() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete project');
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Проект удален.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setSelectedProjectId(null);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить проект",
        variant: "destructive",
      });
    },
  });

  const handleProjectCreated = (projectId: string) => {
    setShowCreateForm(false);
    setSelectedProjectId(projectId);
  };

  const handleDeleteProject = (project: Project) => {
    if (confirm(`Вы уверены, что хотите удалить проект "${project.name}"?`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4 w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto p-6 pt-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Мои Проекты</h1>
            <p className="text-gray-600">Управляйте своими проектами с помощью AI помощника</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Новый Проект
          </Button>
        </div>

        {showCreateForm && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Создать Новый Проект</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectCreationForm 
                  onProjectCreated={handleProjectCreated}
                  onCancel={() => setShowCreateForm(false)}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Projects List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Список Проектов</h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <Card 
                  key={project.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedProjectId === project.id ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{project.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {project.description || "Без описания"}
                        </p>
                        <div className="flex items-center mt-3 text-xs text-gray-500">
                          <FolderOpen className="w-3 h-3 mr-1" />
                          {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Недавно'}
                          {project.githubRepo && (
                            <>
                              <Github className="w-3 h-3 ml-3 mr-1" />
                              GitHub
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project);
                        }}
                        className="ml-2"
                      >
                        ×
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {projects.length === 0 && (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-8 text-center">
                    <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Нет проектов</h3>
                    <p className="text-gray-500 mb-4">Создайте свой первый проект с AI помощником</p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Создать Проект
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* File Manager */}
          <div className="lg:col-span-2">
            {selectedProjectId ? (
              <ProjectFileManager projectId={selectedProjectId} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите проект</h3>
                  <p className="text-gray-500">Выберите проект слева для управления файлами</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Chat */}
            <AIChat 
              title="AI Помощник"
              placeholder="Спросите AI о программировании..."
              systemPrompt="Вы опытный программист и AI помощник. Помогайте пользователям с вопросами по программированию, созданию проектов, и разработке. Отвечайте кратко и по делу на русском языке."
            />
            
            {/* GitHub Integration */}
            {selectedProjectId ? (
              <GitHubIntegration projectId={selectedProjectId} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Github className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">GitHub Интеграция</h3>
                  <p className="text-gray-500">Выберите проект для синхронизации с GitHub</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}