import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TutorialProvider, useTutorial, type PageTutorial } from "../contexts/TutorialContext";

/* ── Test data ───────────────────────────────────────────────────── */

const sampleTutorial: PageTutorial = {
    pageId: "test-page",
    steps: [
        { id: "s1", title: "Step 1", content: "First step" },
        { id: "s2", title: "Step 2", content: "Second step" },
        { id: "s3", title: "Step 3", content: "Third step" },
    ],
};

/* ── Consumer component for testing ──────────────────────────────── */

const TutorialConsumer: React.FC = () => {
    const {
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
    } = useTutorial();

    return (
        <div>
            <span data-testid="is-active">{String(isActive)}</span>
            <span data-testid="current-step">{currentStep}</span>
            <span data-testid="tutorial-id">{currentTutorial?.pageId ?? "none"}</span>
            <span data-testid="step-title">
                {currentTutorial?.steps[currentStep]?.title ?? "none"}
            </span>
            <span data-testid="completed">{String(isTutorialCompleted("test-page"))}</span>
            <button onClick={() => startTutorial(sampleTutorial)}>Start</button>
            <button onClick={nextStep}>Next</button>
            <button onClick={previousStep}>Prev</button>
            <button onClick={skipTutorial}>Skip</button>
            <button onClick={completeTutorial}>Complete</button>
            <button onClick={resetTutorials}>Reset</button>
        </div>
    );
};

/* ── Tests ────────────────────────────────────────────────────────── */

describe("TutorialContext", () => {
    beforeEach(() => {
        localStorage.removeItem("completed-tutorials");
    });

    it("starts inactive with no tutorial", () => {
        render(
            <TutorialProvider>
                <TutorialConsumer />
            </TutorialProvider>,
        );
        expect(screen.getByTestId("is-active").textContent).toBe("false");
        expect(screen.getByTestId("tutorial-id").textContent).toBe("none");
    });

    it("startTutorial activates the tutorial", async () => {
        const user = userEvent.setup();
        render(
            <TutorialProvider>
                <TutorialConsumer />
            </TutorialProvider>,
        );

        await user.click(screen.getByText("Start"));

        expect(screen.getByTestId("is-active").textContent).toBe("true");
        expect(screen.getByTestId("tutorial-id").textContent).toBe("test-page");
        expect(screen.getByTestId("current-step").textContent).toBe("0");
        expect(screen.getByTestId("step-title").textContent).toBe("Step 1");
    });

    it("nextStep advances through steps", async () => {
        const user = userEvent.setup();
        render(
            <TutorialProvider>
                <TutorialConsumer />
            </TutorialProvider>,
        );

        await user.click(screen.getByText("Start"));
        expect(screen.getByTestId("step-title").textContent).toBe("Step 1");

        await user.click(screen.getByText("Next"));
        expect(screen.getByTestId("step-title").textContent).toBe("Step 2");

        await user.click(screen.getByText("Next"));
        expect(screen.getByTestId("step-title").textContent).toBe("Step 3");
    });

    it("nextStep on last step completes the tutorial", async () => {
        const user = userEvent.setup();
        render(
            <TutorialProvider>
                <TutorialConsumer />
            </TutorialProvider>,
        );

        await user.click(screen.getByText("Start"));
        await user.click(screen.getByText("Next")); // → step 2
        await user.click(screen.getByText("Next")); // → step 3
        await user.click(screen.getByText("Next")); // completes

        expect(screen.getByTestId("is-active").textContent).toBe("false");
        expect(screen.getByTestId("completed").textContent).toBe("true");
    });

    it("previousStep moves backward", async () => {
        const user = userEvent.setup();
        const { getByTestId, getByText } = render(
            <TutorialProvider>
                <TutorialConsumer />
            </TutorialProvider>,
        );

        await user.click(getByText("Start"));
        expect(getByTestId("current-step").textContent).toBe("0");
        expect(getByTestId("step-title").textContent).toBe("Step 1");

        await user.click(getByText("Next"));
        expect(getByTestId("current-step").textContent).toBe("1");
        expect(getByTestId("step-title").textContent).toBe("Step 2");

        await user.click(getByText("Prev"));
        expect(getByTestId("current-step").textContent).toBe("0");
        expect(getByTestId("step-title").textContent).toBe("Step 1");
    });

    it("previousStep does nothing at step 0", async () => {
        const user = userEvent.setup();
        render(
            <TutorialProvider>
                <TutorialConsumer />
            </TutorialProvider>,
        );

        await user.click(screen.getByText("Start"));
        await user.click(screen.getByText("Prev"));
        expect(screen.getByTestId("current-step").textContent).toBe("0");
    });

    it("skipTutorial marks as completed and deactivates", async () => {
        const user = userEvent.setup();
        render(
            <TutorialProvider>
                <TutorialConsumer />
            </TutorialProvider>,
        );

        await user.click(screen.getByText("Start"));
        await user.click(screen.getByText("Skip"));

        expect(screen.getByTestId("is-active").textContent).toBe("false");
        expect(screen.getByTestId("completed").textContent).toBe("true");
    });

    it("does not start an already-completed tutorial", async () => {
        const user = userEvent.setup();
        render(
            <TutorialProvider>
                <TutorialConsumer />
            </TutorialProvider>,
        );

        // Complete the tutorial first
        await user.click(screen.getByText("Start"));
        await user.click(screen.getByText("Complete"));
        expect(screen.getByTestId("completed").textContent).toBe("true");

        // Try to start again
        await user.click(screen.getByText("Start"));
        expect(screen.getByTestId("is-active").textContent).toBe("false");
    });

    it("resetTutorials clears completion state", async () => {
        const user = userEvent.setup();
        render(
            <TutorialProvider>
                <TutorialConsumer />
            </TutorialProvider>,
        );

        await user.click(screen.getByText("Start"));
        await user.click(screen.getByText("Complete"));
        expect(screen.getByTestId("completed").textContent).toBe("true");

        await user.click(screen.getByText("Reset"));
        expect(screen.getByTestId("completed").textContent).toBe("false");
    });

    it("persists completed tutorials to localStorage", async () => {
        const user = userEvent.setup();
        render(
            <TutorialProvider>
                <TutorialConsumer />
            </TutorialProvider>,
        );

        await user.click(screen.getByText("Start"));
        await user.click(screen.getByText("Complete"));

        const stored = JSON.parse(localStorage.getItem("completed-tutorials") ?? "[]");
        expect(stored).toContain("test-page");
    });

    it("throws when useTutorial is called outside provider", () => {
        const ErrorConsumer: React.FC = () => {
            useTutorial();
            return null;
        };

        expect(() => render(<ErrorConsumer />)).toThrow(
            "useTutorial must be used within TutorialProvider",
        );
    });
});
