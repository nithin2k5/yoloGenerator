'use client';

import { useState, useEffect } from 'react';
import { MdCheckCircle, MdWarning, MdError, MdInfo } from 'react-icons/md';
import { FiAlertTriangle } from 'react-icons/fi';

export default function AnnotationQuality({ images, annotations, classes }) {
  const [qualityReport, setQualityReport] = useState(null);

  useEffect(() => {
    if (images.length > 0 && classes.length > 0) {
      analyzeQuality();
    }
  }, [images, annotations, classes]);

  const analyzeQuality = () => {
    const issues = [];
    const warnings = [];
    const suggestions = [];
    let qualityScore = 100;

    // Analyze each image
    images.forEach((image, index) => {
      const imageAnnotations = annotations[image.id] || [];
      
      // Check for unannotated images
      if (imageAnnotations.length === 0) {
        warnings.push({
          type: 'warning',
          image: image.name,
          message: 'No annotations',
          suggestion: 'Add at least one annotation to this image'
        });
        qualityScore -= 2;
      }

      // Check for very small annotations
      imageAnnotations.forEach((ann, annIdx) => {
        const width = Math.abs(ann.x2 - ann.x1);
        const height = Math.abs(ann.y2 - ann.y1);
        const area = width * height;

        if (area < 0.001) {
          issues.push({
            type: 'error',
            image: image.name,
            annotation: annIdx + 1,
            message: 'Very small annotation detected',
            suggestion: 'This annotation might be too small. Consider resizing or removing it.'
          });
          qualityScore -= 5;
        }

        // Check for very large annotations (likely background)
        if (area > 0.8) {
          warnings.push({
            type: 'warning',
            image: image.name,
            annotation: annIdx + 1,
            message: 'Very large annotation detected',
            suggestion: 'This annotation covers most of the image. Ensure it\'s not including background.'
          });
          qualityScore -= 3;
        }

        // Check for extremely thin annotations
        if (width < 0.01 || height < 0.01) {
          warnings.push({
            type: 'warning',
            image: image.name,
            annotation: annIdx + 1,
            message: 'Very thin annotation detected',
            suggestion: 'This annotation is very narrow. Ensure it captures the full object.'
          });
          qualityScore -= 2;
        }

        // Check for invalid class IDs
        if (ann.classId < 0 || ann.classId >= classes.length) {
          issues.push({
            type: 'error',
            image: image.name,
            annotation: annIdx + 1,
            message: 'Invalid class ID',
            suggestion: 'This annotation has an invalid class. Please reassign it.'
          });
          qualityScore -= 10;
        }
      });
    });

    // Check class distribution
    const classDistribution = new Array(classes.length).fill(0);
    Object.values(annotations).flat().forEach(ann => {
      if (ann.classId >= 0 && ann.classId < classes.length) {
        classDistribution[ann.classId]++;
      }
    });

    const nonZeroClasses = classDistribution.filter(count => count > 0);
    if (nonZeroClasses.length > 1) {
      const minCount = Math.min(...nonZeroClasses);
      const maxCount = Math.max(...nonZeroClasses);
      const balanceRatio = minCount / maxCount;

      if (balanceRatio < 0.1) {
        warnings.push({
          type: 'warning',
          message: 'Significant class imbalance detected',
          suggestion: `Some classes have significantly fewer annotations than others. Consider adding more annotations for underrepresented classes.`,
          details: classes.map((className, idx) => ({
            class: className,
            count: classDistribution[idx]
          }))
        });
        qualityScore -= 10;
      }
    }

    // Check for unused classes
    const unusedClasses = classes.filter((_, idx) => classDistribution[idx] === 0);
    if (unusedClasses.length > 0) {
      suggestions.push({
        type: 'info',
        message: `${unusedClasses.length} unused class(es)`,
        suggestion: `Classes without annotations: ${unusedClasses.join(', ')}. Consider removing unused classes or adding annotations.`
      });
    }

    // Dataset size recommendations
    const totalAnnotations = Object.values(annotations).flat().length;
    if (images.length < 10) {
      suggestions.push({
        type: 'info',
        message: 'Small dataset',
        suggestion: 'For better model performance, consider adding more images (recommended: 50+ per class)'
      });
      qualityScore -= 5;
    }

    if (totalAnnotations < images.length * 2) {
      suggestions.push({
        type: 'info',
        message: 'Low annotation density',
        suggestion: 'Consider adding more annotations per image for better training results'
      });
      qualityScore -= 5;
    }

    // Ensure score doesn't go below 0
    qualityScore = Math.max(0, qualityScore);

    setQualityReport({
      score: qualityScore,
      issues,
      warnings,
      suggestions,
      classDistribution,
      totalAnnotations,
      annotatedImages: Object.keys(annotations).filter(id => annotations[id].length > 0).length
    });
  };

  if (!qualityReport) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <MdInfo className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            Add annotations to see quality analysis
          </span>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-4">
      {/* Quality Score */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Annotation Quality Score
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on {qualityReport.totalAnnotations} annotations across {qualityReport.annotatedImages} images
            </p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(qualityReport.score)}`}>
              {qualityReport.score}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getScoreLabel(qualityReport.score)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-500 ${
              qualityReport.score >= 80
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : qualityReport.score >= 60
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}
            style={{ width: `${qualityReport.score}%` }}
          />
        </div>
      </div>

      {/* Issues */}
      {qualityReport.issues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <MdError className="w-5 h-5" />
            Critical Issues ({qualityReport.issues.length})
          </h4>
          {qualityReport.issues.slice(0, 5).map((issue, idx) => (
            <div
              key={idx}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <MdError className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">
                    {issue.image} {issue.annotation && `- Annotation #${issue.annotation}`}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {issue.message}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    💡 {issue.suggestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {qualityReport.issues.length > 5 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              ... and {qualityReport.issues.length - 5} more issues
            </p>
          )}
        </div>
      )}

      {/* Warnings */}
      {qualityReport.warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
            <MdWarning className="w-5 h-5" />
            Warnings ({qualityReport.warnings.length})
          </h4>
          {qualityReport.warnings.slice(0, 3).map((warning, idx) => (
            <div
              key={idx}
              className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <FiAlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                    {warning.image && `${warning.image}`} {warning.annotation && `- Annotation #${warning.annotation}`}
                    {!warning.image && warning.message}
                  </p>
                  {warning.image && (
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      {warning.message}
                    </p>
                  )}
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    💡 {warning.suggestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {qualityReport.warnings.length > 3 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              ... and {qualityReport.warnings.length - 3} more warnings
            </p>
          )}
        </div>
      )}

      {/* Suggestions */}
      {qualityReport.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <MdInfo className="w-5 h-5" />
            Suggestions ({qualityReport.suggestions.length})
          </h4>
          {qualityReport.suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <MdInfo className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    {suggestion.message}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {suggestion.suggestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Good */}
      {qualityReport.issues.length === 0 && 
       qualityReport.warnings.length === 0 && 
       qualityReport.suggestions.length === 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center gap-3">
            <MdCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                Excellent! No issues detected
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Your dataset annotations look great and are ready for training
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

