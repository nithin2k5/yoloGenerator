'use client';

import { useState } from 'react';
import { TrendingUp, Download, Share, Eye, BarChart3, Target, Zap } from 'lucide-react';

export default function ModelPerformance({ modelMetrics, modelConfig, classes, modelId, onExportModel, onViewPredictions }) {
  const [selectedFormat, setSelectedFormat] = useState('onnx');

  const exportFormats = [
    { id: 'onnx', name: 'ONNX', description: 'Universal format for inference', size: '~50MB' },
    { id: 'torch', name: 'PyTorch', description: 'Native PyTorch format', size: '~100MB' },
    { id: 'tflite', name: 'TensorFlow Lite', description: 'Mobile-optimized format', size: '~25MB' },
    { id: 'coreml', name: 'Core ML', description: 'Apple devices format', size: '~30MB' },
    { id: 'tensorrt', name: 'TensorRT', description: 'NVIDIA GPU optimized', size: '~75MB' }
  ];

  const handleExport = async (format) => {
    if (modelId) {
      // Download from API if modelId is available
      try {
        const response = await fetch(`/api/models/download/${modelId}`);
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `yolo_model_${modelConfig.modelType}_${format}_${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          console.error('Failed to download model from API');
          // Fallback to mock download
          downloadMockModel(format);
        }
      } catch (error) {
        console.error('Error downloading model:', error);
        // Fallback to mock download
        downloadMockModel(format);
      }
    } else {
      // Fallback mock download
      downloadMockModel(format);
    }

    onExportModel?.(format);
  };

  const downloadMockModel = (format) => {
    const exportData = {
      model: {
        config: modelConfig,
        metrics: modelMetrics,
        classes: classes,
        format: format,
        exportedAt: new Date().toISOString()
      },
      weights: 'mock_weights_data', // In real implementation, this would be actual model weights
      config: 'mock_config_data'    // In real implementation, this would be actual config
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yolo_model_${modelConfig.modelType}_${format}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Model Performance</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Training results and export options</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              ✓ Trained Successfully
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">mAP@50</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(modelMetrics.mAP50 * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">mAP@50:95</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(modelMetrics.mAP50_95 * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Precision</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(modelMetrics.precision * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recall</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {(modelMetrics.recall * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">F1-Score</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {(modelMetrics.f1Score * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Test Set Performance */}
        {modelMetrics.test_mAP50 && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Test Set Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Test mAP@50</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {(modelMetrics.test_mAP50 * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Test Precision</div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {(modelMetrics.test_precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Test Recall</div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {(modelMetrics.test_recall * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Test mAP@50:95</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {(modelMetrics.test_mAP50_95 * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Training Details */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Training Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Model:</span>
              <div className="font-medium text-gray-900 dark:text-white">{modelConfig.modelType.toUpperCase()}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Epochs:</span>
              <div className="font-medium text-gray-900 dark:text-white">{modelMetrics.epochsCompleted || modelConfig.epochs}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Batch Size:</span>
              <div className="font-medium text-gray-900 dark:text-white">{modelConfig.batchSize}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Best Epoch:</span>
              <div className="font-medium text-gray-900 dark:text-white">{modelMetrics.bestEpoch || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Training Time:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {modelMetrics.trainingTime ? `${Math.round(modelMetrics.trainingTime / 1000 / 60)}m` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Loss Metrics */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <span className="text-gray-600 dark:text-gray-400 block">Final Loss</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {modelMetrics.finalLoss ? modelMetrics.finalLoss.toFixed(4) : 'N/A'}
                </span>
              </div>
              <div className="text-center">
                <span className="text-gray-600 dark:text-gray-400 block">Training Loss</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {modelMetrics.trainingLoss ? modelMetrics.trainingLoss.toFixed(4) : 'N/A'}
                </span>
              </div>
              <div className="text-center">
                <span className="text-gray-600 dark:text-gray-400 block">Validation Loss</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {modelMetrics.validationLoss ? modelMetrics.validationLoss.toFixed(4) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Model</h3>
          <div className="space-y-3">
            {exportFormats.map((format) => (
              <div key={format.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{format.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{format.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{format.size}</span>
                  <button
                    onClick={() => handleExport(format.id)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onViewPredictions}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Predictions
          </button>
          <button
            onClick={() => {
              const shareData = {
                title: 'YOLO Model Trained',
                text: `Successfully trained ${modelConfig.modelType.toUpperCase()} model with ${(modelMetrics.mAP50 * 100).toFixed(1)}% mAP@50`,
                url: window.location.href
              };

              if (navigator.share) {
                navigator.share(shareData);
              } else {
                navigator.clipboard.writeText(`${shareData.title}: ${shareData.text} - ${shareData.url}`);
                alert('Model details copied to clipboard!');
              }
            }}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
          >
            <Share className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

