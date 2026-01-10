"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FiSave, FiTrash2, FiUpload, FiChevronLeft, FiChevronRight, FiHome } from "react-icons/fi";

function AnnotationToolContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const datasetId = searchParams.get('dataset');
  
  const [dataset, setDataset] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [boxes, setBoxes] = useState([]);
  const [selectedClass, setSelectedClass] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (datasetId) {
      fetchDataset();
    }
  }, [datasetId]);

  useEffect(() => {
    if (images.length > 0) {
      loadImage(currentImageIndex);
    }
  }, [currentImageIndex, images]);

  const fetchDataset = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/annotations/datasets/${datasetId}`);
      const data = await response.json();
      setDataset(data);
      setImages(data.images || []);
    } catch (error) {
      console.error("Error fetching dataset:", error);
      alert("Error loading dataset. Make sure backend is running.");
    }
  };

  const loadImage = async (index) => {
    if (!images[index]) return;
    
    const img = images[index];
    
    // Load existing annotations
    try {
      const response = await fetch(`http://localhost:8000/api/annotations/annotations/${datasetId}/${img.id}`);
      const data = await response.json();
      setBoxes(data.boxes || []);
    } catch (error) {
      setBoxes([]);
    }
  };

  const handleUploadImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    try {
      const response = await fetch(`http://localhost:8000/api/annotations/datasets/${datasetId}/upload`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`${data.uploaded} images uploaded successfully!`);
        fetchDataset();
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error uploading images");
    }
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    
    const { x, y } = getCanvasCoordinates(e);
    
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;
    
    const { x, y } = getCanvasCoordinates(e);
    
    const width = x - startPos.x;
    const height = y - startPos.y;
    
    setCurrentBox({ x: startPos.x, y: startPos.y, width, height });
    drawCanvas();
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox || !dataset) return;
    
    // Add box if it has reasonable size
    if (Math.abs(currentBox.width) > 10 && Math.abs(currentBox.height) > 10) {
      // Normalize negative dimensions
      const normalizedBox = {
        x: currentBox.width < 0 ? currentBox.x + currentBox.width : currentBox.x,
        y: currentBox.height < 0 ? currentBox.y + currentBox.height : currentBox.y,
        width: Math.abs(currentBox.width),
        height: Math.abs(currentBox.height),
        class_id: selectedClass,
        class_name: dataset.classes[selectedClass]
      };
      
      setBoxes([...boxes, normalizedBox]);
    }
    
    setIsDrawing(false);
    setStartPos(null);
    setCurrentBox(null);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    
    const ctx = canvas.getContext('2d');
    
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw existing boxes
      boxes.forEach((box, index) => {
        const classIndex = box.class_id % 10;
        const hue = (classIndex * 360 / 10);
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Draw label
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        const labelText = box.class_name;
        const labelWidth = ctx.measureText(labelText).width + 10;
        ctx.fillRect(box.x, box.y - 20, labelWidth, 20);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(labelText, box.x + 5, box.y - 5);
      });
      
      // Draw current box being drawn
      if (currentBox && isDrawing) {
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2;
        ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      }
    } catch (error) {
      console.error("Error drawing canvas:", error);
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [boxes, currentBox]);

  const handleSaveAnnotations = async () => {
    if (!images[currentImageIndex] || !dataset) {
      alert("No image or dataset loaded");
      return;
    }
    
    if (boxes.length === 0) {
      alert("Please add at least one annotation before saving");
      return;
    }
    
    const img = images[currentImageIndex];
    const canvas = canvasRef.current;
    
    if (!canvas) {
      alert("Canvas not ready");
      return;
    }
    
    try {
      const response = await fetch("http://localhost:8000/api/annotations/annotations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: img.id,
          image_name: img.filename,
          width: canvas.width,
          height: canvas.height,
          boxes: boxes,
          dataset_id: datasetId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save annotations");
      }
      
      const data = await response.json();
      
      if (data.success) {
        alert("Annotations saved successfully!");
        // Move to next image
        if (currentImageIndex < images.length - 1) {
          setCurrentImageIndex(currentImageIndex + 1);
        } else {
          alert("All images annotated! You can now export the dataset.");
        }
      }
    } catch (error) {
      console.error("Error saving annotations:", error);
      alert(`Error saving annotations: ${error.message}`);
    }
  };

  const handleDeleteBox = (index) => {
    setBoxes(boxes.filter((_, i) => i !== index));
  };

  if (!dataset) {
    return (
      <div className="min-h-screen bg-black text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Loading dataset...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!dataset.classes || dataset.classes.length === 0) {
    return (
      <div className="min-h-screen bg-black text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Error: Dataset has no classes defined</p>
          <Button onClick={() => router.push('/')}>
            <FiHome className="mr-2" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                <FiHome className="mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold text-primary">{dataset.name}</h1>
                <p className="text-xs text-muted-foreground">
                  Image {currentImageIndex + 1} of {images.length}
                </p>
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              {boxes.length} annotations
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                {currentImage ? (
                  <div className="relative">
                    <img
                      ref={imageRef}
                      src={`http://localhost:8000/api/annotations/image/${datasetId}/${currentImage.filename}`}
                      alt="Annotate"
                      className="hidden"
                      onLoad={(e) => {
                        const canvas = canvasRef.current;
                        if (canvas && e.target.complete && e.target.naturalWidth > 0) {
                          canvas.width = e.target.naturalWidth;
                          canvas.height = e.target.naturalHeight;
                          // Small delay to ensure image is fully loaded
                          setTimeout(() => drawCanvas(), 50);
                        }
                      }}
                      onError={(e) => {
                        console.error("Image failed to load:", currentImage.filename);
                        console.error("Dataset ID:", datasetId);
                        console.error("Image URL:", e.target.src);
                        alert("Failed to load image. Check browser console for details.");
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className="w-full border border-border rounded-lg cursor-crosshair bg-black"
                      style={{ maxHeight: '70vh', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                    <p>No images in dataset</p>
                    <Label htmlFor="upload-images" className="mt-4">
                      <Button asChild className="bg-primary">
                        <span>
                          <FiUpload className="mr-2" />
                          Upload Images
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="upload-images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleUploadImages}
                      className="hidden"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            {images.length > 0 && (
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                  disabled={currentImageIndex === 0}
                  variant="outline"
                  className="border-border"
                >
                  <FiChevronLeft className="mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentImage?.original_name}
                </span>
                <Button
                  onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                  disabled={currentImageIndex === images.length - 1}
                  variant="outline"
                  className="border-border"
                >
                  Next
                  <FiChevronRight className="ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Class Selection */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Select Class</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dataset && dataset.classes && dataset.classes.length > 0 ? (
                  <>
                    <Select value={selectedClass.toString()} onValueChange={(v) => setSelectedClass(parseInt(v))}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dataset.classes.map((cls, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Click and drag on the image to create bounding boxes
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-destructive">No classes defined for this dataset</p>
                )}
              </CardContent>
            </Card>

            {/* Current Annotations */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary">Annotations ({boxes.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {boxes.length > 0 ? (
                  boxes.map((box, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                      <div>
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          {box.class_name}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(box.width)} × {Math.round(box.height)}px
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteBox(index)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <FiTrash2 />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No annotations yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={handleSaveAnnotations} className="w-full bg-primary hover:bg-primary/90">
                <FiSave className="mr-2" />
                Save & Next
              </Button>
              <Label htmlFor="upload-more" className="w-full">
                <Button asChild variant="outline" className="w-full border-border">
                  <span>
                    <FiUpload className="mr-2" />
                    Add More Images
                  </span>
                </Button>
              </Label>
              <Input
                id="upload-more"
                type="file"
                multiple
                accept="image/*"
                onChange={handleUploadImages}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AnnotatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-foreground flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <AnnotationToolContent />
    </Suspense>
  );
}

