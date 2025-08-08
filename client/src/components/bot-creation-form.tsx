import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Brain, Rocket, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { InsertBot } from "@shared/schema";

const botFormSchema = z.object({
  name: z.string().min(1, "Bot name is required"),
  description: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  telegramToken: z.string().min(1, "Telegram token is required"),
  gptModel: z.string().default("gpt-5"),
  personality: z.string().optional(),
  temperature: z.string().default("0.7"),
  maxTokens: z.string().default("150"),
});

type BotFormData = z.infer<typeof botFormSchema>;

interface BotCreationFormProps {
  onBotCreated: (botId: string) => void;
}

export function BotCreationForm({ onBotCreated }: BotCreationFormProps) {
  const [temperature, setTemperature] = useState(0.7);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BotFormData>({
    resolver: zodResolver(botFormSchema),
    defaultValues: {
      name: "",
      description: "",
      username: "",
      telegramToken: "",
      gptModel: "gpt-5",
      personality: "",
      temperature: "0.7",
      maxTokens: "150",
    },
  });

  const createBotMutation = useMutation({
    mutationFn: (data: InsertBot) => api.createBot(data),
    onSuccess: (bot) => {
      toast({
        title: "Success!",
        description: "Bot created successfully and is now ready for deployment.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      onBotCreated(bot.id);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bot. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BotFormData) => {
    createBotMutation.mutate({
      ...data,
      isActive: false,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PlusCircle className="w-5 h-5 text-blue-600 mr-3" />
          Bot Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Bot Name</Label>
            <Input
              id="name"
              placeholder="Enter your bot name"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Describe what your bot does"
              className="resize-none"
              {...form.register("description")}
            />
          </div>

          <div>
            <Label htmlFor="username">Bot Username</Label>
            <Input
              id="username"
              placeholder="Enter bot username (without @)"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="telegramToken">Telegram Bot Token</Label>
            <Input
              id="telegramToken"
              type="password"
              placeholder="Enter your bot token from @BotFather"
              {...form.register("telegramToken")}
            />
            {form.formState.errors.telegramToken && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.telegramToken.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Get your token from @BotFather on Telegram</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Brain className="w-4 h-4 text-blue-600 mr-2" />
              GPT-OSS Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="gptModel">Model</Label>
                <Select
                  value={form.watch("gptModel")}
                  onValueChange={(value) => form.setValue("gptModel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-5">gpt-5</SelectItem>
                    <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                    <SelectItem value="gpt-4">gpt-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="personality">Personality</Label>
                <Textarea
                  id="personality"
                  rows={3}
                  placeholder="Define your bot's personality and behavior..."
                  className="resize-none"
                  {...form.register("personality")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <div className="mt-2">
                    <Slider
                      value={[temperature]}
                      onValueChange={(value) => {
                        setTemperature(value[0]);
                        form.setValue("temperature", value[0].toString());
                      }}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{temperature}</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4000"
                    {...form.register("maxTokens")}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={createBotMutation.isPending}
            >
              {createBotMutation.isPending ? (
                <>Creating...</>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Create Bot
                </>
              )}
            </Button>
            <Button type="button" variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
