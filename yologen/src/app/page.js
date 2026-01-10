"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FiUpload, FiZap, FiCpu, FiDatabase, FiActivity, FiImage, FiSettings } from "react-icons/fi";
import InferenceTab from "@/components/InferenceTab";
import TrainingTab from "@/components/TrainingTab";
import ModelsTab from "@/components/ModelsTab";
import DatasetsTab from "@/components/DatasetsTab";
import SettingsTab from "@/components/SettingsTab";
import DashboardStats from "@/components/DashboardStats";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center shadow-md">
                <FiZap className="text-primary text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">YOLO Generator</h1>
                <p className="text-xs text-muted-foreground font-medium">ML Model Training Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-primary/50 text-primary font-medium px-3 py-1">
                <FiActivity className="mr-1.5" /> System Active
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl bg-card/80 backdrop-blur-sm p-1.5 rounded-xl border border-border shadow-lg">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg font-medium transition-all"
            >
              <FiActivity className="mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="datasets" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg font-medium transition-all"
            >
              <FiImage className="mr-2" />
              Datasets
            </TabsTrigger>
            <TabsTrigger 
              value="inference" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg font-medium transition-all"
            >
              <FiZap className="mr-2" />
              Inference
            </TabsTrigger>
            <TabsTrigger 
              value="training" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg font-medium transition-all"
            >
              <FiCpu className="mr-2" />
              Training
            </TabsTrigger>
            <TabsTrigger 
              value="models" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg font-medium transition-all"
            >
              <FiDatabase className="mr-2" />
              Models
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg font-medium transition-all"
            >
              <FiSettings className="mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h2>
                <p className="text-muted-foreground mt-1.5 font-medium">Overview of your ML operations</p>
              </div>
            </div>
            <DashboardStats onNavigate={setActiveTab} />
          </TabsContent>

          <TabsContent value="datasets">
            <DatasetsTab />
          </TabsContent>

          <TabsContent value="inference">
            <InferenceTab />
          </TabsContent>

          <TabsContent value="training">
            <TrainingTab />
          </TabsContent>

          <TabsContent value="models">
            <ModelsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            YOLO Generator - Powered by YOLOv8 & FastAPI
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Professional ML Training Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
