# YOLO Dataset Generator

A web-based tool for creating YOLO format datasets with an intuitive interface for image annotation and bounding box drawing.

## Features

- **Image Upload**: Support for multiple image formats (JPG, PNG, etc.)
- **Class Management**: Add, remove, and manage object classes
- **Bounding Box Drawing**: Click and drag to draw bounding boxes on images
- **Multi-Image Navigation**: Navigate between uploaded images with next/previous buttons
- **YOLO Format Export**: Generate YOLO-compatible annotation files
- **Dark/Light Mode**: Toggle between dark and light themes
- **Local Storage**: Automatically save progress to resume work later
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

### 1. Setup Classes
- Add class names for objects you want to detect (e.g., "person", "car", "dog")
- Classes are automatically assigned sequential IDs starting from 0

### 2. Upload Images
- Click "Choose Images" to select multiple images
- Supported formats: JPG, PNG, GIF, WebP, etc.

### 3. Annotate Images
- Select an image from the uploaded set
- Choose the class for the object you want to annotate
- Click and drag on the image to draw bounding boxes
- Repeat for all objects in the image
- Use navigation buttons to move between images

### 4. Export Dataset
- Click "Export Dataset" to generate a ZIP file containing:
  - `images/` folder with all uploaded images
  - `annotations/` folder with YOLO format .txt files
  - `classes.txt` file listing all class names

## YOLO Format

The exported annotation files follow the YOLO format:
```
class_id x_center y_center width height
```

Where all values are normalized between 0 and 1:
- `class_id`: Index of the class (0-based)
- `x_center`: X-coordinate of the center of the bounding box
- `y_center`: Y-coordinate of the center of the bounding box
- `width`: Width of the bounding box
- `height`: Height of the bounding box

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build for Production

```bash
npm run build
npm start
```

## Technologies Used

- **Next.js 15**: React framework for the web application
- **React 19**: UI library for building the interface
- **JSZip**: Library for creating downloadable ZIP files
- **Lucide React**: Icon library for the user interface
- **Tailwind CSS**: Utility-first CSS framework for styling

## File Structure

```
src/
├── app/
│   ├── globals.css      # Global styles and Tailwind imports
│   ├── layout.js        # Root layout component
│   └── page.js          # Main YOLO dataset generator component
├── tailwind.config.js   # Tailwind CSS configuration
└── postcss.config.js    # PostCSS configuration
```

## Usage Example

1. **Setup**: Add classes like "person", "car", "bicycle"
2. **Upload**: Select 10 images of street scenes
3. **Annotate**: 
   - Draw boxes around people in each image
   - Draw boxes around cars
   - Draw boxes around bicycles
4. **Export**: Download `yolo_dataset.zip` containing:
   - `image1.jpg`, `image1.txt`
   - `image2.jpg`, `image2.txt`
   - ...
   - `classes.txt` (person, car, bicycle)

## Keyboard Shortcuts

- **Enter**: Add new class after typing in the class input
- **Click**: Select and remove existing annotations
- **Drag**: Draw new bounding boxes

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Local Storage

The application automatically saves:
- All uploaded images (as URLs)
- All annotations and bounding boxes
- Class definitions
- Dark/light mode preference

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for any purpose.
