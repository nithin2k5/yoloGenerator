"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FiServer, FiMonitor, FiCheckCircle, FiXCircle, FiRefreshCw, FiGlobe, FiDatabase, FiCpu } from "react-icons/fi";

export default function SettingsTab() {
  const [backendStatus, setBackendStatus] = useState("checking");
  const [backendInfo, setBackendInfo] = useState(null);
  const [systemStats, setSystemStats] = useState({
    frontend: "active",
    version: "1.0.0",
    uptime: "Active"
  });

  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/health");
      if (response.ok) {
        const data = await response.json();
        setBackendStatus("connected");
        setBackendInfo(data);
      } else {
        setBackendStatus("error");
      }
    } catch (error) {
      setBackendStatus("disconnected");
      setBackendInfo(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-600/20 text-green-500 border-green-500/30">
            <FiCheckCircle className="mr-1" /> Connected
          </Badge>
        );
      case "disconnected":
        return (
          <Badge className="bg-red-600/20 text-red-500 border-red-500/30">
            <FiXCircle className="mr-1" /> Disconnected
          </Badge>
        );
      case "checking":
        return (
          <Badge className="bg-yellow-600/20 text-yellow-500 border-yellow-500/30">
            <FiRefreshCw className="mr-1 animate-spin" /> Checking...
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-600/20 text-gray-500 border-gray-500/30">
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-foreground">Settings & Status</h2>
        <p className="text-muted-foreground mt-1.5 font-medium">System information and configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <FiServer className="text-2xl text-primary" />
                </div>
                <div>
                  <CardTitle>Backend Server</CardTitle>
                  <CardDescription>Python FastAPI</CardDescription>
                </div>
              </div>
              {getStatusBadge(backendStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Endpoint</span>
                <span className="text-sm font-mono font-medium">http://localhost:8000</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium">{backendStatus === "connected" ? "Running" : "Offline"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">API Docs</span>
                <a 
                  href="http://localhost:8000/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  /docs
                </a>
              </div>
            </div>

            <Button 
              onClick={checkBackendStatus} 
              variant="outline" 
              className="w-full border-border"
              disabled={backendStatus === "checking"}
            >
              <FiRefreshCw className={`mr-2 ${backendStatus === "checking" ? "animate-spin" : ""}`} />
              Refresh Status
            </Button>

            {backendStatus === "disconnected" && (
              <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
                <p className="text-sm text-red-500 font-medium">Backend is not running</p>
                <p className="text-xs text-red-400 mt-1">
                  Start the backend server: <code className="bg-background px-1 py-0.5 rounded">cd backend && ./run_backend.sh</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Frontend Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <FiMonitor className="text-2xl text-primary" />
                </div>
                <div>
                  <CardTitle>Frontend Application</CardTitle>
                  <CardDescription>Next.js 15</CardDescription>
                </div>
              </div>
              <Badge className="bg-green-600/20 text-green-500 border-green-500/30">
                <FiCheckCircle className="mr-1" /> Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Local URL</span>
                <span className="text-sm font-mono font-medium">http://localhost:3001</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Framework</span>
                <span className="text-sm font-medium">Next.js 15.5.0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <span className="text-sm text-muted-foreground">Theme</span>
                <span className="text-sm font-medium">Dark (Neutral)</span>
              </div>
            </div>

            <div className="p-4 bg-green-600/10 border border-green-600/30 rounded-lg">
              <p className="text-sm text-green-500 font-medium">Frontend is running</p>
              <p className="text-xs text-green-400 mt-1">
                All systems operational
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                <FiGlobe className="text-2xl text-primary" />
              </div>
              <div>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>Available services</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: "Inference", path: "/api/inference", status: backendStatus === "connected" },
                { name: "Training", path: "/api/training", status: backendStatus === "connected" },
                { name: "Models", path: "/api/models", status: backendStatus === "connected" },
                { name: "Annotations", path: "/api/annotations", status: backendStatus === "connected" },
                { name: "Datasets", path: "/api/annotations/datasets", status: backendStatus === "connected" },
              ].map((endpoint, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${endpoint.status ? "bg-green-500" : "bg-red-500"}`} />
                    <div>
                      <p className="text-sm font-medium">{endpoint.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{endpoint.path}</p>
                    </div>
                  </div>
                  <Badge variant={endpoint.status ? "default" : "secondary"} className="text-xs">
                    {endpoint.status ? "Ready" : "Offline"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                <FiCpu className="text-2xl text-primary" />
              </div>
              <div>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Platform details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">Platform</span>
              <span className="text-sm font-medium">YOLO Generator v{systemStats.version}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">ML Framework</span>
              <span className="text-sm font-medium">YOLOv8 (Ultralytics)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">UI Components</span>
              <span className="text-sm font-medium">shadcn/ui</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">Styling</span>
              <span className="text-sm font-medium">Tailwind CSS</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">Font</span>
              <span className="text-sm font-medium">Inter</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/30 lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 gap-2 border-border hover:border-primary/50"
                onClick={() => window.open("http://localhost:8000/docs", "_blank")}
              >
                <FiGlobe className="text-2xl text-primary" />
                <span className="text-sm font-medium">API Docs</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 gap-2 border-border hover:border-primary/50"
                onClick={checkBackendStatus}
              >
                <FiRefreshCw className="text-2xl text-primary" />
                <span className="text-sm font-medium">Refresh</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 gap-2 border-border hover:border-primary/50"
                onClick={() => window.location.href = "/"}
              >
                <FiDatabase className="text-2xl text-primary" />
                <span className="text-sm font-medium">Dashboard</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4 gap-2 border-border hover:border-primary/50"
                onClick={() => window.open("https://github.com/ultralytics/ultralytics", "_blank")}
              >
                <FiServer className="text-2xl text-primary" />
                <span className="text-sm font-medium">YOLO Docs</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Panel */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>About This Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm text-muted-foreground">
              YOLO Generator is a comprehensive ML training and inference platform designed for object detection tasks. 
              It provides a complete workflow from dataset creation and annotation to model training and deployment.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-lg border border-border">
                <h4 className="font-semibold mb-2 text-sm">Features</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Image annotation tool</li>
                  <li>• Dataset management</li>
                  <li>• Model training</li>
                  <li>• Real-time inference</li>
                  <li>• Model export</li>
                </ul>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <h4 className="font-semibold mb-2 text-sm">Technologies</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Next.js 15</li>
                  <li>• FastAPI</li>
                  <li>• YOLOv8</li>
                  <li>• PyTorch</li>
                  <li>• Tailwind CSS</li>
                </ul>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <h4 className="font-semibold mb-2 text-sm">Requirements</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Python 3.8+</li>
                  <li>• Node.js 18+</li>
                  <li>• 8GB RAM (min)</li>
                  <li>• GPU (recommended)</li>
                  <li>• 10GB storage</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

