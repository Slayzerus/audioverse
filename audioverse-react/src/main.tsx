import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

const queryClient = new QueryClient(); // ✅ Utwórz QueryClient

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}> {/* ✅ Ustawienie QueryClientProvider */}
            <Router>
                <App />
            </Router>
        </QueryClientProvider>
    </React.StrictMode>
);
