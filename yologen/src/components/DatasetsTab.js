"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FiFolder, FiPlus, FiRefreshCw, FiEdit, FiPlay, FiEye, FiBarChart2, FiTrash2, FiDownload } from "react-icons/fi";
import { API_ENDPOINTS } from "@/lib/config";
import DatasetWorkflow from "@/components/DatasetWorkflow";

export default function DatasetsTab() {
  const [datasets, setDatasets] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
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
      const response = await fetch(API_ENDPOINTS.DATASETS.LIST);
      const data = await response.json();

      const datasetsWithStats = await Promise.all(
        data.datasets.map(async (dataset) => {
          try {
            const statsResponse = await fetch(API_ENDPOINTS.DATASETS.STATS(dataset.id));
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

      const response = await fetch(API_ENDPOINTS.DATASETS.CREATE, {
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
        setNewDataset({ name: "", description: "", classes: "" });
        await fetchDatasets();
      }
    } catch (error) {
      console.error("Error creating dataset:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportDataset = async (datasetId) => {
    try {
      const response = await fetch(API_ENDPOINTS.DATASETS.EXPORT(datasetId), {
        method: "POST"
      });
      const data = await response.json();
      if (data.success) {
        alert("Dataset exported successfully");
        fetchDatasets();
      }
    } catch (error) {
      console.error("Error exporting dataset:", error);
    }
  };

  const handleTrainDataset = async (datasetId, datasetName) => {
    if (!confirm(`Start training with dataset "${datasetName}"?`)) return;

    try {
      const response = await fetch(API_ENDPOINTS.TRAINING.START_FROM_DATASET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: datasetId,
          config: { epochs: 50, batch_size: 16, img_size: 640, model_name: "yolov8n.pt" }
        })
      });

      const data = await response.json();
      if (data.success) {
        alert("Training started successfully");
      }
    } catch (error) {
      console.error("Error starting training:", error);
    }
  };

  const handleDeleteDataset = async (datasetId, datasetName) => {
    if (!confirm(`Delete dataset "${datasetName}"?`)) return;

    try {
      const response = await fetch(API_ENDPOINTS.DATASETS.GET(datasetId), {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        fetchDatasets();
      }
    } catch (error) {
      console.error("Error deleting dataset:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Datasets</h2>
          <p className="text-sm text-muted-foreground">Manage your image annotation datasets</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDatasets} variant="outline" size="sm">
            <FiRefreshCw className="mr-2" /> Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <FiPlus className="mr-2" /> New Dataset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Dataset</DialogTitle>
                <DialogDescription>Create a new dataset for annotation.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newDataset.name}
                    onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
                    placeholder="e.g. My Dataset"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Classes (comma separated)</Label>
                  <Input
                    value={newDataset.classes}
                    onChange={(e) => setNewDataset({ ...newDataset, classes: e.target.value })}
                    placeholder="cat, dog"
                  />
                </div>
              </div>
              <Button onClick={handleCreateDataset} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.map((dataset) => (
          <Card key={dataset.id} className="bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <FiFolder className="text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{dataset.name}</CardTitle>
                  <p className="text-xs text-muted-foreground truncate w-40">{dataset.description || "No description"}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {dataset.stats && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{dataset.stats.annotated_images} / {dataset.stats.total_images} images</span>
                    <span>{dataset.stats.completion_percentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={dataset.stats.completion_percentage} className="h-1.5" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => window.location.href = `/annotate?dataset=${dataset.id}`}
                >
                  <FiEdit className="mr-1.5" /> Annotate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    setSelectedDataset(dataset);
                    setShowWorkflow(true);
                  }}
                >
                  <FiEye className="mr-1.5" /> Pipeline
                </Button>
              </div>

              <div className="pt-2 border-t border-border flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleExportDataset(dataset.id)} title="Export">
                    <FiDownload className="text-muted-foreground w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleTrainDataset(dataset.id, dataset.name)} title="Train">
                    <FiPlay className="text-muted-foreground w-4 h-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteDataset(dataset.id, dataset.name)} className="text-muted-foreground hover:text-destructive">
                  <FiTrash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showWorkflow} onOpenChange={setShowWorkflow}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDataset?.name} - Pipeline</DialogTitle>
          </DialogHeader>
          {selectedDataset && <DatasetWorkflow dataset={selectedDataset} onRefresh={fetchDatasets} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

