import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Play, Pause, Trash2, Plus, Bot as BotIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Bot } from "@shared/schema";

interface BotManagementDashboardProps {
  onSelectBot: (botId: string) => void;
}

export function BotManagementDashboard({ onSelectBot }: BotManagementDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bots = [], isLoading } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });

  const toggleBotMutation = useMutation({
    mutationFn: (botId: string) => api.toggleBot(botId),
    onSuccess: (bot) => {
      toast({
        title: "Success",
        description: `Bot ${bot.isActive ? 'started' : 'stopped'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle bot status",
        variant: "destructive",
      });
    },
  });

  const deleteBotMutation = useMutation({
    mutationFn: (botId: string) => api.deleteBot(botId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bot deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bot",
        variant: "destructive",
      });
    },
  });

  const handleToggleBot = (bot: Bot) => {
    toggleBotMutation.mutate(bot.id);
  };

  const handleDeleteBot = (bot: Bot) => {
    if (confirm(`Are you sure you want to delete ${bot.name}?`)) {
      deleteBotMutation.mutate(bot.id);
    }
  };

  const getStatusColor = (isActive: boolean | null) => {
    return isActive ? "bg-green-500" : "bg-red-500";
  };

  const getStatusText = (isActive: boolean | null) => {
    return isActive ? "Active" : "Inactive";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BotIcon className="w-5 h-5 text-blue-600 mr-3" />
            Your Bots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded mb-4"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BotIcon className="w-5 h-5 text-blue-600 mr-3" />
          Your Bots
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot: Bot) => (
            <div key={bot.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 truncate">{bot.name}</h3>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(bot.isActive)}`} />
                  <span className={`text-xs font-medium ${bot.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {getStatusText(bot.isActive)}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {bot.description || "No description provided"}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>@{bot.username}</span>
                <span>
                  {bot.createdAt ? new Date(bot.createdAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => onSelectBot(bot.id)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Test
                </Button>
                
                <Button 
                  size="sm"
                  className="text-xs bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleToggleBot(bot)}
                  disabled={toggleBotMutation.isPending}
                >
                  {bot.isActive ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>
                
                <Button 
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDeleteBot(bot)}
                  disabled={deleteBotMutation.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add New Bot Card */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-blue-600 transition-colors duration-200 cursor-pointer min-h-[200px]">
            <Plus className="w-8 h-8 text-gray-400 mb-2" />
            <span className="font-medium text-gray-600">Create New Bot</span>
            <span className="text-xs text-gray-500">Build your next Telegram bot</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
