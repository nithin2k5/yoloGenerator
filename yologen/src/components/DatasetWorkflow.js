"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FiCheckCircle, FiCircle, FiArrowRight, FiUpload, FiEdit, FiDownload, FiPlay } from "react-icons/fi";

export default function DatasetWorkflow({ dataset, onRefresh }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (dataset) {
      fetchDatasetStats();
      determineCurrentStep();
    }
  }, [dataset]);

  const fetchDatasetStats = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/annotations/datasets/${dataset.id}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const determineCurrentStep = () => {
    if (!dataset) return 0;
    
    // Check if has images
    if (!dataset.images || dataset.images.length === 0) {
      setCurrentStep(1); // Need to upload images
      return;
    }
    
    // Check if annotated
    const annotatedCount = dataset.images.filter(img => img.annotated).length;
    if (annotatedCount === 0) {
      setCurrentStep(2); // Need to annotate
      return;
    }
    
    if (annotatedCount < dataset.images.length) {
      setCurrentStep(2); // Still annotating
      return;
    }
    
    // Check if exported
    // We'll assume if all are annotated, next step is export
    setCurrentStep(3); // Ready to export
  };

  const steps = [
    {
      number: 1,
      title: "Create Dataset",
      description: "Define classes and setup",
      action: "Dataset Created",
      icon: FiCheckCircle,
      status: "complete"
    },
    {
      number: 2,
      title: "Upload Images",
      description: "Add training images",
      action: "Upload",
      icon: FiUpload,
      status: dataset?.images?.length > 0 ? "complete" : "current"
    },
    {
      number: 3,
      title: "Annotate",
      description: "Label objects in images",
      action: "Annotate",
      icon: FiEdit,
      status: stats?.annotated_images === stats?.total_images && stats?.total_images > 0 ? "complete" : 
              stats?.annotated_images > 0 ? "current" : "pending"
    },
    {
      number: 4,
      title: "Export",
      description: "Generate YOLO format",
      action: "Export",
      icon: FiDownload,
      status: "pending"
    },
    {
      number: 5,
      title: "Train Model",
      description: "Train on your dataset",
      action: "Train",
      icon: FiPlay,
      status: "pending"
    }
  ];

  const getStepStatus = (step) => {
    if (step.number === 1) return "complete";
    
    if (step.number === 2) {
      return dataset?.images?.length > 0 ? "complete" : "current";
    }
    
    if (step.number === 3) {
      if (stats?.annotated_images === stats?.total_images && stats?.total_images > 0) {
        return "complete";
      }
      if (stats?.annotated_images > 0) {
        return "current";
      }
      return "pending";
    }
    
    if (step.number === 4) {
      if (stats?.annotated_images === stats?.total_images && stats?.total_images > 0) {
        return "current";
      }
      return "pending";
    }
    
    if (step.number === 5) {
      return "pending";
    }
    
    return "pending";
  };

  const getStepColor = (status) => {
    switch (status) {
      case "complete":
        return "text-green-500 border-green-500 bg-green-500/10";
      case "current":
        return "text-primary border-primary bg-primary/10";
      case "pending":
        return "text-muted-foreground border-border bg-muted/10";
      default:
        return "text-muted-foreground border-border bg-muted/10";
    }
  };

  const getProgressPercentage = () => {
    let completed = 0;
    
    // Step 1: Created (always complete)
    completed += 20;
    
    // Step 2: Images uploaded
    if (dataset?.images?.length > 0) {
      completed += 20;
    }
    
    // Step 3: Annotation progress
    if (stats?.total_images > 0) {
      completed += (stats.annotated_images / stats.total_images) * 20;
    }
    
    // Steps 4 & 5 not yet implemented
    return Math.round(completed);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Dataset Pipeline</span>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {getProgressPercentage()}% Complete
          </Badge>
        </CardTitle>
        <CardDescription>Follow these steps to train your model</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={getProgressPercentage()} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {stats?.annotated_images || 0} of {stats?.total_images || 0} images annotated
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step);
              const StepIcon = step.icon;
              
              return (
                <div key={step.number}>
                  <div className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${getStepColor(status)}`}>
                    {/* Step Number/Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      status === "complete" ? "border-green-500 bg-green-500/20" :
                      status === "current" ? "border-primary bg-primary/20" :
                      "border-border bg-muted/20"
                    }`}>
                      {status === "complete" ? (
                        <FiCheckCircle className="text-green-500 text-xl" />
                      ) : (
                        <span className={`text-lg font-bold ${
                          status === "current" ? "text-primary" : "text-muted-foreground"
                        }`}>
                          {step.number}
                        </span>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{step.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      
                      {/* Status Details */}
                      {step.number === 2 && dataset?.images?.length > 0 && (
                        <p className="text-xs text-primary mt-1">
                          ✓ {dataset.images.length} images uploaded
                        </p>
                      )}
                      
                      {step.number === 3 && stats?.total_images > 0 && (
                        <p className="text-xs text-primary mt-1">
                          {stats.annotated_images} / {stats.total_images} annotated ({stats.completion_percentage.toFixed(0)}%)
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <div>
                      {status === "current" && step.number === 2 && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.accept = 'image/*';
                            input.onchange = async (e) => {
                              const files = Array.from(e.target.files);
                              const formData = new FormData();
                              files.forEach(file => formData.append("files", file));
                              
                              try {
                                const response = await fetch(`http://localhost:8000/api/annotations/datasets/${dataset.id}/upload`, {
                                  method: "POST",
                                  body: formData
                                });
                                const data = await response.json();
                                if (data.success) {
                                  alert(`${data.uploaded} images uploaded!`);
                                  onRefresh();
                                }
                              } catch (error) {
                                alert("Error uploading images");
                              }
                            };
                            input.click();
                          }}
                          className="bg-primary"
                        >
                          <FiUpload className="mr-1" />
                          Upload
                        </Button>
                      )}
                      
                      {status === "current" && step.number === 3 && (
                        <Button 
                          size="sm"
                          onClick={() => window.location.href = `/annotate?dataset=${dataset.id}`}
                          className="bg-primary"
                        >
                          <FiEdit className="mr-1" />
                          Annotate
                        </Button>
                      )}
                      
                      {status === "current" && step.number === 4 && (
                        <Button 
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`http://localhost:8000/api/annotations/datasets/${dataset.id}/export`, {
                                method: "POST"
                              });
                              const data = await response.json();
                              if (data.success) {
                                alert(`Dataset exported! Train: ${data.train_images}, Val: ${data.val_images}`);
                                onRefresh();
                              }
                            } catch (error) {
                              alert("Error exporting dataset");
                            }
                          }}
                          className="bg-primary"
                        >
                          <FiDownload className="mr-1" />
                          Export
                        </Button>
                      )}
                      
                      {status === "pending" && (
                        <Badge variant="secondary" className="text-xs">
                          Pending
                        </Badge>
                      )}
                      
                      {status === "complete" && (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                          ✓ Done
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <FiArrowRight className="text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Complete Training Button */}
          {stats?.completion_percentage === 100 && (
            <div className="pt-4 border-t border-border">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                onClick={async () => {
                  if (!confirm("Start training with this dataset?")) return;
                  
                  try {
                    // Export first
                    const exportResponse = await fetch(`http://localhost:8000/api/annotations/datasets/${dataset.id}/export`, {
                      method: "POST"
                    });
                    const exportData = await exportResponse.json();
                    
                    if (!exportData.success) {
                      alert("Failed to export dataset");
                      return;
                    }
                    
                    // Start training
                    const trainingResponse = await fetch("http://localhost:8000/api/training/start-from-dataset", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        dataset_id: dataset.id,
                        config: {
                          epochs: 50,
                          batch_size: 16,
                          img_size: 640,
                          model_name: "yolov8n.pt"
                        }
                      })
                    });
                    
                    const trainData = await trainingResponse.json();
                    
                    if (trainData.success) {
                      alert(`Training started! Job ID: ${trainData.job_id}\nGo to Training tab to monitor.`);
                    }
                  } catch (error) {
                    alert("Error starting training. Make sure backend is running.");
                  }
                }}
              >
                <FiPlay className="mr-2" />
                Complete Pipeline - Start Training Now
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

