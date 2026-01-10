# 📊 Complete Dataset Workflow Guide

## Overview

The YOLO Generator platform provides a complete end-to-end pipeline for creating, annotating, and training custom object detection models. This guide walks you through every step.

---

## 🎯 The 5-Step Pipeline

### **Step 1: Create Dataset** ✓

**What it does**: Initialize a new dataset with your custom classes

**How to do it**:
1. Go to **Datasets** tab
2. Click **"New Dataset"** button
3. Fill in:
   - **Dataset Name**: e.g., "Vehicle Detection"
   - **Description**: Optional description
   - **Classes**: Comma-separated list (e.g., "car, truck, bus, motorcycle")
4. Click **"Create Dataset"**

**Result**: Empty dataset created with your defined classes

---

### **Step 2: Upload Images** 📤

**What it does**: Add training images to your dataset

**How to do it**:

**Option A - From Dataset Card**:
1. Find your dataset in the grid
2. Click **"View Pipeline"** button
3. Click **"Upload"** in Step 2
4. Select multiple images

**Option B - From Annotation Tool**:
1. Click **"Annotate"** on your dataset
2. Click **"Add More Images"**
3. Select your images

**Requirements**:
- Supported formats: JPG, PNG
- Recommended: 100+ images for good training
- Images should contain your target objects

**Result**: Images uploaded and ready for annotation

---

### **Step 3: Annotate Images** ✏️

**What it does**: Draw bounding boxes around objects in your images

**How to do it**:
1. Click **"Annotate"** on your dataset card
2. **OR** Click "View Pipeline" → Click "Annotate" button
3. In the annotation tool:
   - Select a class from dropdown
   - Click and drag on image to draw bounding box
   - Box automatically labeled with class name
   - Repeat for all objects in the image
4. Click **"Save & Next"** to move to next image
5. Continue until all images are annotated

**Tips**:
- Draw tight boxes around objects
- Include all instances of objects
- Use consistent labeling
- Check progress in the workflow view

**Result**: All images annotated with labeled bounding boxes

---

### **Step 4: Export Dataset** 📦

**What it does**: Convert annotations to YOLO format with train/val split

**How to do it**:
1. Click **"View Pipeline"** on your dataset
2. Once all images are annotated (100% complete)
3. Click **"Export"** button in Step 4
4. System automatically:
   - Splits data (80% train, 20% validation)
   - Converts to YOLO format (.txt files)
   - Generates `data.yaml` configuration
   - Creates ZIP archive

**What you get**:
```
dataset_export.zip
├── data.yaml           # Dataset configuration
├── train/
│   ├── images/         # Training images
│   └── labels/         # Training labels (.txt)
└── val/
    ├── images/         # Validation images
    └── labels/         # Validation labels (.txt)
```

**Result**: Dataset ready for training in YOLO format

---

### **Step 5: Train Model** 🚀

**What it does**: Train a custom YOLO model on your dataset

**How to do it**:

**Option A - Quick Train (From Pipeline)**:
1. After exporting, you'll see **"Complete Pipeline - Start Training Now"** button
2. Click it
3. System uses default settings:
   - Model: YOLOv8 Nano
   - Epochs: 50
   - Batch Size: 16
   - Image Size: 640

**Option B - Custom Train (From Training Tab)**:
1. Go to **Training** tab
2. Upload your exported `data.yaml`
3. Configure custom parameters:
   - Choose base model (nano/small/medium/large/xlarge)
   - Set epochs (1-500)
   - Set batch size (8/16/32/64)
   - Set image size (320/640/1280)
4. Click **"Start Training"**

**Option C - Direct from Dataset**:
1. In Datasets tab, click **"Train"** on any exported dataset
2. System auto-exports and starts training

**Result**: Training job starts, monitor in Training tab

---

## 📈 Monitoring Progress

### In the Workflow View

