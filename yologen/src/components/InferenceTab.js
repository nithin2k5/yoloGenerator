"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FiUpload, FiImage, FiCheckCircle, FiLoader, FiZap, FiTarget, FiBox } from "react-icons/fi";
import { cn } from "@/lib/utils";

export default function InferenceTab() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState("yolov8n.pt");
  const [confidence, setConfidence] = useState(0.25);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResults(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setResults(null);
    }
  };

  const handleInference = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("confidence", confidence);
    formData.append("model_name", selectedModel);

    try {
      const response = await fetch("http://localhost:8000/api/inference/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Inference error:", error);
      alert("Error running inference. Make sure the backend is running on port 8000.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-white/90">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Inference Playground</h2>
          <p className="text-muted-foreground mt-1">Test your models in real-time with drag & drop support.</p>
        </div>
        <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 animate-pulse" />
          GPU Ready
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Config */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl bg-card/40 backdrop-blur-md border border-white/5 p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <FiTarget />
              </div>
              <h3 className="font-semibold text-lg">Configuration</h3>
            </div>

            {/* Upload Zone */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Input Image</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed border-white/10 rounded-xl p-8 text-center transition-all duration-300 group",
                  isDragging ? "border-indigo-500 bg-indigo-500/10" : "hover:border-white/20 hover:bg-white/5",
                  selectedFile ? "border-emerald-500/50 bg-emerald-500/5" : ""
                )}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer block w-full h-full">
                  {selectedFile ? (
                    <div className="animate-fade-in">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
                        <FiCheckCircle className="text-2xl" />
                      </div>
                      <p className="text-sm font-medium text-emerald-100 truncate max-w-[200px] mx-auto">{selectedFile.name}</p>
                      <p className="text-xs text-emerald-500/70 mt-1">Click to replace</p>
                    </div>
                  ) : (
                    <div className="group-hover:-translate-y-1 transition-transform duration-300">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground group-hover:text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                        <FiUpload className="text-xl" />
                      </div>
                      <p className="text-sm font-medium text-gray-300">Drop image here</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Model Select */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Model Strategy</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="bg-black/20 border-white/10 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-gray-200">
                  <SelectItem value="yolov8n.pt">Nano (Edge/Mobile)</SelectItem>
                  <SelectItem value="yolov8s.pt">Small (Balanced)</SelectItem>
                  <SelectItem value="yolov8m.pt">Medium (Standard)</SelectItem>
                  <SelectItem value="yolov8l.pt">Large (High Accuracy)</SelectItem>
                  <SelectItem value="yolov8x.pt">XLarge (SOTA)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Confidence Slider */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Confidence Threshold</Label>
                <span className="text-xs font-mono text-indigo-400">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <Input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="h-2 bg-black/40 accent-indigo-500 cursor-pointer border-0 p-0 rounded-full appearance-none"
              />
            </div>

            <Button
              onClick={handleInference}
              disabled={!selectedFile || isLoading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 border-0 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? <FiLoader className="mr-2 animate-spin" /> : <FiZap className="mr-2" />}
              {isLoading ? "Processing..." : "Run Inference"}
            </Button>
          </div>
        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-8 space-y-6">
          {/* Results Card */}
          <div className="rounded-2xl bg-card/40 backdrop-blur-md border border-white/5 p-1 min-h-[500px] flex flex-col items-center justify-center relative shadow-2xl">
            {results ? (
              <div className="w-full h-full p-4 animate-fade-in group relative">
                {/* The Image Overlay (Simulated here, normally canvas) */}
                <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-lg">
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border-white/10 px-3 py-1.5 flex gap-2">
                      <FiBox className="text-indigo-400" />
                      {results.num_detections} Detections
                    </Badge>
                  </div>

                  {/* Placeholder for actual output image with boxes drawn */}
                  <div className="aspect-video bg-black/40 flex items-center justify-center relative">
                    {/* In a real app, this would be the processed image */}
                    <div className="text-center">
                      <FiCheckCircle className="text-6xl text-emerald-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                      <p className="text-lg font-medium text-white">Inference Complete</p>
                      <p className="text-sm text-gray-400 mt-2">Check the raw JSON response below for details</p>
                    </div>
                  </div>
                </div>

                {/* Detection List */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {results.detections?.map((det, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-between">
                      <span className="font-semibold capitalize text-indigo-200">{det.class_name}</span>
                      <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                        {(det.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                  <FiImage className="text-4xl text-white/20" />
                </div>
                <h3 className="text-xl font-medium text-white/80">Ready for Analysis</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                  Select a model and upload an image to see YOLO object detection in action.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
