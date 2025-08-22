import { Plus, Trash2, Upload, Download, RotateCcw, SkipForward, X, Tag, Image, Settings, BarChart3, Palette, FileImage, Zap } from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar({
  classes,
  newClass,
  setNewClass,
  addClass,
  removeClass,
  selectedClass,
  setSelectedClass,
  annotations,
  handleImageUpload,
  fileInputRef,
  images,
  exportDataset,
  isExporting,
  exportProgress,
  undo,
  redo,
  undoStack,
  redoStack,
  clearAll
}) {
  const totalAnnotations = Object.values(annotations).flat().length;

  return (
    <div className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Tag className={styles.headerIconInner} />
        </div>
        <div className={styles.headerText}>
          <h1 className={styles.headerTitle}>YOLO Generator</h1>
          <p className={styles.headerSubtitle}>Dataset Builder</p>
        </div>
      </div>

      {/* Classes Management Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <div className={`${styles.cardIcon} ${styles.classes}`}>
              <Palette className={styles.cardIconInner} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Classes</h3>
              <p className={styles.cardSubtitle}>{classes.length} class{classes.length !== 1 ? 'es' : ''} defined</p>
            </div>
          </div>
          {classes.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all classes? This will also remove all annotations.')) {
                  clearAll();
                }
              }}
              className={styles.clearButton}
              title="Clear all classes and annotations"
            >
              <Trash2 className={styles.clearIcon} />
            </button>
          )}
        </div>
        
        {/* Add new class */}
        <div className={styles.addClassSection}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              placeholder="Enter class name..."
              className={styles.classInput}
              onKeyPress={(e) => e.key === 'Enter' && addClass()}
            />
            <button 
              onClick={addClass} 
              disabled={!newClass.trim()}
              className={styles.addClassButton}
              title="Add new class"
            >
              <Plus className={styles.addClassIcon} />
            </button>
          </div>
        </div>

        {/* Class list */}
        <div className={styles.classList}>
          {classes.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Tag className={styles.emptyIconInner} />
              </div>
              <p className={styles.emptyTitle}>No classes added yet</p>
              <p className={styles.emptyDescription}>Add your first class to start annotating</p>
            </div>
          ) : (
            classes.map((className, index) => {
              const classAnnotations = Object.values(annotations).flat().filter(ann => ann.classId === index).length;
              return (
                <div 
                  key={index} 
                  className={`${styles.classItem} ${selectedClass === index ? styles.selected : ''}`}
                  onClick={() => setSelectedClass(index)}
                >
                  <div className={styles.classItemContent}>
                    <div className={styles.classItemLeft}>
                      <div 
                        className={styles.classColor}
                        style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
                      />
                      <div className={styles.classInfo}>
                        <span className={styles.className}>{className}</span>
                        <span className={styles.classIndex}>#{index + 1}</span>
                      </div>
                    </div>
                    <div className={styles.classItemRight}>
                      <span className={styles.annotationCount}>
                        {classAnnotations} annotation{classAnnotations !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete class "${className}"? This will also remove all its annotations.`)) {
                            removeClass(index);
                          }
                        }}
                        className={styles.deleteButton}
                        title={`Delete class "${className}"`}
                      >
                        <X className={styles.deleteIcon} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upload Images Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <div className={`${styles.cardIcon} ${styles.upload}`}>
              <Image className={styles.cardIconInner} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Images</h3>
              <p className={styles.cardSubtitle}>{images.length} image{images.length !== 1 ? 's' : ''} uploaded</p>
            </div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className={styles.uploadButton}
          title="Upload images"
        >
          <div className={styles.uploadIcon}>
            <Upload className={styles.uploadIconInner} />
          </div>
          <div className={styles.uploadText}>
            <span className={styles.uploadTitle}>Choose Images</span>
            <p className={styles.uploadDescription}>
              JPG, PNG, GIF, WebP
            </p>
          </div>
        </button>
        
        {images.length > 0 && (
          <div className={styles.uploadInfo}>
            <div className={styles.uploadInfoRow}>
              <FileImage className={styles.uploadInfoIcon} />
              <span className={styles.uploadInfoText}>
                {images.length} image{images.length !== 1 ? 's' : ''} ready
              </span>
            </div>
            <div className={styles.uploadInfoRow}>
              <BarChart3 className={styles.uploadInfoIcon} />
              <span className={styles.uploadInfoSize}>
                {(images.reduce((acc, img) => acc + img.size, 0) / 1024 / 1024).toFixed(2)} MB total
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <div className={`${styles.cardIcon} ${styles.actions}`}>
              <Zap className={styles.cardIconInner} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Actions</h3>
              <p className={styles.cardSubtitle}>{totalAnnotations} total annotations</p>
            </div>
          </div>
        </div>
        
        <div className={styles.actionsSection}>
          {/* Export Button */}
          <button
            onClick={exportDataset}
            disabled={images.length === 0 || isExporting}
            className={`${styles.actionButton} ${styles.export}`}
            title="Export dataset as YOLO format"
          >
            {isExporting ? (
              <>
                <div className={styles.loadingSpinner} />
                <span>Exporting... {Math.round(exportProgress)}%</span>
              </>
            ) : (
              <>
                <Download className={styles.actionIcon} />
                <span>Export Dataset</span>
              </>
            )}
          </button>
          
          {/* Undo/Redo Buttons */}
          <div className={styles.buttonGroup}>
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className={`${styles.actionButton} ${styles.secondary}`}
              title={`Undo (Ctrl+Z) - ${undoStack.length} action${undoStack.length !== 1 ? 's' : ''} available`}
            >
              <RotateCcw className={styles.actionIcon} />
              <span>Undo</span>
              {undoStack.length > 0 && (
                <span className={styles.actionBadge}>{undoStack.length}</span>
              )}
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className={`${styles.actionButton} ${styles.secondary}`}
              title={`Redo (Ctrl+Shift+Z) - ${redoStack.length} action${redoStack.length !== 1 ? 's' : ''} available`}
            >
              <SkipForward className={styles.actionIcon} />
              <span>Redo</span>
              {redoStack.length > 0 && (
                <span className={styles.actionBadge}>{redoStack.length}</span>
              )}
            </button>
          </div>
          
          {/* Clear All Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear everything? This will remove all classes, images, and annotations.')) {
                clearAll();
              }
            }}
            className={`${styles.actionButton} ${styles.danger}`}
            title="Clear all data"
          >
            <Trash2 className={styles.actionIcon} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {totalAnnotations > 0 && (
        <div className={styles.statsCard}>
          <div className={styles.statsHeader}>
            <BarChart3 className={styles.statsIcon} />
            <span className={styles.statsTitle}>Quick Stats</span>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{totalAnnotations}</span>
              <span className={styles.statLabel}>Annotations</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{images.length}</span>
              <span className={styles.statLabel}>Images</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{classes.length}</span>
              <span className={styles.statLabel}>Classes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
