import React, { useState } from "react";
import apiUser from "../../../scripts/api/apiUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import "./registrationForm.css";

const RegistrationForm: React.FC = () => {
    const [user, setUser] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            await apiUser.registerUser(user);
            setSuccess("Rejestracja zakończona sukcesem! Możesz się teraz zalogować.");
        } catch (err: any) {
            setError(err.message || "Błąd rejestracji");
        }
    };

    return (
        <div className="registration-container">
            <form onSubmit={handleSubmit} className="registration-form">
                <h2>Rejestracja</h2>
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
                <div className="input-group">
                    <FontAwesomeIcon icon={faUser} className="icon" />
                    <input type="text" name="username" placeholder="Nazwa użytkownika" onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <FontAwesomeIcon icon={faEnvelope} className="icon" />
                    <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <FontAwesomeIcon icon={faLock} className="icon" />
                    <input type="password" name="password" placeholder="Hasło" onChange={handleChange} required />
                </div>
                <button type="submit">Zarejestruj się</button>
            </form>
        </div>
    );
};

export default RegistrationForm;
