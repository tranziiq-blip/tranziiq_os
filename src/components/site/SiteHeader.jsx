import { Link } from "react-router-dom";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-wrap site-header__row">
        <Link to="/" className="site-logo" aria-label="TranziIQ home">
          Tranzi<span>IQ</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <a href="/#how-it-works">How it works</a>
          <a href="/#modules">What it covers</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#faq">Questions</a>
        </nav>
        <div className="site-header__actions">
          <Link to="/login" className="btn btn-quiet site-signin">
            Sign in
          </Link>
          <Link to="/register" className="btn btn-primary">
            Start a pilot
          </Link>
        </div>
      </div>
    </header>
  );
}
