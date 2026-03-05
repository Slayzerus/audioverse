import React, { useEffect, useRef, useState } from "react";
import { useTutorial } from "../../contexts/TutorialContext";
import styles from './TutorialOverlay.module.css';

const TutorialOverlay: React.FC = () => {
  const { isActive, currentTutorial, currentStep, nextStep, previousStep, skipTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !currentTutorial) return;

    const step = currentTutorial.steps[currentStep];
    if (!step.targetElement) {
      setTargetRect(null);
      return;
    }

    const updateTargetPosition = () => {
      const target = document.querySelector(step.targetElement!);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition);

    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition);
    };
  }, [isActive, currentTutorial, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skipTutorial();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        previousStep();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextStep();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, nextStep, previousStep, skipTutorial]);

  if (!isActive || !currentTutorial) return null;

  const step = currentTutorial.steps[currentStep];
  const totalSteps = currentTutorial.steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  const getTooltipPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const padding = 20;
    const tooltipWidth = 360;
    const tooltipHeight = 200;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case "top":
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
      default:
        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    return { top: `${top}px`, left: `${left}px` };
  };

  return (
    <div className={`${styles['tutorial-overlay']} fade-in`} ref={overlayRef}>
      {/* Dark backdrop with spotlight */}
      <div className={styles['tutorial-backdrop']}>
        {targetRect && (
          <div
            className={styles['tutorial-spotlight']}
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        )}
      </div>

      {/* Tutorial tooltip */}
      <div className={`${styles['tutorial-tooltip']} fade-in`} style={getTooltipPosition()}>
        <div className={styles['tutorial-tooltip__header']}>
          <h3 className={styles['tutorial-tooltip__title']}>{step.title}</h3>
          <button className={styles['tutorial-tooltip__close']} onClick={skipTutorial} aria-label="Skip tutorial">
            ✕
          </button>
        </div>

        <div className={styles['tutorial-tooltip__content']}>
          <p>{step.content}</p>
          {step.action && <div className={styles['tutorial-tooltip__action']}>💡 {step.action}</div>}
        </div>

        <div className={styles['tutorial-tooltip__footer']}>
          <div className={styles['tutorial-tooltip__progress']}>
            {currentStep + 1} / {totalSteps}
          </div>

          <div className={styles['tutorial-tooltip__buttons']}>
            {currentStep > 0 && (
              <button className={`${styles['tutorial-btn']} ${styles['tutorial-btn--secondary']}`} onClick={previousStep}>
                ← Previous
              </button>
            )}
            <button className={`${styles['tutorial-btn']} ${styles['tutorial-btn--primary']}`} onClick={nextStep}>
              {isLastStep ? "Finish 🎉" : "Next →"}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className={styles['tutorial-tooltip__dots']}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`${styles['tutorial-dot']} ${i === currentStep ? styles['tutorial-dot--active'] : ""} ${
                i < currentStep ? styles['tutorial-dot--completed'] : ""
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
