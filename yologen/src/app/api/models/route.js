import { NextResponse } from 'next/server';

// Mock model storage - in production, this would be a database or cloud storage
let storedModels = new Map();

// Generate mock model weights (in production, this would be actual model data)
function generateMockModelData(modelConfig, metrics, classes) {
  return {
    weights: {
      // Mock weight data structure
      backbone: 'mock_backbone_weights',
      neck: 'mock_neck_weights',
      head: 'mock_head_weights',
      size: '~50MB'
    },
    config: {
      modelType: modelConfig.modelType,
      epochs: modelConfig.epochs,
      batchSize: modelConfig.batchSize,
      learningRate: modelConfig.learningRate,
      imageSize: modelConfig.imageSize,
      classes: classes,
      numClasses: classes.length
    },
    metadata: {
      trainedAt: new Date().toISOString(),
      trainingTime: metrics.trainingTime || 0,
      dataset: {
        numClasses: classes.length,
        classNames: classes
      }
    },
    metrics: metrics,
    downloadUrl: `/api/models/download/${modelConfig.modelType}_${Date.now()}`
  };
}

export async function POST(request) {
  try {
    const { jobId, modelConfig, metrics, classes, datasetInfo } = await request.json();

    if (!jobId || !modelConfig || !metrics || !classes) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: jobId, modelConfig, metrics, classes'
      }, { status: 400 });
    }

    // Generate unique model ID
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate mock model data
    const modelData = generateMockModelData(modelConfig, metrics, classes);

    // Store model
    const model = {
      id: modelId,
      jobId,
      modelConfig,
      metrics,
      classes,
      datasetInfo,
      modelData,
      createdAt: new Date().toISOString(),
      status: 'ready'
    };

    storedModels.set(modelId, model);

    return NextResponse.json({
      success: true,
      modelId,
      model,
      message: 'Model stored successfully'
    });

  } catch (error) {
    console.error('Model storage error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to store model'
    }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get('modelId');

  if (modelId) {
    // Get specific model
    const model = storedModels.get(modelId);

    if (!model) {
      return NextResponse.json({
        success: false,
        error: 'Model not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      model
    });
  } else {
    // Get all models
    const models = Array.from(storedModels.values()).map(model => ({
      id: model.id,
      jobId: model.jobId,
      modelType: model.modelConfig.modelType,
      metrics: model.metrics,
      classes: model.classes.length,
      createdAt: model.createdAt,
      status: model.status
    }));

    return NextResponse.json({
      success: true,
      models,
      total: models.length
    });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get('modelId');

  if (!modelId) {
    return NextResponse.json({
      success: false,
      error: 'Model ID required'
    }, { status: 400 });
  }

  if (!storedModels.has(modelId)) {
    return NextResponse.json({
      success: false,
      error: 'Model not found'
    }, { status: 404 });
  }

  storedModels.delete(modelId);

  return NextResponse.json({
    success: true,
    message: 'Model deleted successfully'
  });
}
