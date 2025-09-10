import { NextResponse } from 'next/server';

// Mock training queue - in production, this would be a database
let trainingJobs = new Map();
let trainingQueue = [];
let activeTrainingJobs = new Set();
const MAX_CONCURRENT_JOBS = 2; // Limit concurrent training jobs

// Mock model storage reference
let storedModels = new Map();

// Process training queue
function processTrainingQueue() {
  if (activeTrainingJobs.size >= MAX_CONCURRENT_JOBS) {
    return; // Max concurrent jobs reached
  }

  if (trainingQueue.length === 0) {
    return; // No jobs in queue
  }

  // Get next job from queue
  const queuedJob = trainingQueue.shift();
  const { jobId, classes, images, annotations, modelConfig, datasetInfo } = queuedJob;

  // Start training
  activeTrainingJobs.add(jobId);
  simulateTraining(jobId, modelConfig, datasetInfo);

  // Update job status
  const job = trainingJobs.get(jobId);
  if (job) {
    job.status = 'running';
    job.queuePosition = null;
    job.startedAt = new Date();
  }
}

// Add job to queue or start immediately
function addToTrainingQueue(jobId, classes, images, annotations, modelConfig, datasetInfo) {
  const job = {
    id: jobId,
    status: 'queued',
    progress: 0,
    queuePosition: trainingQueue.length + 1,
    createdAt: new Date(),
    modelConfig,
    datasetInfo,
    classes,
    images,
    annotations
  };

  trainingJobs.set(jobId, job);

  if (activeTrainingJobs.size < MAX_CONCURRENT_JOBS) {
    // Start immediately
    activeTrainingJobs.add(jobId);
    job.status = 'running';
    job.startedAt = new Date();
    simulateTraining(jobId, modelConfig, datasetInfo);
  } else {
    // Add to queue
    trainingQueue.push({ jobId, classes, images, annotations, modelConfig, datasetInfo });
    job.status = 'queued';
    job.estimatedStartTime = new Date(Date.now() + (trainingQueue.length * 5 * 60 * 1000)); // Rough estimate
  }

  return job;
}

