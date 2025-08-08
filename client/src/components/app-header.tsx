import { Link, useLocation } from "wouter";
import { Bot, FolderOpen, Home } from "lucide-react";

export function AppHeader() {
  const [location] = useLocation();

  const navigation = [
    { name: "Главная", href: "/", icon: Home },
    { name: "Проекты", href: "/projects", icon: FolderOpen },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Bot className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-800">
                  GPT-OSS Bot Creator
                </h1>
              </div>
            </Link>
          </div>

          <nav className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}