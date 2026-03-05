// ScrollToTop.tsx — Reset scroll & focus on route change for accessibility
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to top and moves focus to <main> on every route change.
 * Improves keyboard/screen-reader navigation.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);

        // Move focus to main content area for screen readers
        const main = document.getElementById("main-content");
        if (main) {
            main.focus({ preventScroll: true });
        }
    }, [pathname]);

    return null;
};

export default ScrollToTop;
