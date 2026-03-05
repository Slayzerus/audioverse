import React, { useEffect, useState, useRef } from "react";

const SESSION_TIMEOUT_MINUTES = 30;
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;

const SessionTimer: React.FC = () => {
  const [remaining, setRemaining] = useState(SESSION_TIMEOUT_MS);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setRemaining(SESSION_TIMEOUT_MS);
    };
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      setRemaining(Math.max(SESSION_TIMEOUT_MS - elapsed, 0));
    }, 1000);
    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      clearInterval(interval);
    };
  }, []);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <span style={{ color: "var(--text-muted, #aaa)", fontSize: 13, marginLeft: 12 }}>
      Sesja: {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
};

export default SessionTimer;
