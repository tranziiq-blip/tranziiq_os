import LegalLayout from "./LegalLayout";
import { openCookieSettings } from "@/lib/cookieConsent";

const btn = {
  font: "inherit",
  fontWeight: 650,
  padding: "9px 16px",
  borderRadius: 6,
  border: "2px solid #0b2545",
  background: "#0b2545",
  color: "#fff",
  cursor: "pointer",
};

const sections = [
  {
    id: "what",
    title: "What we mean by cookies",
    body: (
      <p>
        Cookies are small text files a website stores in your browser. We also
        use your browser's local storage, which works in a similar way. This
        policy covers both.
      </p>
    ),
  },
  {
    id: "what-we-use",
    title: "What we store",
    body: (
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Purpose</th>
            <th>Type</th>
            <th>Kept for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>sb-…-auth-token</td>
            <td>
              Keeps you signed in to TranziIQ (set by our sign-in provider,
              Supabase)
            </td>
            <td>Strictly necessary, local storage</td>
            <td>Until you sign out or the session expires</td>
          </tr>
          <tr>
            <td>sb-…-auth-token-code-verifier</td>
            <td>Completes a Google sign-in securely</td>
            <td>Strictly necessary, local storage</td>
            <td>Removed once sign-in completes</td>
          </tr>
          <tr>
            <td>tranziq_cookie_consent</td>
            <td>Remembers your cookie choice</td>
            <td>Strictly necessary, local storage</td>
            <td>Until you change it or this policy changes</td>
          </tr>
          <tr>
            <td>tranziiq_driver_id</td>
            <td>
              Remembers which driver profile is linked to a device in the driver
              app
            </td>
            <td>Strictly necessary, local storage</td>
            <td>Until you sign out or switch driver</td>
          </tr>
          <tr>
            <td>sidebar_state</td>
            <td>Remembers whether the app sidebar is open or collapsed</td>
            <td>Functional, cookie</td>
            <td>7 days, only if you allow functional cookies</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "no-tracking",
    title: "Analytics and advertising",
    body: (
      <p>
        We do not currently use analytics, advertising or tracking cookies. Our
        fonts are served from our own site, not from a third-party font service.
        If we add analytics later, it will stay off until you allow it, and this
        policy will be updated first.
      </p>
    ),
  },
  {
    id: "third-parties",
    title: "Third parties",
    body: (
      <p>
        If you choose to sign in with Google, Google may set its own cookies on
        its own website under its own privacy policy. We do not control those.
      </p>
    ),
  },
  {
    id: "choices",
    title: "Your choices",
    body: (
      <>
        <p>
          You can change what you allow at any time. Strictly necessary storage
          cannot be turned off because sign-in does not work without it. You can
          also clear cookies and site data in your browser settings, which will
          sign you out.
        </p>
        <p>
          <button type="button" style={btn} onClick={openCookieSettings}>
            Open cookie settings
          </button>
        </p>
      </>
    ),
  },
];

export default function CookiePolicy() {
  return <LegalLayout title="Cookie policy" sections={sections} />;
}
