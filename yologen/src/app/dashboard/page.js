"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiZap, FiCpu, FiDatabase, FiActivity, FiImage, FiSettings, FiLogOut } from "react-icons/fi";
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
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <FiZap className="text-xl text-primary" />
            <span className="font-bold">YOLO Gen</span>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                `}
                >
                  <Icon className="text-lg" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
            >
              <FiLogOut className="mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-card/50 px-8 flex items-center justify-between">
            <h1 className="font-semibold text-lg capitalize">{activeTab}</h1>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary">
                Active
              </Badge>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-8">
            <div className="max-w-6xl mx-auto">
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <DashboardStats onNavigate={setActiveTab} />
                </div>
              )}

              {activeTab === "datasets" && <DatasetsTab />}
              {activeTab === "inference" && <InferenceTab />}
              {activeTab === "training" && <TrainingTab />}
              {activeTab === "models" && <ModelsTab />}
              {activeTab === "settings" && <SettingsTab />}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

