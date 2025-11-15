import React from "react";
import LoginForm from "../components/forms/user/LoginForm.tsx";

const LoginPage: React.FC = () => {
    return (
        <div style={{
            width: "100%",
            height: "85%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "20px"
        }}>
            <LoginForm />
        </div>
    );
};

export default LoginPage;
