import { useEffect } from 'react';
import { useTutorial as useTutorialContext, PageTutorial, TutorialStep } from '../contexts/TutorialContext';

/**
 * Hook to easily start a tutorial on page mount.
 * 
 * @param pageId - Unique identifier for this tutorial page
 * @param steps - Array of tutorial steps to display
 * @param autoStart - Whether to start the tutorial automatically on mount (default: true)
 * 
 * @example
 * ```tsx
 * import { songBrowserTutorial } from '../utils/tutorialDefinitions';
 * 
 * useTutorialPage('song-browser', songBrowserTutorial);
 * ```
 */
export function useTutorialPage(
  pageId: string,
  steps: TutorialStep[],
  autoStart: boolean = true
) {
  const { startTutorial, isTutorialCompleted, skipTutorial } = useTutorialContext();

  useEffect(() => {
    if (autoStart && !isTutorialCompleted(pageId)) {
      // Delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        const tutorial: PageTutorial = {
          pageId,
          steps
        };
        startTutorial(tutorial);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [pageId, autoStart, startTutorial, isTutorialCompleted]);

  return { startTutorial, skipTutorial, isTutorialCompleted };
}
