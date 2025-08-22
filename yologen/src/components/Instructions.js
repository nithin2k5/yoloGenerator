import styles from './Instructions.module.css';

export default function Instructions() {
  const steps = [
    {
      number: 1,
      title: "Setup Classes",
      description: "Add class names for objects you want to detect",
      icon: "🏷️",
      stepClass: "step1"
    },
    {
      number: 2,
      title: "Upload Images",
      description: "Select multiple images to create your dataset",
      icon: "📸",
      stepClass: "step2"
    },
    {
      number: 3,
      title: "Draw Boxes",
      description: "Click and drag to draw bounding boxes around objects",
      icon: "✏️",
      stepClass: "step3"
    },
    {
      number: 4,
      title: "Export Dataset",
      description: "Download your dataset as a ZIP file with all annotations",
      icon: "📦",
      stepClass: "step4"
    }
  ];

  return (
    <div className={styles.instructions}>
      <div className={styles.headerSection}>
        <h2 className={styles.title}>
          How to Use YOLO Generator
        </h2>
        <p className={styles.description}>
          Follow these simple steps to create your professional YOLO dataset. 
          The tool is designed to be intuitive and efficient for both beginners and experts.
        </p>
      </div>
      
      <div className={styles.stepsGrid}>
        {steps.map((step, index) => (
          <div 
            key={index}
            className={styles.stepItem}
          >
            {/* Step Number Badge */}
            <div className={`${styles.stepNumber} ${styles[step.stepClass]}`}>
              {step.number}
            </div>
            
            {/* Main Card */}
            <div className={`${styles.stepCard} ${styles[step.stepClass]}`}>
              <div className={styles.stepContent}>
                {/* Icon */}
                <div className={`${styles.stepIcon} ${styles[step.stepClass]}`}>
                  <span className={styles.stepIconText}>{step.icon}</span>
                </div>
                
                {/* Content */}
                <h3 className={styles.stepTitle}>
                  {step.title}
                </h3>
                <p className={styles.stepDescription}>
                  {step.description}
                </p>
              </div>
            </div>
            
            {/* Connection Line (for desktop) */}
            {index < steps.length - 1 && (
              <div className={styles.connectionLine} />
            )}
          </div>
        ))}
      </div>
      
      {/* Additional Tips */}
      <div className={styles.proTipsSection}>
        <div className={styles.proTipsHeader}>
          <h3 className={styles.proTipsTitle}>
            💡 Pro Tips for Better Results
          </h3>
        </div>
        <div className={styles.proTipsGrid}>
          <div className={styles.proTipItem}>
            <span className={styles.proTipDot}></span>
            <span className={styles.proTipText}>Use consistent class names</span>
          </div>
          <div className={styles.proTipItem}>
            <span className={styles.proTipDot}></span>
            <span className={styles.proTipText}>Draw tight bounding boxes</span>
          </div>
          <div className={styles.proTipItem}>
            <span className={styles.proTipDot}></span>
            <span className={styles.proTipText}>Include diverse images</span>
          </div>
        </div>
      </div>
    </div>
  );
}
