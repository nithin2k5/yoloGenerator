"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FiFolder, FiPlus, FiUpload, FiDownload, FiTrash2, FiEdit, FiCheckCircle, FiRefreshCw, FiPlay, FiEye } from "react-icons/fi";
import DatasetWorkflow from "@/components/DatasetWorkflow";

export default function DatasetsTab() {
  const [datasets, setDatasets] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [newDataset, setNewDataset] = useState({
    name: "",
    description: "",
    classes: ""
  });

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/annotations/datasets/list");
      const data = await response.json();
      
      // Fetch stats for each dataset
      const datasetsWithStats = await Promise.all(
        data.datasets.map(async (dataset) => {
          try {
            const statsResponse = await fetch(`http://localhost:8000/api/annotations/datasets/${dataset.id}/stats`);
            const stats = await statsResponse.json();
            return { ...dataset, stats };
          } catch (error) {
            return { ...dataset, stats: null };
          }
        })
      );
      
      setDatasets(datasetsWithStats);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  const handleCreateDataset = async () => {
    if (!newDataset.name || !newDataset.classes) {
      alert("Please fill in dataset name and classes");
      return;
    }

    setIsCreating(true);
    try {
      const classes = newDataset.classes.split(",").map(c => c.trim()).filter(c => c);
      
      const response = await fetch("http://localhost:8000/api/annotations/datasets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDataset.name,
          description: newDataset.description,
          classes: classes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert("✅ Dataset created successfully!\n\nNext steps:\n1. Upload images\n2. Annotate objects\n3. Export dataset\n4. Train model\n\nClick 'View Pipeline' to see the complete workflow.");
        setNewDataset({ name: "", description: "", classes: "" });
        await fetchDatasets();
        
        // Automatically show workflow for the newly created dataset
        const newDataset = data.dataset || datasets.find(d => d.id === data.dataset_id);
        if (newDataset) {
          setSelectedDataset(newDataset);
          setShowWorkflow(true);
        }
      } else {
        alert(`Error: ${data.detail || "Failed to create dataset"}`);
      }
    } catch (error) {
      console.error("Error creating dataset:", error);
      alert("Error creating dataset. Make sure backend is running.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportDataset = async (datasetId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/annotations/datasets/${datasetId}/export`, {
        method: "POST"
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`Dataset exported! Train: ${data.train_images}, Val: ${data.val_images} images`);
        fetchDatasets();
      }
    } catch (error) {
      console.error("Error exporting dataset:", error);
      alert("Error exporting dataset");
    }
  };

  const handleDownloadDataset = async (datasetId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/annotations/datasets/${datasetId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dataset_${datasetId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading dataset:", error);
      alert("Export the dataset first before downloading");
    }
  };

  const handleDeleteDataset = async (datasetId, datasetName) => {
    if (!confirm(`Are you sure you want to delete dataset "${datasetName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/annotations/datasets/${datasetId}`, {
        method: "DELETE"
      });
      const data = await response.json();
      
      if (data.success) {
        alert("Dataset deleted successfully");
        fetchDatasets();
      }
    } catch (error) {
      console.error("Error deleting dataset:", error);
      alert("Error deleting dataset");
    }
  };

  const handleTrainDataset = async (datasetId, datasetName) => {
    if (!confirm(`Start training with dataset "${datasetName}"? Make sure it's exported first.`)) {
      return;
    }

    try {
      // First ensure dataset is exported
      const exportResponse = await fetch(`http://localhost:8000/api/annotations/datasets/${datasetId}/export`, {
        method: "POST"
      });
      const exportData = await exportResponse.json();
      
      if (!exportData.success) {
        alert("Failed to export dataset. Make sure you have annotated images.");
        return;
      }

      // Start training with the exported dataset
      const trainingConfig = {
        epochs: 50,
        batch_size: 16,
        img_size: 640,
        model_name: "yolov8n.pt"
      };

      const trainResponse = await fetch("http://localhost:8000/api/training/start-from-dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: datasetId,
          config: trainingConfig
        })
      });

      const trainData = await trainResponse.json();
      
      if (trainData.success) {
        alert(`Training started! Job ID: ${trainData.job_id}\nGo to Training tab to monitor progress.`);
      }
    } catch (error) {
      console.error("Error starting training:", error);
      alert("Error starting training. Make sure backend is running.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Notice */}
      <Card className="bg-primary/10 border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FiCheckCircle className="text-primary text-lg" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary mb-1">Complete Workflow Required (A to Z)</h3>
              <p className="text-sm text-muted-foreground">
                To create a working dataset, you must complete all steps in order: <strong>Create → Upload → Annotate → Export → Train</strong>. 
                Click "View Pipeline" on any dataset to see your progress and next steps.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Datasets</h2>
          <p className="text-muted-foreground">Create and manage annotation datasets - follow the complete workflow</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchDatasets} variant="outline" className="border-border">
            <FiRefreshCw className="mr-2" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <FiPlus className="mr-2" />
                New Dataset
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-primary">Create New Dataset</DialogTitle>
                <DialogDescription>
                  Set up a new dataset for image annotation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="dataset-name">Dataset Name</Label>
                  <Input
                    id="dataset-name"
                    value={newDataset.name}
                    onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
                    placeholder="e.g., Vehicle Detection"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataset-desc">Description (Optional)</Label>
                  <Input
                    id="dataset-desc"
                    value={newDataset.description}
                    onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
                    placeholder="Dataset description"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataset-classes">Classes (comma-separated)</Label>
                  <Input
                    id="dataset-classes"
                    value={newDataset.classes}
                    onChange={(e) => setNewDataset({ ...newDataset, classes: e.target.value })}
                    placeholder="e.g., car, truck, bus"
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter class names separated by commas
                  </p>
                </div>
              </div>
              <Button onClick={handleCreateDataset} disabled={isCreating} className="w-full bg-primary">
                {isCreating ? "Creating..." : "Create Dataset"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Datasets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.length > 0 ? (
          datasets.map((dataset) => (
            <Card key={dataset.id} className="bg-card border-border hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <FiFolder className="text-2xl text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{dataset.name}</CardTitle>
                      {dataset.description && (
                        <p className="text-xs text-muted-foreground mt-1">{dataset.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                {dataset.stats && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-primary">
                        {dataset.stats.completion_percentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={dataset.stats.completion_percentage} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Total Images</span>
                        <span className="font-medium">{dataset.stats.total_images}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Annotated</span>
                        <span className="font-medium text-primary">{dataset.stats.annotated_images}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Classes</span>
                        <span className="font-medium">{dataset.stats.total_classes}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Remaining</span>
                        <span className="font-medium">{dataset.stats.unannotated_images}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Classes */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Classes:</p>
                  <div className="flex flex-wrap gap-1">
                    {dataset.classes.slice(0, 3).map((cls, idx) => (
                      <Badge key={idx} className="bg-primary/20 text-primary border-primary/30 text-xs">
                        {cls}
                      </Badge>
                    ))}
                    {dataset.classes.length > 3 && (
                      <Badge className="bg-secondary text-secondary-foreground text-xs">
                        +{dataset.classes.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        setSelectedDataset(dataset);
                        setShowWorkflow(true);
                      }}
                      className="bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      <FiEye className="mr-1" />
                      Pipeline
                    </Button>
                    <Button
                      onClick={() => window.location.href = `/annotate?dataset=${dataset.id}`}
                      variant="outline"
                      className="border-border"
                      size="sm"
                    >
                      <FiEdit className="mr-1" />
                      Annotate
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleExportDataset(dataset.id)}
                    variant="outline"
                    className="w-full border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                    size="sm"
                  >
                    <FiDownload className="mr-1" />
                    Export Dataset
                  </Button>
                  <Button
                    onClick={() => handleTrainDataset(dataset.id, dataset.name)}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    size="sm"
                  >
                    <FiPlay className="mr-1" />
                    Train Model
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    onClick={() => handleDownloadDataset(dataset.id)}
                    variant="outline"
                    className="border-border"
                    size="sm"
                  >
                    <FiDownload className="mr-1" />
                    Download
                  </Button>
                  <Button
                    onClick={() => handleDeleteDataset(dataset.id, dataset.name)}
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    size="sm"
                  >
                    <FiTrash2 className="mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FiFolder className="text-6xl text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground mb-2">No datasets yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a dataset to start annotating images
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <FiPlus className="mr-2" />
                    Create Your First Dataset
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-primary">Create New Dataset</DialogTitle>
                    <DialogDescription>
                      Set up a new dataset for image annotation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataset-name-2">Dataset Name</Label>
                      <Input
                        id="dataset-name-2"
                        value={newDataset.name}
                        onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
                        placeholder="e.g., Vehicle Detection"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataset-desc-2">Description (Optional)</Label>
                      <Input
                        id="dataset-desc-2"
                        value={newDataset.description}
                        onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
                        placeholder="Dataset description"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataset-classes-2">Classes (comma-separated)</Label>
                      <Input
                        id="dataset-classes-2"
                        value={newDataset.classes}
                        onChange={(e) => setNewDataset({ ...newDataset, classes: e.target.value })}
                        placeholder="e.g., car, truck, bus"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateDataset} disabled={isCreating} className="w-full bg-primary">
                    {isCreating ? "Creating..." : "Create Dataset"}
                  </Button>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Workflow Dialog */}
      <Dialog open={showWorkflow} onOpenChange={setShowWorkflow}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {selectedDataset?.name} - Complete Pipeline
            </DialogTitle>
            <DialogDescription>
              Follow all steps to train your model
            </DialogDescription>
          </DialogHeader>
          {selectedDataset && (
            <DatasetWorkflow 
              dataset={selectedDataset} 
              onRefresh={async () => {
                await fetchDatasets();
                // Refresh the selected dataset with latest data
                if (selectedDataset) {
                  try {
                    const response = await fetch(`http://localhost:8000/api/annotations/datasets/${selectedDataset.id}`);
                    const updatedDataset = await response.json();
                    setSelectedDataset(updatedDataset);
                  } catch (error) {
                    console.error("Error refreshing selected dataset:", error);
                  }
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

