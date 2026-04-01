import { useState } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function LoginScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password) return setError("Completá todos los campos.");
    if (mode === "signup" && password !== confirm) return setError("Las contraseñas no coinciden.");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No encontramos esa cuenta.",
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/email-already-in-use": "Ese email ya está registrado.",
        "auth/invalid-email": "El email no es válido.",
        "auth/invalid-credential": "Email o contraseña incorrectos.",
      };
      setError(msgs[err.code] || "Algo salió mal. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #E8E2D8",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "'Work Sans', sans-serif",
    color: "#2D2A26",
    background: "#FDFCFA",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FBF8F3", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 24, padding: "40px 36px", boxShadow: "0 4px 24px rgba(45,42,38,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.jpg" alt="logo" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", marginBottom: 8 }} />
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, color: "#2D2A26", margin: "0 0 6px 0" }}>Holis</h1>
          <p style={{ color: "#8A8478", fontSize: 14, margin: 0 }}>Bienvenida a Mood Tracker</p>
        </div>

        <div style={{ display: "flex", background: "#F5F1EB", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {[{ id: "login", label: "Ingresar" }, { id: "signup", label: "Registrarse" }].map((tab) => (
            <button key={tab.id} onClick={() => { setMode(tab.id); setError(""); }}
              style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: mode === tab.id ? "#fff" : "transparent", color: mode === tab.id ? "#2D2A26" : "#8A8478", fontWeight: mode === tab.id ? 600 : 400, fontSize: 14, cursor: "pointer", fontFamily: "'Work Sans', sans-serif", boxShadow: mode === tab.id ? "0 1px 4px rgba(45,42,38,0.08)" : "none", transition: "all 0.2s" }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} style={inputStyle} />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} style={inputStyle} />
          {mode === "signup" && (
            <input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} style={inputStyle} />
          )}
          {error && (
            <p style={{ color: "#E74C3C", fontSize: 13, margin: 0, background: "#E74C3C10", padding: "8px 12px", borderRadius: 8 }}>{error}</p>
          )}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "13px 0", background: loading ? "#E8E2D8" : "#C67B5C", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer", fontFamily: "'Work Sans', sans-serif", marginTop: 4, transition: "background 0.2s" }}>
            {loading ? "Un momento..." : mode === "login" ? "Ingresar" : "Registrarse"}
          </button>
        </div>
      </div>
    </div>
  );
}
