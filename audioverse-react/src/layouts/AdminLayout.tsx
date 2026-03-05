// AdminLayout.tsx — Layout route guard: requires both auth + admin role
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const AdminLayout: React.FC = () => {
    const { isAuthenticated, isAdmin } = useUser();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminLayout;
