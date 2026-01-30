"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FiZap,
  FiCpu,
  FiDatabase,
  FiActivity,
  FiImage,
  FiSettings,
  FiLogOut,
  FiMenu
} from "react-icons/fi";
import InferenceTab from "@/components/InferenceTab";
import TrainingTab from "@/components/TrainingTab";
import ModelsTab from "@/components/ModelsTab";
import DatasetsTab from "@/components/DatasetsTab";
import SettingsTab from "@/components/SettingsTab";
import DashboardStats from "@/components/DashboardStats";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tabs = [
    { id: "dashboard", label: "Overview", icon: FiActivity },
    { id: "datasets", label: "Datasets", icon: FiImage },
    { id: "inference", label: "Playground", icon: FiZap },
    { id: "training", label: "Training", icon: FiCpu },
    { id: "models", label: "Model Registry", icon: FiDatabase },
    { id: "settings", label: "Settings", icon: FiSettings },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground overflow-hidden relative selection:bg-primary/20">
        {/* Ambient Background Mesh */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-mesh" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[100px] animate-mesh animation-delay-4000" />
          <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[80px]" />
        </div>

        <div className="relative z-10 flex h-screen">
          {/* Floating Sidebar */}
          <aside
            className={cn(
              "hidden md:flex flex-col m-4 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-xl shadow-2xl transition-all duration-300",
              sidebarOpen ? "w-64" : "w-20 items-center"
            )}
          >
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-white/5">
              <div className="flex items-center gap-3 text-primary">
                <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-white/10 shadow-lg shadow-primary/20">
                  <FiZap className="text-xl" />
                </div>
                {sidebarOpen && (
                  <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Nebula
                  </span>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                      isActive
                        ? "text-white shadow-lg shadow-primary/20 bg-primary/90"
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {/* Active Indicator Glow */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}

                    <Icon className={cn("text-lg flex-shrink-0 transition-transform", isActive && "scale-110", !sidebarOpen && "mx-auto")} />

                    {sidebarOpen && (
                      <span>{tab.label}</span>
                    )}

                    {/* Tooltip for collapsed state could go here */}
                  </button>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/5">
              <div className={cn("bg-white/5 rounded-xl p-3 flex items-center gap-3 transition-colors hover:bg-white/10", !sidebarOpen && "justify-center p-2")}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-inner ring-2 ring-black/20" />

                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.username || "Admin"}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || "Developer"}</p>
                  </div>
                )}

                {sidebarOpen && (
                  <Button
                    onClick={logout}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <FiLogOut className="text-sm" />
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Header */}
            <header className="h-20 flex items-center justify-between px-8 py-4 z-20">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-muted-foreground"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <FiMenu className="text-xl" />
                </Button>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight capitalize">{tabs.find(t => t.id === activeTab)?.label}</h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">Manage your ML pipeline with ease</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant="outline" className="hidden sm:flex bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                  System Online
                </Badge>
                {/* Additional header actions could go here */}
              </div>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto px-4 pb-4 md:pr-4 custom-scrollbar">
              <div className="h-full rounded-2xl border border-white/5 bg-card/30 backdrop-blur-sm p-6 md:p-8 shadow-inner overflow-y-auto">
                <div className="max-w-7xl mx-auto animate-fade-in space-y-8">
                  {/* Render Active Tab */}
                  {activeTab === "dashboard" && <DashboardStats onNavigate={setActiveTab} />}
                  {activeTab === "datasets" && <DatasetsTab />}
                  {activeTab === "inference" && <InferenceTab />}
                  {activeTab === "training" && <TrainingTab />}
                  {activeTab === "models" && <ModelsTab />}
                  {activeTab === "settings" && <SettingsTab />}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