// Enhanced dataset validation function
function validateDataset(classes, images, annotations) {
  const errors = [];
  const warnings = [];
  const info = [];

  // Check minimum requirements
  if (classes.length === 0) {
    errors.push('At least one class must be defined');
  }

  if (images.length < 5) {
    errors.push('Minimum 5 images required for training');
  }

  if (images.length < 10) {
    warnings.push('Small dataset detected. Consider adding more images for better training results.');
  }

  if (Object.keys(annotations).length === 0) {
    errors.push('At least one annotation required');
  }

  // Check annotation quality and statistics
  let totalAnnotations = 0;
  const classDistribution = new Array(classes.length).fill(0);
  const imageAnnotationCounts = [];
  const annotationSizes = [];

  Object.entries(annotations).forEach(([imageId, imageAnnotations]) => {
    const count = imageAnnotations.length;
    totalAnnotations += count;
    imageAnnotationCounts.push(count);

    imageAnnotations.forEach(ann => {
      if (ann.classId >= 0 && ann.classId < classes.length) {
        classDistribution[ann.classId]++;

        // Check annotation dimensions (assuming normalized 0-1 coordinates)
        if (ann.width && ann.height) {
          const size = ann.width * ann.height;
          annotationSizes.push(size);

          if (size < 0.0001) {
            warnings.push(`Very small annotation detected in image ${imageId}. Check annotation accuracy.`);
          }
          if (size > 0.5) {
            warnings.push(`Very large annotation detected in image ${imageId}. Check annotation boundaries.`);
          }
        }
      } else {
        warnings.push(`Invalid class ID found in image ${imageId}`);
      }
    });
  });

  // Check for unannotated images
  const annotatedImages = Object.keys(annotations).length;
  const unannotatedImages = images.length - annotatedImages;

  if (unannotatedImages > 0) {
    warnings.push(`${unannotatedImages} images have no annotations and will be excluded from training.`);
  }

  // Check class balance
  const nonZeroClasses = classDistribution.filter(count => count > 0);
  if (nonZeroClasses.length > 0) {
    const minAnnotations = Math.min(...nonZeroClasses);
    const maxAnnotations = Math.max(...nonZeroClasses);

    if (maxAnnotations > 0) {
      const balanceRatio = minAnnotations / maxAnnotations;

      if (balanceRatio < 0.1) {
        warnings.push('Significant class imbalance detected. Consider adding more samples to underrepresented classes.');
      } else if (balanceRatio < 0.3) {
        warnings.push('Moderate class imbalance detected. Training may favor majority classes.');
      }
    }
  }

  // Check annotation density
  const avgAnnotationsPerImage = totalAnnotations / annotatedImages;
  if (avgAnnotationsPerImage < 1) {
    warnings.push('Low annotation density. Consider adding more annotations per image.');
  } else if (avgAnnotationsPerImage > 20) {
    warnings.push('High annotation density detected. Ensure annotations are accurate.');
  }

  // Check for potential data quality issues
  if (imageAnnotationCounts.length > 0) {
    const stdDev = Math.sqrt(
      imageAnnotationCounts.reduce((sum, count) => sum + Math.pow(count - avgAnnotationsPerImage, 2), 0) /
      imageAnnotationCounts.length
    );

    if (stdDev > avgAnnotationsPerImage * 0.5) {
      info.push('High variation in annotation counts per image detected.');
    }
  }

  // Check for classes with no annotations
  const unusedClasses = classDistribution
    .map((count, index) => ({ count, index }))
    .filter(item => item.count === 0)
    .map(item => classes[item.index]);

  if (unusedClasses.length > 0) {
    warnings.push(`Classes with no annotations: ${unusedClasses.join(', ')}`);
  }

  return {
    errors,
    warnings,
    info,
    totalAnnotations,
    classDistribution,
    annotatedImages,
    unannotatedImages,
    avgAnnotationsPerImage: avgAnnotationsPerImage.toFixed(2),
    quality: {
      hasBalancedClasses: nonZeroClasses.length > 1 && Math.min(...nonZeroClasses) / Math.max(...nonZeroClasses) > 0.3,
      hasSufficientAnnotations: avgAnnotationsPerImage >= 1,
      hasMinimumDataset: images.length >= 10,
      annotationQualityScore: Math.min(100, (totalAnnotations / (images.length * 5)) * 100) // Rough quality score
    }
  };
}

// Manual categorization function (uses user-defined categories)
function splitDataset(images, annotations, imageCategories) {
  // Use manual categorization instead of automatic splitting
  const trainImages = images.filter(img => imageCategories[img.id] === 'train');
  const valImages = images.filter(img => imageCategories[img.id] === 'valid');
  const testImages = images.filter(img => imageCategories[img.id] === 'test');

  // Split annotations accordingly
  const trainAnnotations = {};
  const valAnnotations = {};
  const testAnnotations = {};

  trainImages.forEach(img => {
    if (annotations[img.id]) {
      trainAnnotations[img.id] = annotations[img.id];
    }
  });

  valImages.forEach(img => {
    if (annotations[img.id]) {
      valAnnotations[img.id] = annotations[img.id];
    }
  });

  testImages.forEach(img => {
    if (annotations[img.id]) {
      testAnnotations[img.id] = annotations[img.id];
    }
  });

  // Calculate annotation statistics for each split
  const getAnnotationStats = (splitAnnotations) => {
    const total = Object.values(splitAnnotations).flat().length;
    const perImage = total / Object.keys(splitAnnotations).length || 0;
    return { total, perImage };
  };

  return {
    train: {
      images: trainImages,
      annotations: trainAnnotations,
      stats: getAnnotationStats(trainAnnotations)
    },
    val: {
      images: valImages,
      annotations: valAnnotations,
      stats: getAnnotationStats(valAnnotations)
    },
    test: {
      images: testImages,
      annotations: testAnnotations,
      stats: getAnnotationStats(testAnnotations)
    }
  };
}

