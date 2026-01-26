"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FiSave, FiTrash2, FiUpload, FiChevronLeft, FiChevronRight, FiHome, FiDownload } from "react-icons/fi";

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
  const [stats, setStats] = useState(null);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileInputMoreRef = useRef(null);

  useEffect(() => {
    if (datasetId) {
      fetchDataset();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  const fetchStats = async () => {
    if (!datasetId) return;
    try {
      const response = await fetch(`http://localhost:8000/api/annotations/datasets/${datasetId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Refresh stats periodically and when images change
  useEffect(() => {
    if (!datasetId) return;

    // Initial fetch
    fetchStats();

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  useEffect(() => {
    if (images.length > 0 && currentImageIndex < images.length) {
      loadImage(currentImageIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIndex, images.length]);

  // Handle window resize to redraw canvas
  useEffect(() => {
    const handleResize = () => {
      // Use a small debounce to avoid excessive redraws
      const timeoutId = setTimeout(() => {
        if (canvasRef.current && imageRef.current?.complete) {
          drawCanvas();
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes, currentBox, isDrawing]);

  const fetchDataset = async () => {
    if (!datasetId) return;

    try {
      const response = await fetch(`http://localhost:8000/api/annotations/datasets/${datasetId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch dataset: ${response.status}`);
      }
      const data = await response.json();
      setDataset(data);
      setImages(data.images || []);
    } catch (error) {
      console.error("Error fetching dataset:", error);
      alert("Error loading dataset. Make sure backend is running.");
    }
  };

  const loadImage = async (index) => {
    if (!images[index] || !datasetId) return;

    const img = images[index];

    // Load existing annotations
    try {
      const response = await fetch(`http://localhost:8000/api/annotations/annotations/${datasetId}/${img.id}`);
      if (response.ok) {
        const data = await response.json();
        setBoxes(data.boxes || []);
      } else {
        setBoxes([]);
      }
    } catch (error) {
      console.error("Error loading annotations:", error);
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
    if (canvasRef.current && imageRef.current?.complete) {
      drawCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes, currentBox, isDrawing]);

  // Redraw when image loads
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete && canvasRef.current) {
      drawCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIndex]);

  const handleSaveAnnotations = async () => {
    if (!images[currentImageIndex] || !dataset) return false;

    // Check natural dimensions availability
    const naturalWidth = imageRef.current?.naturalWidth || 0;
    const naturalHeight = imageRef.current?.naturalHeight || 0;

    // If image isn't loaded yet, try to use canvas dimensions or skip
    // We should be careful not to overwrite valid annotations with 0-size data
    // if the image hasn't loaded. But if boxes is empty, it's fine.

    // If we have boxes but no dimensions, that's risky. 
    // However, the user is navigating away, so they likely saw the image.

    const img = images[currentImageIndex];

    try {
      const response = await fetch(`http://localhost:8000/api/annotations/annotations/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: datasetId,
          image_id: img.id,
          image_name: img.filename,
          width: naturalWidth || 0,
          height: naturalHeight || 0,
          boxes: boxes,
          split: selectedSplit || null
        })
      });

      if (response.ok) {
        await fetchStats(); // Refresh stats in background
        return true;
      } else {
        console.error("Failed to save annotations:", await response.text());
        return false;
      }
    } catch (error) {
      console.error("Error saving annotations:", error);
      return false;
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



  const handleNavigation = async (direction) => {
    // Auto-save before moving
    await handleSaveAnnotations();

    if (direction === 'next') {
      setCurrentImageIndex(prev => Math.min(images.length - 1, prev + 1));
    } else {
      setCurrentImageIndex(prev => Math.max(0, prev - 1));
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
          <Button onClick={() => router.push('/dashboard')} className="bg-primary hover:bg-primary/90">
            <FiHome className="mr-2" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];

  return (
    <div className="h-screen bg-black text-foreground overflow-hidden flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0 z-50 h-[65px]">
        <div className="container mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                <FiHome className="mr-2" />
                Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-px bg-border"></div>
                <div>
                  <h1 className="text-xl font-bold">{dataset?.name || 'Loading...'}</h1>
                  <p className="text-xs text-muted-foreground">
                    Image {currentImageIndex + 1} of {images.length}
                    {selectedSplit && (
                      <span className="ml-2">
                        • <span className="capitalize">{selectedSplit}</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stats && (
                <Badge variant="outline" className="border-border">
                  {stats.annotated_images || 0} / {stats.total_images || 0} annotated
                </Badge>
              )}
              <Badge>
                {boxes.length} {boxes.length === 1 ? 'annotation' : 'annotations'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="grid grid-cols-[15%_70%_15%] h-full">

          {/* Left Sidebar - Tools & Classes */}
          <div className="border-r border-border bg-card p-4 overflow-y-auto space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Classes</h3>
              {dataset && dataset.classes && dataset.classes.length > 0 ? (
                <div className="space-y-2">
                  {dataset.classes.map((cls, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedClass(idx)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${selectedClass === idx
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'hover:bg-muted text-muted-foreground'
                        }`}
                    >
                      <span className="truncate">{cls}</span>
                      {selectedClass === idx && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-destructive">No classes defined</p>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Controls</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Click & Drag to draw</p>
                <p>• Select class on left</p>
                <p>• Delete on right</p>
              </div>
            </div>
          </div>

          {/* Center Workspace - Canvas */}
          <div className="bg-black/50 relative flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
              <Card className="bg-transparent border-none shadow-none w-full h-full flex items-center justify-center">
                <CardContent className="p-0 flex items-center justify-center w-full h-full relative">
                  {currentImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        ref={imageRef}
                        src={`http://localhost:8000/api/annotations/image/${datasetId}/${currentImage.filename}`}
                        alt="Annotate"
                        className="hidden"
                        onLoad={(e) => {
                          const canvas = canvasRef.current;
                          const img = e.target;
                          if (canvas && img.complete && img.naturalWidth > 0) {
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;

                            // Let the canvas sit naturally within the container
                            // We use object-contain equivalent logic via CSS on the canvas
                            canvas.style.maxWidth = '100%';
                            canvas.style.maxHeight = '100%';
                            canvas.style.width = 'auto';
                            canvas.style.height = 'auto';
                            canvas.style.display = 'block';

                            canvas.offsetHeight;
                            setTimeout(() => drawCanvas(), 100);
                          }
                        }}
                        onError={(e) => {
                          console.error("Image failed:", e);
                        }}
                      />
                      <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={(e) => {
                          if (isDrawing && startPos) {
                            setIsDrawing(false);
                            setStartPos(null);
                            setCurrentBox(null);
                            setTimeout(() => drawCanvas(), 0);
                          }
                        }}
                        className="border border-border/50 shadow-2xl rounded-sm cursor-crosshair bg-black"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          display: 'block'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">No images available</p>
                      <Button onClick={() => fileInputRef.current?.click()}>
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
            </div>

            {/* Bottom Bar - Navigation */}
            {images.length > 0 && (
              <div className="h-14 border-t border-border bg-card flex items-center justify-between px-6 shrink-0">
                <Button
                  onClick={() => handleNavigation('prev')}
                  disabled={currentImageIndex === 0}
                  variant="ghost"
                  size="sm"
                >
                  <FiChevronLeft className="mr-2" /> Previous
                </Button>

                <span className="text-sm font-medium">
                  {currentImage?.original_name}
                </span>

                <Button
                  onClick={() => handleNavigation('next')}
                  disabled={currentImageIndex === images.length - 1}
                  variant="ghost"
                  size="sm"
                >
                  Next <FiChevronRight className="ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar - Annotations & Actions */}
          <div className="border-l border-border bg-card p-4 overflow-y-auto space-y-6">

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={async () => {
                const success = await handleSaveAnnotations();
                if (success) alert("Annotations saved successfully!");
                else alert("Failed to save annotations. See console for details.");
              }} className="w-full bg-primary hover:bg-primary/90">
                <FiSave className="mr-2" />
                Save
              </Button>
              <Button
                onClick={async () => {
                  if (!datasetId) return;
                  await fetchStats();
                  window.location.href = `http://localhost:8000/api/annotations/datasets/${datasetId}/export`;
                }}
                variant="outline"
                className="w-full border-border"
              >
                <FiDownload className="mr-2" />
                Export
              </Button>
            </div>

            {/* Annotations List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Annotations</h3>
                <Badge variant="outline" className="text-xs">{boxes.length}</Badge>
              </div>

              <div className="space-y-2">
                {boxes.length > 0 ? (
                  boxes.map((box, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/50 transition-colors group">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${(box.class_id % 10) * 36}, 100%, 50%)` }} />
                          <span className="font-medium text-sm">{box.class_name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(box.width)} × {Math.round(box.height)}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteBox(index)}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4 border border-dashed border-border/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">No annotations yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Split Info */}
            {selectedSplit && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Dataset Split</p>
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded-md border border-border/50">
                  <span className="text-sm font-medium capitalize">{selectedSplit}</span>
                  <Button
                    onClick={() => setShowSplitDialog(true)}
                    variant="ghost"
                    size="xs"
                    className="h-6 text-xs"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            )}

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

