# 📁 Project Structure

```
yoloGenerator/
├── backend/                          # Python FastAPI Backend
│   ├── app/                         # Application logic
│   │   ├── __init__.py
│   │   └── routes/                  # API route handlers
│   │       ├── inference.py         # Inference endpoints
│   │       ├── training.py          # Training endpoints
│   │       └── models.py            # Model management endpoints
│   │
│   ├── models/                      # ML model classes
│   │   ├── __init__.py
│   │   ├── inference.py             # YOLO inference handler
│   │   └── trainer.py               # YOLO training handler
│   │
│   ├── utils/                       # Utility functions
│   │   └── __init__.py
│   │
│   ├── main.py                      # FastAPI application entry
│   ├── requirements.txt             # Python dependencies
│   ├── setup.sh                     # Backend setup script
│   ├── run_backend.sh              # Backend run script
│   └── dataset_example.yaml        # Example dataset config
│
├── yologen/                         # Next.js Frontend
│   ├── src/
│   │   ├── app/                     # Next.js app directory
│   │   │   ├── page.js             # Main dashboard page
│   │   │   ├── layout.js           # Root layout
│   │   │   └── globals.css         # Global styles (violet theme)
│   │   │
│   │   ├── components/              # React components
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   │   ├── button.jsx
│   │   │   │   ├── card.jsx
│   │   │   │   ├── input.jsx
│   │   │   │   ├── label.jsx
│   │   │   │   ├── select.jsx
│   │   │   │   ├── tabs.jsx
│   │   │   │   ├── badge.jsx
│   │   │   │   ├── progress.jsx
│   │   │   │   ├── dialog.jsx
│   │   │   │   └── dropdown-menu.jsx
│   │   │   │
│   │   │   ├── DashboardStats.js   # Dashboard statistics
│   │   │   ├── InferenceTab.js     # Inference interface
│   │   │   ├── TrainingTab.js      # Training interface
│   │   │   └── ModelsTab.js        # Model management
│   │   │
│   │   └── lib/
│   │       └── utils.js            # Utility functions
│   │
│   ├── public/                      # Static assets
│   ├── package.json                 # Node dependencies
│   ├── tailwind.config.js          # Tailwind configuration
│   ├── postcss.config.js           # PostCSS configuration
│   ├── next.config.mjs             # Next.js configuration
│   └── jsconfig.json               # JavaScript config
│
├── .gitignore                       # Git ignore rules
├── README.md                        # Main documentation
├── QUICKSTART.md                    # Quick setup guide
├── STRUCTURE.md                     # This file
├── start.sh                         # Full stack startup script
└── LICENSE                          # License file

## 🎯 Component Responsibilities

### Backend

#### `main.py`
- FastAPI application initialization
- CORS middleware configuration
- Route registration
- Server startup

#### `app/routes/inference.py`
- Image upload handling
- YOLO model inference
- Batch processing
- Model listing

#### `app/routes/training.py`
- Training job management
- Background task processing
- Progress tracking
- Job status monitoring

#### `app/routes/models.py`
- Trained model listing
- Model download
- Model deletion
- Model metadata

#### `models/inference.py`
- YOLOInference class
- Single image prediction
- Batch prediction
- Result formatting

#### `models/trainer.py`
- YOLOTrainer class
- Training execution
- Validation
- Model export

### Frontend

#### `src/app/page.js`
- Main dashboard layout
- Tab navigation
- Header and footer
- Component orchestration

#### `src/components/DashboardStats.js`
- Statistics display
- Activity feed
- Quick action cards

#### `src/components/InferenceTab.js`
- Image upload interface
- Model selection
- Detection results display
- API integration

#### `src/components/TrainingTab.js`
- Training configuration
- Job management
- Progress monitoring
- Status tracking

#### `src/components/ModelsTab.js`
- Model listing
- Download functionality
- Model deletion
- Metadata display

## 🎨 Styling

### Theme Colors
- **Background**: Pure black (#000000)
- **Primary**: Violet (hsl(270, 95%, 65%))
- **Accent**: Light violet
- **Border**: Violet with low opacity
- **Text**: Light purple/white

### Component Library
- **shadcn/ui**: Pre-built accessible components
- **Tailwind CSS**: Utility-first styling
- **React Icons**: Icon library

## 🔌 API Integration

Frontend components connect to backend via fetch API:
- Base URL: `http://localhost:8000`
- FormData for file uploads
- JSON for configuration
- Real-time status polling

## 📦 Dependencies

### Backend (Python)
- fastapi: Web framework
- uvicorn: ASGI server
- ultralytics: YOLO implementation
- torch/torchvision: Deep learning
- opencv-python: Image processing
- pydantic: Data validation

### Frontend (JavaScript)
- next: React framework
- react/react-dom: UI library
- @radix-ui/*: Component primitives
- tailwindcss: Styling
- react-icons: Icons

## 🚀 Build & Deploy

### Development
```bash
# Backend
cd backend && ./run_backend.sh

# Frontend
cd yologen && npm run dev
```

### Production
```bash
# Backend
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd yologen
npm run build
npm start
```

## 📝 Configuration Files

- `tailwind.config.js`: Theme colors, plugins
- `next.config.mjs`: Next.js settings
- `components.json`: shadcn/ui config
- `requirements.txt`: Python packages
- `dataset_example.yaml`: Training data format