// Enhanced realistic training simulation
async function simulateTraining(jobId, modelConfig, datasetInfo) {
  const { modelType, epochs, batchSize, learningRate } = modelConfig;
  const totalSteps = epochs * Math.ceil(datasetInfo.train.images.length / batchSize);

  // Estimate realistic training time (10-30 minutes based on dataset size and model complexity)
  const baseTrainingTime = Math.max(600000, Math.min(1800000, datasetInfo.train.images.length * epochs * 2000)); // 10-30 minutes
  const modelComplexityMultiplier = modelType.includes('x') ? 1.5 : modelType.includes('l') ? 1.3 : modelType.includes('m') ? 1.1 : 0.8;

  trainingJobs.set(jobId, {
    id: jobId,
    status: 'running',
    progress: 0,
    currentEpoch: 0,
    totalEpochs: epochs,
    logs: ['🚀 Initializing YOLO training environment...'],
    startTime: new Date(),
    estimatedTimeRemaining: baseTrainingTime * modelComplexityMultiplier,
    modelConfig,
    datasetInfo
  });

  // Phase 1: Environment Setup (2-5 minutes)
  const job = trainingJobs.get(jobId);
  job.logs.push('📦 Setting up training environment...');
  job.logs.push(`🔧 Loading ${modelType.toUpperCase()} model weights...`);
  job.logs.push('📊 Preparing dataset for training...');

  const phases = [
    { name: 'Environment Setup', duration: 30000, steps: 5 }, // 30 seconds
    { name: 'Data Loading', duration: 45000, steps: 8 }, // 45 seconds
    { name: 'Model Initialization', duration: 60000, steps: 6 }, // 1 minute
    { name: 'Training Preparation', duration: 30000, steps: 4 } // 30 seconds
  ];

  for (const phase of phases) {
    for (let i = 1; i <= phase.steps; i++) {
      await new Promise(resolve => setTimeout(resolve, phase.duration / phase.steps));
      job.logs.push(`⚡ ${phase.name}: ${i}/${phase.steps} complete`);
    }
  }

  job.logs.push('✅ Training environment ready!');
  job.logs.push(`🎯 Dataset Overview:`);
  job.logs.push(`   📊 Total Images: ${datasetInfo.images}`);
  job.logs.push(`   📝 Total Annotations: ${datasetInfo.totalAnnotations}`);
  job.logs.push(`   🏷️  Classes: ${datasetInfo.classDistribution.length}`);
  job.logs.push(`   📈 Avg annotations per image: ${datasetInfo.avgAnnotationsPerImage}`);
  job.logs.push(`📂 Dataset Split:`);
  job.logs.push(`   🟢 Training: ${datasetInfo.split.train.images} images (${datasetInfo.split.train.annotations} annotations)`);
  job.logs.push(`   🔵 Validation: ${datasetInfo.split.val.images} images (${datasetInfo.split.val.annotations} annotations)`);
  job.logs.push(`   🟣 Testing: ${datasetInfo.split.test.images} images (${datasetInfo.split.test.annotations} annotations)`);
  job.logs.push(`🚀 Starting training for ${epochs} epochs with batch size ${batchSize}...`);

  // Phase 2: Actual Training (main bulk of time)
  const trainingStartTime = Date.now();
  const targetTrainingTime = baseTrainingTime * modelComplexityMultiplier * 0.8; // 80% of estimated time for training

  for (let epoch = 1; epoch <= epochs; epoch++) {
    const epochStartTime = Date.now();
    job.currentEpoch = epoch;

    job.logs.push(`🔥 Epoch ${epoch}/${epochs} - Starting training...`);
    job.logs.push(`📊 Learning rate: ${learningRate}`);

    // Simulate epoch training with realistic time
    const stepsInEpoch = Math.ceil(datasetInfo.train.images.length / batchSize);
    const epochTimePerStep = targetTrainingTime / (epochs * stepsInEpoch);

    for (let step = 1; step <= stepsInEpoch; step++) {
      await new Promise(resolve => setTimeout(resolve, Math.max(1000, epochTimePerStep))); // Minimum 1 second per step

      const progress = ((epoch - 1) * stepsInEpoch + step) / totalSteps;
      job.progress = Math.round(progress * 90); // Reserve 10% for final validation

      // Log training metrics
      if (step % Math.max(1, Math.floor(stepsInEpoch / 10)) === 0 || step === stepsInEpoch) {
        const loss = Math.max(0.1, 3.0 - (epoch / epochs) * 2.5 + Math.random() * 0.3);
        const lr = learningRate * Math.pow(0.95, epoch - 1);
        job.logs.push(`📈 Epoch ${epoch}/${epochs}, Step ${step}/${stepsInEpoch} - Loss: ${loss.toFixed(4)}, LR: ${lr.toExponential(2)}`);
      }
    }

    const epochTime = Date.now() - epochStartTime;
    job.logs.push(`✅ Epoch ${epoch}/${epochs} completed in ${(epochTime / 1000).toFixed(1)}s`);

    // Validation phase (shorter than training)
    if (epoch % 5 === 0 || epoch === epochs) {
      job.logs.push(`🔍 Running validation on ${datasetInfo.split.val.images} validation images...`);
      await new Promise(resolve => setTimeout(resolve, Math.max(5000, epochTimePerStep * 3))); // Validation takes time too

      const valLoss = Math.max(0.15, 2.5 - (epoch / epochs) * 2.0 + Math.random() * 0.2);
      job.logs.push(`📊 Validation Loss: ${valLoss.toFixed(4)}`);
    }

    // Update time remaining estimate
    const elapsed = Date.now() - trainingStartTime;
    const avgEpochTime = elapsed / epoch;
    job.estimatedTimeRemaining = avgEpochTime * (epochs - epoch) + 120000; // Add 2 minutes for final processing
  }

  // Training completed
  // job is already declared above
  job.status = 'completed';
  job.progress = 100;
  job.logs.push('Training completed successfully!');
  job.logs.push('Running validation on test set...');

  // Simulate test set evaluation
  await new Promise(resolve => setTimeout(resolve, 1500));
  job.logs.push('Test set evaluation complete!');

  job.logs.push('Final model validation...');

  // Simulate final validation
  await new Promise(resolve => setTimeout(resolve, 1000));
  job.logs.push('Model validation complete!');

  // Generate comprehensive mock metrics based on dataset quality and model config
  const baseAccuracy = 0.85 + Math.random() * 0.1;
  const datasetQuality = datasetInfo.totalAnnotations / (datasetInfo.images.length * 5); // Normalize by expected annotations

  // Generate class-wise metrics
  const classMetrics = (job.datasetInfo.classes || []).map((className, index) => ({
    className,
    precision: Math.min(0.95, baseAccuracy * (0.85 + Math.random() * 0.15)),
    recall: Math.min(0.92, baseAccuracy * (0.82 + Math.random() * 0.15)),
    f1Score: 0,
    ap: Math.min(0.94, baseAccuracy * (0.83 + Math.random() * 0.15))
  }));

  // Calculate F1 scores
  classMetrics.forEach(metric => {
    metric.f1Score = 2 * (metric.precision * metric.recall) / (metric.precision + metric.recall);
  });

  // Overall metrics
  const avgPrecision = classMetrics.reduce((sum, m) => sum + m.precision, 0) / classMetrics.length;
  const avgRecall = classMetrics.reduce((sum, m) => sum + m.recall, 0) / classMetrics.length;
  const avgF1 = classMetrics.reduce((sum, m) => sum + m.f1Score, 0) / classMetrics.length;
  const avgAP = classMetrics.reduce((sum, m) => sum + m.ap, 0) / classMetrics.length;

  job.metrics = {
    // Overall metrics
    mAP50: Math.min(0.95, avgAP * (0.9 + datasetQuality * 0.2)),
    mAP50_95: Math.min(0.90, avgAP * 0.85 * (0.9 + datasetQuality * 0.2)),
    precision: Math.min(0.92, avgPrecision * (0.95 + datasetQuality * 0.1)),
    recall: Math.min(0.88, avgRecall * (0.92 + datasetQuality * 0.1)),
    f1Score: Math.min(0.90, avgF1 * (0.93 + datasetQuality * 0.1)),

    // Training metrics
    finalLoss: 0.08 + Math.random() * 0.15,
    trainingLoss: 0.15 + Math.random() * 0.2,
    validationLoss: 0.12 + Math.random() * 0.18,

    // Test set metrics (usually slightly lower than validation)
    test_mAP50: Math.min(0.93, avgAP * (0.85 + datasetQuality * 0.18)),
    test_mAP50_95: Math.min(0.88, avgAP * 0.8 * (0.85 + datasetQuality * 0.18)),
    test_precision: Math.min(0.90, avgPrecision * (0.9 + datasetQuality * 0.08)),
    test_recall: Math.min(0.86, avgRecall * (0.88 + datasetQuality * 0.08)),

    // Class-wise metrics
    classMetrics,

    // Training metadata
    trainingTime: Date.now() - job.startTime,
    epochsCompleted: modelConfig.epochs,
    bestEpoch: Math.floor(modelConfig.epochs * 0.8) + Math.floor(Math.random() * (modelConfig.epochs * 0.2)),

    // Dataset statistics
    datasetStats: {
      totalImages: datasetInfo.images,
      annotatedImages: datasetInfo.annotatedImages,
      totalAnnotations: datasetInfo.totalAnnotations,
      avgAnnotationsPerImage: datasetInfo.avgAnnotationsPerImage,
      classDistribution: datasetInfo.classDistribution
    }
  };

  job.logs.push(`Final Results:`);
  job.logs.push(`  - mAP@50: ${(job.metrics.mAP50 * 100).toFixed(1)}%`);
  job.logs.push(`  - mAP@50:95: ${(job.metrics.mAP50_95 * 100).toFixed(1)}%`);
  job.logs.push(`  - Precision: ${(job.metrics.precision * 100).toFixed(1)}%`);
  job.logs.push(`  - Recall: ${(job.metrics.recall * 100).toFixed(1)}%`);
  job.logs.push(`  - F1-Score: ${(job.metrics.f1Score * 100).toFixed(1)}%`);
  job.logs.push(`Test Set Performance:`);
  job.logs.push(`  - Test mAP@50: ${(job.metrics.test_mAP50 * 100).toFixed(1)}%`);
  job.logs.push(`  - Test Precision: ${(job.metrics.test_precision * 100).toFixed(1)}%`);
  job.logs.push(`  - Test Recall: ${(job.metrics.test_recall * 100).toFixed(1)}%`);

  // Store the trained model
  const modelId = `model_${jobId}_${Date.now()}`;
  storedModels.set(modelId, {
    id: modelId,
    jobId,
    modelConfig,
    metrics: job.metrics,
    classes: job.datasetInfo.classes || [],
    datasetInfo: job.datasetInfo,
    modelData: {
      weights: {
        backbone: 'trained_backbone_weights',
        neck: 'trained_neck_weights',
        head: 'trained_head_weights',
        size: '~50MB'
      },
      config: modelConfig,
      metadata: {
        trainedAt: new Date().toISOString(),
        trainingTime: job.metrics.trainingTime,
        dataset: job.datasetInfo
      },
      metrics: job.metrics,
      downloadUrl: `/api/models/download/${modelId}`
    },
    createdAt: new Date().toISOString(),
    status: 'ready'
  });

  job.modelId = modelId;
  job.logs.push(`Model saved with ID: ${modelId}`);
  job.completedAt = new Date();

  // Remove from active jobs and process queue
  activeTrainingJobs.delete(jobId);
  setTimeout(processTrainingQueue, 1000); // Process queue after a short delay
}

