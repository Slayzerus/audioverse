import { createContext, useContext, useEffect, useState } from "react";
import apiUser from "../scripts/api/apiUser";

interface UserContextType {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!apiUser.getAccessToken());

    useEffect(() => {
        const checkAuth = () => setIsAuthenticated(!!apiUser.getAccessToken());
        window.addEventListener("storage", checkAuth); // Obsługa zmian w localStorage

        return () => window.removeEventListener("storage", checkAuth);
    }, []);

    const login = () => {
        setIsAuthenticated(true);
    };

    const logout = () => {
        apiUser.logoutUser(0);
        setIsAuthenticated(false);
    };

    return (
        <UserContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
