import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { saveConsent, useCookieConsent } from "@/lib/cookieConsent";
import "./site.css";

export default function CookieBanner() {
  const { consent, settingsRequested, clearSettingsRequest } =
    useCookieConsent();
  const [showPrefs, setShowPrefs] = useState(false);
  const [functional, setFunctional] = useState(consent?.functional ?? false);
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);

  useEffect(() => {
    if (settingsRequested) {
      setShowPrefs(true);
      setFunctional(consent?.functional ?? false);
      setAnalytics(consent?.analytics ?? false);
    }
  }, [settingsRequested]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = !consent || settingsRequested;
  if (!visible) return null;

  const done = (choice) => {
    saveConsent(choice);
    setShowPrefs(false);
    clearSettingsRequest();
  };

  return (
    <div
      className="cookie"
      role="dialog"
      aria-labelledby="cookie-title"
      aria-live="polite"
    >
      <h2 id="cookie-title">Cookies and local storage</h2>
      <p>
        We use strictly necessary storage to keep you signed in and to remember
        this choice. Anything else is optional and off until you allow it. See
        our <Link to="/cookies">cookie policy</Link>.
      </p>

      {showPrefs && (
        <div className="cookie__prefs">
          <label>
            <input type="checkbox" checked disabled />
            <span>
              Strictly necessary
              <small>
                Sign-in session, security and your cookie choice. Always on.
              </small>
            </span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={functional}
              onChange={(e) => setFunctional(e.target.checked)}
            />
            <span>
              Functional
              <small>
                Remembers interface preferences such as a collapsed sidebar.
              </small>
            </span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
            />
            <span>
              Analytics
              <small>
                Anonymous usage statistics to improve the product. Not currently
                in use.
              </small>
            </span>
          </label>
        </div>
      )}

      <div className="cookie__actions">
        {showPrefs ? (
          <button
            className="cookie__accept"
            onClick={() => done({ functional, analytics })}
          >
            Save my choices
          </button>
        ) : (
          <button
            className="cookie__accept"
            onClick={() => done({ functional: true, analytics: true })}
          >
            Accept all
          </button>
        )}
        <button
          className="cookie__reject"
          onClick={() => done({ functional: false, analytics: false })}
        >
          Necessary only
        </button>
        {!showPrefs && (
          <button className="cookie__manage" onClick={() => setShowPrefs(true)}>
            Choose what to allow
          </button>
        )}
      </div>
    </div>
  );
}
