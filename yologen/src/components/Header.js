import { Moon, Sun, HelpCircle, Settings } from 'lucide-react';
import styles from './Header.module.css';

export default function Header({ 
  darkMode, 
  setDarkMode, 
  showHelp, 
  setShowHelp, 
  showSettings, 
  setShowSettings,
  images,
  totalAnnotations,
  progressPercentage 
}) {
  return (
    <header className={`${styles.header} ${darkMode ? styles.dark : ''}`}>
      <div className={styles.headerContent}>
        <div className={styles.headerMain}>
          {/* Logo and Title */}
          <div className={styles.logoSection}>
            <div className={styles.logoContainer}>
              <div className={styles.logoIcon}>
                <span className="text-white font-bold text-xl">Y</span>
              </div>
              <div>
                <h1 className={styles.logoText}>
                  YOLO Generator
                </h1>
                <p className={styles.logoSubtitle}>
                  Professional Dataset Creation Tool
                </p>
              </div>
            </div>
            
            {/* Stats */}
            {images.length > 0 && (
              <div className={styles.statsSection}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>
                    {images.length}
                  </div>
                  <div className={styles.statLabel}>Images</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>
                    {totalAnnotations}
                  </div>
                  <div className={styles.statLabel}>Annotations</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className={styles.statLabel}>Complete</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {images.length > 0 && (
            <div className={styles.progressSection}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <div className={styles.progressLabel}>
                Dataset Progress
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className={styles.actionsSection}>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={`${styles.actionButton} ${styles.help}`}
              title="Help & Shortcuts"
            >
              <HelpCircle className={styles.actionIcon} />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`${styles.actionButton} ${styles.settings}`}
              title="Settings"
            >
              <Settings className={styles.actionIcon} />
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`${styles.actionButton} ${styles.theme}`}
              title="Toggle theme"
            >
              {darkMode ? (
                <Sun className={styles.actionIcon} />
              ) : (
                <Moon className={styles.actionIcon} />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Stats */}
        {images.length > 0 && (
          <div className={styles.mobileStats}>
            <div className={styles.mobileStatsContent}>
              <div className={styles.mobileStatsLeft}>
                <div className={styles.mobileStatItem}>
                  <div className={styles.mobileStatValue}>
                    {images.length} Images
                  </div>
                </div>
                <div className={styles.mobileStatItem}>
                  <div className={styles.mobileStatValue}>
                    {totalAnnotations} Annotations
                  </div>
                </div>
              </div>
              <div className={styles.mobileStatItem}>
                <div className={styles.mobileStatValue}>
                  {Math.round(progressPercentage)}% Complete
                </div>
              </div>
            </div>
            <div className={styles.mobileProgressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
