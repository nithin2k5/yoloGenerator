'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, BarChart3 } from 'lucide-react';

export default function DatasetValidation({ classes, images, annotations, onValidationComplete }) {
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (classes.length > 0 && images.length > 0) {
      validateDataset();
    }
  }, [classes, images, annotations]);

  const validateDataset = async () => {
    setIsValidating(true);

    // Simulate validation time
    await new Promise(resolve => setTimeout(resolve, 500));

    const errors = [];
    const warnings = [];
    const stats = {
      totalImages: images.length,
      totalAnnotations: 0,
      classDistribution: new Array(classes.length).fill(0),
      avgAnnotationsPerImage: 0,
      imagesWithAnnotations: 0,
      imagesWithoutAnnotations: 0
    };

    // Calculate statistics
    Object.entries(annotations).forEach(([imageId, imageAnnotations]) => {
      const count = imageAnnotations.length;
      stats.totalAnnotations += count;

      if (count > 0) {
        stats.imagesWithAnnotations++;
      } else {
        stats.imagesWithoutAnnotations++;
      }

      // Count annotations per class
      imageAnnotations.forEach(ann => {
        if (ann.classId >= 0 && ann.classId < classes.length) {
          stats.classDistribution[ann.classId]++;
        }
      });
    });

    stats.avgAnnotationsPerImage = stats.totalAnnotations / images.length;
    stats.imagesWithoutAnnotations = images.length - stats.imagesWithAnnotations;

    // Validation rules
    if (classes.length === 0) {
      errors.push({
        type: 'error',
        message: 'At least one class must be defined',
        icon: XCircle
      });
    }

    if (images.length < 5) {
      errors.push({
        type: 'error',
        message: 'Minimum 5 images required for training',
        icon: XCircle
      });
    }

    if (stats.totalAnnotations === 0) {
      errors.push({
        type: 'error',
        message: 'At least one annotation required',
        icon: XCircle
      });
    }

    if (stats.imagesWithoutAnnotations > 0) {
      warnings.push({
        type: 'warning',
        message: `${stats.imagesWithoutAnnotations} images have no annotations`,
        icon: AlertTriangle
      });
    }

    if (stats.avgAnnotationsPerImage < 1) {
      warnings.push({
        type: 'warning',
        message: `Low annotation density (${stats.avgAnnotationsPerImage.toFixed(1)} annotations per image)`,
        icon: AlertTriangle
      });
    }

    // Check class balance
    const nonZeroClasses = stats.classDistribution.filter(count => count > 0);
    if (nonZeroClasses.length > 1) {
      const minCount = Math.min(...nonZeroClasses);
      const maxCount = Math.max(...nonZeroClasses);
      const balanceRatio = minCount / maxCount;

      if (balanceRatio < 0.1) {
        warnings.push({
          type: 'warning',
          message: 'Significant class imbalance detected',
          icon: AlertTriangle
        });
      }
    }

    // Success messages
    const success = [];
    if (stats.totalAnnotations > 0) {
      success.push({
        type: 'success',
        message: `Dataset ready with ${stats.totalAnnotations} annotations`,
        icon: CheckCircle
      });
    }

    const results = {
      errors,
      warnings,
      success,
      stats,
      isValid: errors.length === 0,
      canTrain: errors.length === 0
    };

    setValidationResults(results);
    setIsValidating(false);

    if (onValidationComplete) {
      onValidationComplete(results);
    }
  };

  if (isValidating) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Validating dataset...</span>
        </div>
      </div>
    );
  }

  if (!validationResults) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Add classes and images to see validation results</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Validation Messages */}
      <div className="space-y-2">
        {validationResults.success.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <item.icon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-green-800 dark:text-green-200 text-sm">{item.message}</span>
          </div>
        ))}

        {validationResults.warnings.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <item.icon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <span className="text-yellow-800 dark:text-yellow-200 text-sm">{item.message}</span>
          </div>
        ))}

        {validationResults.info && validationResults.info.map((item, index) => (
          <div key={`info-${index}`} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-blue-800 dark:text-blue-200 text-sm">{item}</span>
          </div>
        ))}

        {validationResults.errors.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <item.icon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-red-800 dark:text-red-200 text-sm">{item.message}</span>
          </div>
        ))}
      </div>

        {/* Dataset Statistics */}
      {validationResults.stats && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dataset Overview</h3>
          </div>

          {/* Dataset Split Visualization */}
          {validationResults.canTrain && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Training Dataset Split (70/20/10)
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">Training Set</div>
                      <div className="text-xs text-green-600 dark:text-green-400">70% of images</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-800 dark:text-green-200">{Math.floor(images.length * 0.7)} images</div>
                    <div className="text-xs text-green-600 dark:text-green-400">~{Math.floor(validationResults.stats.totalAnnotations * 0.7)} annotations</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-blue-800 dark:text-blue-200">Validation Set</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">20% of images</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-800 dark:text-blue-200">{Math.floor(images.length * 0.2)} images</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">~{Math.floor(validationResults.stats.totalAnnotations * 0.2)} annotations</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-purple-800 dark:text-purple-200">Test Set</div>
                      <div className="text-xs text-purple-600 dark:text-purple-400">10% of images</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-800 dark:text-purple-200">{Math.floor(images.length * 0.1)} images</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">~{Math.floor(validationResults.stats.totalAnnotations * 0.1)} annotations</div>
                  </div>
                </div>
              </div>

              {/* Split Ratio Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Dataset Distribution</span>
                  <span>{images.length} total images</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <div className="bg-green-500" style={{width: '70%'}}></div>
                  <div className="bg-blue-500" style={{width: '20%'}}></div>
                  <div className="bg-purple-500" style={{width: '10%'}}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>70% Train</span>
                  <span>20% Val</span>
                  <span>10% Test</span>
                </div>
              </div>
            </div>
          )}


          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{validationResults.stats.totalImages}</div>
              <div className="text-gray-600 dark:text-gray-400">Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{validationResults.stats.totalAnnotations}</div>
              <div className="text-gray-600 dark:text-gray-400">Annotations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{validationResults.stats.avgAnnotationsPerImage.toFixed(1)}</div>
              <div className="text-gray-600 dark:text-gray-400">Avg per Image</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{validationResults.stats.imagesWithAnnotations}</div>
              <div className="text-gray-600 dark:text-gray-400">Annotated</div>
            </div>
          </div>

          {/* Class Distribution */}
          {classes.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class Distribution</h4>
              <div className="space-y-2">
                {classes.map((className, index) => {
                  const count = validationResults.stats.classDistribution[index] || 0;
                  const percentage = validationResults.stats.totalAnnotations > 0
                    ? (count / validationResults.stats.totalAnnotations * 100).toFixed(1)
                    : 0;

                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{className}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Training Readiness */}
      <div className={`p-3 rounded-lg border ${
        validationResults.canTrain
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
      }`}>
        <div className="flex items-center gap-3">
          {validationResults.canTrain ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className={`text-sm font-medium ${
            validationResults.canTrain
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            {validationResults.canTrain ? 'Ready for training' : 'Fix validation errors to train'}
          </span>
        </div>
      </div>
    </div>
  );
}
