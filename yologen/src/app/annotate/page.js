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
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileInputMoreRef = useRef(null);

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

  // Handle window resize to redraw canvas
  useEffect(() => {
    const handleResize = () => {
      // Use a small debounce to avoid excessive redraws
      setTimeout(() => {
        if (canvasRef.current && imageRef.current?.complete) {
          drawCanvas();
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [boxes, currentBox, isDrawing]);

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
    
    // Load split assignment
    setSelectedSplit(img.split || null);
    setShowSplitDialog(false);
  };

  const handleUploadImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Reset input value to allow re-uploading the same file
    e.target.value = '';

    if (!datasetId) {
      alert("Error: Dataset ID not found");
      return;
    }

    // Validate files before upload
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const invalidFiles = files.filter(file => {
      const type = file.type.toLowerCase();
      return !validTypes.some(validType => type.includes(validType.split('/')[1]));
    });
    
    if (invalidFiles.length > 0) {
      alert(`Invalid file types detected. Please upload only images (JPG, PNG, GIF, BMP, WEBP).\n\nInvalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      // Ensure each file is appended with the correct field name
      formData.append("files", file);
    });

    try {
      const response = await fetch(`http://localhost:8000/api/annotations/datasets/${datasetId}/upload`, {
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
        alert(message);
        fetchDataset();
      } else {
        let errorMsg = data.detail || "Upload failed";
        if (data.errors && data.errors.length > 0) {
          errorMsg += `\n\nErrors:\n${data.errors.join('\n')}`;
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      alert(`❌ Error uploading images: ${error.message}\n\nMake sure:\n- Backend is running on port 8000\n- Files are valid images\n- You have permission to upload`);
    }
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !e) return { x: 0, y: 0 };
    
    const img = imageRef.current;
    if (!img || !img.complete || img.naturalWidth === 0 || !canvas.width || !canvas.height) {
      return { x: 0, y: 0 };
    }
    
    // Get canvas bounding rectangle
    const rect = canvas.getBoundingClientRect();
    
    // Get computed styles to account for borders
    const styles = window.getComputedStyle(canvas);
    const borderLeft = parseFloat(styles.borderLeftWidth) || 0;
    const borderRight = parseFloat(styles.borderRightWidth) || 0;
    const borderTop = parseFloat(styles.borderTopWidth) || 0;
    const borderBottom = parseFloat(styles.borderBottomWidth) || 0;
    
    // Image natural dimensions (these are what we store annotations in)
    const imageWidth = img.naturalWidth;
    const imageHeight = img.naturalHeight;
    
    // Canvas internal dimensions (should match image dimensions)
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Get displayed canvas dimensions (actual rendered size on screen, excluding borders)
    const displayWidth = rect.width - borderLeft - borderRight;
    const displayHeight = rect.height - borderTop - borderBottom;
    
    // Calculate the actual scale factor
    // Canvas is scaled proportionally, so scale should be the same for both axes
    const scale = imageWidth / displayWidth;
    
    // Get mouse position relative to canvas element (including borders in the offset)
    const mouseX = e.clientX - rect.left - borderLeft;
    const mouseY = e.clientY - rect.top - borderTop;
    
    // Convert display coordinates to image coordinates
    const imageX = mouseX * scale;
    const imageY = mouseY * scale;
    
    // Clamp to image bounds
    const clampedX = Math.max(0, Math.min(imageX, imageWidth));
    const clampedY = Math.max(0, Math.min(imageY, imageHeight));
    
    return { x: clampedX, y: clampedY };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    if (!canvasRef.current || !dataset) return;
    
    const { x, y } = getCanvasCoordinates(e);
    
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    if (!isDrawing || !startPos || !canvasRef.current) return;
    
    const { x, y } = getCanvasCoordinates(e);
    
    const width = x - startPos.x;
    const height = y - startPos.y;
    
    setCurrentBox({ x: startPos.x, y: startPos.y, width, height });
    drawCanvas();
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    if (!isDrawing || !startPos || !dataset || !canvasRef.current) {
      setIsDrawing(false);
      setStartPos(null);
      setCurrentBox(null);
      return;
    }
    
    // Calculate final box dimensions from current mouse position
    const { x, y } = getCanvasCoordinates(e);
    const width = x - startPos.x;
    const height = y - startPos.y;
    
    // Add box if it has reasonable size
    if (Math.abs(width) > 10 && Math.abs(height) > 10) {
      // Normalize negative dimensions
      const normalizedBox = {
        x: width < 0 ? startPos.x + width : startPos.x,
        y: height < 0 ? startPos.y + height : startPos.y,
        width: Math.abs(width),
        height: Math.abs(height),
        class_id: selectedClass,
        class_name: dataset.classes[selectedClass]
      };
      
      // Use functional update to ensure we have the latest boxes
      setBoxes(prevBoxes => [...prevBoxes, normalizedBox]);
      
      // Force canvas redraw after state update
      setTimeout(() => {
        setCurrentBox(null);
        drawCanvas();
      }, 0);
    } else {
      // Clear current box if too small
      setCurrentBox(null);
      drawCanvas();
    }
    
    setIsDrawing(false);
    setStartPos(null);
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
  }, [boxes, currentBox, isDrawing]);

  // Redraw when image loads
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete && canvasRef.current) {
      drawCanvas();
    }
  }, [currentImageIndex]);

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
    
    // Ensure we use the image's natural dimensions (canvas should match, but use image as source of truth)
    const imgElement = imageRef.current;
    const imageWidth = imgElement?.naturalWidth || canvas.width;
    const imageHeight = imgElement?.naturalHeight || canvas.height;
    
    try {
      const response = await fetch("http://localhost:8000/api/annotations/annotations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: img.id,
          image_name: img.filename,
          width: imageWidth,
          height: imageHeight,
          boxes: boxes,
          dataset_id: datasetId,
          split: selectedSplit  // Include split if already selected
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save annotations");
      }
      
      const data = await response.json();
      
      if (data.success) {
        // If split not selected, show dialog; otherwise move to next
        if (!selectedSplit) {
          setShowSplitDialog(true);
        } else {
          handleNextImage();
        }
      }
    } catch (error) {
      console.error("Error saving annotations:", error);
      alert(`Error saving annotations: ${error.message}`);
    }
  };

  const handleSplitSelection = async (split) => {
    if (!images[currentImageIndex]) return;
    
    const img = images[currentImageIndex];
    setSelectedSplit(split);
    
    try {
      // Update split on backend
      const response = await fetch(
        `http://localhost:8000/api/annotations/datasets/${datasetId}/images/${img.id}/split`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ split })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update split");
      }
      
      // Update local state
      const updatedImages = [...images];
      updatedImages[currentImageIndex].split = split;
      setImages(updatedImages);
      
      // Close dialog and move to next image
      setShowSplitDialog(false);
      handleNextImage();
    } catch (error) {
      console.error("Error updating split:", error);
      alert(`Error updating split: ${error.message}`);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      alert("All images annotated! You can now export the dataset.");
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
                  {selectedSplit && (
                    <span className="ml-2">
                      • Split: <span className="font-semibold capitalize">{selectedSplit}</span>
                    </span>
                  )}
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
                        const img = e.target;
                        if (canvas && img.complete && img.naturalWidth > 0) {
                          // Set canvas internal dimensions to EXACTLY match image natural size
                          // This is critical - these dimensions are used for coordinate calculations
                          canvas.width = img.naturalWidth;
                          canvas.height = img.naturalHeight;
                          
                          // Set display size to maintain aspect ratio
                          // The canvas will be scaled by CSS but internal dimensions stay at natural size
                          canvas.style.width = '100%';
                          canvas.style.height = 'auto';
                          canvas.style.maxHeight = '70vh';
                          canvas.style.display = 'block';
                          
                          // Force a reflow to ensure dimensions are set
                          canvas.offsetHeight;
                          
                          // Small delay to ensure everything is rendered
                          setTimeout(() => drawCanvas(), 100);
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
                      onMouseLeave={(e) => {
                        if (isDrawing && startPos) {
                          // Use the last known position from currentBox if available
                          if (currentBox && Math.abs(currentBox.width) > 10 && Math.abs(currentBox.height) > 10) {
                            const normalizedBox = {
                              x: currentBox.width < 0 ? currentBox.x + currentBox.width : currentBox.x,
                              y: currentBox.height < 0 ? currentBox.y + currentBox.height : currentBox.y,
                              width: Math.abs(currentBox.width),
                              height: Math.abs(currentBox.height),
                              class_id: selectedClass,
                              class_name: dataset.classes[selectedClass]
                            };
                            setBoxes(prevBoxes => [...prevBoxes, normalizedBox]);
                          }
                          setIsDrawing(false);
                          setStartPos(null);
                          setCurrentBox(null);
                          setTimeout(() => drawCanvas(), 0);
                        }
                      }}
                      className="w-full border border-border rounded-lg cursor-crosshair bg-black"
                      style={{ 
                        maxHeight: '70vh', 
                        height: 'auto',
                        display: 'block',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                    <p>No images in dataset</p>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 bg-primary"
                    >
                      <FiUpload className="mr-2" />
                      Upload Images
                    </Button>
                    <Input
                      ref={fileInputRef}
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

            {/* Current Split Display */}
            {selectedSplit && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Split</p>
                      <p className="text-lg font-semibold capitalize">{selectedSplit}</p>
                    </div>
                    <Button
                      onClick={() => setShowSplitDialog(true)}
                      variant="outline"
                      size="sm"
                      className="border-border"
                    >
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={handleSaveAnnotations} className="w-full bg-primary hover:bg-primary/90">
                <FiSave className="mr-2" />
                Save & Next
              </Button>
              <Button 
                onClick={() => fileInputMoreRef.current?.click()}
                variant="outline" 
                className="w-full border-border"
              >
                <FiUpload className="mr-2" />
                Add More Images
              </Button>
              <Input
                ref={fileInputMoreRef}
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

      {/* Split Selection Dialog */}
      {showSplitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-card border-border w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-primary">Select Dataset Split</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please select whether this image is for training, validation, or testing.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleSplitSelection("train")}
                  className="h-20 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <span className="text-lg font-bold">Train</span>
                  <span className="text-xs opacity-90">Training set</span>
                </Button>
                <Button
                  onClick={() => handleSplitSelection("val")}
                  className="h-20 flex flex-col items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <span className="text-lg font-bold">Val</span>
                  <span className="text-xs opacity-90">Validation set</span>
                </Button>
                <Button
                  onClick={() => handleSplitSelection("test")}
                  className="h-20 flex flex-col items-center justify-center bg-green-600 hover:bg-green-700 text-white"
                >
                  <span className="text-lg font-bold">Test</span>
                  <span className="text-xs opacity-90">Test set</span>
                </Button>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  This selection will be saved and used when exporting the dataset.
                </p>
                <Button
                  onClick={() => {
                    setShowSplitDialog(false);
                    handleNextImage();
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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

