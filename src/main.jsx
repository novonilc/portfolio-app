import { useState } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import App, { LicenseGate } from "./App.jsx";

// ── License gate toggle ──────────────────────────────────────────────────
// true  = gate is active on all non-localhost URLs (public/paid mode)
// false = gate disabled everywhere (open/free mode)
const GATE_ENABLED = true;
// ─────────────────────────────────────────────────────────────────────────

function Root() {
  const [license, setLicense] = useState(() => {
    try { return JSON.parse(localStorage.getItem("portfolio:license") || "null"); } catch { return null; }
  });

  const onLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (GATE_ENABLED && !license && !onLocalhost) {
    return <LicenseGate onActivate={setLicense} />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
