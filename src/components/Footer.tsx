import { getDictionary } from "@/app/[lang]/dictionaries";
import { profile } from "@/content/profile";
import { Container } from "./ui/Container";
import { Eyebrow } from "./ui/Eyebrow";
import { Year } from "./ui/Year";
import "./footer.css";

export const HUD_CENTER = `${profile.name.toUpperCase()} — PORTFOLIO`;

function Arrow() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="footer-arrow" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M7 17 17 7M8 7h9v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export async function Footer() {
  const dict = await getDictionary();
  const { footer } = dict;
  const hud = dict.hud.sections.contact;
  // Several markers: the footer is too tall on phones to be 50 % in view as a whole.
  const hudAttrs = {
    "data-hud-left": hud.left,
    "data-hud-center": HUD_CENTER,
    "data-hud-right": hud.right,
  };
  const pills = [
    {
      label: footer.phone,
      value: footer.phoneDisplay,
      href: profile.phoneHref,
    },
    {
      label: footer.emailPro,
      value: profile.emailPro,
      href: `mailto:${profile.emailPro}`,
    },
    { label: "PDF", value: footer.cv, href: profile.cv, download: true },
    { label: "in", value: "LinkedIn", href: profile.linkedin, external: true },
    { label: "gh", value: "GitHub", href: profile.github, external: true },
  ];

  return (
    <footer id="contact" className="footer relative overflow-hidden text-cream">
      <div aria-hidden className="footer-glow" />
      <Container className="relative pt-28 md:pt-40">
        <div {...hudAttrs}>
          <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-3">
            <Eyebrow className="text-cream-dim">{footer.eyebrow}</Eyebrow>
            <p className="footer-status">
              <span aria-hidden className="footer-status-dot" />
              {footer.availability}
            </p>
          </div>

          <h2 className="footer-statement">
            <span className="footer-statement-line">{footer.statementTop}</span>
            <span className="footer-statement-line footer-statement-accent">{footer.statementBottom}</span>
          </h2>

          <div className="footer-lead-wrap">
            <p className="footer-lead">{footer.title}</p>
          </div>
        </div>

        <div {...hudAttrs} data-hud-stop="">
          <div className="footer-mail-block">
            <p className="font-mono text-label uppercase text-cream-dim">{footer.writeMe}</p>
            <a href={`mailto:${profile.emailPersonal}`} className="footer-email" aria-label={`${footer.emailAria} ${profile.emailPersonal}`}>
              <span className="footer-email-text">{profile.emailPersonal}</span>
              <Arrow />
            </a>
          </div>

          <ul className="footer-pills" role="list">
            {pills.map((p) => (
              <li key={p.href}>
                <a
                  href={p.href}
                  className="footer-pill"
                  {...(p.download ? { download: "" } : {})}
                  {...(p.external ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  <span className="footer-pill-label">{p.label}</span>
                  <span className="footer-pill-value">{p.value}</span>
                  <Arrow />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-bar" {...hudAttrs}>
          <span>
            © <Year /> Clément Cochod
          </span>
          <span>{footer.made}</span>
          <a href="#main" className="footer-top">
            {footer.backToTop} <span aria-hidden>↑</span>
          </a>
        </div>
      </Container>
      <p aria-hidden className="footer-wordmark">
        Cochod
      </p>
    </footer>
  );
}
