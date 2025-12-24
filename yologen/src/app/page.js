'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  FiUpload, FiImage, FiTag, FiDownload, FiZap, FiCheck, 
  FiX, FiPlus, FiTrash2, FiChevronLeft, FiChevronRight 
} from 'react-icons/fi';
import { MdAutoFixHigh } from 'react-icons/md';

export default function YOLOGenerator() {
  // Core State
  const [step, setStep] = useState(1);
  const [classes, setClasses] = useState([]);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [annotations, setAnnotations] = useState({});
  const [selectedClass, setSelectedClass] = useState(0);
  
  // UI State
  const [newClassName, setNewClassName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get current image
  const currentImage = images[currentImageIndex];
  const currentAnnotations = currentImage ? (annotations[currentImage.id] || []) : [];
  const totalAnnotations = Object.values(annotations).flat().length;

  // Add Class
  const handleAddClass = () => {
    if (newClassName.trim() && !classes.includes(newClassName.trim())) {
      setClasses([...classes, newClassName.trim()]);
      setNewClassName('');
    }
  };

  // Remove Class
  const handleRemoveClass = (index) => {
    const newClasses = classes.filter((_, i) => i !== index);
    setClasses(newClasses);
    
    // Update annotations
    const newAnnotations = {};
    Object.keys(annotations).forEach(imgId => {
      newAnnotations[imgId] = annotations[imgId]
        .filter(ann => ann.classId !== index)
        .map(ann => ({
          ...ann,
          classId: ann.classId > index ? ann.classId - 1 : ann.classId
        }));
    });
    setAnnotations(newAnnotations);
  };

  // Upload Images
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    const newImages = imageFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    
    setImages([...images, ...newImages]);
    if (images.length === 0) setCurrentImageIndex(0);
  };

  // Canvas Drawing
  const handleCanvasMouseDown = (e) => {
    if (!currentImage || classes.length === 0) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setIsDrawing(true);
    setDrawStart({ x, y });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !drawStart) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setCurrentBox({
      x1: Math.min(drawStart.x, x),
      y1: Math.min(drawStart.y, y),
      x2: Math.max(drawStart.x, x),
      y2: Math.max(drawStart.y, y),
      classId: selectedClass
    });
  };

  const handleCanvasMouseUp = () => {
    if (currentBox && currentImage) {
      const width = currentBox.x2 - currentBox.x1;
      const height = currentBox.y2 - currentBox.y1;
      
      if (width > 0.01 && height > 0.01) {
        const newAnnotations = {
          ...annotations,
          [currentImage.id]: [
            ...(annotations[currentImage.id] || []),
            { ...currentBox, id: Date.now() }
          ]
        };
        setAnnotations(newAnnotations);
      }
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentBox(null);
  };

  // Delete Annotation
  const deleteAnnotation = (index) => {
    if (!currentImage) return;
    const newAnnotations = {
      ...annotations,
      [currentImage.id]: currentAnnotations.filter((_, i) => i !== index)
    };
    setAnnotations(newAnnotations);
    setSelectedBox(null);
  };

  // Export Dataset
  const exportDataset = async () => {
    if (images.length === 0 || totalAnnotations === 0) {
      alert('Please add images and annotations before exporting');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Create folders
      const imagesFolder = zip.folder('images');
      const labelsFolder = zip.folder('labels');
      
      // Add images and labels
      for (const image of images) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        imagesFolder.file(image.name, blob);
        
        const imageAnnotations = annotations[image.id] || [];
        if (imageAnnotations.length > 0) {
          const yoloFormat = imageAnnotations.map(ann => {
            const x_center = (ann.x1 + ann.x2) / 2;
            const y_center = (ann.y1 + ann.y2) / 2;
            const width = ann.x2 - ann.x1;
            const height = ann.y2 - ann.y1;
            return `${ann.classId} ${x_center.toFixed(6)} ${y_center.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`;
          }).join('\n');
          
          const labelName = image.name.replace(/\.[^/.]+$/, '') + '.txt';
          labelsFolder.file(labelName, yoloFormat);
        }
      }
      
      // Create data.yaml
      const yaml = `
train: ./images
val: ./images

nc: ${classes.length}
names: ${JSON.stringify(classes)}
      `.trim();
      
      zip.file('data.yaml', yaml);
      zip.file('classes.txt', classes.join('\n'));
      
      // Generate and download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yolo-dataset.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Dataset exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Navigation
  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setSelectedBox(null);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setSelectedBox(null);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Delete' && selectedBox !== null) deleteAnnotation(selectedBox);
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (idx < classes.length) setSelectedClass(idx);
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentImageIndex, images.length, selectedBox, classes.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <MdAutoFixHigh className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  YOLO Generator
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Professional Dataset Creator</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="flex items-center gap-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-blue-600">{classes.length}</span> Classes
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-purple-600">{images.length}</span> Images
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-green-600">{totalAnnotations}</span> Annotations
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Classes */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Define Your Classes
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add the object classes you want to detect
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddClass()}
                  placeholder="Enter class name (e.g., person, car, dog)"
                  className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddClass}
                  disabled={!newClassName.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <FiPlus className="w-5 h-5" />
                  Add
                </button>
              </div>

              {/* Classes List */}
              {classes.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {classes.map((className, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ background: `hsl(${(idx * 137.5) % 360}, 70%, 60%)` }}
                        >
                          {idx}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{className}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveClass(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <FiTag className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No classes added yet</p>
                </div>
              )}

              {/* Continue Button */}
              {classes.length > 0 && (
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  Continue to Upload Images
                  <FiChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Upload Images */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <button
                onClick={() => setStep(1)}
                className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-2 mx-auto"
              >
                <FiChevronLeft className="w-4 h-4" />
                Back to Classes
              </button>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Upload Your Images
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add images to annotate for your dataset
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
              >
                <FiUpload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Click to upload images
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  JPG, PNG, WebP (Multiple files supported)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Images Grid */}
              {images.length > 0 && (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-medium">{img.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    Start Annotating ({images.length} images)
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Annotate */}
        {step === 3 && currentImage && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-2"
              >
                <FiChevronLeft className="w-4 h-4" />
                Back
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Annotate Images
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Image {currentImageIndex + 1} of {images.length}
                </p>
              </div>
              <button
                onClick={() => setStep(4)}
                disabled={totalAnnotations === 0}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                Export
                <FiDownload className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Canvas */}
              <div className="col-span-9 space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <div 
                      className="relative"
                      style={{ paddingBottom: '75%' }}
                    >
                      <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                        className="absolute inset-0 w-full h-full rounded-lg cursor-crosshair"
                        style={{
                          backgroundImage: `url(${currentImage.url})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                        }}
                      />
                      
                      {/* Draw existing boxes */}
                      {currentAnnotations.map((ann, idx) => (
                        <div
                          key={ann.id}
                          onClick={() => setSelectedBox(idx)}
                          className={`absolute border-2 cursor-pointer ${
                            selectedBox === idx ? 'border-yellow-400' : 'border-white'
                          }`}
                          style={{
                            left: `${ann.x1 * 100}%`,
                            top: `${ann.y1 * 100}%`,
                            width: `${(ann.x2 - ann.x1) * 100}%`,
                            height: `${(ann.y2 - ann.y1) * 100}%`,
                            backgroundColor: `hsla(${(ann.classId * 137.5) % 360}, 70%, 60%, 0.3)`
                          }}
                        >
                          <span className="absolute -top-6 left-0 px-2 py-1 bg-white dark:bg-gray-800 text-xs font-bold rounded shadow">
                            {classes[ann.classId]}
                          </span>
                        </div>
                      ))}
                      
                      {/* Draw current box */}
                      {currentBox && (
                        <div
                          className="absolute border-2 border-blue-500 pointer-events-none"
                          style={{
                            left: `${currentBox.x1 * 100}%`,
                            top: `${currentBox.y1 * 100}%`,
                            width: `${(currentBox.x2 - currentBox.x1) * 100}%`,
                            height: `${(currentBox.y2 - currentBox.y1) * 100}%`,
                            backgroundColor: `hsla(${(currentBox.classId * 137.5) % 360}, 70%, 60%, 0.3)`
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevImage}
                    disabled={currentImageIndex === 0}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                    Previous
                  </button>
                  
                  <span className="text-gray-600 dark:text-gray-400">
                    {currentAnnotations.length} annotation{currentAnnotations.length !== 1 ? 's' : ''}
                  </span>
                  
                  <button
                    onClick={nextImage}
                    disabled={currentImageIndex === images.length - 1}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    Next
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="col-span-3 space-y-4">
                {/* Class Selector */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Active Class</h3>
                  <div className="space-y-2">
                    {classes.map((className, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedClass(idx)}
                        className={`w-full p-3 rounded-lg text-left font-medium transition-all ${
                          selectedClass === idx
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: `hsl(${(idx * 137.5) % 360}, 70%, 60%)` }}
                          >
                            {idx}
                          </div>
                          {className}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Annotations List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                    Annotations ({currentAnnotations.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {currentAnnotations.map((ann, idx) => (
                      <div
                        key={ann.id}
                        onClick={() => setSelectedBox(idx)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedBox === idx
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ background: `hsl(${(ann.classId * 137.5) % 360}, 70%, 60%)` }}
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {classes[ann.classId]}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAnnotation(idx);
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2 text-sm">
                    Keyboard Shortcuts
                  </h4>
                  <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    <div>← → : Navigate images</div>
                    <div>1-9 : Switch class</div>
                    <div>Delete : Remove selected box</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Export */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <button
                onClick={() => setStep(3)}
                className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-2 mx-auto"
              >
                <FiChevronLeft className="w-4 h-4" />
                Back to Annotation
              </button>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Export Dataset
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your dataset is ready to download
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl font-bold text-blue-600">{classes.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Classes</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl font-bold text-purple-600">{images.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Images</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-3xl font-bold text-green-600">{totalAnnotations}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Annotations</div>
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={exportDataset}
                disabled={isExporting}
                className="w-full py-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FiDownload className="w-6 h-6" />
                    Download YOLO Dataset
                  </>
                )}
              </button>

              {/* Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Dataset Contents</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <FiCheck className="w-4 h-4 text-green-600" />
                    <span>images/ - All your uploaded images</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheck className="w-4 h-4 text-green-600" />
                    <span>labels/ - YOLO format annotations (.txt)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheck className="w-4 h-4 text-green-600" />
                    <span>data.yaml - Training configuration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheck className="w-4 h-4 text-green-600" />
                    <span>classes.txt - Class names list</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