export async function POST(request) {
  try {
    const { classes, images, annotations, modelConfig, imageCategories } = await request.json();

    // Validate dataset
    const validation = validateDataset(classes, images, annotations);

    if (validation.errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
        info: validation.info
      }, { status: 400 });
    }

    // Split dataset using manual categorization
    const datasetSplit = splitDataset(images, annotations, imageCategories || {});

    // Generate unique job ID
    const jobId = `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Enhanced dataset info
    const datasetInfo = {
      images: images.length,
      annotatedImages: validation.annotatedImages,
      unannotatedImages: validation.unannotatedImages,
      totalAnnotations: validation.totalAnnotations,
      avgAnnotationsPerImage: validation.avgAnnotationsPerImage,
      classDistribution: validation.classDistribution,
      quality: validation.quality,
      split: {
        train: {
          images: datasetSplit.train.images.length,
          annotations: datasetSplit.train.stats.total,
          avgPerImage: datasetSplit.train.stats.perImage.toFixed(2)
        },
        val: {
          images: datasetSplit.val.images.length,
          annotations: datasetSplit.val.stats.total,
          avgPerImage: datasetSplit.val.stats.perImage.toFixed(2)
        },
        test: {
          images: datasetSplit.test.images.length,
          annotations: datasetSplit.test.stats.total,
          avgPerImage: datasetSplit.test.stats.perImage.toFixed(2)
        }
      }
    };

    // Add to training queue
    const job = addToTrainingQueue(jobId, classes, images, annotations, modelConfig, datasetInfo);

    return NextResponse.json({
      success: true,
      jobId,
      message: job.status === 'running' ? 'Training started successfully' : `Training queued (position ${job.queuePosition})`,
      status: job.status,
      queuePosition: job.queuePosition,
      estimatedStartTime: job.estimatedStartTime,
      validation: {
        warnings: validation.warnings,
        info: validation.info,
        quality: validation.quality
      },
      datasetInfo
    });

  } catch (error) {
    console.error('Training API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to start training'
    }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const action = searchParams.get('action');

  // Get queue status
  if (action === 'queue') {
    const queueStatus = {
      activeJobs: activeTrainingJobs.size,
      maxConcurrentJobs: MAX_CONCURRENT_JOBS,
      queuedJobs: trainingQueue.length,
      totalJobs: trainingJobs.size
    };

    const allJobs = Array.from(trainingJobs.values()).map(job => ({
      id: job.id,
      status: job.status,
      progress: job.progress,
      queuePosition: job.queuePosition,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      estimatedStartTime: job.estimatedStartTime,
      completedAt: job.completedAt,
      modelType: job.modelConfig?.modelType
    }));

    return NextResponse.json({
      success: true,
      queueStatus,
      jobs: allJobs
    });
  }

  if (!jobId) {
    return NextResponse.json({
      success: false,
      error: 'Job ID required'
    }, { status: 400 });
  }

  const job = trainingJobs.get(jobId);

  if (!job) {
    return NextResponse.json({
      success: false,
      error: 'Training job not found'
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      progress: job.progress,
      currentEpoch: job.currentEpoch,
      totalEpochs: job.totalEpochs,
      logs: job.logs.slice(-20), // Last 20 logs
      estimatedTimeRemaining: job.estimatedTimeRemaining,
      metrics: job.metrics,
      modelId: job.modelId,
      queuePosition: job.queuePosition,
      estimatedStartTime: job.estimatedStartTime,
      startTime: job.startTime || job.startedAt,
      completedAt: job.completedAt
    }
  });
}
