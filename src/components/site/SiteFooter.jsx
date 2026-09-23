import { Link } from "react-router-dom";
import { COMPANY } from "@/lib/siteConfig";
import { openCookieSettings } from "@/lib/cookieConsent";

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-wrap">
        <div className="site-footer__grid">
          <div>
            <img
              src="/brand/tranziiq-logo.png"
              alt="TranziIQ"
              width="96"
              height="96"
              style={{ marginBottom: 12 }}
            />
            <p style={{ margin: 0, maxWidth: "32em" }}>
              Fleet operations software for road freight and goods transport
              operators in South Africa and the SADC region.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li>
                <a href="/#how-it-works">How it works</a>
              </li>
              <li>
                <a href="/#pricing">Pricing</a>
              </li>
              <li>
                <Link to="/login">Sign in</Link>
              </li>
              <li>
                <Link to="/register">Start 14-day free trial</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li>
                <Link to="/terms">Terms of service</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy policy (POPIA)</Link>
              </li>
              <li>
                <Link to="/cookies">Cookie policy</Link>
              </li>
              <li>
                <button type="button" onClick={openCookieSettings}>
                  Cookie settings
                </button>
              </li>
            </ul>
          </div>
        </div>
        {/* Supplier details required by section 43 of the Electronic
            Communications and Transactions Act 25 of 2002 */}
        <div className="site-footer__legal">
          <p style={{ margin: "0 0 6px" }}>
            © {year} {COMPANY.legalName}. Registration number{" "}
            {COMPANY.registrationNumber}.
            {COMPANY.vatNumber ? ` VAT number ${COMPANY.vatNumber}.` : ""}{" "}
            Directors: {COMPANY.directors}.
          </p>
          <p style={{ margin: 0 }}>
            {COMPANY.physicalAddress}. Email {COMPANY.email}. Phone{" "}
            {COMPANY.phone}.
          </p>
        </div>
      </div>
    </footer>
  );
}
