// AuthLayout.tsx — Layout route guard: redirects unauthenticated users to /login
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const AuthLayout: React.FC = () => {
    const { isAuthenticated } = useUser();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default AuthLayout;
