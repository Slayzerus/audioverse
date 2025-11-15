import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext"; // ✅ Importujemy UserContext
import apiUser from "../../../scripts/api/apiUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import "./loginForm.css";

const LoginForm: React.FC = () => {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const { login } = useUser(); // ✅ Pobieramy `login()` z UserContext
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await apiUser.loginUser(credentials);
            login(); // ✅ Aktualizujemy stan użytkownika
            navigate("/"); // ✅ Przekierowanie po zalogowaniu
        } catch (err: any) {
            setError(err.message || "Błąd logowania");
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Logowanie</h2>
                {error && <p className="error">{error}</p>}
                <div className="input-group" style={{ flexWrap: "nowrap", alignItems: "center" }}>
                    <FontAwesomeIcon icon={faUser} className="icon" />
                    <input type="text" name="username" placeholder="Nazwa użytkownika" onChange={handleChange} required />
                </div>
                <div className="input-group" style={{ flexWrap: "nowrap", alignItems: "center" }}>
                    <FontAwesomeIcon icon={faLock} className="icon" />
                    <input type="password" name="password" placeholder="Hasło" onChange={handleChange} required />
                </div>
                <button type="submit">Zaloguj</button>
            </form>
        </div>
    );
};

export default LoginForm;
