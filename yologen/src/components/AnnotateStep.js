'use client';

export default function AnnotateStep({
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
  setSelectedClass
}) {
  if (!currentImage) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center">
        <div className="text-6xl mb-4">📷</div>
        <h2 className="text-3xl font-bold text-white mb-4">No Images Uploaded</h2>
        <p className="text-gray-300 mb-8">
          Upload some images to get started with your YOLO dataset annotation.
        </p>
        <div className="text-gray-400">
          Go back to the Upload step to add images
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Start Annotating</h2>

      {/* Image Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevImage}
          disabled={currentImageIndex === 0}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <div className="text-white">
          {currentImageIndex + 1} of {images.length}
        </div>

        <button
          onClick={nextImage}
          disabled={currentImageIndex === images.length - 1}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={zoomOut} className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
          Zoom Out
        </button>
        <span className="text-white">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn} className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
          Zoom In
        </button>
        <button onClick={resetZoom} className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
          Reset
        </button>
      </div>

      {/* Canvas Container */}
      <div className="canvas-container mb-6" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="canvas"
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
          <div
            className="drawing-preview"
            style={{
              left: Math.min(drawingBox.x1, drawingBox.x2),
              top: Math.min(drawingBox.y1, drawingBox.y2),
              width: Math.abs(drawingBox.x2 - drawingBox.x1),
              height: Math.abs(drawingBox.y2 - drawingBox.y1)
            }}
          />
        )}

        {/* Existing annotations */}
        {currentAnnotations.map((annotation, index) => (
          <div
            key={annotation.id || index}
            className={`bounding-box ${selectedAnnotation === index ? 'selected' : ''}`}
            style={{
              left: annotation.x1 * 800,
              top: annotation.y1 * 600,
              width: (annotation.x2 - annotation.x1) * 800,
              height: (annotation.y2 - annotation.y1) * 600
            }}
            onClick={() => selectAnnotation(index)}
          />
        ))}
      </div>

      {/* Class Selection */}
      <div className="mb-6">
        <label className="block text-white mb-2">Selected Class for Drawing:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(parseInt(e.target.value))}
          className="px-4 py-2 bg-white text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {classes.map((className, index) => (
            <option key={index} value={index}>{className}</option>
          ))}
        </select>
      </div>

      {/* Current Annotations */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-3">
          Annotations ({currentAnnotations.length})
        </h3>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {currentAnnotations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-gray-300">No annotations yet</p>
              <p className="text-gray-400 text-sm">Draw bounding boxes on the image above</p>
            </div>
          ) : (
            currentAnnotations.map((annotation, index) => (
              <div
                key={annotation.id || index}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedAnnotation === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                onClick={() => selectAnnotation(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: `hsl(${(annotation.classId * 137.5) % 360}, 70%, 60%)` }}
                    />
                    <span>{classes[annotation.classId] || 'Unknown'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAnnotation(currentImage.id, index);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

