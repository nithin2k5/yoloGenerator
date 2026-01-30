"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FiUpload,
  FiPlay,
  FiRefreshCw,
  FiCpu,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTrash2,
  FiEye,
  FiTerminal,
  FiSettings
} from "react-icons/fi";
import { cn } from "@/lib/utils";

export default function TrainingTab() {
  const [configFile, setConfigFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState("yolov8n.pt");
  const [epochs, setEpochs] = useState(100);
  const [batchSize, setBatchSize] = useState(16);
  const [imgSize, setImgSize] = useState(640);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingJobs, setTrainingJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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
    formData.append("epochs", epochs.toString());
    formData.append("batch_size", batchSize.toString());
    formData.append("img_size", imgSize.toString());
    formData.append("model_name", selectedModel);

    try {
      const response = await fetch("http://localhost:8000/api/training/start", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert(`Training job ${data.job_id} started!`);
        fetchTrainingJobs();
      } else {
        alert(`Error: ${data.detail || "Failed to start training"}`);
      }
    } catch (error) {
      console.error("Training error:", error);
      alert("Error starting training. Check backend connection.");
    } finally {
      setIsTraining(false);
    }
  };

  const fetchTrainingJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/api/training/jobs");
      if (response.ok) {
        const data = await response.json();
        setTrainingJobs(data.jobs || []);
      } else {
        setTrainingJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setTrainingJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingJobs();
    const interval = setInterval(() => {
      fetchTrainingJobs();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteJob = async (jobId) => {
    if (!confirm(`Delete training job ${jobId.substring(0, 8)}?`)) return;
    try {
      const response = await fetch(`http://localhost:8000/api/training/job/${jobId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        fetchTrainingJobs();
      } else {
        alert("Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return <FiCheckCircle className="text-emerald-400" />;
      case "running": return <FiRefreshCw className="text-indigo-400 animate-spin" />;
      case "failed": return <FiXCircle className="text-red-400" />;
      default: return <FiClock className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Training Center</h2>
          <p className="text-muted-foreground mt-1">Configure and monitor GPU training jobs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="rounded-2xl bg-card/40 backdrop-blur-md border border-white/5 p-6 shadow-xl space-y-6 lg:order-1">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <FiSettings />
            </div>
            <h3 className="font-semibold text-lg">Hyperparameters</h3>
          </div>

          <div className="space-y-6">
            {/* Dataset Config */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Dataset Config (YAML)</Label>
              <div className="relative border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group">
                <Input
                  id="config-upload"
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleConfigChange}
                  className="hidden"
                />
                <label htmlFor="config-upload" className="cursor-pointer block w-full h-full">
                  {configFile ? (
                    <div className="flex items-center justify-center gap-3 text-emerald-400">
                      <FiCheckCircle className="text-xl" />
                      <span className="font-medium text-emerald-100">{configFile.name}</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground group-hover:text-purple-300 transition-colors">
                      <FiUpload className="text-2xl mx-auto mb-2" />
                      <span className="text-sm">Click to upload data.yaml</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Base Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-gray-200">
                    {['n', 's', 'm', 'l', 'x'].map(size => (
                      <SelectItem key={size} value={`yolov8${size}.pt`}>YOLOv8 {size.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Epochs</Label>
                <Input
                  type="number"
                  value={epochs}
                  onChange={e => setEpochs(e.target.value)}
                  className="bg-black/20 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Batch Size</Label>
                <Select value={batchSize.toString()} onValueChange={(v) => setBatchSize(parseInt(v))}>
                  <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-gray-200">
                    {[8, 16, 32, 64].map(bs => <SelectItem key={bs} value={bs.toString()}>{bs}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Img Size</Label>
                <Select value={imgSize.toString()} onValueChange={(v) => setImgSize(parseInt(v))}>
                  <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-gray-200">
                    {[320, 640, 1280].map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleStartTraining}
              disabled={!configFile || isTraining}
              className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/20 border-0 rounded-xl transition-all hover:scale-[1.02]"
            >
              {isTraining ? <FiRefreshCw className="mr-2 animate-spin" /> : <FiPlay className="mr-2" />}
              {isTraining ? "Initializing Cluster..." : "Start Training Run"}
            </Button>
          </div>
        </div>

        {/* Job Monitor (Terminal Style) */}
        <div className="rounded-2xl bg-[#0d0d11] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[600px] lg:order-2">
          <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiTerminal className="text-gray-400" />
              <span className="text-sm font-mono text-gray-300">cluster_monitor ~ jobs</span>
            </div>
            <Button onClick={fetchTrainingJobs} variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm custom-scrollbar">
            {loading && trainingJobs.length === 0 ? (
              <div className="text-gray-500 animate-pulse">connecting to cluster...</div>
            ) : trainingJobs.length === 0 ? (
              <div className="text-gray-600 italic">// No active jobs found. Start a new run to see logs here.</div>
            ) : (
              trainingJobs.map((job) => (
                <div key={job.job_id} className="border-l-2 border-white/10 pl-4 py-1 hover:border-purple-500/50 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-400 font-bold flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      JOB-{job.job_id?.substring(0, 6)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {job.config?.model_name} • {job.config?.epochs}ep
                    </span>
                  </div>

                  {job.status === "running" && (
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Progress</span>
                        <span>{job.progress || 0}%</span>
                      </div>
                      <Progress value={job.progress || 0} className="h-1 bg-white/10" indicatorClassName="bg-purple-500" />
                    </div>
                  )}

                  {job.metrics && (
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mt-2 bg-white/5 p-2 rounded">
                      <div>mAP50: <span className="text-white">{(job.metrics.map50 * 100).toFixed(1)}%</span></div>
                      <div>mAP50-95: <span className="text-white">{(job.metrics["map50-95"] * 100).toFixed(1)}%</span></div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {job.status === "completed" && (
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-white/10 border-white/20">
                        <FiEye className="mr-1" /> View Artifacts
                      </Badge>
                    )}
                    <Badge
                      variant="destructive"
                      className="text-xs cursor-pointer hover:bg-destructive/80"
                      onClick={() => handleDeleteJob(job.job_id)}
                    >
                      <FiTrash2 className="mr-1" /> Terminate
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
