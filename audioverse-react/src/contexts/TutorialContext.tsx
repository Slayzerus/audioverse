import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { loadUserSettings, syncSettingToBackend } from "../scripts/settingsSync";

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetElement?: string; // CSS selector or element ID
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: string; // Optional action hint like "Press Enter to continue"
}

export interface PageTutorial {
  pageId: string;
  steps: TutorialStep[];
}

interface TutorialContextType {
  currentStep: number;
  isActive: boolean;
  currentTutorial: PageTutorial | null;
  startTutorial: (tutorial: PageTutorial) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  isTutorialCompleted: (pageId: string) => boolean;
  resetTutorials: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const STORAGE_KEY = "completed-tutorials";

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<PageTutorial | null>(null);
  const initialSyncDone = useRef(false);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Hydrate from backend on first load (merge with localStorage)
  useEffect(() => {
    if (initialSyncDone.current) return;
    loadUserSettings().then(s => {
      if (s?.completedTutorials) {
        try {
          const remote: string[] = JSON.parse(s.completedTutorials);
          if (Array.isArray(remote) && remote.length > 0) {
            setCompletedTutorials(prev => {
              const merged = new Set(prev);
              remote.forEach(id => merged.add(id));
              return merged;
            });
          }
        } catch { /* ignore bad JSON */ }
      }
      initialSyncDone.current = true;
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const arr = Array.from(completedTutorials);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      // Sync to backend (debounced)
      if (initialSyncDone.current) {
        syncSettingToBackend({ completedTutorials: JSON.stringify(arr) });
      }
    }
  }, [completedTutorials]);

  const startTutorial = (tutorial: PageTutorial) => {
    if (completedTutorials.has(tutorial.pageId)) {
      // Don't auto-start if already completed
      return;
    }
    setCurrentTutorial(tutorial);
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (!currentTutorial) return;
    if (currentStep < currentTutorial.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTutorial = () => {
    if (currentTutorial) {
      setCompletedTutorials(prev => new Set(prev).add(currentTutorial.pageId));
    }
    setIsActive(false);
    setCurrentTutorial(null);
    setCurrentStep(0);
  };

  const completeTutorial = () => {
    if (currentTutorial) {
      setCompletedTutorials(prev => new Set(prev).add(currentTutorial.pageId));
    }
    setIsActive(false);
    setCurrentTutorial(null);
    setCurrentStep(0);
  };

  const isTutorialCompleted = (pageId: string) => {
    return completedTutorials.has(pageId);
  };

  const resetTutorials = () => {
    setCompletedTutorials(new Set());
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        currentStep,
        isActive,
        currentTutorial,
        startTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        completeTutorial,
        isTutorialCompleted,
        resetTutorials,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
};
