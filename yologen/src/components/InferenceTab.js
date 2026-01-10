"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FiUpload, FiImage, FiCheckCircle, FiLoader } from "react-icons/fi";

export default function InferenceTab() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState("yolov8n.pt");
  const [confidence, setConfidence] = useState(0.25);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary">Object Detection Inference</h2>
        <p className="text-muted-foreground">Upload an image to detect objects using YOLO models</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary">Upload Image</CardTitle>
            <CardDescription>Select an image and configure detection settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="image-upload">Image File</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FiCheckCircle className="mx-auto text-4xl text-primary" />
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FiUpload className="mx-auto text-4xl text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload image</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model-select">YOLO Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model-select" className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yolov8n.pt">YOLOv8 Nano (Fastest)</SelectItem>
                  <SelectItem value="yolov8s.pt">YOLOv8 Small</SelectItem>
                  <SelectItem value="yolov8m.pt">YOLOv8 Medium</SelectItem>
                  <SelectItem value="yolov8l.pt">YOLOv8 Large</SelectItem>
                  <SelectItem value="yolov8x.pt">YOLOv8 XLarge (Best)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-2">
              <Label htmlFor="confidence">Confidence Threshold: {confidence}</Label>
              <Input
                id="confidence"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Lower values detect more objects but may include false positives
              </p>
            </div>

            {/* Run Button */}
            <Button
              onClick={handleInference}
              disabled={!selectedFile || isLoading}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isLoading ? (
                <>
                  <FiLoader className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FiImage className="mr-2" />
                  Run Detection
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary">Detection Results</CardTitle>
            <CardDescription>Objects detected in the uploaded image</CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/30">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Detections</p>
                    <p className="text-3xl font-bold text-primary">{results.num_detections}</p>
                  </div>
                  <FiCheckCircle className="text-4xl text-primary" />
                </div>

                {results.detections && results.detections.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {results.detections.map((detection, index) => (
                      <div
                        key={index}
                        className="p-4 bg-background rounded-lg border border-border hover:border-primary transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-primary text-primary-foreground">
                            {detection.class_name}
                          </Badge>
                          <span className="text-sm font-medium text-accent">
                            {(detection.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">X: </span>
                            {detection.bbox[0].toFixed(0)}
                          </div>
                          <div>
                            <span className="font-medium">Y: </span>
                            {detection.bbox[1].toFixed(0)}
                          </div>
                          <div>
                            <span className="font-medium">Width: </span>
                            {(detection.bbox[2] - detection.bbox[0]).toFixed(0)}
                          </div>
                          <div>
                            <span className="font-medium">Height: </span>
                            {(detection.bbox[3] - detection.bbox[1]).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No objects detected</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FiImage className="text-6xl mb-4 opacity-20" />
                <p className="text-sm">Upload and process an image to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