The **"View Pipeline"** button shows you:
- ✓ **Green checkmarks**: Completed steps
- **Current number**: Step you're on
- **Pending badge**: Steps not yet started
- **Progress bar**: Overall completion percentage
- **Stats**: X of Y images annotated

### Progress Indicators

- **0-20%**: Dataset created
- **20-40%**: Images uploaded
- **40-60%**: Annotation in progress
- **60-80%**: Ready to export
- **80-100%**: Exported and ready to train

---

## 🎓 Complete Workflow Example

### Scenario: Training a Custom Car Detector

```
1. CREATE DATASET
   Name: "Car Types Detector"
   Classes: sedan, suv, truck, van
   ✓ Created

2. UPLOAD IMAGES
   Uploaded: 200 images
   - 50 images of sedans
   - 50 images of SUVs
   - 50 images of trucks
   - 50 images of vans
   ✓ All uploaded

3. ANNOTATE
   Progress: 200/200 images (100%)
   Total boxes: 347 objects labeled
   - sedan: 98 boxes
   - suv: 87 boxes
   - truck: 82 boxes
   - van: 80 boxes
   ✓ All annotated

4. EXPORT
   Generated:
   - Train set: 160 images
   - Val set: 40 images
   - data.yaml created
   ✓ Exported successfully

5. TRAIN
   Configuration:
   - Model: YOLOv8 Small
   - Epochs: 100
   - Batch: 16
   - Image size: 640
   Status: Training... (Job ID: abc123)
   ✓ Training started

6. RESULT
   After ~2 hours training completes
   Model saved to: runs/detect/abc123/weights/best.pt
   Metrics: mAP 0.89
   ✓ Model ready for inference!
```

---

## ⚡ Quick Actions

### From Dataset Card:
- **View Pipeline**: See complete workflow status
- **Annotate**: Jump to annotation tool
- **Train**: Quick start training
- **Export**: Generate YOLO format
- **Download**: Get ZIP file
- **Delete**: Remove dataset

### From Workflow View:
- **Upload**: Add more images (Step 2)
- **Annotate**: Label images (Step 3)
- **Export**: Convert format (Step 4)
- **Start Training**: Complete pipeline (Step 5)

---

## 🔍 Checking Your Progress

### Via Settings Tab
1. Go to **Settings** tab
2. See backend status
3. Check API endpoint health
4. Verify system is operational

### Via Training Tab
1. Monitor active training jobs
2. See progress percentage
3. Check job status (pending/running/completed/failed)

### Via Models Tab
1. See completed training runs
2. Download trained models
3. View model metadata

---

## 💡 Pro Tips

### For Best Results:

1. **Image Quality**
   - Use high-resolution images
   - Ensure good lighting
   - Include variety of angles

2. **Annotation**
   - Draw tight, accurate boxes
   - Label all objects consistently
   - Include difficult cases

3. **Dataset Size**
   - Minimum: 50 images per class
   - Good: 200+ images per class
   - Excellent: 1000+ images per class

4. **Training**
   - Start with nano model for speed
   - Use more epochs for better accuracy
   - Monitor validation metrics

---

## 🚨 Troubleshooting

### "Backend not running"
```bash
cd backend
./run_backend.sh
```

### "Upload failed"
- Check file format (JPG/PNG only)
- Ensure files aren't corrupted
- Try smaller batches

### "Training won't start"
- Ensure dataset is exported
- Check backend is running
- Verify YAML format is correct

### "No detections showing"
- Check model is loaded
- Adjust confidence threshold
- Verify image format

---

## 📚 Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **Frontend**: http://localhost:3001
- **YOLO Docs**: https://docs.ultralytics.com

---

## ✅ Checklist

Before starting training, ensure:
- [ ] Dataset created with correct classes
- [ ] All images uploaded
- [ ] All images annotated (100%)
- [ ] Dataset exported successfully
- [ ] Backend running on port 8000
- [ ] Frontend accessible on port 3001

---

**Ready to train your first model? Start with Step 1! 🎯**

