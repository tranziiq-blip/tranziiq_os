import SiteLayout from "@/components/site/SiteLayout";
import { LEGAL } from "@/lib/siteConfig";

export default function LegalLayout({ title, intro, sections }) {
  return (
    <SiteLayout title={`${title} | TranziIQ`}>
      <div className="legal">
        <div className="site-wrap legal__grid">
          <nav className="legal__toc" aria-label="On this page">
            <strong>On this page</strong>
            <ol>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>
          <article className="legal__doc">
            <h1 className="site-h2">{title}</h1>
            <p className="legal__meta">Effective {LEGAL.effectiveDate}</p>
            {intro}
            {sections.map((s) => (
              <section key={s.id} aria-labelledby={s.id}>
                <h2 id={s.id}>{s.title}</h2>
                {s.body}
              </section>
            ))}
          </article>
        </div>
      </div>
    </SiteLayout>
  );
}
