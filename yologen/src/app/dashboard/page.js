"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FiUpload, FiZap, FiCpu, FiDatabase, FiActivity, FiImage, FiSettings, FiMenu, FiLogOut } from "react-icons/fi";
import InferenceTab from "@/components/InferenceTab";
import TrainingTab from "@/components/TrainingTab";
import ModelsTab from "@/components/ModelsTab";
import DatasetsTab from "@/components/DatasetsTab";
import SettingsTab from "@/components/SettingsTab";
import DashboardStats from "@/components/DashboardStats";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, logout } = useAuth();

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: FiActivity },
    { id: "datasets", label: "Datasets", icon: FiImage },
    { id: "inference", label: "Inference", icon: FiZap },
    { id: "training", label: "Training", icon: FiCpu },
    { id: "models", label: "Models", icon: FiDatabase },
    { id: "settings", label: "Settings", icon: FiSettings },
  ];

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-black via-background to-black">
      {/* Modern Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-20 bg-card/40 backdrop-blur-xl border-r border-border/50 flex flex-col items-center py-6 z-50">
        {/* Logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
          <FiZap className="text-2xl text-primary-foreground" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-4 w-full px-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group relative w-14 h-14 rounded-xl flex items-center justify-center
                  transition-all duration-200 ease-out
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105' 
                    : 'hover:bg-card hover:scale-105 text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="text-xl" />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-card border border-border rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl">
                  <p className="text-sm font-medium">{tab.label}</p>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -right-3 w-1 h-8 bg-primary rounded-l-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Status Indicator */}
        <div className="mt-auto">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-20">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-card/60 backdrop-blur-xl border-b border-border/50">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {tabs.find(t => t.id === activeTab)?.label || "YOLO Generator"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Professional ML Training Platform
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right mr-3">
                <p className="text-sm font-medium text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <Badge 
                variant="outline" 
                className="border-primary/40 bg-primary/10 text-primary font-medium px-4 py-1.5 rounded-full"
              >
                <div className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                Active
              </Badge>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                <FiLogOut className="mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-8 py-6">
          <div className="max-w-screen-2xl mx-auto">
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <DashboardStats onNavigate={setActiveTab} />
              </div>
            )}
            
            {activeTab === "datasets" && (
              <div className="animate-in fade-in duration-500">
                <DatasetsTab />
              </div>
            )}
            
            {activeTab === "inference" && (
              <div className="animate-in fade-in duration-500">
                <InferenceTab />
              </div>
            )}
            
            {activeTab === "training" && (
              <div className="animate-in fade-in duration-500">
                <TrainingTab />
              </div>
            )}
            
            {activeTab === "models" && (
              <div className="animate-in fade-in duration-500">
                <ModelsTab />
              </div>
            )}
            
            {activeTab === "settings" && (
              <div className="animate-in fade-in duration-500">
                <SettingsTab />
              </div>
            )}
          </div>
        </main>

        {/* Floating Footer */}
        <footer className="mt-16 mb-8">
          <div className="mx-8 px-6 py-4 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">YOLO Generator</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Powered by YOLOv5-11 • FastAPI • Next.js
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">v1.0</Badge>
                <Badge variant="outline" className="text-xs">Production Ready</Badge>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </ProtectedRoute>
  );
}

