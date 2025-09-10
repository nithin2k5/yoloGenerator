'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
// import JSZip from 'jszip';

import Sidebar from '../components/Sidebar';
import ImageViewer from '../components/ImageViewer';
import { HelpModal, SettingsModal } from '../components/Modals';
import Instructions from '../components/Instructions';

export default function YOLODatasetGenerator() {
  // State for the sequential workflow
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowCompleted, setWorkflowCompleted] = useState({
    step1: false, // Classes setup
    step2: false, // Images uploaded
    step3: false, // Annotations started
    step4: false  // Dataset ready
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [annotationPresets, setAnnotationPresets] = useState([]);
  const [showCopyAnnotations, setShowCopyAnnotations] = useState(false);
  const [copySourceImage, setCopySourceImage] = useState(null);
  const [annotationFilters, setAnnotationFilters] = useState({ classId: 'all', showLabels: true });
  const [selectedYoloModel, setSelectedYoloModel] = useState('yolov9');
  const [imageCategories, setImageCategories] = useState({}); // Manual categorization of images

  // Original state variables
  const [darkMode, setDarkMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState('');
  const [selectedClass, setSelectedClass] = useState(0);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [annotations, setAnnotations] = useState({});
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [drawingBox, setDrawingBox] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [autoSave, setAutoSave] = useState(true);
  const [imageQuality, setImageQuality] = useState(0.8);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [annotationHistory, setAnnotationHistory] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-save effect
  useEffect(() => {
    if (autoSave) {
      const data = { classes, annotations, currentImageIndex };
      localStorage.setItem('yoloGeneratorData', JSON.stringify(data));
    }
  }, [autoSave, classes, annotations, currentImageIndex]);

  // Load saved data
  useEffect(() => {
    const savedData = localStorage.getItem('yoloGeneratorData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.classes) setClasses(data.classes);
        if (data.annotations) setAnnotations(data.annotations);
        if (data.currentImageIndex) setCurrentImageIndex(data.currentImageIndex);
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
  }, []);

  // Update workflow completion status
  useEffect(() => {
    const newWorkflowStatus = {
      step1: classes.length > 0,
      step2: images.length > 0,
      step3: Object.keys(annotations).length > 0 && Object.values(annotations).some(anns => anns.length > 0),
      step4: images.length > 0 && Object.keys(annotations).length > 0
    };
    setWorkflowCompleted(newWorkflowStatus);
  }, [classes, images, annotations]);



  // Workflow navigation functions
  const goToStep = (step) => {
    if (step === 1 || 
        (step === 2 && workflowCompleted.step1) ||
        (step === 3 && workflowCompleted.step2) ||
        (step === 4 && workflowCompleted.step3)) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Original functions
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Validate file types and sizes
    const maxFileSize = 50 * 1024 * 1024; // 50MB per file
    const validImageFiles = imageFiles.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large. Maximum size is 50MB.`);
        return false;
      }
      return true;
    });

    if (validImageFiles.length === 0) {
      alert('No valid images selected. Please select image files under 50MB each.');
      return;
    }

    // Check for duplicate names
    const existingNames = images.map(img => img.name);
    const duplicates = validImageFiles.filter(file => existingNames.includes(file.name));

    if (duplicates.length > 0) {
      const overwrite = confirm(`${duplicates.length} image(s) with the same name already exist. Overwrite them?`);
      if (!overwrite) {
        // Remove duplicates from valid files
        const uniqueFiles = validImageFiles.filter(file => !existingNames.includes(file.name));
        if (uniqueFiles.length === 0) {
          alert('All selected images already exist. Please choose different files.');
          return;
        }
        validImageFiles.splice(0, validImageFiles.length, ...uniqueFiles);
      }
    }

    const newImages = validImageFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));
    
    setImages(prev => [...prev, ...newImages]);
    setCurrentImageIndex(prev => prev === 0 ? 0 : prev);
    
    // Auto-advance to next step if classes are set up
    if (classes.length > 0) {
      nextStep();
    }
    
    event.target.value = '';

    // Show success message
    if (validImageFiles.length > 0) {
      console.log(`Successfully uploaded ${validImageFiles.length} image(s)`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Create a synthetic event object for the existing handler
      const syntheticEvent = {
        target: {
          files: files,
          value: ''
        }
      };
      handleImageUpload(syntheticEvent);
    }
  };

  const addClass = () => {
    if (newClass.trim() && !classes.includes(newClass.trim())) {
      const newClasses = [...classes, newClass.trim()];
      setClasses(newClasses);
      setNewClass('');
      
      addToHistory('addClass', { classes: newClasses });
      
      // Auto-advance to next step if this is the first class
      if (newClasses.length === 1) {
        nextStep();
      }
    }
  };

  const removeClass = (index) => {
    const newClasses = classes.filter((_, i) => i !== index);
    setClasses(newClasses);
    
    setAnnotations(prev => {
      const newAnnotations = { ...prev };
      Object.keys(newAnnotations).forEach(imageId => {
        newAnnotations[imageId] = newAnnotations[imageId].filter(ann => ann.classId !== index);
        newAnnotations[imageId] = newAnnotations[imageId].map(ann => ({
          ...ann,
          classId: ann.classId > index ? ann.classId - 1 : ann.classId
        }));
      });
      return newAnnotations;
    });
    
    addToHistory('removeClass', { classes: newClasses, removedIndex: index });
  };

  const addToHistory = (action, data) => {
    const historyItem = {
      id: Date.now(),
      action,
      data,
      timestamp: new Date().toISOString(),
      previousState: { 
        annotations: JSON.parse(JSON.stringify(annotations)), 
        classes: JSON.parse(JSON.stringify(classes)) 
      }
    };
    
    setAnnotationHistory(prev => [...prev, historyItem]);
    setUndoStack(prev => [...prev, historyItem]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { 
      action: 'undo', 
      data: lastAction,
      previousState: { 
        annotations: JSON.parse(JSON.stringify(annotations)), 
        classes: JSON.parse(JSON.stringify(classes)) 
      }
    }]);
    setUndoStack(prev => prev.slice(0, -1));
    
    if (lastAction.previousState) {
      setAnnotations(lastAction.previousState.annotations);
      setClasses(lastAction.previousState.classes);
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    
    const lastAction = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { 
      action: 'redo', 
      data: lastAction,
      previousState: { 
        annotations: JSON.parse(JSON.stringify(annotations)), 
        classes: JSON.parse(JSON.stringify(classes)) 
      }
    }]);
    setRedoStack(prev => prev.slice(0, -1));
    
    if (lastAction.action === 'undo' && lastAction.data.previousState) {
      setAnnotations(lastAction.data.previousState.annotations);
      setClasses(lastAction.data.previousState.classes);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!images[currentImageIndex]) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setIsDrawing(true);
    setDrawingBox({ x1: x, y1: y, x2: x, y2: y });
    setSelectedAnnotation(null);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !drawingBox) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setDrawingBox(prev => ({ ...prev, x2: x, y2: y }));
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !drawingBox || !images[currentImageIndex]) return;
    
    const { x1, y1, x2, y2 } = drawingBox;
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    
    if (width > 10 && height > 10) {
      const imageId = images[currentImageIndex].id;
      const canvas = canvasRef.current;
      
      const normalizedBox = {
        x1: Math.min(x1, x2) / canvas.width,
        y1: Math.min(y1, y2) / canvas.height,
        x2: Math.max(x1, x2) / canvas.width,
        y2: Math.max(y1, y2) / canvas.height,
        classId: selectedClass,
        id: Date.now() + Math.random()
      };
      
      const newAnnotations = {
        ...annotations,
        [imageId]: [...(annotations[imageId] || []), normalizedBox]
      };
      
      setAnnotations(newAnnotations);
      addToHistory('addAnnotation', { 
        imageId, 
        annotation: normalizedBox,
        annotations: newAnnotations 
      });
    }
    
    setIsDrawing(false);
    setDrawingBox(null);
  };

  const removeAnnotation = (imageId, index) => {
    const imageAnnotations = annotations[imageId] || [];
    const removedAnnotation = imageAnnotations[index];
    
    const newAnnotations = {
      ...annotations,
      [imageId]: imageAnnotations.filter((_, i) => i !== index)
    };
    
    setAnnotations(newAnnotations);
    addToHistory('removeAnnotation', { 
      imageId, 
      removedAnnotation,
      annotations: newAnnotations 
    });
    
    if (selectedAnnotation === index) {
      setSelectedAnnotation(null);
    }
  };

  const selectAnnotation = (index) => {
    setSelectedAnnotation(selectedAnnotation === index ? null : index);
  };

  const convertToYOLOFormat = (box) => {
    // Ensure coordinates are properly normalized (0-1 range)
    const x_center = Math.max(0, Math.min(1, (box.x1 + box.x2) / 2));
    const y_center = Math.max(0, Math.min(1, (box.y1 + box.y2) / 2));
    const width = Math.max(0, Math.min(1, box.x2 - box.x1));
    const height = Math.max(0, Math.min(1, box.y2 - box.y1));

    // Validate that the box has reasonable dimensions
    if (width <= 0 || height <= 0 || width > 1 || height > 1) {
      console.warn('Invalid bounding box dimensions:', { x_center, y_center, width, height });
      return null; // Skip invalid annotations
    }

    // YOLO9 format: class_id x_center y_center width height (all normalized)
    return `${box.classId} ${x_center.toFixed(6)} ${y_center.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
  };

  const exportDataset = async () => {
    if (images.length === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Create proper YOLO dataset folder structure with manual categories
      const imagesTrainFolder = zip.folder('images').folder('train');
      const imagesValFolder = zip.folder('images').folder('valid');
      const imagesTestFolder = zip.folder('images').folder('test');
      const labelsTrainFolder = zip.folder('labels').folder('train');
      const labelsValFolder = zip.folder('labels').folder('valid');
      const labelsTestFolder = zip.folder('labels').folder('test');

      // Use manual categorization instead of automatic splitting
      const trainImages = images.filter(img => imageCategories[img.id] === 'train');
      const valImages = images.filter(img => imageCategories[img.id] === 'valid');
      const testImages = images.filter(img => imageCategories[img.id] === 'test');

      // Validate that we have at least training and validation images
      const uncategorizedImages = images.filter(img => !imageCategories[img.id]);
      if (trainImages.length === 0 || valImages.length === 0) {
        alert(`Please categorize your images first!\n\nCurrent status:\n• Training: ${trainImages.length} images\n• Validation: ${valImages.length} images\n• Test: ${testImages.length} images\n• Uncategorised: ${uncategorizedImages.length} images\n\nUse the category buttons in the image viewer to assign each image to Training, Validation, or Test.`);
        setIsExporting(false);
        return;
      }

      
      const totalSteps = images.length * 2 + 1;
      let currentStep = 0;
      
      // Process training images
      for (const image of trainImages) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        imagesTrainFolder.file(image.name, blob);
        currentStep++;
        setExportProgress((currentStep / totalSteps) * 100);
      }
      
      // Process validation images
      for (const image of valImages) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        imagesValFolder.file(image.name, blob);
        currentStep++;
        setExportProgress((currentStep / totalSteps) * 100);
      }

      // Process test images
      for (const image of testImages) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        imagesTestFolder.file(image.name, blob);
        currentStep++;
        setExportProgress((currentStep / totalSteps) * 100);
      }

      // Process training annotations
      for (const image of trainImages) {
        const imageAnnotations = annotations[image.id] || [];
        if (imageAnnotations.length > 0) {
          const yoloAnnotations = imageAnnotations
            .map(box => convertToYOLOFormat(box))
            .filter(annotation => annotation !== null) // Filter out invalid annotations
            .join('\n');

          // Only create annotation file if there are valid annotations
          if (yoloAnnotations.trim()) {
          const annotationFileName = image.name.replace(/\.[^/.]+$/, '') + '.txt';
            labelsTrainFolder.file(annotationFileName, yoloAnnotations);
          }
        }
        currentStep++;
        setExportProgress((currentStep / totalSteps) * 100);
      }
      
      // Process validation annotations
      for (const image of valImages) {
        const imageAnnotations = annotations[image.id] || [];
        if (imageAnnotations.length > 0) {
          const yoloAnnotations = imageAnnotations
            .map(box => convertToYOLOFormat(box))
            .filter(annotation => annotation !== null) // Filter out invalid annotations
            .join('\n');

          // Only create annotation file if there are valid annotations
          if (yoloAnnotations.trim()) {
            const annotationFileName = image.name.replace(/\.[^/.]+$/, '') + '.txt';
            labelsValFolder.file(annotationFileName, yoloAnnotations);
          }
        }
        currentStep++;
        setExportProgress((currentStep / totalSteps) * 100);
      }

      // Process test annotations
      for (const image of testImages) {
        const imageAnnotations = annotations[image.id] || [];
        if (imageAnnotations.length > 0) {
          const yoloAnnotations = imageAnnotations
            .map(box => convertToYOLOFormat(box))
            .filter(annotation => annotation !== null) // Filter out invalid annotations
            .join('\n');

          // Only create annotation file if there are valid annotations
          if (yoloAnnotations.trim()) {
            const annotationFileName = image.name.replace(/\.[^/.]+$/, '') + '.txt';
            labelsTestFolder.file(annotationFileName, yoloAnnotations);
          }
        }
        currentStep++;
        setExportProgress((currentStep / totalSteps) * 100);
      }
      
            // Create model-specific data.yaml configuration file
      const selectedModelInfo = yoloModels[selectedYoloModel];
      const dataYaml = `# ${selectedModelInfo.name} Dataset Configuration
# Generated by YOLO Generator with Manual Categorization
# Model: ${selectedYoloModel.toUpperCase()}

# Dataset paths (relative to this file)
path: ./  # dataset root dir
train: images/train  # train images (relative to 'path')
val: images/valid    # validation images (relative to 'path')
${testImages.length > 0 ? `test: images/test     # test images (relative to 'path')` : '# test: images/test     # test images (no test images categorized)'}

# Classes
nc: ${classes.length}  # number of classes
names:
${classes.map((name, index) => `  ${index}: ${name}`).join('\n')}

# Model-specific configuration
model: ${selectedYoloModel}
recommended_model: ${selectedModelInfo.defaultModel}.pt

# Download script (optional)
download: |
  import os
  from pathlib import Path

  def download_dataset():
      # Dataset is already prepared for ${selectedModelInfo.name}
      print("Dataset ready for ${selectedModelInfo.name} training")

  if __name__ == "__main__":
      download_dataset()
`;

      zip.file('data.yaml', dataYaml);

      // Create README file with dataset information
      const readmeContent = `# ${selectedModelInfo.name} Dataset (Manual Categorization)

## Dataset Information
- **Model**: ${selectedModelInfo.name} (${selectedYoloModel.toUpperCase()})
- **Total Images**: ${images.length}
- **Training Images**: ${trainImages.length}
- **Validation Images**: ${valImages.length}
- **Test Images**: ${testImages.length}
- **Classes**: ${classes.length}
- **Total Annotations**: ${Object.values(annotations).flat().length}

## Class Names
${classes.map((name, index) => `${index}: ${name}`).join('\n')}

## ${selectedModelInfo.name} Training
${selectedModelInfo.description}

**Recommended Use:** ${selectedModelInfo.recommendedUse}

### Training Commands:

\`\`\`bash
# Train with recommended model
${selectedModelInfo.trainCommand}

# Train with different model sizes
${selectedModelInfo.modelSizes.map(size => `yolo train data=data.yaml model=${size}.pt epochs=100 imgsz=640`).join('\n')}

# Custom training parameters
yolo train data=data.yaml model=${selectedModelInfo.defaultModel}.pt epochs=100 imgsz=640 batch=16 workers=4
\`\`\`

### Model Features:
${selectedModelInfo.features.map(feature => `- ${feature}`).join('\n')}

## Dataset Structure (YOLO Format) - Manual Categorization
\`\`\`
dataset/
├── images/
│   ├── train/           # Training images (manually categorized)
│   ├── valid/           # Validation images (manually categorized)
│   └── test/            # Test images (manually categorized)
├── labels/
│   ├── train/           # YOLO labels for training images (.txt)
│   ├── valid/           # YOLO labels for validation images (.txt)
│   └── test/            # YOLO labels for test images (.txt)
├── data.yaml            # Dataset configuration for YOLO9
├── classes.txt          # Class names file (legacy)
└── README.md            # This file
\`\`\`

## YOLO Annotation Format
Each image has a corresponding .txt file with the same name containing:

### Format: \`<class_id> <x_center> <y_center> <width> <height>\`

- **class_id**: Integer starting from 0 (corresponds to class names above)
- **x_center**: Normalized center X coordinate (0.0 to 1.0)
- **y_center**: Normalized center Y coordinate (0.0 to 1.0)
- **width**: Normalized bounding box width (0.0 to 1.0)
- **height**: Normalized bounding box height (0.0 to 1.0)

### Example annotation file:
\`\`\`
0 0.512500 0.345833 0.125000 0.089583  # person
1 0.725000 0.612500 0.150000 0.125000  # car
0 0.312500 0.587500 0.100000 0.083333  # person
\`\`\`

## Manual Data Categorization
- **Training Set**: ${trainImages.length} images (manually selected)
- **Validation Set**: ${valImages.length} images (manually selected)
- **Test Set**: ${testImages.length} images (manually selected)
- Images were manually categorized by the user for precise control

## Usage with YOLO9
\`\`\`python
from ultralytics import YOLO

# Load model
model = YOLO('yolov9-c.pt')

# Train
model.train(data='data.yaml', epochs=100, imgsz=640)

# Validate
model.val(data='data.yaml')

# Predict
model.predict(source='path/to/images', save=True)
\`\`\`

## File Naming Convention
- Images: \`image_001.jpg\`, \`photo_2024.png\`, etc.
- Labels: \`image_001.txt\`, \`photo_2024.txt\`, etc.
- Each image must have a corresponding .txt file (even if empty)

---
**Generated by YOLO Generator**
${new Date().toISOString()}
`;

      zip.file('README.md', readmeContent);
      zip.file('classes.txt', classes.join('\n'));
      currentStep++;
      setExportProgress(100);
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yolo_dataset.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setSelectedAnnotation(null);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
      setSelectedAnnotation(null);
    }
  };

  // Copy annotations from one image to another
  const copyAnnotationsFromImage = (sourceImageId, targetImageId) => {
    if (!annotations[sourceImageId] || !images.find(img => img.id === targetImageId)) return;

    const sourceAnnotations = annotations[sourceImageId];
    const newAnnotations = {
      ...annotations,
      [targetImageId]: [...sourceAnnotations.map(ann => ({ ...ann, id: Date.now() + Math.random() }))]
    };

    setAnnotations(newAnnotations);
    addToHistory('copyAnnotations', {
      sourceImageId,
      targetImageId,
      copiedAnnotations: sourceAnnotations,
      newAnnotations
    });
  };

  // Save current annotations as a preset
  const saveAnnotationPreset = (name) => {
    if (!currentImage || !annotations[currentImage.id]) return;

    const preset = {
      id: Date.now(),
      name,
      annotations: JSON.parse(JSON.stringify(annotations[currentImage.id])),
      imageSize: { width: 800, height: 600 }, // Canvas size
      createdAt: new Date().toISOString()
    };

    setAnnotationPresets(prev => [...prev, preset]);
  };

  // Load annotation preset to current image
  const loadAnnotationPreset = (presetId) => {
    if (!currentImage) return;

    const preset = annotationPresets.find(p => p.id === presetId);
    if (!preset) return;

    const newAnnotations = {
      ...annotations,
      [currentImage.id]: preset.annotations.map(ann => ({ ...ann, id: Date.now() + Math.random() }))
    };

    setAnnotations(newAnnotations);
    addToHistory('loadPreset', {
      presetId,
      presetName: preset.name,
      newAnnotations
    });
  };

  // Batch operations on annotations
  const batchDeleteAnnotations = (classId = null) => {
    if (!currentImage) return;

    const currentImageAnnotations = annotations[currentImage.id] || [];
    const filteredAnnotations = classId !== null
      ? currentImageAnnotations.filter(ann => ann.classId !== classId)
      : [];

    const newAnnotations = {
      ...annotations,
      [currentImage.id]: filteredAnnotations
    };

    setAnnotations(newAnnotations);
    setSelectedAnnotation(null);
    addToHistory('batchDelete', {
      imageId: currentImage.id,
      deletedClassId: classId,
      previousAnnotations: currentImageAnnotations,
      newAnnotations
    });
  };

  // Auto-adjust annotations for different image sizes
  const autoAdjustAnnotations = (targetImageId) => {
    const targetImage = images.find(img => img.id === targetImageId);
    if (!targetImage || !currentImage) return;

    // For now, we'll assume canvas size is consistent
    // In a real implementation, you'd adjust based on actual image dimensions
    const currentAnnotations = annotations[currentImage.id] || [];
    const adjustedAnnotations = currentAnnotations.map(ann => ({
      ...ann,
      id: Date.now() + Math.random()
    }));

    const newAnnotations = {
      ...annotations,
      [targetImageId]: adjustedAnnotations
    };

    setAnnotations(newAnnotations);
    addToHistory('autoAdjust', {
      sourceImageId: currentImage.id,
      targetImageId,
      adjustedAnnotations,
      newAnnotations
    });
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setImages([]);
      setAnnotations({});
      setCurrentImageIndex(0);
      setSelectedAnnotation(null);
      setAnnotationHistory([]);
      setUndoStack([]);
      setRedoStack([]);
      setCurrentStep(1);
      setAnnotationPresets([]);
    }
  };

  const resetZoom = () => setZoom(1);
  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));

  // Keyboard shortcuts (moved here after all functions are defined)
  useEffect(() => {
    if (!keyboardShortcuts) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'n':
        case 'N':
          if (e.ctrlKey) {
            e.preventDefault();
            nextImage();
          }
          break;
        case 'p':
        case 'P':
          if (e.ctrlKey) {
            e.preventDefault();
            prevImage();
          }
          break;
        case 'z':
        case 'Z':
          if (e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            redo();
          } else if (e.ctrlKey) {
            e.preventDefault();
            undo();
          }
          break;
        case 'Delete':
          if (selectedAnnotation !== null && currentImage) {
            removeAnnotation(currentImage.id, selectedAnnotation);
            setSelectedAnnotation(null);
            setDrawingBox(null);
            setIsDrawing(false);
          }
          break;
        case ' ':
          e.preventDefault();
          setShowHelp(!showHelp);
          break;
        case 'c':
        case 'C':
          if (e.ctrlKey) {
            e.preventDefault();
            setShowCopyAnnotations(!showCopyAnnotations);
          }
          break;
        case 's':
        case 'S':
          if (e.ctrlKey) {
            e.preventDefault();
            const name = prompt('Enter preset name:');
            if (name) saveAnnotationPreset(name);
          }
          break;
        case 'd':
        case 'D':
          if (e.ctrlKey) {
            e.preventDefault();
            const classId = prompt('Enter class ID to delete (leave empty for all):');
            const classIdNum = classId === '' ? null : parseInt(classId);
            batchDeleteAnnotations(classIdNum);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts, selectedAnnotation, currentImageIndex, images, showHelp, undo, redo, nextImage, prevImage, removeAnnotation]);

  const currentImage = images[currentImageIndex];
  const currentAnnotations = currentImage ? (annotations[currentImage.id] || []) : [];
  const totalAnnotations = Object.values(annotations).flat().length;
  const progressPercentage = images.length > 0 ? (totalAnnotations / (images.length * 5)) * 100 : 0;

  // Titles for stepper labels
  const stepTitles = ['Classes', 'Upload', 'Annotate', 'Export'];

  // YOLO Model configurations with optimization data
  const yoloModels = {
    yolov8: {
      name: 'YOLOv8',
      description: 'Ultralytics YOLOv8 with anchor-free detection',
      features: ['Anchor-free detection', 'Advanced backbone', 'Real-time performance', 'Multi-task support'],
      recommendedUse: 'General purpose, real-time applications',
      modelSizes: ['yolov8n', 'yolov8s', 'yolov8m', 'yolov8l', 'yolov8x'],
      defaultModel: 'yolov8m',
      trainCommand: 'yolo train data=data.yaml model=yolov8m.pt epochs=100 imgsz=640',
      theme: {
        primary: 'from-blue-500 to-indigo-600',
        secondary: 'from-blue-400 to-cyan-500',
        accent: 'blue-500',
        gradient: 'from-blue-600 via-purple-600 to-indigo-600'
      },
      performance: {
        speed: 'Fast',
        accuracy: 'High',
        efficiency: 'Good'
      },
      optimizationTips: [
        'Best for general object detection tasks',
        'Excellent real-time performance',
        'Good balance of speed and accuracy',
        'Supports multiple task types'
      ]
    },
    yolov9: {
      name: 'YOLOv9',
      description: 'Advanced YOLOv9 with PGI and GELAN',
      features: ['Programmable Gradient Information', 'GELAN architecture', 'Edge deployment', 'High accuracy'],
      recommendedUse: 'High accuracy, edge devices, mobile deployment',
      modelSizes: ['yolov9t', 'yolov9s', 'yolov9m', 'yolov9c', 'yolov9e'],
      defaultModel: 'yolov9c',
      trainCommand: 'yolo train data=data.yaml model=yolov9c.pt epochs=100 imgsz=640',
      theme: {
        primary: 'from-emerald-500 to-teal-600',
        secondary: 'from-green-400 to-emerald-500',
        accent: 'emerald-500',
        gradient: 'from-emerald-600 via-green-600 to-teal-600'
      },
      performance: {
        speed: 'Medium',
        accuracy: 'Very High',
        efficiency: 'Excellent'
      },
      optimizationTips: [
        'Optimized for edge and mobile deployment',
        'Best accuracy for resource-constrained devices',
        'Excellent for IoT and embedded applications',
        'Superior performance per parameter'
      ]
    },
    yolov10: {
      name: 'YOLOv10',
      description: 'NMS-free YOLOv10 with dual assignments',
      features: ['NMS-free detection', 'Dual label assignment', 'Low latency', 'Efficient inference'],
      recommendedUse: 'Real-time applications, low-latency requirements',
      modelSizes: ['yolov10n', 'yolov10s', 'yolov10m', 'yolov10l', 'yolov10x'],
      defaultModel: 'yolov10m',
      trainCommand: 'yolo train data=data.yaml model=yolov10m.pt epochs=100 imgsz=640',
      theme: {
        primary: 'from-purple-500 to-violet-600',
        secondary: 'from-purple-400 to-pink-500',
        accent: 'purple-500',
        gradient: 'from-purple-600 via-violet-600 to-pink-600'
      },
      performance: {
        speed: 'Very Fast',
        accuracy: 'High',
        efficiency: 'Excellent'
      },
      optimizationTips: [
        'Fastest inference speed of all YOLO models',
        'No NMS post-processing needed',
        'Perfect for real-time applications',
        'Minimal latency requirements'
      ]
    },
    yolov11: {
      name: 'YOLOv11',
      description: 'Latest YOLOv11 with C3k2 and C2PSA',
      features: ['C3k2 blocks', 'C2PSA attention', 'Multi-task support', 'Highest accuracy'],
      recommendedUse: 'Maximum accuracy, research, advanced applications',
      modelSizes: ['yolov11n', 'yolov11s', 'yolov11m', 'yolov11l', 'yolov11x'],
      defaultModel: 'yolov11m',
      trainCommand: 'yolo train data=data.yaml model=yolov11m.pt epochs=100 imgsz=640',
      theme: {
        primary: 'from-orange-500 to-red-600',
        secondary: 'from-orange-400 to-yellow-500',
        accent: 'orange-500',
        gradient: 'from-orange-600 via-red-600 to-pink-600'
      },
      performance: {
        speed: 'Medium',
        accuracy: 'Highest',
        efficiency: 'Good'
      },
      optimizationTips: [
        'Highest accuracy among YOLO models',
        'Best for research and maximum precision',
        'Advanced architectural innovations',
        'Superior performance on complex datasets'
      ]
    }
  };

  // Workflow step content
  const renderWorkflowStep = () => {
    switch (currentStep) {
      case 1:
  return (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="relative inline-block">
                <div className={`w-32 h-32 bg-gradient-to-br ${yoloModels[selectedYoloModel].theme.primary} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform hover:scale-105 transition-all duration-300`}>
                  <span className="text-white text-6xl animate-bounce">🏷️</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <h2 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.gradient} bg-clip-text text-transparent mb-6`}>
                Setup Your Classes
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Define the object classes you want to detect in your images. Each class represents a different type of object for your {yoloModels[selectedYoloModel].name} model to learn.
              </p>

              {/* Model-specific Optimization Tips */}
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.secondary} bg-opacity-10 border border-opacity-20 mb-8 backdrop-blur-sm`}>
                <div className={`w-6 h-6 bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-xs">💡</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {yoloModels[selectedYoloModel].name} Optimization: {yoloModels[selectedYoloModel].optimizationTips[0]}
                  </p>
                </div>
              </div>
            </div>

            {/* Input Card */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-8">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                <input
                  type="text"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                      placeholder="Enter class name (e.g., 'person', 'car', 'dog')"
                      className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                  onKeyPress={(e) => e.key === 'Enter' && addClass()}
                />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <span className="text-sm">Press Enter to add</span>
                    </div>
                  </div>
                <button
                  onClick={addClass}
                    disabled={!newClass.trim()}
                    className={`px-8 py-4 bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl disabled:transform-none`}
                >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                  Add Class
                    </span>
                </button>
              </div>

                {/* Classes Grid */}
              {classes.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Your Classes ({classes.length})
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Click × to remove
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((className, index) => (
                        <div
                          key={index}
                          className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                                style={{
                                  background: `linear-gradient(135deg, hsl(${(index * 137.5) % 360}, 70%, 60%), hsl(${(index * 137.5 + 60) % 360}, 70%, 50%))`
                                }}
                              >
                                {index + 1}
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {className}
                              </span>
                            </div>
                      <button
                          onClick={() => removeClass(index)}
                              className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 flex items-center justify-center shadow-lg"
                        >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                      </button>
                          </div>
                  </div>
                ))}
              </div>

                    {/* Continue Button */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={nextStep}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
                      >
                        <span className="flex items-center justify-center gap-3">
                          Continue to Upload Images
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                  </button>
                    </div>
                </div>
              )}

                {/* Empty State */}
                {classes.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl text-gray-400">📝</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Classes Added Yet
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Add your first class above to get started with your dataset
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="relative inline-block">
                <div className={`w-32 h-32 bg-gradient-to-br ${yoloModels[selectedYoloModel].theme.primary} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform hover:scale-105 transition-all duration-300`}>
                  <span className="text-white text-6xl animate-bounce">📸</span>
            </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <h2 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.gradient} bg-clip-text text-transparent mb-6`}>
                Upload Your Images
            </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Add the images you want to annotate. Upload multiple images at once for efficient dataset creation with your {yoloModels[selectedYoloModel].name} model.
            </p>

              {/* Model-specific Upload Tips */}
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.secondary} bg-opacity-10 border border-opacity-20 mb-8 backdrop-blur-sm`}>
                <div className={`w-6 h-6 bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-xs">📊</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {yoloModels[selectedYoloModel].name} Upload Tip: Aim for 500-2000 images per class for optimal {yoloModels[selectedYoloModel].performance.accuracy.toLowerCase()} results
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="max-w-3xl mx-auto mb-8">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            <button
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full p-16 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center gap-6 group shadow-xl hover:shadow-2xl ${
                  isDragOver
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 scale-105 shadow-blue-500/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20'
                }`}
              >
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                  isDragOver
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-500 scale-110'
                    : 'bg-gradient-to-br from-green-500 to-emerald-500 group-hover:scale-110'
                }`}>
                  <span className="text-white text-5xl">
                    {isDragOver ? '📂' : '📁'}
                  </span>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isDragOver ? 'Drop Images Here' : 'Choose Multiple Images'}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md">
                    {isDragOver
                      ? 'Release to upload your images'
                      : 'Select multiple images at once or drag & drop them here'
                    }
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <span className="px-3 py-1 bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                      JPG
                    </span>
                    <span className="px-3 py-1 bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                      PNG
                    </span>
                    <span className="px-3 py-1 bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                      GIF
                    </span>
                    <span className="px-3 py-1 bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                      WebP
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isDragOver ? '✨ Drop files to start uploading' : '💡 Hold Ctrl/Cmd to select multiple files'}
                  </p>
                </div>
            </button>
            </div>

            {/* Upload Status & Navigation */}
              {images.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-8">
                  {/* Success Message */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white text-2xl">✅</span>
                  </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {images.length} Image{images.length !== 1 ? 's' : ''} Uploaded!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Your images are ready for annotation. Each image will be processed with your defined classes.
                    </p>
                  </div>

                  {/* Image Preview Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                    {images.slice(0, 8).map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-lg">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-xl">
                          <p className="text-white text-xs font-medium truncate">
                            {image.name.length > 15 ? image.name.substring(0, 15) + '...' : image.name}
                          </p>
                        </div>
                        {index === 7 && images.length > 8 && (
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              +{images.length - 8}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
            <button
                      onClick={prevStep}
                      className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Classes
            </button>
            <button
                      onClick={nextStep}
                      className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
            >
                      Start Annotating
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
            </button>
                  </div>
          </div>
        </div>
              )}
                </div>
        );

      case 3:
        return (
          <div className={`min-h-screen relative overflow-hidden ${
            darkMode
              ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white'
              : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'
          }`}>
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className={`absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl opacity-10 animate-pulse ${
                darkMode ? 'bg-gray-600' : 'bg-blue-200'
              }`}></div>
              <div className={`absolute -top-20 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10 animate-pulse delay-1000 ${
                darkMode ? 'bg-gray-700' : 'bg-purple-200'
              }`}></div>
              <div className={`absolute bottom-1/4 right-1/6 w-72 h-72 rounded-full blur-3xl opacity-10 animate-pulse delay-2000 ${
                darkMode ? 'bg-gray-800' : 'bg-indigo-200'
              }`}></div>
              </div>

            <div className="relative z-10 py-12 px-6">
              <div className="max-w-7xl mx-auto">
                {/* Hero Section with Premium Design */}
                <div className="text-center mb-16">
                  <div className="relative inline-block mb-8">
                    <div className={`w-32 h-32 bg-gradient-to-br ${yoloModels[selectedYoloModel].theme.primary} rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-500 animate-bounce`}>
                      <span className="text-6xl animate-pulse">✏️</span>
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-500 rounded-full"></div>
                  </div>

                  <h2 className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.gradient} bg-clip-text text-transparent mb-6 animate-fade-in`}>
                    Professional Annotation Suite
                </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed">
                    Create precise bounding boxes for your <span className={`font-semibold ${yoloModels[selectedYoloModel].theme.text}`}>{yoloModels[selectedYoloModel].name}</span> model.
                    Use our advanced annotation tools with real-time feedback and professional-grade features.
                  </p>

                  {/* Premium Feature Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
                    <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 transform hover:scale-105 transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-xl">🎯</span>
                  </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2">Precision Tools</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Real-time dimension display and professional annotation controls</p>
                    </div>

                    <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 transform hover:scale-105 transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-xl">⚡</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2">Smart Features</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Auto-adjust, copy annotations, and advanced editing capabilities</p>
                    </div>

                    <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 transform hover:scale-105 transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-xl">🚀</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2">Professional Workflow</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Industry-standard tools with keyboard shortcuts and presets</p>
                    </div>
                  </div>

                  {/* Model-specific Premium Tip */}
                  <div className={`inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} bg-opacity-10 border border-opacity-20 backdrop-blur-xl shadow-xl mb-12`}>
                    <div className={`w-10 h-10 bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-lg">💡</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        {yoloModels[selectedYoloModel].name} Optimization
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {yoloModels[selectedYoloModel].optimizationTips[1]}
                    </p>
                  </div>
                </div>

                  {/* Enhanced Keyboard Shortcuts Bar */}
                  <div className="max-w-6xl mx-auto mb-12">
                    <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-8">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🚀 Professional Shortcuts</h3>
                        <p className="text-gray-600 dark:text-gray-400">Master these shortcuts for lightning-fast annotation</p>
              </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <kbd className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs font-bold">Ctrl</kbd>
                            <span className="text-blue-600">+</span>
                            <kbd className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs font-bold">N</kbd>
                </div>
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Next Image</span>
                </div>

                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border border-green-200 dark:border-green-700">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <kbd className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-xs font-bold">Ctrl</kbd>
                            <span className="text-green-600">+</span>
                            <kbd className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-xs font-bold">P</kbd>
                </div>
                          <span className="text-sm font-semibold text-green-700 dark:text-green-300">Previous</span>
              </div>

                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl border border-purple-200 dark:border-purple-700">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <kbd className="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded text-xs font-bold">Ctrl</kbd>
                            <span className="text-purple-600">+</span>
                            <kbd className="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded text-xs font-bold">Z</kbd>
                          </div>
                          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Undo</span>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl border border-orange-200 dark:border-orange-700">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <kbd className="bg-orange-100 dark:bg-orange-800 px-2 py-1 rounded text-xs font-bold">Del</kbd>
                          </div>
                          <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Delete Box</span>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl border border-indigo-200 dark:border-indigo-700">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <kbd className="bg-indigo-100 dark:bg-indigo-800 px-2 py-1 rounded text-xs font-bold">Space</kbd>
                          </div>
                          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Help</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Annotation Workspace */}
                <div className="backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl overflow-hidden">
                  {/* Premium Header Toolbar */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-slate-800 dark:to-gray-800 border-b border-white/20 dark:border-gray-700/50 p-8">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      {/* Left Section - Professional Branding */}
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-all duration-300">
                            <span className="text-white text-2xl">🎨</span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
                            <div>
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Professional Annotation Studio
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Ready for {yoloModels[selectedYoloModel].name} • {totalAnnotations} annotations created
                          </p>
          </div>
                          </div>

                      {/* Center Section - Active Class Display */}
                      <div className="flex-1 max-w-md">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs">🎯</span>
                          </div>
                          Active Annotation Class
                        </label>
                          
                          {/* Enhanced Class Selector */}
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Active Class
                            </label>
                            <div className="relative">
                <button
                                onClick={() => setSelectedClass(selectedClass === null ? 0 : null)}
                                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[200px] shadow-sm"
                              >
                                {selectedClass !== null ? (
                                  <>
                                    <div 
                                      className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0"
                                      style={{ backgroundColor: `hsl(${(selectedClass * 137.5) % 360}, 70%, 60%)` }}
                                    />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                      {classes[selectedClass]}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                      #{selectedClass + 1}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      Select a class
                                    </span>
                                    <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </>
                                )}
                </button>

                              {/* Class Dropdown */}
                              {selectedClass !== null && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                {classes.map((className, index) => (
                                    <button
                    key={index} 
                    onClick={() => setSelectedClass(index)}
                                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                                        selectedClass === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                      }`}
                                    >
                                      <div 
                                        className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
                                      />
                                      <span className={`text-sm font-medium ${
                                        selectedClass === index 
                                          ? 'text-blue-700 dark:text-blue-300' 
                                          : 'text-gray-900 dark:text-white'
                                      }`}>
                                        {className}
                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                        #{index + 1}
                                      </span>
                                      {selectedClass === index && (
                                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                      </button>
                                  ))}
                    </div>
                              )}
                  </div>
              </div>
            </div>

                        {/* Right Section - Controls */}
                        <div className="flex items-center gap-4">
                          {/* Add New Class */}
                          <div className="flex items-center gap-2">
              <input
                              type="text"
                              value={newClass}
                              onChange={(e) => setNewClass(e.target.value)}
                              placeholder="New class name..."
                              className="px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-40"
                              onKeyPress={(e) => e.key === 'Enter' && addClass()}
              />
              <button
                              onClick={addClass}
                              disabled={!newClass.trim()}
                              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                            >
                    <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Class
                    </div>
                </button>
                          </div>
                
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                  <button
                    onClick={undo}
                    disabled={undoStack.length === 0}
                              className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                              title={`Undo (Ctrl+Z) - ${undoStack.length} action${undoStack.length !== 1 ? 's' : ''} available`}
                  >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                  </button>
                  <button
                    onClick={redo}
                    disabled={redoStack.length === 0}
                              className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                              title={`Redo (Ctrl+Shift+Z) - ${redoStack.length} action${redoStack.length !== 1 ? 's' : ''} available`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                </button>
              </div>
            </div>
          </div>

                      {/* Enhanced Class List */}
                      {classes.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Available Classes ({classes.length})</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Click to select • Total annotations: {totalAnnotations}
                    </span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            {classes.map((className, index) => {
                              const classAnnotations = Object.values(annotations).flat().filter(ann => ann.classId === index).length;
                              return (
                    <button
                                  key={index}
                                  onClick={() => setSelectedClass(index)}
                                  className={`group relative px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                                    selectedClass === index
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-600 shadow-lg'
                                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                                        selectedClass === index 
                                          ? 'border-blue-600 dark:border-blue-400' 
                                          : 'border-gray-300 dark:border-gray-500'
                                      }`}
                                      style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
                                    />
                                    <span className="font-semibold">{className}</span>
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                                      {classAnnotations}
                                    </span>
                  </div>
                  
                                  {/* Selection indicator */}
                                  {selectedClass === index && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                    </button>
                              );
                            })}
                  </div>
                </div>
                      )}
                </div>

                {/* Premium Annotation Controls */}
                <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-700/80 rounded-2xl border border-white/20 dark:border-gray-600/50 shadow-xl p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl">⚡</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Annotation Tools</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Professional controls for precise annotations</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                        {currentAnnotations.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Current Annotations</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Copy Annotations */}
                    <button
                      onClick={() => setShowCopyAnnotations(!showCopyAnnotations)}
                      className="group flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                      title="Copy annotations from another image (Ctrl+C)"
                    >
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Copy</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400">Annotations</span>
                    </button>

                    {/* Save Preset */}
                    <button
                      onClick={() => {
                        const name = prompt('Enter preset name:');
                        if (name) saveAnnotationPreset(name);
                      }}
                      className="group flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                      title="Save current annotations as preset (Ctrl+S)"
                    >
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">Save</span>
                      <span className="text-xs text-green-600 dark:text-green-400">Preset</span>
                    </button>

                    {/* Batch Delete */}
                    <button
                      onClick={() => {
                        const classId = prompt('Enter class ID to delete (leave empty for all):');
                        const classIdNum = classId === '' ? null : parseInt(classId);
                        batchDeleteAnnotations(classIdNum);
                      }}
                      className="group flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl border border-red-200 dark:border-red-700 hover:border-red-400 dark:hover:border-red-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                      title="Batch delete annotations (Ctrl+D)"
                    >
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-sm font-semibold text-red-700 dark:text-red-300">Batch</span>
                      <span className="text-xs text-red-600 dark:text-red-400">Delete</span>
                    </button>

                    {/* Keyboard Shortcuts */}
                    <button
                      onClick={() => setShowHelp(true)}
                      className="group flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl border border-yellow-200 dark:border-yellow-700 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                      title="Show keyboard shortcuts"
                    >
                      <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Keyboard</span>
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">Shortcuts</span>
                    </button>

                    {/* Auto Adjust */}
                    <button
                      onClick={() => {
                        const targetIndex = parseInt(prompt('Enter target image index:'));
                        if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < images.length) {
                          autoAdjustAnnotations(images[targetIndex].id);
                        }
                      }}
                      className="group flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl border border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                      title="Auto-adjust annotations for another image"
                    >
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Auto</span>
                      <span className="text-xs text-purple-600 dark:text-purple-400">Adjust</span>
                    </button>
                  </div>

                  {/* Copy Annotations Panel */}
                  {showCopyAnnotations && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Copy from Image:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {images.map((img, index) => (
                          <button
                            key={img.id}
                            onClick={() => {
                              copyAnnotationsFromImage(img.id, currentImage.id);
                              setShowCopyAnnotations(false);
                            }}
                            className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-xs disabled:opacity-50"
                            disabled={img.id === currentImage.id}
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                            <div className="text-left flex-1 min-w-0">
                              <div className="font-medium truncate">{img.name}</div>
                              <div className="text-gray-500">
                                {(annotations[img.id] || []).length} annotations
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Annotation Presets */}
                  {annotationPresets.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Load Preset:</h4>
                      <div className="flex flex-wrap gap-2">
                        {annotationPresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => loadAnnotationPreset(preset.id)}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200"
                            title={`Load ${preset.name} preset`}
                          >
                            {preset.name}
                          </button>
                        ))}
                  </div>
                </div>
                      )}
                </div>

                    {/* Premium Image Viewer Container */}
                    <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl overflow-hidden mb-8">
                    <div className="p-6">
                      <ImageViewer
                        currentImage={currentImage}
                        currentImageIndex={currentImageIndex}
                        images={images}
                        prevImage={prevImage}
                        nextImage={nextImage}
                        zoom={zoom}
                        zoomIn={zoomIn}
                        zoomOut={zoomOut}
                        resetZoom={resetZoom}
                        canvasRef={canvasRef}
                        containerRef={containerRef}
                        handleCanvasMouseDown={handleCanvasMouseDown}
                        handleCanvasMouseMove={handleCanvasMouseMove}
                        handleCanvasMouseUp={handleCanvasMouseUp}
                        drawingBox={drawingBox}
                        currentAnnotations={currentAnnotations}
                        selectedAnnotation={selectedAnnotation}
                        selectAnnotation={selectAnnotation}
                        removeAnnotation={(index) => removeAnnotation(currentImage.id, index)}
                        classes={classes}
                        selectedClass={selectedClass}
                        setSelectedClass={setSelectedClass}
                          imageCategories={imageCategories}
                          setImageCategories={setImageCategories}
                      />
                      </div>
                    </div>

                    {/* Enhanced Thumbnail Strip */}
              {images.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm font-bold">📷</span>
                  </div>
                            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">Image Gallery</span>
                  </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {currentImageIndex + 1} of {images.length}
                            </span>
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                                style={{ width: `${((currentImageIndex + 1) / images.length) * 100}%` }}
                              />
                </div>
                          </div>
            </div>

                        <div className="flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] scrollbar-hide">
                          {images.map((img, idx) => (
                <button
                              key={img.id}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`relative flex-shrink-0 group transition-all duration-300 transform hover:scale-105 ${
                                idx === currentImageIndex
                                  ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                                  : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                              }`}
                              title={img.name}
                            >
                              <div className={`w-28 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                idx === currentImageIndex
                                  ? 'border-blue-500 shadow-lg'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}>
                                <img
                                  src={img.url}
                                  alt={img.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  draggable={false}
                                />
                  </div>
                  
                              {/* Current indicator */}
                              {idx === currentImageIndex && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                  <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  )}
                              
                              {/* Image name */}
                              <div className="mt-2 text-center">
                                <p className={`text-xs font-medium truncate max-w-28 ${
                                  idx === currentImageIndex
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {img.name.length > 20 ? img.name.substring(0, 20) + '...' : img.name}
                                </p>
                </div>
                </button>
                          ))}
                        </div>
                      </div>
                    )}
              </div>
            </div>
                </div>

              {/* Navigation Buttons */}
              <div className="mt-12 text-center">
                <div className="flex gap-6 justify-center items-center">
                  <button onClick={prevStep} className="px-8 py-4 bg-gray-200 text-gray-800 rounded-lg">
                      Back to Upload
                    </button>
                  <button onClick={nextStep} disabled={totalAnnotations === 0} className="px-8 py-4 bg-blue-500 text-white rounded-lg disabled:opacity-50">
                      Continue to Export
                        </button>
                  </div>
                </div>
              </div>
        );

      case 4:
        return (
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="relative inline-block">
                <div className={`w-32 h-32 bg-gradient-to-br ${yoloModels[selectedYoloModel].theme.primary} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform hover:scale-105 transition-all duration-300`}>
                  <span className="text-white text-6xl animate-bounce">📦</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <h2 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.gradient} bg-clip-text text-transparent mb-6`}>
                Export Your Dataset
            </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Congratulations! Your professional {yoloModels[selectedYoloModel].name} dataset is ready. Export it as a complete package with all images, annotations, and configuration files optimized for your selected model.
              </p>

              {/* Model-specific Export Tips */}
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.secondary} bg-opacity-10 border border-opacity-20 mb-8 backdrop-blur-sm`}>
                <div className={`w-6 h-6 bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-xs">🚀</span>
                        </div>
                  <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {yoloModels[selectedYoloModel].name} Export: Dataset optimized for {yoloModels[selectedYoloModel].performance.speed.toLowerCase()} inference with {yoloModels[selectedYoloModel].performance.accuracy.toLowerCase()} accuracy
                  </p>
                      </div>
                  </div>
                </div>

            {/* Dataset Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className={`w-16 h-16 bg-gradient-to-br ${yoloModels[selectedYoloModel].theme.primary} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-white text-2xl">🖼️</span>
              </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {images.length}
              </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Images
                </div>
              </div>

              {/* Dataset Categorization Status */}
              <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white text-2xl">🎯</span>
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {Object.values(imageCategories).filter(cat => cat === 'train').length}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Training
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white text-2xl">🔍</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {Object.values(imageCategories).filter(cat => cat === 'valid').length}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Validation
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white text-2xl">🧪</span>
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {Object.values(imageCategories).filter(cat => cat === 'test').length}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Test
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white text-2xl">🏷️</span>
              </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {classes.length}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Classes
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white text-2xl">📍</span>
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {totalAnnotations}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Annotations
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {Math.round(progressPercentage)}%
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Complete
                </div>
              </div>
            </div>

            {/* Export Features */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                  🚀 Professional YOLO9 Dataset Package
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📁 Dataset Structure:</h4>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 font-mono text-sm">
                      <div className="space-y-1 text-gray-700 dark:text-gray-300">
                        <div>📦 dataset/</div>
                        <div className="ml-4">├── 📸 images/</div>
                        <div className="ml-8">├── 🏋️ train/ ({Math.floor(images.length * 0.8)} images)</div>
                        <div className="ml-8">└── ✅ val/ ({Math.ceil(images.length * 0.2)} images)</div>
                        <div className="ml-4">├── 📝 labels/</div>
                        <div className="ml-8">├── 🏋️ train/ (YOLO .txt files)</div>
                        <div className="ml-8">└── ✅ val/ (YOLO .txt files)</div>
                        <div className="ml-4">├── ⚙️ data.yaml (config)</div>
                        <div className="ml-4">├── 📋 classes.txt (legacy)</div>
                        <div className="ml-4">└── 📖 README.md (guide)</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                      <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Data Split:</h5>
                      <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                        <div>🎯 Training: {Math.floor(images.length * 0.8)} images (80%)</div>
                        <div>✅ Validation: {Math.ceil(images.length * 0.2)} images (20%)</div>
                        <div>🔀 Random split for balanced distribution</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🎯 YOLO Format Details:</h4>
                    <div className="space-y-3">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">📝 Annotation Format:</h5>
                        <div className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                          class_id x_center y_center width height
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          All coordinates normalized (0.0 - 1.0)
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                        <h5 className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Example:</h5>
                        <div className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border text-green-800 dark:text-green-200">
                          0 0.512500 0.345833 0.125000 0.089583<br/>
                          1 0.725000 0.612500 0.150000 0.125000
                        </div>
                      </div>

                      <div className={`bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4`}>
                        <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">🚀 {yoloModels[selectedYoloModel].name} Ready:</h5>
                        <div className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                          <div>✅ Proper annotation format</div>
                          <div>✅ Normalized coordinates (0-1)</div>
                          <div>✅ Train/val split included</div>
                          <div>✅ data.yaml configuration</div>
                          <div>✅ Optimized for {yoloModels[selectedYoloModel].performance.speed.toLowerCase()} inference</div>
                          <div>✅ Ready for immediate training</div>
                        </div>
                      </div>

                      {/* Model Performance Comparison */}
                      <div className={`bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.secondary} bg-opacity-10 rounded-xl p-4 border border-opacity-20`}>
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">📊 {yoloModels[selectedYoloModel].name} Performance:</h5>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className={`font-bold text-${yoloModels[selectedYoloModel].theme.accent}`}>{yoloModels[selectedYoloModel].performance.speed}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">Speed</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-bold text-${yoloModels[selectedYoloModel].theme.accent}`}>{yoloModels[selectedYoloModel].performance.accuracy}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">Accuracy</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-bold text-${yoloModels[selectedYoloModel].theme.accent}`}>{yoloModels[selectedYoloModel].performance.efficiency}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">Efficiency</div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            💡 {yoloModels[selectedYoloModel].optimizationTips[2]}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Progress */}
                {isExporting && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Exporting Dataset...
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {Math.round(exportProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={prevStep}
                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Annotating
                </button>
                <button
                  onClick={exportDataset}
                  disabled={images.length === 0 || isExporting}
                    className={`flex-1 py-4 bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} text-white font-bold text-lg rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2`}
                >
                  {isExporting ? (
                    <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Exporting... {Math.round(exportProgress)}%
                    </>
                  ) : (
                      <>
                        <span>🚀</span>
                        Export {yoloModels[selectedYoloModel].name} Dataset
                      </>
                  )}
                </button>
                </div>
          </div>
        </div>
        </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      darkMode
        ? 'dark bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white'
        : 'bg-white text-gray-900'
    }`}>
      {/* Subtle Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl opacity-5 animate-pulse ${
          darkMode ? 'bg-gray-600' : 'bg-gray-100'
        }`}></div>
        <div className={`absolute -top-20 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-5 animate-pulse delay-1000 ${
          darkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}></div>
        <div className={`absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full blur-3xl opacity-3 animate-pulse delay-2000 ${
          darkMode ? 'bg-gray-600' : 'bg-gray-100'
        }`}></div>
        <div className={`absolute top-3/4 right-0 w-64 h-64 rounded-full blur-3xl opacity-3 animate-pulse delay-3000 ${
          darkMode ? 'bg-gray-500' : 'bg-gray-200'
        }`}></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen">
        {/* Modern Navbar */}
        <div className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-700/50 sticky top-0 z-50">
          <div className="container mx-auto px-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between py-4">
              {/* Logo & Brand */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300">
                    <span className="text-white text-xl animate-bounce">🎯</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className={`text-xl font-bold bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.gradient} bg-clip-text text-transparent`}>
                    YOLO Generator
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    {yoloModels[selectedYoloModel].name} Dataset Creator
                  </p>
              </div>
            </div>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">🖼️</span>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{images.length}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <span className="text-green-600 dark:text-green-400 text-sm">🏷️</span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">{classes.length}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                  <span className="text-purple-600 dark:text-purple-400 text-sm">📍</span>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{totalAnnotations}</span>
                </div>
              </div>

              {/* Current Step Indicator & Actions */}
              <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => setShowHelp(true)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                    title="Help & Shortcuts"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200"
                    title="Settings"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200"
                    title="Toggle Dark Mode"
                  >
                    {darkMode ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Current Step Indicator */}
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    Step {currentStep}/4
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {stepTitles[currentStep - 1]}
                  </div>
                  <div className={`text-xs text-${yoloModels[selectedYoloModel].theme.accent} font-medium`}>
                    {yoloModels[selectedYoloModel].name}
                  </div>
                </div>
                <div className={`w-8 h-8 bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} rounded-lg flex items-center justify-center shadow-sm`}>
                  <span className="text-white text-xs font-bold">{currentStep}</span>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="py-4">
              {/* Progress Bar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} rounded-full transition-all duration-700 ease-out shadow-sm`}
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                  {Math.round((currentStep / 4) * 100)}%
                </div>
              </div>

              {/* Step Navigation */}
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((step) => {
                  const isActive = currentStep === step;
                  const isCompleted = workflowCompleted[`step${step}`];
                  const isAccessible = workflowCompleted[`step${step - 1}`] || step === 1;

                  return (
                    <div key={step} className="flex flex-col items-center">
                  <button
                    onClick={() => goToStep(step)}
                        disabled={!isAccessible}
                        className={`relative w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-lg ${
                          isActive
                            ? `bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} text-white scale-110 shadow-${yoloModels[selectedYoloModel].theme.accent}/50 ring-4 ring-${yoloModels[selectedYoloModel].theme.accent}/20`
                            : isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:scale-105 shadow-green-500/30'
                            : isAccessible
                            ? 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:scale-105 hover:shadow-xl border-2 border-gray-200 dark:border-gray-600'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                        }`}
                        title={`${isAccessible ? 'Go to' : 'Complete previous steps to access'} ${stepTitles[step - 1]}`}
                      >
                        {isCompleted ? (
                          <span className="text-lg">✓</span>
                        ) : (
                          <span>{step}</span>
                        )}

                        {/* Active pulse effect */}
                        {isActive && (
                          <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.secondary} animate-pulse opacity-30`} />
                        )}
                  </button>

                      {/* Step label */}
                      <div className={`mt-2 text-xs font-semibold text-center transition-colors duration-200 ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : isAccessible
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        <div className="max-w-[60px] truncate">
                    {stepTitles[step - 1]}
              </div>
            </div>

                      {/* Connection line */}
                      {step < 4 && (
                        <div className="hidden lg:block absolute top-6 left-full w-full h-0.5 -translate-y-1/2 transition-colors duration-300 z-0"
                             style={{ width: 'calc(25vw - 3rem)' }}>
                          <div className={`h-full rounded-full transition-colors duration-300 ${
                            isCompleted || (isActive && step < currentStep)
                              ? 'bg-gradient-to-r from-green-500 to-green-400'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
              </div>
                      )}
                    </div>
                  );
                })}
            </div>
              </div>
                        </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
              <div className="px-6 py-4 space-y-4">
                {/* Quick Stats for Mobile */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="text-blue-600 dark:text-blue-400 text-lg">🖼️</div>
                    <div className="text-sm font-bold text-blue-700 dark:text-blue-300">{images.length}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">Images</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="text-green-600 dark:text-green-400 text-lg">🏷️</div>
                    <div className="text-sm font-bold text-green-700 dark:text-green-300">{classes.length}</div>
                    <div className="text-xs text-green-600 dark:text-green-400">Classes</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <div className="text-purple-600 dark:text-purple-400 text-lg">📍</div>
                    <div className="text-sm font-bold text-purple-700 dark:text-purple-300">{totalAnnotations}</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">Annotations</div>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex justify-around pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowHelp(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center p-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200"
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium">Help</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center p-3 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200"
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-medium">Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setDarkMode(!darkMode);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center p-3 text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-all duration-200"
                  >
                    {darkMode ? (
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    <span className="text-xs font-medium">Theme</span>
                  </button>
                </div>
              </div>
            </div>
          )}
            </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative">
        {/* Model Optimization Panel */}
        <div className="absolute top-4 right-4 z-10 hidden lg:block">
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-xs transform transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 bg-gradient-to-r ${yoloModels[selectedYoloModel].theme.primary} rounded-lg flex items-center justify-center shadow-sm`}>
                <span className="text-white text-sm font-bold">
                  {yoloModels[selectedYoloModel].name.charAt(5)}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  {yoloModels[selectedYoloModel].name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {yoloModels[selectedYoloModel].performance.speed} • {yoloModels[selectedYoloModel].performance.accuracy}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">Speed:</span>
                <span className={`font-semibold text-${yoloModels[selectedYoloModel].theme.accent}`}>
                  {yoloModels[selectedYoloModel].performance.speed}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
                <span className={`font-semibold text-${yoloModels[selectedYoloModel].theme.accent}`}>
                  {yoloModels[selectedYoloModel].performance.accuracy}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">Efficiency:</span>
                <span className={`font-semibold text-${yoloModels[selectedYoloModel].theme.accent}`}>
                  {yoloModels[selectedYoloModel].performance.efficiency}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                💡 Optimization Tips:
              </h4>
              <ul className="space-y-1">
                {yoloModels[selectedYoloModel].optimizationTips.slice(0, 2).map((tip, index) => (
                  <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {renderWorkflowStep()}
      </main>

      {/* Modals */}
      <HelpModal showHelp={showHelp} setShowHelp={setShowHelp} />
      <SettingsModal 
        showSettings={showSettings} 
        setShowSettings={setShowSettings}
        autoSave={autoSave}
        setAutoSave={setAutoSave}
        imageQuality={imageQuality}
        setImageQuality={setImageQuality}
        keyboardShortcuts={keyboardShortcuts}
        setKeyboardShortcuts={setKeyboardShortcuts}
        selectedYoloModel={selectedYoloModel}
        setSelectedYoloModel={setSelectedYoloModel}
      />
      </div>
    </div>
  );
}

