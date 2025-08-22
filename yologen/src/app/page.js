'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
// import JSZip from 'jszip';
import Header from '../components/Header';
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
    
    const newImages = imageFiles.map(file => ({
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
    const x_center = (box.x1 + box.x2) / 2;
    const y_center = (box.y1 + box.y2) / 2;
    const width = box.x2 - box.x1;
    const height = box.y2 - box.y1;
    
    return `${box.classId} ${x_center.toFixed(6)} ${y_center.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
  };

  const exportDataset = async () => {
    if (images.length === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const imagesFolder = zip.folder('images');
      const annotationsFolder = zip.folder('annotations');
      
      const totalSteps = images.length * 2 + 1;
      let currentStep = 0;
      
      for (const image of images) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        imagesFolder.file(image.name, blob);
        currentStep++;
        setExportProgress((currentStep / totalSteps) * 100);
      }
      
      for (const image of images) {
        const imageAnnotations = annotations[image.id] || [];
        if (imageAnnotations.length > 0) {
          const yoloAnnotations = imageAnnotations.map(box => 
            convertToYOLOFormat(box)
          ).join('\n');
          
          const annotationFileName = image.name.replace(/\.[^/.]+$/, '') + '.txt';
          annotationsFolder.file(annotationFileName, yoloAnnotations);
        }
        currentStep++;
        setExportProgress((currentStep / totalSteps) * 100);
      }
      
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

  // Workflow step content
  const renderWorkflowStep = () => {
    switch (currentStep) {
      case 1:
  return (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-blue-600 dark:text-blue-400 text-4xl">🏷️</span>
                </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Step 1: Setup Your Classes
              </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Start by defining the object classes you want to detect. Add descriptive names for each type of object in your dataset.
            </p>
            <div className="max-w-md mx-auto">
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  placeholder="Enter class name (e.g., 'person', 'car')"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && addClass()}
                />
                <button
                  onClick={addClass}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium"
                >
                  Add Class
                </button>
              </div>
              {classes.length > 0 && (
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your Classes:</h3>
                  <div className="space-y-2">
                {classes.map((className, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">{className}</span>
                      <button
                          onClick={() => removeClass(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 rounded transition-all duration-200"
                        >
                          ✕
                      </button>
                  </div>
                ))}
              </div>
                  <button
                    onClick={nextStep}
                    disabled={classes.length === 0}
                    className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium"
                  >
                    Continue to Step 2 →
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-green-600 dark:text-green-400 text-4xl">📸</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Step 2: Upload Your Images
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Upload the images you want to annotate. You can select multiple images at once. Supported formats: JPG, PNG, GIF, WebP
            </p>
            <div className="max-w-lg mx-auto">
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
                className="w-full p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-green-500 dark:hover:border-green-400 transition-all duration-200 flex flex-col items-center justify-center gap-4 hover:bg-green-50 dark:hover:bg-green-900/20 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-green-600 dark:text-green-400 text-3xl">📁</span>
                </div>
                <div className="text-center">
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">Choose Images</span>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Click to browse or drag and drop
                  </p>
                </div>
            </button>
              {images.length > 0 && (
                <div className="mt-8 text-center">
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                    ✓ {images.length} image{images.length !== 1 ? 's' : ''} uploaded successfully!
                  </div>
                  <div className="flex gap-4 justify-center">
            <button
                      onClick={prevStep}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
            >
                      ← Back to Classes
            </button>
            <button
                      onClick={nextStep}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium"
            >
                      Start Annotating →
            </button>
          </div>
        </div>
              )}
              </div>
                </div>
        );

      case 3:
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-6">
              {/* Header Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-2xl mb-6 transform hover:scale-105 transition-all duration-300">
                  <span className="text-3xl">✏️</span>
              </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-4">
                  Step 3: Start Annotating
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Select a class, then click and drag on the image to draw a bounding box. Use the toolbar below for quick navigation and shortcuts.
                </p>

                {/* Enhanced Helper Toolbar */}
                <div className="max-w-6xl mx-auto mb-10">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-6">
                    <div className="flex items-center justify-center gap-6 flex-wrap">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                        Keyboard Shortcuts
                      </span>
                      <div className="flex gap-3 flex-wrap justify-center">
                        <span className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-700">
                          <kbd className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs">Ctrl</kbd> + <kbd className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs">N</kbd>
                          <span className="text-blue-600 dark:text-blue-400">Next</span>
                        </span>
                        <span className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg text-sm font-medium border border-green-200 dark:border-green-700">
                          <kbd className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-xs">Ctrl</kbd> + <kbd className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-xs">P</kbd>
                          <span className="text-green-600 dark:text-green-400">Prev</span>
                        </span>
                        <span className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-lg text-sm font-medium border border-purple-200 dark:border-purple-700">
                          <kbd className="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded text-xs">Ctrl</kbd> + <kbd className="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded text-xs">Z</kbd>
                          <span className="text-purple-600 dark:text-purple-400">Undo</span>
                        </span>
                        <span className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-2 rounded-lg text-sm font-medium border border-orange-200 dark:border-orange-700">
                          <kbd className="bg-orange-100 dark:bg-orange-800 px-2 py-1 rounded text-xs">Delete</kbd>
                          <span className="text-orange-600 dark:text-orange-400">Remove</span>
                        </span>
                        <span className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg text-sm font-medium border border-indigo-200 dark:border-indigo-700">
                          <kbd className="bg-indigo-100 dark:bg-indigo-800 px-2 py-1 rounded text-xs">Space</kbd>
                          <span className="text-indigo-600 dark:text-indigo-400">Help</span>
                        </span>
              </div>
                </div>
                </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 gap-8">
                {/* Main Content Area */}
                <div className="w-full">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    {/* Floating Class Selector Toolbar */}
                    <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-gray-800/50 p-6">
                      <div className="flex items-center justify-between gap-6">
                        {/* Left Section - Class Selection */}
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-white text-lg">🏷️</span>
            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Annotation Mode</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Select a class to start annotating</p>
          </div>
                          </div>
                          
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

                    {/* Image Viewer */}
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
                        removeAnnotation={removeAnnotation}
                        classes={classes}
                        selectedClass={selectedClass}
                        setSelectedClass={setSelectedClass}
                      />
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
                    <button
                    onClick={prevStep}
                    className="group px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">←</span>
                      Back to Upload
                          </span>
                    </button>
                    
                        <button
                    onClick={nextStep}
                    disabled={totalAnnotations === 0}
                    className="group px-8 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white rounded-2xl hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-3xl font-bold text-lg disabled:transform-none disabled:hover:scale-100"
                  >
                    <span className="flex items-center gap-2">
                      Continue to Export
                      <span className="text-xl group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </span>
                        </button>
                      </div>

                {totalAnnotations === 0 && (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Add at least one annotation to continue
                  </p>
                )}
                  </div>
                </div>
              </div>
        );

      case 4:
        return (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-purple-600 dark:text-purple-400 text-4xl">📦</span>
                </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Step 4: Export Your Dataset
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Congratulations! Your dataset is ready. Export it as a ZIP file containing all images, annotations, and class definitions in YOLO format.
            </p>
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Dataset Summary</h3>
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{images.length}</div>
                    <div className="text-gray-600 dark:text-gray-400">Images</div>
                        </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totalAnnotations}</div>
                    <div className="text-gray-600 dark:text-gray-400">Annotations</div>
                      </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{classes.length}</div>
                    <div className="text-gray-600 dark:text-gray-400">Classes</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{Math.round(progressPercentage)}%</div>
                    <div className="text-gray-600 dark:text-gray-400">Complete</div>
                </div>
              </div>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                >
                  ← Back to Annotating
                </button>
                <button
                  onClick={exportDataset}
                  disabled={images.length === 0 || isExporting}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium text-lg"
                >
                  {isExporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                      Exporting... {Math.round(exportProgress)}%
                    </>
                  ) : (
                    '🚀 Export Dataset'
                  )}
                </button>
          </div>
        </div>
        </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-50 text-gray-900' : 'bg-gray-50 text-gray-900'}`}>
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        images={images}
        totalAnnotations={totalAnnotations}
        progressPercentage={progressPercentage}
      />

      {/* Workflow Progress Bar */}
      <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-b border-gray-200/70 dark:border-gray-800/60">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">YOLO Dataset Generator</h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep} of 4
              </div>
            </div>

          <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm p-4 shadow-sm">
            <div className="flex items-center justify-between md:justify-around gap-3">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col items-center min-w-[64px]">
                  <button
                    onClick={() => goToStep(step)}
                    disabled={!workflowCompleted[`step${step - 1}`] && step > 1}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-200 shadow-sm ${
                      currentStep === step
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                        : workflowCompleted[`step${step}`]
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                        : 'bg-gray-200/70 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300'
                    } ${
                      workflowCompleted[`step${step - 1}`] || step === 1
                        ? 'cursor-pointer hover:scale-110'
                        : 'cursor-not-allowed'
                    }`}
                    title={`Go to ${stepTitles[step - 1]}`}
                  >
                    {workflowCompleted[`step${step}`] ? '✓' : step}
                  </button>
                  <div className="mt-2 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                    {stepTitles[step - 1]}
              </div>
            </div>
              ))}
              </div>
            </div>
              </div>
            </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
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
      />
    </div>
  );
}
