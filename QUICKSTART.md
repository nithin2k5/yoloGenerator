# 🚀 Quick Setup Guide

## Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- pip

## Setup Steps

### 1. Backend Setup (Python + FastAPI)

```bash
cd backend
./setup.sh
```

This will:
- Create a Python virtual environment
- Install all required dependencies (FastAPI, YOLO, PyTorch, etc.)

### 2. Start Backend Server

```bash
./run_backend.sh
```

Backend will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs

### 3. Frontend Setup (Next.js)

```bash
cd yologen
npm install
```

### 4. Start Frontend Server

```bash
npm run dev
```

Frontend will be available at:
- http://localhost:3000 (or 3001 if 3000 is busy)

## 🎨 Features

### Dashboard
- Overview of ML operations
- Recent activity tracking
- Quick access to all features

### Inference
- Upload images for object detection
- Select from multiple YOLO models (nano to xlarge)
- Adjust confidence threshold
- View detailed detection results

### Training
- Upload dataset YAML configuration
- Configure hyperparameters:
  - Epochs (1-500)
  - Batch size (8, 16, 32, 64)
  - Image size (320, 640, 1280)
  - Base model selection
- Monitor training progress
- Track multiple training jobs

### Models
- View all trained models
- Download models
- Delete unused models
- See model metadata

## 📁 Dataset Format

Create a dataset YAML file (`data.yaml`):

```yaml
path: ./datasets/custom
train: images/train
val: images/val

names:
  0: class1
  1: class2
  2: class3

nc: 3
```

Directory structure:
```
datasets/custom/
├── images/
│   ├── train/
│   │   ├── image1.jpg
│   │   └── image2.jpg
│   └── val/
│       ├── image3.jpg
│       └── image4.jpg
└── labels/
    ├── train/
    │   ├── image1.txt
    │   └── image2.txt
    └── val/
        ├── image3.txt
        └── image4.txt
```

Label format (one line per object):
```
class_id center_x center_y width height
```
All values normalized to 0-1.

## 🎨 Theme Customization

The project uses a violet theme with black background. Colors are defined in `yologen/src/app/globals.css`:

- Background: `#000000` (pure black)
- Primary: Violet (`hsl(270, 95%, 65%)`)
- Accent: Light violet
- All components use shadcn/ui

## 🔧 API Endpoints

### Inference
- `POST /api/inference/predict` - Single image inference
- `POST /api/inference/predict-batch` - Batch inference
- `GET /api/inference/models` - List available models

### Training
- `POST /api/training/start` - Start training
- `GET /api/training/status/{job_id}` - Get status
- `GET /api/training/jobs` - List all jobs

### Models
- `GET /api/models/list` - List models
- `GET /api/models/download/{name}` - Download model
- `DELETE /api/models/delete/{name}` - Delete model

## 🐛 Troubleshooting

### Backend Issues
- **Module not found**: Run `./setup.sh` again
- **Port 8000 in use**: Kill the process or change port in `main.py`

### Frontend Issues
- **Port 3000 in use**: Next.js will automatically use 3001
- **Components not found**: Run `npm install` again
- **API connection failed**: Ensure backend is running on port 8000

### YOLO Model Downloads
First time running inference will download the selected YOLO model (~6-200MB depending on size).

## 📝 Notes

- The platform uses YOLOv8 from Ultralytics
- Training runs are saved in `backend/runs/detect/`
- Uploaded files are temporarily stored and cleaned up after processing
- Use GPU if available for faster training/inference

## 🎯 Next Steps

1. Upload test images to try inference
2. Prepare your dataset for training
3. Train a custom model
4. Deploy trained models for inference

Enjoy using YOLO Generator! 🎉

