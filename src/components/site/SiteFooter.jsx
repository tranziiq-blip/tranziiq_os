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
            <h4>{COMPANY.legalName}</h4>
            <p style={{ margin: 0, maxWidth: "32em" }}>
              Fleet operations software for bulk haulage and mining-contract
              transport in South Africa and the SADC region.
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
                <Link to="/register">Start a pilot</Link>
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
