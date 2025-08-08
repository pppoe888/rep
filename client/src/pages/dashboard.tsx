import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Sidebar } from "@/components/sidebar";
import { BotCreationForm } from "@/components/bot-creation-form";
import { BotTestingInterface } from "@/components/bot-testing-interface";
import { BotManagementDashboard } from "@/components/bot-management-dashboard";

export default function Dashboard() {
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="flex h-screen pt-16">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Telegram Bot</h1>
              <p className="text-gray-600">Build intelligent Telegram bots powered by GPT-OSS in minutes</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <BotCreationForm onBotCreated={setSelectedBotId} />
              <BotTestingInterface selectedBotId={selectedBotId} />
            </div>

            <div className="mt-8">
              <BotManagementDashboard onSelectBot={setSelectedBotId} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
