import { getDictionary } from "@/app/[lang]/dictionaries";
import { profile } from "@/content/profile";
import { Button } from "./ui/Button";
import { Container } from "./ui/Container";
import { Eyebrow } from "./ui/Eyebrow";
import { Year } from "./ui/Year";

export async function Footer() {
  const { footer } = await getDictionary();
  const contacts = [
    { label: footer.emailPersonal, value: profile.emailPersonal, href: `mailto:${profile.emailPersonal}` },
    { label: footer.emailPro, value: profile.emailPro, href: `mailto:${profile.emailPro}` },
    { label: footer.phone, value: footer.phoneDisplay, href: profile.phoneHref },
  ];

  return (
    <footer id="contact" className="relative overflow-hidden bg-ink text-cream">
      <Container className="pt-24 md:pt-36">
        <Eyebrow className="text-cream/70">{footer.eyebrow}</Eyebrow>
        <h2 className="mt-6 max-w-4xl text-h1 font-medium">{footer.title}</h2>

        <div className="mt-14 grid gap-10 xl:grid-cols-[2fr_1fr]">
          <dl className="grid gap-6 md:grid-cols-3">
            {contacts.map((c) => (
              <div key={c.href}>
                <dt className="font-mono text-label uppercase text-cream/60">{c.label}</dt>
                <dd className="mt-2">
                  <a href={c.href} className="touch-target whitespace-nowrap text-lg underline decoration-cream/30 underline-offset-4 hover:text-gold hover:decoration-current">
                    {c.value}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-start gap-3 xl:justify-end">
            <Button href={profile.cv} variant="light" download arrow>
              {footer.cv}
            </Button>
            <Button href={profile.linkedin} variant="outlineLight">
              LinkedIn
            </Button>
            <Button href={profile.github} variant="outlineLight">
              GitHub
            </Button>
          </div>
        </div>

        <div className="mt-20 flex flex-wrap justify-between gap-4 border-t border-cream/15 py-6 font-mono text-label uppercase text-cream/60">
          <span>
            © <Year /> Clément Cochod
          </span>
          <span>{footer.made}</span>
        </div>
      </Container>
      <p
        aria-hidden
        className="pointer-events-none select-none bg-gradient-to-b from-sun via-coral to-transparent bg-clip-text px-4 text-center text-[22vw] font-medium leading-[0.75] tracking-[-0.06em] text-transparent"
      >
        Cochod
      </p>
    </footer>
  );
}
