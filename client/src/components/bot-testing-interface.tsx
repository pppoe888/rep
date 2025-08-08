import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Play, RotateCcw, TestTubeDiagonal, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { BotMessage } from "@shared/schema";

interface BotTestingInterfaceProps {
  selectedBotId: string | null;
}

export function BotTestingInterface({ selectedBotId }: BotTestingInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  const { data: messages = [], refetch: refetchMessages } = useQuery<BotMessage[]>({
    queryKey: ["/api/bots", selectedBotId, "messages"],
    enabled: !!selectedBotId,
  });

  const testMessageMutation = useMutation({
    mutationFn: (data: { botId: string; message: string }) => 
      api.testBotMessage(data.botId, data.message),
    onSuccess: () => {
      setMessage("");
      refetchMessages();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !selectedBotId) return;
    
    testMessageMutation.mutate({
      botId: selectedBotId,
      message: message.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetChat = () => {
    refetchMessages();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TestTubeDiagonal className="w-5 h-5 text-green-600 mr-3" />
          Live Testing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-gray-200 rounded-lg h-96 flex flex-col">
          {/* Chat Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${selectedBotId ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="font-medium text-sm">Test Bot</span>
              <span className="text-xs text-gray-500 ml-2">
                {selectedBotId ? 'Ready' : 'Select a bot'}
              </span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {!selectedBotId ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a bot to start testing</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                  <p className="text-sm">Hello! I'm your bot. Send me a message to test my responses.</p>
                  <span className="text-xs text-gray-500">Just now</span>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {/* User Message */}
                  <div className="flex items-start justify-end">
                    <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs">
                      <p className="text-sm">{msg.message}</p>
                      <span className="text-xs text-blue-200">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Now'}
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center ml-3">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  
                  {/* Bot Response */}
                  {msg.response && (
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                        <p className="text-sm">{msg.response}</p>
                        <span className="text-xs text-gray-500">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Now'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {testMessageMutation.isPending && (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your test message..."
                disabled={!selectedBotId || testMessageMutation.isPending}
              />
              <Button 
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!selectedBotId || !message.trim() || testMessageMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="mt-6 space-y-4">
          <div className="flex space-x-2">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!selectedBotId}
              onClick={() => setIsActive(true)}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Testing
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={resetChat}
              disabled={!selectedBotId}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Chat
            </Button>
          </div>
          
          {/* Test Status */}
          {selectedBotId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span className="text-sm font-medium text-green-800">Bot is ready for testing</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
