"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import {
  Upload, Play, Square, RefreshCw, Terminal,
  CheckCircle, XCircle, Clock, Cpu, TrendingUp
} from "lucide-react";
import GamifiedTerminal from "./GamifiedTerminal";

export default function TrainingTab() {
  const [config, setConfig] = useState({
    model_name: "yolov8n",
    epochs: 50,
    batch_size: 16,
    img_size: 640,
    dataset_yaml: null,
    dataset_yaml_name: ""
  });

  const [jobs, setJobs] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/training/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleStartTraining = async () => {
    if (!config.dataset_yaml) {
      toast.error("Please upload a dataset YAML configuration file.");
      return;
    }

    setIsTraining(true);
    const formData = new FormData();
    formData.append("dataset_yaml", config.dataset_yaml);
    formData.append("model_name", config.model_name);
    formData.append("epochs", config.epochs);
    formData.append("batch_size", config.batch_size);
    formData.append("img_size", config.img_size);

    try {
      const response = await fetch("http://localhost:8000/api/training/start", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Training started! Job ID: ${data.job_id}`);
        fetchJobs();
      } else {
        const err = await response.json();
        toast.error(err.detail || "Failed to start training");
      }
    } catch (error) {
      toast.error("Error starting training: " + error.message);
    } finally {
      setIsTraining(false);
    }
  };

  const handleTerminateJob = async (jobId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/training/terminate/${jobId}`, { method: "POST" });
      if (response.ok) {
        toast.success("Training job terminated");
        fetchJobs();
      } else {
        toast.error("Failed to terminate job");
      }
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="mr-1" /> Running</Badge>;
      case "completed":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="mr-1" /> Done</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Training</h2>
          <p className="text-muted-foreground mt-1">Configure and monitor model training jobs.</p>
        </div>
        <Button
          onClick={fetchJobs}
          variant="outline"
          size="sm"
          className="border-white/10 bg-white/5 hover:bg-white/10"
        >
          <RefreshCw className="mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Panel */}
        <div className="space-y-6">
          <Card className="bg-card/40 border-white/5">
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
              <CardDescription>Set up your training run.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Dataset Config (YAML)</Label>
                <div
                  onClick={() => document.getElementById('yaml-upload')?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all"
                >
                  <Upload className="mx-auto text-xl text-gray-500 mb-2" />
                  <p className="text-sm text-gray-400">{config.dataset_yaml_name || "Click to upload .yaml"}</p>
                  <input
                    id="yaml-upload"
                    type="file"
                    accept=".yaml,.yml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setConfig({ ...config, dataset_yaml: file, dataset_yaml_name: file.name });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={config.model_name}
                  onValueChange={v => setConfig({ ...config, model_name: v })}
                >
                  <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yolov8n">YOLOv8 Nano</SelectItem>
                    <SelectItem value="yolov8s">YOLOv8 Small</SelectItem>
                    <SelectItem value="yolov8m">YOLOv8 Medium</SelectItem>
                    <SelectItem value="yolov8l">YOLOv8 Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Epochs</Label>
                  <Input
                    type="number"
                    value={config.epochs}
                    onChange={e => setConfig({ ...config, epochs: parseInt(e.target.value) || 1 })}
                    className="bg-black/30 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Batch</Label>
                  <Input
                    type="number"
                    value={config.batch_size}
                    onChange={e => setConfig({ ...config, batch_size: parseInt(e.target.value) || 1 })}
                    className="bg-black/30 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Img Size</Label>
                  <Select
                    value={config.img_size.toString()}
                    onValueChange={v => setConfig({ ...config, img_size: parseInt(v) })}
                  >
                    <SelectTrigger className="bg-black/30 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="416">416</SelectItem>
                      <SelectItem value="640">640</SelectItem>
                      <SelectItem value="1024">1024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleStartTraining}
                disabled={isTraining || !config.dataset_yaml}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {isTraining ? <RefreshCw className="animate-spin mr-2" /> : <Play className="mr-2" />}
                {isTraining ? "Starting..." : "Start Training"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Panel */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Terminal className="text-gray-500" />
            Training Jobs
          </h3>

          {jobs.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <Cpu className="mx-auto text-3xl text-gray-600 mb-3" />
              <h3 className="font-semibold mb-1">No Training Jobs</h3>
              <p className="text-sm text-muted-foreground">Start a training job using the configuration panel.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.job_id} className="rounded-2xl bg-card/40 border border-white/5 overflow-hidden">
                {/* Job Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(job.status)}
                    <div>
                      <p className="text-sm font-medium">{job.config?.model_name || "yolov8n"}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.config?.epochs || 0} epochs • Batch {job.config?.batch_size || 16}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === "running" && (
                      <Button
                        onClick={() => handleTerminateJob(job.job_id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-400/10"
                      >
                        <Square className="mr-1" /> Stop
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress & Metrics */}
                {(job.progress !== undefined || job.metrics) && (
                  <div className="p-4 space-y-3">
                    {job.progress !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-mono text-indigo-400">{Math.round(job.progress || 0)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
                            style={{ width: `${job.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {job.metrics && (
                      <div className="grid grid-cols-3 gap-4 pt-2">
                        {job.metrics.loss !== undefined && (
                          <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                            <p className="text-[10px] text-gray-500 uppercase">Loss</p>
                            <p className="text-sm font-mono text-amber-400">{Number(job.metrics.loss).toFixed(4)}</p>
                          </div>
                        )}
                        {job.metrics.mAP50 !== undefined && (
                          <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                            <p className="text-[10px] text-gray-500 uppercase">mAP@50</p>
                            <p className="text-sm font-mono text-emerald-400">{Number(job.metrics.mAP50).toFixed(3)}</p>
                          </div>
                        )}
                        {job.metrics.epoch !== undefined && (
                          <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                            <p className="text-[10px] text-gray-500 uppercase">Epoch</p>
                            <p className="text-sm font-mono text-blue-400">{job.metrics.epoch}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Log Output */}
                <GamifiedTerminal
                  output={job.output}
                  isRunning={job.status === "running"}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
