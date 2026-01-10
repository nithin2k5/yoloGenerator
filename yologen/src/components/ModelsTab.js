"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FiDatabase, FiDownload, FiTrash2, FiInfo, FiRefreshCw } from "react-icons/fi";

export default function ModelsTab() {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/models/list");
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error("Error fetching models:", error);
      // Show demo data if backend is not available
      setModels([
        {
          name: "demo_model_v1",
          path: "/runs/detect/demo_model_v1/weights/best.pt",
          size: 6291456,
          created: Date.now() / 1000
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleDownload = async (modelName) => {
    try {
      const response = await fetch(`http://localhost:8000/api/models/download/${modelName}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${modelName}_best.pt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Error downloading model. Make sure the backend is running.");
    }
  };

  const handleDelete = async (modelName) => {
    if (!confirm(`Are you sure you want to delete model "${modelName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/models/delete/${modelName}`, {
        method: "DELETE"
      });
      const data = await response.json();
      
      if (data.success) {
        alert("Model deleted successfully");
        fetchModels();
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting model. Make sure the backend is running.");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Trained Models</h2>
          <p className="text-muted-foreground">Manage your trained YOLO models</p>
        </div>
        <Button
          onClick={fetchModels}
          disabled={isLoading}
          variant="outline"
          className="border-border"
        >
          <FiRefreshCw className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.length > 0 ? (
          models.map((model, index) => (
            <Card key={index} className="bg-card border-border hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <FiDatabase className="text-2xl text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{model.name}</CardTitle>
                      <Badge className="mt-1 bg-primary/20 text-primary border-primary/30">
                        Trained
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium">{formatFileSize(model.size)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium text-xs">
                      {formatDate(model.created)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(model.name)}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    size="sm"
                  >
                    <FiDownload className="mr-1" />
                    Download
                  </Button>
                  <Button
                    onClick={() => handleDelete(model.name)}
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    size="sm"
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FiDatabase className="text-6xl text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground mb-2">No trained models found</p>
              <p className="text-sm text-muted-foreground">
                Train a model to see it here
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FiInfo />
            About Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Models are stored in the <code className="bg-background px-1 py-0.5 rounded">runs/detect</code> directory
            </p>
            <p>
              • Each training run creates a new model with unique weights
            </p>
            <p>
              • Download models to use them in production or share with others
            </p>
            <p>
              • Models can be loaded directly into the inference engine
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

