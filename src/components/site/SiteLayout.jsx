import { useEffect } from "react";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./site.css";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

export default function SiteLayout({ title, children }) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
  return (
    <div className="site">
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
