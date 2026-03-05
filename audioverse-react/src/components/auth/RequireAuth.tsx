// RequireAuth.tsx — Route guard components for authenticated and admin routes
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";

interface RequireAuthProps {
    children: React.ReactNode;
}

/**
 * Redirects unauthenticated users to /login (preserving the attempted URL).
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
    const { isAuthenticated } = useUser();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

/**
 * Redirects non-admin users to / (requires both auth + admin role).
 */
export const RequireAdmin: React.FC<RequireAuthProps> = ({ children }) => {
    const { isAuthenticated, isAdmin } = useUser();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
