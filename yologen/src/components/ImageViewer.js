import { SkipBack, SkipForward, ZoomOut, ZoomIn, Maximize, X } from 'lucide-react';
import styles from './ImageViewer.module.css';

export default function ImageViewer({
  currentImage,
  currentImageIndex,
  images,
  prevImage,
  nextImage,
  zoom,
  zoomIn,
  zoomOut,
  resetZoom,
  canvasRef,
  containerRef,
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  drawingBox,
  currentAnnotations,
  selectedAnnotation,
  selectAnnotation,
  removeAnnotation,
  classes,
  selectedClass,
  setSelectedClass,
  imageCategories,
  setImageCategories
}) {
  if (!currentImage) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <span>📷</span>
        </div>
        <h2 className={styles.emptyTitle}>No Images Uploaded</h2>
        <p className={styles.emptyDescription}>
          Upload some images to get started with your YOLO dataset. 
          You can select multiple images at once and start annotating immediately.
        </p>
        <div className={styles.emptyButton}>
          <span>Upload Images to Begin</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.imageViewer}>
      {/* Image Navigation Header */}
      <div className={styles.navigationHeader}>
        <div className={styles.navigationLeft}>
          <div className={styles.navigationControls}>
            <button
              onClick={prevImage}
              disabled={currentImageIndex === 0}
              className={styles.navButton}
              title="Previous image (Ctrl+P)"
            >
              <SkipBack className={styles.navIcon} />
            </button>
            
            <span className={styles.imageCounter}>
              {currentImageIndex + 1} of {images.length}
            </span>
            
            <button
              onClick={nextImage}
              disabled={currentImageIndex === images.length - 1}
              className={styles.navButton}
              title="Next image (Ctrl+N)"
            >
              <SkipForward className={styles.navIcon} />
            </button>
          </div>
          
          <div className={styles.imageInfo}>
            {currentImage.name} • {(currentImage.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
        
        {/* Zoom Controls */}
        <div className={styles.zoomControls}>
          <button onClick={zoomOut} className={styles.zoomButton} title="Zoom out">
            <ZoomOut className={styles.zoomIcon} />
          </button>
          <span className={styles.zoomLevel}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={zoomIn} className={styles.zoomButton} title="Zoom in">
            <ZoomIn className={styles.zoomIcon} />
          </button>
          <button onClick={resetZoom} className={styles.zoomButton} title="Reset zoom">
            <Maximize className={styles.zoomIcon} />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className={styles.canvasContainer} ref={containerRef}>
        <div className={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className={styles.canvas}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            style={{
              backgroundImage: `url(${currentImage.url})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
          
          {/* Drawing overlay */}
          {drawingBox && (
            <>
              <div
                className={styles.drawingOverlay}
                style={{
                  left: Math.min(drawingBox.x1, drawingBox.x2) * zoom,
                  top: Math.min(drawingBox.y1, drawingBox.y2) * zoom,
                  width: Math.abs(drawingBox.x2 - drawingBox.x1) * zoom,
                  height: Math.abs(drawingBox.y2 - drawingBox.y1) * zoom
                }}
              />
              <div
                className={styles.drawingInfo}
                style={{
                  left: Math.min(drawingBox.x1, drawingBox.x2) * zoom
                }}
              >
                📦 Drawing: {classes[selectedClass] || 'Unknown'} •
                📏 {(Math.abs(drawingBox.x2 - drawingBox.x1)).toFixed(3)} × {(Math.abs(drawingBox.y2 - drawingBox.y1)).toFixed(3)} •
                📐 {(Math.abs(drawingBox.x2 - drawingBox.x1) * Math.abs(drawingBox.y2 - drawingBox.y1) * 100).toFixed(1)}%
              </div>
            </>
          )}
          
          {/* Existing annotations */}
          {currentAnnotations.map((annotation, index) => (
            <div
              key={annotation.id || index}
              className={`${styles.boundingBox} ${selectedAnnotation === index ? styles.selected : ''}`}
              style={{
                left: annotation.x1 * 800 * zoom,
                top: annotation.y1 * 600 * zoom,
                width: (annotation.x2 - annotation.x1) * 800 * zoom,
                height: (annotation.y2 - annotation.y1) * 600 * zoom
              }}
              onClick={() => selectAnnotation(index)}
              title={`${classes[annotation.classId] || 'Unknown'} - Click to select, Delete to remove`}
            >
              {/* Class label */}
              <div className={styles.annotationLabel}>
                {classes[annotation.classId] || 'Unknown'}
              </div>

              {/* Resize handles - only show for selected annotation */}
              {selectedAnnotation === index && (
                <>
                  <div className={`${styles.resizeHandle} ${styles.nw}`} />
                  <div className={`${styles.resizeHandle} ${styles.ne}`} />
                  <div className={`${styles.resizeHandle} ${styles.sw}`} />
                  <div className={`${styles.resizeHandle} ${styles.se}`} />
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Zoom indicator */}
        <div className={styles.zoomIndicator}>
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Class Selection and Annotations */}
      <div className={styles.bottomSection}>
        {/* Class Selection */}
        <div className={styles.classSelection}>
          <label className={styles.classLabel}>Selected Class for Drawing:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(parseInt(e.target.value))}
            className={styles.classSelect}
          >
            {classes.map((className, index) => (
              <option key={index} value={index}>{className}</option>
            ))}
          </select>
        </div>

        {/* Image Category Selection */}
        <div className={styles.categorySelection}>
          <label className={styles.categoryLabel}>Dataset Category:</label>
          <div className={styles.categoryButtons}>
            {[
              { id: 'train', label: 'Training', emoji: '🎯', color: 'green', desc: 'Used for training the model' },
              { id: 'valid', label: 'Validation', emoji: '🔍', color: 'blue', desc: 'Used for validating during training' },
              { id: 'test', label: 'Test', emoji: '🧪', color: 'purple', desc: 'Used for final evaluation' }
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  const newCategories = { ...imageCategories };
                  newCategories[currentImage.id] = category.id;
                  setImageCategories(newCategories);
                }}
                className={`${styles.categoryButton} ${styles[`category${category.id}`]} ${
                  imageCategories[currentImage.id] === category.id ? styles.categorySelected : ''
                }`}
                title={category.desc}
              >
                <span className={styles.categoryEmoji}>{category.emoji}</span>
                <span className={styles.categoryText}>{category.label}</span>
                <span className={styles.categoryDesc}>{category.desc}</span>
              </button>
            ))}
          </div>
          <div className={styles.categoryStats}>
            <div className={styles.categoryStat}>
              <span className={styles.categoryStatIcon}>🎯</span>
              <span className={styles.categoryStatText}>
                Training: {Object.values(imageCategories).filter(cat => cat === 'train').length}
              </span>
            </div>
            <div className={styles.categoryStat}>
              <span className={styles.categoryStatIcon}>🔍</span>
              <span className={styles.categoryStatText}>
                Validation: {Object.values(imageCategories).filter(cat => cat === 'valid').length}
              </span>
            </div>
            <div className={styles.categoryStat}>
              <span className={styles.categoryStatIcon}>🧪</span>
              <span className={styles.categoryStatText}>
                Test: {Object.values(imageCategories).filter(cat => cat === 'test').length}
              </span>
            </div>
          </div>
        </div>

        {/* Current Annotations */}
        <div className={styles.annotationsSection}>
          <h3 className={styles.annotationsTitle}>
            <span>Annotations ({currentAnnotations.length})</span>
            {currentAnnotations.length > 0 && (
              <span className={styles.annotationsSubtitle}>
                • Click to select • Delete to remove • Drag corners to resize
              </span>
            )}
          </h3>
          
          <div className={styles.annotationsList}>
            {currentAnnotations.length === 0 ? (
              <div className={styles.emptyAnnotations}>
                <div className={styles.emptyAnnotationsIcon}>
                  <span>📦</span>
                </div>
                <p className={styles.emptyAnnotationsTitle}>No annotations yet</p>
                <p className={styles.emptyAnnotationsDescription}>
                  Click and drag on the image to draw bounding boxes
                </p>
                <div className={styles.shortcuts}>
                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutKey}>Click + Drag</span>
                    <span className={styles.shortcutDesc}>Draw bounding box</span>
                  </div>
                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutKey}>Delete</span>
                    <span className={styles.shortcutDesc}>Remove selected box</span>
                  </div>
                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutKey}>1-9</span>
                    <span className={styles.shortcutDesc}>Switch class</span>
                  </div>
                </div>
              </div>
            ) : (
              currentAnnotations.map((annotation, index) => (
                <div 
                  key={annotation.id || index} 
                  className={`${styles.annotationItem} ${selectedAnnotation === index ? styles.selected : ''}`}
                  onClick={() => selectAnnotation(index)}
                >
                  <div className={styles.annotationContent}>
                    <div className={styles.annotationLeft}>
                      <div 
                        className={styles.annotationColor}
                        style={{ backgroundColor: `hsl(${(annotation.classId * 137.5) % 360}, 70%, 60%)` }}
                      />
                      <div className={styles.annotationDetails}>
                        <span className={styles.annotationName}>
                          {classes[annotation.classId] || 'Unknown'}
                        </span>
                        <div className={styles.annotationMetrics}>
                          <div className={styles.annotationSize}>
                            📏 {(annotation.x2 - annotation.x1).toFixed(3)} × {(annotation.y2 - annotation.y1).toFixed(3)}
                          </div>
                          <div className={styles.annotationArea}>
                            📐 {((annotation.x2 - annotation.x1) * (annotation.y2 - annotation.y1) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAnnotation(currentImage.id, index);
                      }}
                      className={styles.annotationDelete}
                    >
                      <X className={styles.annotationDeleteIcon} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
