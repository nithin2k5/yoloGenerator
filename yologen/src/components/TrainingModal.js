'use client';

import { useState } from 'react';
import { X, Play, Settings, Download, Cpu, Zap, BarChart3 } from 'lucide-react';
import ModelPerformance from './ModelPerformance';
import DatasetValidation from './DatasetValidation';

export default function TrainingModal({ showTraining, setShowTraining, classes, images, annotations }) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [trainingJobId, setTrainingJobId] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [modelConfig, setModelConfig] = useState({
    modelType: 'yolov8n', // yolov5n, yolov5s, yolov5m, yolov5l, yolov5x, yolov8n, yolov8s, yolov8m, yolov8l, yolov8x
    epochs: 50,
    batchSize: 16,
    learningRate: 0.01,
    imageSize: 640,
    patience: 10
  });

  const totalAnnotations = Object.values(annotations).flat().length;

  const startTraining = async () => {
    if (!validationResults?.canTrain) {
      alert('Please fix dataset validation errors before training');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([]);
    setTrainingComplete(false);
    setTrainingJobId(null);

    try {
      // Start training via API
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classes,
          images,
          annotations,
          modelConfig,
          imageCategories: imageCategories || {}
        })
      });

      const data = await response.json();

      if (!data.success) {
        alert(`Training failed: ${data.errors?.join(', ') || data.error}`);
        setIsTraining(false);
        return;
      }

      // Show validation results
      if (data.validation) {
        if (data.validation.warnings && data.validation.warnings.length > 0) {
          console.warn('Dataset warnings:', data.validation.warnings);
          // You could show these in a toast or modal
        }
        if (data.validation.info && data.validation.info.length > 0) {
          console.info('Dataset info:', data.validation.info);
        }
      }

      setTrainingJobId(data.jobId);
      setJobStatus(data.status);

      if (data.status === 'running') {
        setIsTraining(true);
        setTrainingLogs([{ time: new Date().toLocaleTimeString(), message: 'Training started...' }]);
      } else if (data.status === 'queued') {
        setTrainingLogs([{ time: new Date().toLocaleTimeString(), message: `Training queued (position ${data.queuePosition})` }]);
      }

      // Start polling for progress
      pollTrainingProgress(data.jobId);

    } catch (error) {
      console.error('Failed to start training:', error);
      alert('Failed to start training. Please try again.');
      setIsTraining(false);
    }
  };

  const pollTrainingProgress = (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/train?jobId=${jobId}`);
        const data = await response.json();

        if (!data.success) {
          console.error('Failed to get training status:', data.error);
          return;
        }

        const job = data.job;

        // Update job status
        setJobStatus(job.status);

        // Update progress
        setTrainingProgress(job.progress);

        // Update logs
        setTrainingLogs(job.logs.map(log => ({
          time: new Date().toLocaleTimeString(),
          message: log
        })));

        // Handle different job states
        if (job.status === 'running' && !isTraining) {
          setIsTraining(true);
          setTrainingLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Training started...' }]);
        } else if (job.status === 'queued') {
          setIsTraining(false);
          if (job.queuePosition) {
            setTrainingLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Queued position: ${job.queuePosition}` }]);
          }
        } else if (job.status === 'completed') {
          clearInterval(pollInterval);
          setModelMetrics(job.metrics);
          setTrainingComplete(true);
          setIsTraining(false);
          setJobStatus('completed');
        }

        // Update model config with current epoch info
        setModelConfig(prev => ({
          ...prev,
          currentEpoch: job.currentEpoch,
          totalEpochs: job.totalEpochs
        }));

        // Store model ID when available
        if (job.modelId) {
          setTrainingJobId(job.modelId);
        }

      } catch (error) {
        console.error('Failed to poll training progress:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Store interval ID for cleanup
    setTrainingJobId(jobId);
  };

  const downloadModel = () => {
    // Simulate model download
    const modelData = {
      config: modelConfig,
      classes: classes,
      trainedAt: new Date().toISOString(),
      metrics: {
        finalLoss: 0.765,
        mAP50: 0.892,
        mAP50_95: 0.756
      }
    };

    const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yolo_model_${modelConfig.modelType}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!showTraining) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Train YOLO Model</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Train your custom object detection model</p>
            </div>
          </div>
          <button
            onClick={() => setShowTraining(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Left Panel - Configuration */}
          <div className="w-1/3 p-6 border-r border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              {/* Model Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuration
                </h3>

                <div className="space-y-4">
                  {/* Model Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model Type
                    </label>
                    <select
                      value={modelConfig.modelType}
                      onChange={(e) => setModelConfig(prev => ({ ...prev, modelType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isTraining}
                    >
                      <optgroup label="YOLOv5">
                        <option value="yolov5n">YOLOv5 Nano</option>
                        <option value="yolov5s">YOLOv5 Small</option>
                        <option value="yolov5m">YOLOv5 Medium</option>
                        <option value="yolov5l">YOLOv5 Large</option>
                        <option value="yolov5x">YOLOv5 Extra Large</option>
                      </optgroup>
                      <optgroup label="YOLOv8">
                        <option value="yolov8n">YOLOv8 Nano</option>
                        <option value="yolov8s">YOLOv8 Small</option>
                        <option value="yolov8m">YOLOv8 Medium</option>
                        <option value="yolov8l">YOLOv8 Large</option>
                        <option value="yolov8x">YOLOv8 Extra Large</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Epochs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Epochs: {modelConfig.epochs}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={modelConfig.epochs}
                      onChange={(e) => setModelConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      disabled={isTraining}
                    />
                  </div>

                  {/* Batch Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Batch Size: {modelConfig.batchSize}
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="64"
                      step="4"
                      value={modelConfig.batchSize}
                      onChange={(e) => setModelConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      disabled={isTraining}
                    />
                  </div>

                  {/* Learning Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Learning Rate: {modelConfig.learningRate}
                    </label>
                    <input
                      type="range"
                      min="0.001"
                      max="0.1"
                      step="0.001"
                      value={modelConfig.learningRate}
                      onChange={(e) => setModelConfig(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      disabled={isTraining}
                    />
                  </div>
                </div>
              </div>

              {/* Dataset Validation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Dataset Validation
                </h3>

                <DatasetValidation
                  classes={classes}
                  images={images}
                  annotations={annotations}
                  onValidationComplete={setValidationResults}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Training/Results */}
          <div className="flex-1 p-6">
            {!trainingComplete ? (
              /* Training Progress View */
              <div className="h-full flex flex-col">
                {/* Training Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {jobStatus === 'queued' ? 'Training Queue' : 'Training Progress'}
                    </h3>
                    {validationResults?.canTrain && !isTraining && trainingProgress === 0 && !trainingJobId && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        📊 Estimated training time: {Math.max(10, Math.min(30, Math.round(images.length * modelConfig.epochs * 0.002)))} minutes
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isTraining && trainingProgress === 0 && !trainingJobId && (
                      <button
                        onClick={startTraining}
                        disabled={!validationResults?.canTrain}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-600 transition-all duration-200 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Start Training
                      </button>
                    )}
                    {jobStatus === 'queued' && (
                      <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        In Queue
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {(isTraining || trainingProgress > 0) && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Training Progress</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(trainingProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${trainingProgress}%` }}
                      />
                    </div>
                    {jobStatus === 'running' && (
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Epoch {modelConfig.currentEpoch || 0} / {modelConfig.totalEpochs || modelConfig.epochs}</span>
                        <span>Estimated time remaining: ~{Math.round((modelConfig.epochs - (modelConfig.currentEpoch || 0)) * 2)} minutes</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Training Logs */}
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Training Logs</h4>
                  <div className="space-y-2">
                    {trainingLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Ready to start training</p>
                      </div>
                    ) : (
                      trainingLogs.map((log, index) => (
                        <div key={index} className="flex gap-3 text-sm">
                          <span className="text-gray-400 dark:text-gray-500 font-mono text-xs">
                            {log.time}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Model Performance View */
              <div className="h-full">
                <ModelPerformance
                  modelMetrics={modelMetrics}
                  modelConfig={modelConfig}
                  classes={classes}
                  modelId={trainingJobId}
                  onExportModel={(format) => {
                    console.log(`Exporting model in ${format} format`);
                  }}
                  onViewPredictions={() => {
                    console.log('Viewing predictions');
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
