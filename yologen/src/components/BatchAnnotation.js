'use client';

import { useState } from 'react';
import { MdContentCopy, MdDeleteSweep, MdAutoFixHigh, MdClose } from 'react-icons/md';
import { FiCopy } from 'react-icons/fi';

export default function BatchAnnotation({
  images,
  annotations,
  classes,
  currentImageIndex,
  onCopyAnnotations,
  onApplyToAll,
  onClearAll
}) {
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [copyMode, setCopyMode] = useState(false);

  const currentImage = images[currentImageIndex];
  const currentAnnotations = annotations[currentImage?.id] || [];

  const handleCopyToSelected = () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one target image');
      return;
    }

    const confirmed = confirm(
      `Copy ${currentAnnotations.length} annotation(s) to ${selectedImages.length} selected image(s)?`
    );

    if (confirmed) {
      onCopyAnnotations(currentImage.id, selectedImages);
      setSelectedImages([]);
      setCopyMode(false);
      setShowBatchMenu(false);
    }
  };

  const handleApplyToAll = () => {
    const unannotatedImages = images.filter(img => !annotations[img.id] || annotations[img.id].length === 0);
    
    if (unannotatedImages.length === 0) {
      alert('All images already have annotations');
      return;
    }

    const confirmed = confirm(
      `Apply ${currentAnnotations.length} annotation(s) to ${unannotatedImages.length} unannotated image(s)?`
    );

    if (confirmed) {
      onApplyToAll(currentImage.id);
      setShowBatchMenu(false);
    }
  };

  const handleClearAnnotations = () => {
    const annotatedCount = Object.keys(annotations).filter(id => annotations[id].length > 0).length;
    
    const confirmed = confirm(
      `Clear all annotations from ${annotatedCount} image(s)? This cannot be undone.`
    );

    if (confirmed) {
      onClearAll();
      setShowBatchMenu(false);
    }
  };

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  if (currentAnnotations.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowBatchMenu(!showBatchMenu)}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center gap-2 shadow-lg"
        title="Batch annotation tools"
      >
        <MdAutoFixHigh className="w-5 h-5" />
        Batch Tools
      </button>

      {showBatchMenu && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Batch Annotation Tools</h3>
              <button
                onClick={() => setShowBatchMenu(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Copy to Selected */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-3 mb-2">
                  <FiCopy className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">Copy to Selected Images</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Select specific images to copy current annotations
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCopyMode(!copyMode)}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  {copyMode ? 'Cancel Selection' : 'Select Images'}
                </button>
              </div>

              {/* Apply to All Unannotated */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-start gap-3 mb-2">
                  <MdContentCopy className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">Apply to All Unannotated</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Copy annotations to all images without annotations
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleApplyToAll}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  Apply to Unannotated
                </button>
              </div>

              {/* Clear All */}
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-start gap-3 mb-2">
                  <MdDeleteSweep className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">Clear All Annotations</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Remove all annotations from all images
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearAnnotations}
                  className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Selection Modal */}
      {copyMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Select Target Images
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedImages.length} image(s) selected • {currentAnnotations.length} annotation(s) to copy
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCopyMode(false);
                    setSelectedImages([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => {
                  if (image.id === currentImage.id) return null;
                  
                  const isSelected = selectedImages.includes(image.id);
                  const hasAnnotations = annotations[image.id]?.length > 0;

                  return (
                    <div
                      key={image.id}
                      onClick={() => toggleImageSelection(image.id)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs font-medium truncate">{image.name}</p>
                        <p className="text-white/80 text-xs">
                          {hasAnnotations ? `${annotations[image.id].length} annotations` : 'No annotations'}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setCopyMode(false);
                  setSelectedImages([]);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyToSelected}
                disabled={selectedImages.length === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Copy to {selectedImages.length} Image(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

