import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";

// Catch render/runtime errors and show them on screen instead of a blank
// page — this matters most right now because there's no easy dev-tools
// access on a tablet. Once things are stable this can be simplified or
// removed, but it costs nothing to leave in.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            fontFamily: "monospace",
            padding: "24px",
            maxWidth: "700px",
            margin: "40px auto",
            background: "#fff5f5",
            border: "1px solid #f5c2c2",
            borderRadius: "8px",
            color: "#7a1f1f",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <h2 style={{ marginTop: 0 }}>App failed to load</h2>
          <p>
            <strong>
              {String(this.state.error?.message || this.state.error)}
            </strong>
          </p>
          <p style={{ fontSize: "12px", opacity: 0.8 }}>
            {this.state.error?.stack}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  const missingEnvVars = [];
  if (!import.meta.env.VITE_SUPABASE_URL)
    missingEnvVars.push("VITE_SUPABASE_URL");
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY)
    missingEnvVars.push("VITE_SUPABASE_ANON_KEY");

  if (missingEnvVars.length > 0) {
    document.getElementById("root").innerHTML = `
      <div style="font-family: monospace; padding: 24px; max-width: 700px; margin: 40px auto; background: #fff5f5; border: 1px solid #f5c2c2; border-radius: 8px; color: #7a1f1f;">
        <h2 style="margin-top:0;">Missing environment variables</h2>
        <p>The app can't start because these are not set: <strong>${missingEnvVars.join(", ")}</strong></p>
        <p style="font-size:12px; opacity:0.8;">Check Vercel → Project → Settings → Environment Variables, then redeploy.</p>
      </div>
    `;
  } else {
    ReactDOM.createRoot(document.getElementById("root")).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    );
  }
} catch (err) {
  document.getElementById("root").innerHTML = `
    <div style="font-family: monospace; padding: 24px; max-width: 700px; margin: 40px auto; background: #fff5f5; border: 1px solid #f5c2c2; border-radius: 8px; color: #7a1f1f;">
      <h2 style="margin-top:0;">App failed to start</h2>
      <p><strong>${String(err.message || err)}</strong></p>
      <pre style="font-size:12px; opacity:0.8; white-space:pre-wrap;">${String(err.stack || "")}</pre>
    </div>
  `;
}
