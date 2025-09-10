'use client';

import { useState } from 'react';
import { Cpu, Database, Download } from 'lucide-react';
import TrainingModal from './TrainingModal';

export default function ExportStep({
  classes,
  images,
  annotations,
  exportDataset,
  isExporting,
  exportProgress,
  totalAnnotations
}) {
  const [showTraining, setShowTraining] = useState(false);
  const progressPercentage = images.length > 0 ? (totalAnnotations / (images.length * 5)) * 100 : 0;

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Export & Train</h2>

      <div className="max-w-4xl mx-auto">
        {/* Dataset Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Dataset Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{images.length}</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Images</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totalAnnotations}</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Annotations</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{classes.length}</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Classes</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{Math.round(progressPercentage)}%</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Complete</div>
            </div>
          </div>
        </div>

        {/* Dataset Preview */}
        {images.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              Dataset Structure Preview
            </h3>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 font-mono text-sm">
              <div className="text-gray-700 dark:text-gray-300 mb-3">📁 dataset/</div>
              <div className="ml-4 space-y-1">
                <div className="text-gray-600 dark:text-gray-400">📄 data.yaml</div>

                <div className="text-gray-700 dark:text-gray-300 mt-3">📁 images/</div>
                <div className="ml-4 space-y-1">
                  <div className="text-green-700 dark:text-green-400">
                    📁 train/ ({Object.values(imageCategories).filter(cat => cat === 'train').length} images)
                  </div>
                  <div className="text-blue-700 dark:text-blue-400">
                    📁 valid/ ({Object.values(imageCategories).filter(cat => cat === 'valid').length} images)
                  </div>
                  <div className="text-purple-700 dark:text-purple-400">
                    📁 test/ ({Object.values(imageCategories).filter(cat => cat === 'test').length} images)
                  </div>
                </div>

                <div className="text-gray-700 dark:text-gray-300 mt-3">📁 labels/</div>
                <div className="ml-4 space-y-1">
                  <div className="text-green-700 dark:text-green-400">
                    📁 train/ ({Object.values(imageCategories).filter(cat => cat === 'train').length * Math.max(1, Math.floor(totalAnnotations / images.length))} annotations)
                  </div>
                  <div className="text-blue-700 dark:text-blue-400">
                    📁 valid/ ({Object.values(imageCategories).filter(cat => cat === 'valid').length * Math.max(1, Math.floor(totalAnnotations / images.length))} annotations)
                  </div>
                  <div className="text-purple-700 dark:text-purple-400">
                    📁 test/ ({Object.values(imageCategories).filter(cat => cat === 'test').length * Math.max(1, Math.floor(totalAnnotations / images.length))} annotations)
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>🎯 Manual Dataset Categorization:</strong> You control which images go to Training, Validation, and Test sets
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Use the category buttons in the image viewer to assign each image to its appropriate dataset
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Export Dataset */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Dataset</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Download as YOLO format</p>
              </div>
            </div>

            <button
              onClick={exportDataset}
              disabled={images.length === 0 || isExporting}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                  Exporting... {Math.round(exportProgress)}%
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 inline mr-2" />
                  Export Dataset
                </>
              )}
            </button>
          </div>

          {/* Train Model */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Train Model</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Train YOLO model on your data</p>
              </div>
            </div>

            <button
              onClick={() => setShowTraining(true)}
              disabled={images.length === 0 || totalAnnotations === 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium"
            >
              <Cpu className="w-4 h-4 inline mr-2" />
              Train Model
            </button>
          </div>
        </div>

        {/* Classes Preview */}
        {classes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Classes Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {classes.map((className, index) => {
                const classAnnotations = Object.values(annotations).flat().filter(ann => ann.classId === index).length;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{className}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{classAnnotations} annotations</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Requirements Check */}
        {(images.length === 0 || totalAnnotations === 0) && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">⚠️</div>
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Requirements</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                  {images.length === 0 && <li>• Add at least one image to your dataset</li>}
                  {totalAnnotations === 0 && <li>• Create at least one annotation on your images</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Training Modal */}
      <TrainingModal
        showTraining={showTraining}
        setShowTraining={setShowTraining}
        classes={classes}
        images={images}
        annotations={annotations}
      />
    </div>
  );
}
