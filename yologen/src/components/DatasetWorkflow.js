"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FiCheckCircle, FiCircle, FiArrowRight, FiUpload, FiEdit, FiDownload, FiPlay, FiSettings } from "react-icons/fi";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DatasetWorkflow({ dataset, onRefresh }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [stats, setStats] = useState(null);
  const [showTrainDialog, setShowTrainDialog] = useState(false);
  const [trainingConfig, setTrainingConfig] = useState({
    epochs: 100,
    batch_size: 16,
    img_size: 640,
    model_name: "yolov8n.pt",
    learning_rate: 0.01
  });

  useEffect(() => {
    if (dataset) {
      fetchDatasetStats();
      determineCurrentStep();
    }
  }, [dataset, stats]);

  // Refresh stats periodically when dataset is active
  useEffect(() => {
    if (!dataset) return;
    
    const interval = setInterval(() => {
      fetchDatasetStats();
    }, 3000); // Refresh every 3 seconds
    
    return () => clearInterval(interval);
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
      if (dataset?.images?.length > 0) return "complete";
      // Can only start step 2 if step 1 is complete
      return "current";
    }
    
    if (step.number === 3) {
      // Can only start step 3 if step 2 is complete (has images)
      if (dataset?.images?.length === 0) return "pending";
      
      if (stats?.annotated_images === stats?.total_images && stats?.total_images > 0) {
        return "complete";
      }
      // If images exist, step 3 should be current (even if stats haven't refreshed yet)
      if (dataset?.images?.length > 0) {
        return "current";
      }
      return "pending";
    }
    
    if (step.number === 4) {
      // Can only export if all images are annotated
      if (stats?.annotated_images === stats?.total_images && stats?.total_images > 0) {
        return "current";
      }
      return "pending";
    }
    
    if (step.number === 5) {
      // Can only train if dataset is exported
      // We'll check if export was successful (this would need backend tracking)
      return "pending";
    }
    
    return "pending";
  };
  
  const canProceedToStep = (stepNumber) => {
    if (stepNumber === 1) return true;
    if (stepNumber === 2) return true; // Step 1 is always complete
    if (stepNumber === 3) return dataset?.images?.length > 0;
    if (stepNumber === 4) return stats?.annotated_images === stats?.total_images && stats?.total_images > 0;
    if (stepNumber === 5) return false; // Would need export status check
    return false;
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
        <CardDescription>
          Complete all steps in order (A to Z) to create and train your model
        </CardDescription>
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
                      {step.number === 1 && (
                        <p className="text-xs text-green-500 mt-1">
                          ✓ Dataset "{dataset?.name}" created with {dataset?.classes?.length || 0} classes
                        </p>
                      )}
                      
                      {step.number === 2 && (
                        <div className="mt-1">
                          {dataset?.images?.length > 0 ? (
                            <p className="text-xs text-green-500">
                              ✓ {dataset.images.length} images uploaded
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              ⚠️ Upload at least 10-20 images for good results
                            </p>
                          )}
                        </div>
                      )}
                      
                      {step.number === 3 && (
                        <div className="mt-1">
                          {stats?.total_images > 0 ? (
                            <p className="text-xs text-primary">
                              {stats.annotated_images} / {stats.total_images} annotated ({stats.completion_percentage.toFixed(0)}%)
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              ⚠️ Upload images first before annotating
                            </p>
                          )}
                          {stats?.annotated_images === stats?.total_images && stats?.total_images > 0 && (
                            <p className="text-xs text-green-500 mt-1">
                              ✓ All images annotated! Ready to export.
                            </p>
                          )}
                        </div>
                      )}
                      
                      {step.number === 4 && (
                        <div className="mt-1">
                          {stats?.annotated_images === stats?.total_images && stats?.total_images > 0 ? (
                            <p className="text-xs text-primary">
                              Ready to export {stats.total_images} annotated images
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              ⚠️ Complete annotation first ({stats?.annotated_images || 0} / {stats?.total_images || 0})
                            </p>
                          )}
                        </div>
                      )}
                      
                      {step.number === 5 && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground">
                            Export dataset first, then start training
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div>
                      {(status === "current" || status === "complete") && step.number === 2 && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.accept = 'image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp';
                            input.onchange = async (e) => {
                              const files = Array.from(e.target.files);
                              if (files.length === 0) return;
                              
                              // Validate file types
                              const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
                              const invalidFiles = files.filter(file => !validTypes.includes(file.type));
                              
                              if (invalidFiles.length > 0) {
                                alert(`Invalid file types detected. Please upload only images (JPG, PNG, GIF, BMP, WEBP).\n\nInvalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
                                return;
                              }
                              
                              // Show loading state
                              const button = e.target.closest('button');
                              const originalText = button?.textContent;
                              if (button) {
                                button.disabled = true;
                                button.textContent = 'Uploading...';
                              }
                              
                              const formData = new FormData();
                              files.forEach(file => {
                                // Ensure each file is appended with the correct field name
                                formData.append("files", file);
                              });
                              
                              try {
                                const response = await fetch(`http://localhost:8000/api/annotations/datasets/${dataset.id}/upload`, {
                                  method: "POST",
                                  body: formData,
                                  // Don't set Content-Type header, let browser set it with boundary
                                });
                                
                                if (!response.ok) {
                                  const errorText = await response.text();
                                  let errorData;
                                  try {
                                    errorData = JSON.parse(errorText);
                                  } catch {
                                    errorData = { detail: errorText || `Server error: ${response.status}` };
                                  }
                                  throw new Error(errorData.detail || `Upload failed: ${response.status}`);
                                }
                                
                                const data = await response.json();
                                
                                if (data.success) {
                                  let message = `✅ ${data.uploaded} image${data.uploaded !== 1 ? 's' : ''} uploaded successfully!`;
                                  
                                  if (data.errors && data.errors.length > 0) {
                                    message += `\n\n⚠️ ${data.error_count} file${data.error_count !== 1 ? 's' : ''} failed:\n${data.errors.slice(0, 3).join('\n')}`;
                                    if (data.errors.length > 3) {
                                      message += `\n... and ${data.errors.length - 3} more`;
                                    }
                                  }
                                  
                                  if (dataset.images.length === 0) {
                                    message += `\n\nNext: Click "Start Annotating" to label objects in your images.`;
                                  } else {
                                    message += `\n\nYou can now proceed to annotation or upload more images.`;
                                  }
                                  
                                  alert(message);
                                  
                                  // Refresh dataset and stats
                                  if (onRefresh) {
                                    onRefresh();
                                  }
                                  
                                  // Also manually refresh stats
                                  setTimeout(() => {
                                    fetchDatasetStats();
                                  }, 500);
                                } else {
                                  let errorMsg = data.detail || "Failed to upload images";
                                  if (data.errors && data.errors.length > 0) {
                                    errorMsg += `\n\nErrors:\n${data.errors.join('\n')}`;
                                  }
                                  throw new Error(errorMsg);
                                }
                              } catch (error) {
                                console.error("Upload error:", error);
                                alert(`❌ Error uploading images: ${error.message}\n\nMake sure:\n- Backend is running on port 8000\n- Files are valid images\n- You have permission to upload`);
                              } finally {
                                if (button) {
                                  button.disabled = false;
                                  if (originalText) button.textContent = originalText;
                                }
                              }
                            };
                            input.click();
                          }}
                          className={status === "complete" ? "bg-secondary hover:bg-secondary/90" : "bg-primary hover:bg-primary/90"}
                        >
                          <FiUpload className="mr-1" />
                          {status === "complete" ? "Upload More Images" : "Upload Images"}
                        </Button>
                      )}
                      
                      {(status === "current" || status === "complete") && step.number === 3 && dataset?.images?.length > 0 && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (!dataset || !dataset.id) {
                              alert("Error: Dataset ID not found");
                              return;
                            }
                            if (dataset.images.length === 0) {
                              alert("Please upload images first!");
                              return;
                            }
                            router.push(`/annotate?dataset=${dataset.id}`);
                          }}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <FiEdit className="mr-1" />
                          {status === "complete" ? "Continue Annotating" : "Start Annotating"}
                        </Button>
                      )}
                      
                      {status === "current" && step.number === 4 && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={async () => {
                              if (stats?.annotated_images !== stats?.total_images) {
                                alert(`Please annotate all images first!\n\nCurrent: ${stats?.annotated_images || 0} / ${stats?.total_images || 0} annotated`);
                                return;
                              }
                              
                              try {
                                const response = await fetch(`http://localhost:8000/api/annotations/datasets/${dataset.id}/export`, {
                                  method: "POST"
                                });
                                const data = await response.json();
                                if (data.success) {
                                  alert(`✅ Dataset exported successfully!\n\nTraining set: ${data.train_images} images\nValidation set: ${data.val_images} images\n\nYou can now proceed to training.`);
                                  onRefresh();
                                } else {
                                  alert(`Error: ${data.detail || "Failed to export dataset"}`);
                                }
                              } catch (error) {
                                alert("Error exporting dataset. Make sure backend is running.");
                              }
                            }}
                            variant="outline"
                            className="border-border"
                          >
                            <FiDownload className="mr-1" />
                            Export Only
                          </Button>
                          <Dialog open={showTrainDialog} onOpenChange={setShowTrainDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <FiPlay className="mr-1" />
                                Export & Train
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-primary">Export & Train Configuration</DialogTitle>
                                <DialogDescription>
                                  Configure strict training parameters. All epochs will be completed.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="epochs">Epochs (Required)</Label>
                                  <Input
                                    id="epochs"
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={trainingConfig.epochs}
                                    onChange={(e) => setTrainingConfig({...trainingConfig, epochs: parseInt(e.target.value) || 100})}
                                    className="bg-background border-border"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Number of training epochs (strict mode - all will run)
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="batch_size">Batch Size</Label>
                                  <Input
                                    id="batch_size"
                                    type="number"
                                    min="1"
                                    max="128"
                                    value={trainingConfig.batch_size}
                                    onChange={(e) => setTrainingConfig({...trainingConfig, batch_size: parseInt(e.target.value) || 16})}
                                    className="bg-background border-border"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="img_size">Image Size</Label>
                                  <Select 
                                    value={trainingConfig.img_size.toString()} 
                                    onValueChange={(v) => setTrainingConfig({...trainingConfig, img_size: parseInt(v)})}
                                  >
                                    <SelectTrigger className="bg-background border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="320">320</SelectItem>
                                      <SelectItem value="416">416</SelectItem>
                                      <SelectItem value="512">512</SelectItem>
                                      <SelectItem value="640">640</SelectItem>
                                      <SelectItem value="768">768</SelectItem>
                                      <SelectItem value="896">896</SelectItem>
                                      <SelectItem value="1024">1024</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="model_name">Model</Label>
                                  <Select 
                                    value={trainingConfig.model_name} 
                                    onValueChange={(v) => setTrainingConfig({...trainingConfig, model_name: v})}
                                  >
                                    <SelectTrigger className="bg-background border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="yolov8n.pt">YOLOv8 Nano (yolov8n.pt)</SelectItem>
                                      <SelectItem value="yolov8s.pt">YOLOv8 Small (yolov8s.pt)</SelectItem>
                                      <SelectItem value="yolov8m.pt">YOLOv8 Medium (yolov8m.pt)</SelectItem>
                                      <SelectItem value="yolov8l.pt">YOLOv8 Large (yolov8l.pt)</SelectItem>
                                      <SelectItem value="yolov8x.pt">YOLOv8 XLarge (yolov8x.pt)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="learning_rate">Learning Rate</Label>
                                  <Input
                                    id="learning_rate"
                                    type="number"
                                    step="0.001"
                                    min="0.0001"
                                    max="1.0"
                                    value={trainingConfig.learning_rate}
                                    onChange={(e) => setTrainingConfig({...trainingConfig, learning_rate: parseFloat(e.target.value) || 0.01})}
                                    className="bg-background border-border"
                                  />
                                </div>
                                
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                  <p className="text-xs text-yellow-500 font-semibold mb-1">⚠️ Strict Training Mode</p>
                                  <p className="text-xs text-muted-foreground">
                                    All {trainingConfig.epochs} epochs will be completed. Early stopping is disabled.
                                  </p>
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    onClick={() => setShowTrainDialog(false)}
                                    variant="outline"
                                    className="flex-1 border-border"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={async () => {
                                      if (!trainingConfig.epochs || trainingConfig.epochs < 1) {
                                        alert("Please enter a valid number of epochs (1-1000)");
                                        return;
                                      }
                                      
                                      if (stats?.annotated_images !== stats?.total_images) {
                                        alert(`Please annotate all images first!\n\nCurrent: ${stats?.annotated_images || 0} / ${stats?.total_images || 0} annotated`);
                                        return;
                                      }
                                      
                                      try {
                                        const response = await fetch("http://localhost:8000/api/training/export-and-train", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            dataset_id: dataset.id,
                                            config: {
                                              epochs: trainingConfig.epochs,
                                              batch_size: trainingConfig.batch_size,
                                              img_size: trainingConfig.img_size,
                                              model_name: trainingConfig.model_name,
                                              learning_rate: trainingConfig.learning_rate,
                                              strict_epochs: true
                                            }
                                          })
                                        });
                                        
                                        const data = await response.json();
                                        
                                        if (data.success) {
                                          setShowTrainDialog(false);
                                          alert(`✅ Export & Training started!\n\nJob ID: ${data.job_id}\nEpochs: ${data.epochs} (strict mode)\n\nGo to the "Training" tab to monitor progress.`);
                                          onRefresh();
                                          // Optionally redirect to training tab
                                          window.location.hash = "#training";
                                        } else {
                                          alert(`Error: ${data.detail || "Failed to start training"}`);
                                        }
                                      } catch (error) {
                                        console.error("Error:", error);
                                        alert("Error starting export and training. Make sure backend is running.");
                                      }
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <FiPlay className="mr-2" />
                                    Start Training
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                      
                      {status === "pending" && (
                        <Badge variant="secondary" className="text-xs">
                          {!canProceedToStep(step.number) ? "Complete previous steps" : "Pending"}
                        </Badge>
                      )}
                      
                      {status === "complete" && step.number !== 2 && (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                          ✓ Complete
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
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-500 font-semibold mb-2">
                  🎉 All Steps Complete!
                </p>
                <p className="text-xs text-muted-foreground">
                  Your dataset is ready for training. Click below to start training your model.
                </p>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                onClick={async () => {
                  if (!confirm("Ready to start training?\n\nThis will:\n1. Automatically export your dataset (if not already done)\n2. Start training with YOLOv8\n3. Monitor progress in Training tab\n\nContinue?")) return;
                  
                  try {
                    // Start training - endpoint will auto-export if needed
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
                      alert(`✅ Training started successfully!\n\nJob ID: ${trainData.job_id}\n\nGo to the "Training" tab to monitor progress.`);
                      // Optionally redirect to training tab
                      window.location.hash = "#training";
                    } else {
                      alert(`Error: ${trainData.detail || "Failed to start training"}`);
                    }
                  } catch (error) {
                    console.error("Training error:", error);
                    alert("Error starting training. Make sure backend is running and dataset has annotated images.");
                  }
                }}
              >
                <FiPlay className="mr-2" />
                Complete Pipeline - Start Training Now
              </Button>
            </div>
          )}
          
          {/* Instructions */}
          <div className="pt-4 border-t border-border mt-4">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">📋 Instructions:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Create dataset with name and classes (comma-separated)</li>
              <li>Upload images (minimum 10-20 recommended)</li>
              <li>Annotate all images by drawing bounding boxes</li>
              <li>Export dataset to YOLO format</li>
              <li>Start training your custom model</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

