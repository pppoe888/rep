import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Edit, Trash2, Bot, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileEditor } from "@/components/file-editor";
import type { File } from "@shared/schema";

interface ProjectFileManagerProps {
  projectId: string;
}

export function ProjectFileManager({ projectId }: ProjectFileManagerProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileDescription, setNewFileDescription] = useState("");
  const [newFileLanguage, setNewFileLanguage] = useState("javascript");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery<File[]>({
    queryKey: ["/api/projects", projectId, "files"],
    enabled: !!projectId,
  });

  const createFileMutation = useMutation({
    mutationFn: async (data: { description: string; fileName: string; language: string }) => {
      // Generate file content using AI
      const generateResponse = await fetch("/api/ai/generate-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!generateResponse.ok) throw new Error("Failed to generate file");
      const { content } = await generateResponse.json();

      // Create file
      const createResponse = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: data.fileName,
          path: data.fileName,
          content,
          language: data.language,
        }),
      });
      
      if (!createResponse.ok) throw new Error("Failed to create file");
      return createResponse.json();
    },
    onSuccess: (file) => {
      toast({
        title: "Успешно!",
        description: "Файл создан с помощью AI.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      setSelectedFileId(file.id);
      setShowCreateForm(false);
      setNewFileName("");
      setNewFileDescription("");
      setNewFileLanguage("javascript");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать файл.",
        variant: "destructive",
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete file");
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Файл удален.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      setSelectedFileId(null);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить файл.",
        variant: "destructive",
      });
    },
  });

  const handleCreateFile = () => {
    if (!newFileName || !newFileDescription) {
      toast({
        title: "Ошибка",
        description: "Название файла и описание обязательны.",
        variant: "destructive",
      });
      return;
    }

    createFileMutation.mutate({
      description: newFileDescription,
      fileName: newFileName,
      language: newFileLanguage,
    });
  };

  const handleDeleteFile = (file: File) => {
    if (confirm(`Вы уверены, что хотите удалить файл "${file.name}"?`)) {
      deleteFileMutation.mutate(file.id);
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      javascript: "bg-yellow-100 text-yellow-800",
      typescript: "bg-blue-100 text-blue-800",
      python: "bg-green-100 text-green-800",
      java: "bg-orange-100 text-orange-800",
      html: "bg-red-100 text-red-800",
      css: "bg-pink-100 text-pink-800",
      json: "bg-gray-100 text-gray-800",
    };
    return colors[language] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Файлы проекта</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
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
              <FileText className="w-5 h-5 mr-2" />
              Файлы проекта
            </CardTitle>
            <Button
              onClick={() => setShowCreateForm(true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              AI Создание
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Создать файл с помощью AI</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fileName">Название файла</Label>
                  <Input
                    id="fileName"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="example.js"
                  />
                </div>
                <div>
                  <Label htmlFor="fileDescription">Описание для AI</Label>
                  <Textarea
                    id="fileDescription"
                    value={newFileDescription}
                    onChange={(e) => setNewFileDescription(e.target.value)}
                    placeholder="Опишите, какой файл вы хотите создать..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="fileLanguage">Язык программирования</Label>
                  <Select value={newFileLanguage} onValueChange={setNewFileLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="css">CSS</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateFile}
                    disabled={createFileMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createFileMutation.isPending ? (
                      <>
                        <Bot className="w-4 h-4 mr-2 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        Создать
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={createFileMutation.isPending}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedFileId === file.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedFileId(file.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">{file.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getLanguageColor(file.language || "text")}`}>
                      {file.language}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {files.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет файлов</h3>
                <p className="text-gray-500 mb-4">Создайте первый файл с помощью AI</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Bot className="w-4 h-4 mr-2" />
                  Создать файл
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedFileId && (
        <FileEditor fileId={selectedFileId} />
      )}
    </div>
  );
}