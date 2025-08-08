import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { InsertProject, Project } from "@shared/schema";

const projectFormSchema = z.object({
  name: z.string().min(1, "Название проекта обязательно"),
  description: z.string().optional(),
  githubRepo: z.string().optional(),
  githubToken: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectCreationFormProps {
  onProjectCreated: (projectId: string) => void;
  onCancel: () => void;
}

export function ProjectCreationForm({ onProjectCreated, onCancel }: ProjectCreationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      githubRepo: "",
      githubToken: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject): Promise<Project> => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    onSuccess: (project) => {
      toast({
        title: "Успешно!",
        description: "Проект создан успешно.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onProjectCreated(project.id);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать проект.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Название проекта</Label>
        <Input
          id="name"
          placeholder="Введите название проекта"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="Опишите ваш проект"
          className="resize-none"
          {...form.register("description")}
        />
      </div>

      <div>
        <Label htmlFor="githubRepo">GitHub Репозиторий (опционально)</Label>
        <Input
          id="githubRepo"
          placeholder="username/repository-name"
          {...form.register("githubRepo")}
        />
      </div>

      <div>
        <Label htmlFor="githubToken">GitHub Token (опционально)</Label>
        <Input
          id="githubToken"
          type="password"
          placeholder="Введите токен для интеграции с GitHub"
          {...form.register("githubToken")}
        />
        <p className="text-xs text-gray-500 mt-1">
          Токен нужен для синхронизации с GitHub. Получите его в настройках GitHub.
        </p>
      </div>

      <div className="flex space-x-4">
        <Button 
          type="submit" 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={createProjectMutation.isPending}
        >
          {createProjectMutation.isPending ? "Создание..." : "Создать Проект"}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          disabled={createProjectMutation.isPending}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}