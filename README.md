# YOLO Generator Platform

A complete ML training and inference platform for YOLO object detection models.

## 🚀 Features

- **Modern Dashboard**: Beautiful dark theme with violet accents using shadcn/ui components
- **Object Detection**: Upload images and run real-time inference with YOLO models
- **Model Training**: Train custom YOLO models on your datasets with full hyperparameter control
- **Model Management**: Download, manage, and deploy trained models
- **FastAPI Backend**: High-performance Python backend with strict ML integration
- **Real-time Updates**: Monitor training progress and inference results in real-time

## 🛠️ Tech Stack

### Frontend
- Next.js 14
- Tailwind CSS
- shadcn/ui components
- React Icons

### Backend
- Python 3.8+
- FastAPI
- Ultralytics YOLO (YOLOv8)
- PyTorch
- OpenCV

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- pip

### Quick Start

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd yoloGenerator
\`\`\`

2. Run the startup script:
\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

This will:
- Set up Python virtual environment
- Install backend dependencies
- Install frontend dependencies
- Start both servers

### Manual Setup

#### Backend Setup
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python main.py
\`\`\`

The backend will run on `http://localhost:8000`

#### Frontend Setup
\`\`\`bash
cd yologen
npm install
npm run dev
\`\`\`

The frontend will run on `http://localhost:3000`

## 📖 Usage

### Inference
1. Navigate to the "Inference" tab
2. Upload an image (PNG, JPG)
3. Select a YOLO model variant
4. Adjust confidence threshold
5. Click "Run Detection"

### Training
1. Navigate to the "Training" tab
2. Upload a dataset YAML configuration file
3. Configure training parameters:
   - Base model
   - Number of epochs
   - Batch size
   - Image size
4. Click "Start Training"
5. Monitor progress in the Training Jobs section

### Model Management
1. Navigate to the "Models" tab
2. View all trained models
3. Download models for deployment
4. Delete unused models

## 🎨 Theme

The platform features a sleek dark theme with violet accents:
- Background: Pure black (#000000)
- Primary: Violet (#a78bfa)
- Accent: Light violet
- All components use shadcn/ui for consistency

## 📁 Project Structure

\`\`\`
yoloGenerator/
├── backend/
│   ├── app/
│   │   └── routes/
│   │       ├── inference.py
│   │       ├── training.py
│   │       └── models.py
│   ├── models/
│   │   ├── inference.py
│   │   └── trainer.py
│   ├── main.py
│   └── requirements.txt
├── yologen/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js
│   │   │   ├── layout.js
│   │   │   └── globals.css
│   │   └── components/
│   │       ├── DashboardStats.js
│   │       ├── InferenceTab.js
│   │       ├── TrainingTab.js
│   │       └── ModelsTab.js
│   ├── package.json
│   └── tailwind.config.js
└── start.sh
\`\`\`

## 🔧 API Endpoints

### Inference
- `POST /api/inference/predict` - Run inference on single image
- `POST /api/inference/predict-batch` - Batch inference
- `GET /api/inference/models` - List available models

### Training
- `POST /api/training/start` - Start training job
- `GET /api/training/status/{job_id}` - Get training status
- `GET /api/training/jobs` - List all training jobs
- `DELETE /api/training/job/{job_id}` - Delete training job

### Models
- `GET /api/models/list` - List trained models
- `GET /api/models/download/{model_name}` - Download model
- `DELETE /api/models/delete/{model_name}` - Delete model
- `GET /api/models/info/{model_name}` - Get model info

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Ultralytics for YOLOv8
- shadcn/ui for beautiful components
- FastAPI for the backend framework
