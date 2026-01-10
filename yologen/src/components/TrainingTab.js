"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FiUpload, FiPlay, FiRefreshCw, FiCpu, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";

export default function TrainingTab() {
  const [configFile, setConfigFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState("yolov8n.pt");
  const [epochs, setEpochs] = useState(100);
  const [batchSize, setBatchSize] = useState(16);
  const [imgSize, setImgSize] = useState(640);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingJobs, setTrainingJobs] = useState([
    {
      job_id: "demo-job-1",
      status: "completed",
      config: { epochs: 50, batch_size: 16 },
      progress: 100
    }
  ]);

  const handleConfigChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setConfigFile(file);
    }
  };

  const handleStartTraining = async () => {
    if (!configFile) {
      alert("Please upload a dataset YAML configuration file");
      return;
    }

    setIsTraining(true);
    const formData = new FormData();
    formData.append("dataset_yaml", configFile);

    const config = {
      epochs: parseInt(epochs),
      batch_size: parseInt(batchSize),
      img_size: parseInt(imgSize),
      model_name: selectedModel
    };

    try {
      const response = await fetch("http://localhost:8000/api/training/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config,
          dataset_yaml: configFile.name
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Training job ${data.job_id} started!`);
        // Refresh jobs list
        fetchTrainingJobs();
      }
    } catch (error) {
      console.error("Training error:", error);
      alert("Error starting training. Make sure the backend is running on port 8000.");
    } finally {
      setIsTraining(false);
    }
  };

  const fetchTrainingJobs = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/training/jobs");
      const data = await response.json();
      setTrainingJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FiCheckCircle className="text-primary" />;
      case "running":
        return <FiRefreshCw className="text-accent animate-spin" />;
      case "failed":
        return <FiXCircle className="text-destructive" />;
      default:
        return <FiClock className="text-muted-foreground" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-primary text-primary-foreground";
      case "running":
        return "bg-accent text-accent-foreground";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary">Model Training</h2>
        <p className="text-muted-foreground">Train custom YOLO models on your datasets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Configuration */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary">Training Configuration</CardTitle>
            <CardDescription>Configure hyperparameters for model training</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dataset Config */}
            <div className="space-y-2">
              <Label htmlFor="config-upload">Dataset YAML Config</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <Input
                  id="config-upload"
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleConfigChange}
                  className="hidden"
                />
                <label htmlFor="config-upload" className="cursor-pointer">
                  {configFile ? (
                    <div className="space-y-2">
                      <FiCheckCircle className="mx-auto text-3xl text-primary" />
                      <p className="text-sm font-medium">{configFile.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FiUpload className="mx-auto text-3xl text-muted-foreground" />
                      <p className="text-sm font-medium">Upload YAML config</p>
                      <p className="text-xs text-muted-foreground">data.yaml with train/val paths</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Base Model */}
            <div className="space-y-2">
              <Label htmlFor="base-model">Base Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="base-model" className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yolov8n.pt">YOLOv8 Nano</SelectItem>
                  <SelectItem value="yolov8s.pt">YOLOv8 Small</SelectItem>
                  <SelectItem value="yolov8m.pt">YOLOv8 Medium</SelectItem>
                  <SelectItem value="yolov8l.pt">YOLOv8 Large</SelectItem>
                  <SelectItem value="yolov8x.pt">YOLOv8 XLarge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Epochs */}
            <div className="space-y-2">
              <Label htmlFor="epochs">Epochs: {epochs}</Label>
              <Input
                id="epochs"
                type="number"
                min="1"
                max="500"
                value={epochs}
                onChange={(e) => setEpochs(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            {/* Batch Size */}
            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Size: {batchSize}</Label>
              <Select value={batchSize.toString()} onValueChange={(v) => setBatchSize(parseInt(v))}>
                <SelectTrigger id="batch-size" className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="32">32</SelectItem>
                  <SelectItem value="64">64</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image Size */}
            <div className="space-y-2">
              <Label htmlFor="img-size">Image Size: {imgSize}</Label>
              <Select value={imgSize.toString()} onValueChange={(v) => setImgSize(parseInt(v))}>
                <SelectTrigger id="img-size" className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="320">320</SelectItem>
                  <SelectItem value="640">640</SelectItem>
                  <SelectItem value="1280">1280</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartTraining}
              disabled={!configFile || isTraining}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isTraining ? (
                <>
                  <FiRefreshCw className="mr-2 animate-spin" />
                  Starting Training...
                </>
              ) : (
                <>
                  <FiPlay className="mr-2" />
                  Start Training
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Training Jobs */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-primary">Training Jobs</CardTitle>
                <CardDescription>Monitor active and completed training jobs</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTrainingJobs}
                className="border-border"
              >
                <FiRefreshCw className="mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {trainingJobs.length > 0 ? (
              <div className="space-y-4">
                {trainingJobs.map((job, index) => (
                  <div
                    key={index}
                    className="p-4 bg-background rounded-lg border border-border hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getStatusIcon(job.status)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Job: {job.job_id?.substring(0, 8) || 'N/A'}</p>
                          <Badge className={`mt-1 ${getStatusColor(job.status)}`}>
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                      <FiCpu className="text-muted-foreground" />
                    </div>

                    {job.status === "running" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{job.progress || 0}%</span>
                        </div>
                        <Progress value={job.progress || 0} className="h-2" />
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Epochs: </span>
                        {job.config?.epochs || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Batch: </span>
                        {job.config?.batch_size || "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FiCpu className="text-6xl mb-4 opacity-20" />
                <p className="text-sm">No training jobs yet</p>
                <p className="text-xs mt-1">Start a new training job to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

