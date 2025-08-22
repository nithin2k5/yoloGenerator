import { X, Keyboard, Info, Settings as SettingsIcon, Save, Image, Zap } from 'lucide-react';
import styles from './Modals.module.css';

export function HelpModal({ showHelp, setShowHelp }) {
  if (!showHelp) return null;

  const shortcuts = [
    { key: 'Ctrl+N', description: 'Next image', icon: '→' },
    { key: 'Ctrl+P', description: 'Previous image', icon: '←' },
    { key: 'Ctrl+Z', description: 'Undo', icon: '↶' },
    { key: 'Ctrl+Shift+Z', description: 'Redo', icon: '↷' },
    { key: 'Delete', description: 'Remove annotation', icon: '🗑️' },
    { key: 'Escape', description: 'Cancel selection', icon: '❌' },
    { key: 'Space', description: 'Toggle help', icon: '❓' },
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleSection}>
            <div className={`${styles.modalIcon} ${styles.help}`}>
              <Keyboard />
            </div>
            <h2 className={styles.modalTitle}>Keyboard Shortcuts</h2>
          </div>
          <button 
            onClick={() => setShowHelp(false)} 
            className={styles.modalCloseButton}
          >
            <X className={styles.modalCloseIcon} />
          </button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.shortcutsGrid}>
            {shortcuts.map((shortcut, index) => (
              <div key={index} className={styles.shortcutItem}>
                <div className={styles.shortcutIcon}>
                  <span>{shortcut.icon}</span>
                </div>
                <div className={styles.shortcutContent}>
                  <div className={styles.shortcutDescription}>{shortcut.description}</div>
                  <kbd className={styles.shortcutKey}>
                    {shortcut.key}
                  </kbd>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.proTipsSection}>
            <div className={styles.proTipsHeader}>
              <Info className={styles.proTipsIcon} />
              <div>
                <p className={styles.proTipsTitle}>Pro Tips:</p>
                <ul className={styles.proTipsList}>
                  <li>Use the mouse wheel to zoom in/out on the image</li>
                  <li>Hold Shift while drawing for perfect squares</li>
                  <li>Double-click an annotation to edit its class</li>
                  <li>Use Ctrl+A to select all annotations on current image</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ showSettings, setShowSettings, autoSave, setAutoSave, imageQuality, setImageQuality, keyboardShortcuts, setKeyboardShortcuts }) {
  if (!showSettings) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleSection}>
            <div className={`${styles.modalIcon} ${styles.settings}`}>
              <SettingsIcon />
            </div>
            <h2 className={styles.modalTitle}>Settings</h2>
          </div>
          <button 
            onClick={() => setShowSettings(false)} 
            className={styles.modalCloseButton}
          >
            <X className={styles.modalCloseIcon} />
          </button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.settingsSection}>
            {/* Auto-save */}
            <div className={styles.settingItem}>
              <div className={styles.settingHeader}>
                <div className={styles.settingLeft}>
                  <div className={`${styles.settingIcon} ${styles.autoSave}`}>
                    <Save />
                  </div>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingName}>Auto-save</div>
                    <div className={styles.settingDescription}>Save to localStorage automatically</div>
                  </div>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>

            {/* Image Quality */}
            <div className={styles.settingItem}>
              <div className={styles.settingHeader}>
                <div className={styles.settingLeft}>
                  <div className={`${styles.settingIcon} ${styles.imageQuality}`}>
                    <Image />
                  </div>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingName}>Image Quality</div>
                    <div className={styles.settingDescription}>Export quality: {Math.round(imageQuality * 100)}%</div>
                  </div>
                </div>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={imageQuality}
                onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                className={styles.rangeSlider}
              />
              <div className={styles.rangeLabels}>
                <span>Low (10%)</span>
                <span>High (100%)</span>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className={styles.settingItem}>
              <div className={styles.settingHeader}>
                <div className={styles.settingLeft}>
                  <div className={`${styles.settingIcon} ${styles.keyboardShortcuts}`}>
                    <Zap />
                  </div>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingName}>Keyboard Shortcuts</div>
                    <div className={styles.settingDescription}>Enable quick keyboard access</div>
                  </div>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={keyboardShortcuts}
                    onChange={(e) => setKeyboardShortcuts(e.target.checked)}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
