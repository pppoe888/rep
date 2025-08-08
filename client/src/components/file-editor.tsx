import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Bot, Eye, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { File } from "@shared/schema";

interface FileEditorProps {
  fileId: string;
}

export function FileEditor({ fileId }: FileEditorProps) {
  const [content, setContent] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: file, isLoading } = useQuery<File>({
    queryKey: ["/api/files", fileId],
    enabled: !!fileId,
    onSuccess: (data) => {
      setContent(data.content);
    },
  });

  const saveFileMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!response.ok) throw new Error("Failed to save file");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Файл сохранен.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files", fileId] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить файл.",
        variant: "destructive",
      });
    },
  });

  const editWithAIMutation = useMutation({
    mutationFn: async (instructions: string) => {
      const response = await fetch("/api/ai/edit-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileContent: content,
          editInstructions: instructions,
          language: file?.language || "javascript",
        }),
      });
      if (!response.ok) throw new Error("Failed to edit file with AI");
      const { content: newContent } = await response.json();
      return newContent;
    },
    onSuccess: (newContent) => {
      setContent(newContent);
      setEditInstructions("");
      toast({
        title: "Успешно",
        description: "Файл отредактирован с помощью AI.",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отредактировать файл с помощью AI.",
        variant: "destructive",
      });
    },
  });

  const analyzeCode = async () => {
    if (!content || !file) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: content,
          language: file.language || "javascript",
        }),
      });
      
      if (!response.ok) throw new Error("Failed to analyze code");
      const { analysis: codeAnalysis } = await response.json();
      setAnalysis(codeAnalysis);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проанализировать код.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    saveFileMutation.mutate(content);
  };

  const handleAIEdit = () => {
    if (!editInstructions.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите инструкции для редактирования.",
        variant: "destructive",
      });
      return;
    }
    editWithAIMutation.mutate(editInstructions);
  };

  const resetContent = () => {
    if (file) {
      setContent(file.content);
      toast({
        title: "Сброшено",
        description: "Содержимое файла восстановлено.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Загрузка файла...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!file) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Файл не найден</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Редактор: {file.name}
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetContent}
                disabled={content === file.content}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Сбросить
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeCode}
                disabled={isAnalyzing || !content}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isAnalyzing ? "Анализ..." : "Анализ кода"}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saveFileMutation.isPending || content === file.content}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveFileMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Содержимое файла</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-sm min-h-96 resize-none"
                placeholder="Содержимое файла..."
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3 flex items-center">
                <Bot className="w-4 h-4 mr-2" />
                AI Редактирование
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="editInstructions">Инструкции для AI</Label>
                  <Input
                    id="editInstructions"
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    placeholder="Опишите, что изменить в коде..."
                  />
                </div>
                <Button
                  onClick={handleAIEdit}
                  disabled={editWithAIMutation.isPending || !editInstructions.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  {editWithAIMutation.isPending ? "Редактирование..." : "Редактировать с AI"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Анализ кода
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
              {analysis}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}