import { Footer } from "@/components/Footer";
import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
import { AvatarLayerLazy } from "@/components/three/avatar/AvatarLayerLazy";
import { Hero } from "@/components/sections/Hero";
import { Journey } from "@/components/sections/Journey";
import { Manifesto } from "@/components/sections/Manifesto";
import { ProjectGrid } from "@/components/sections/ProjectGrid";
import { Skills } from "@/components/sections/Skills";
import { journey } from "@/content/journey";
import { featuredProjects, otherProjects } from "@/content/projects";
import { skills } from "@/content/skills";
import { getDictionary, getLocale } from "./dictionaries";

export default async function Home() {
  const [dict, lang] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <>
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero lang={lang} copy={dict.hero} />
        <Manifesto copy={dict.manifesto} index="01" />
        <FeaturedProjects id="projets" index="02" lang={lang} copy={dict.projects} projects={featuredProjects} />
        <ProjectGrid index="03" lang={lang} copy={dict.projects} projects={otherProjects} />
        <Skills id="stack" index="04" lang={lang} copy={dict.skills} skills={skills} />
        <Journey id="parcours" index="05" lang={lang} copy={dict.journey} steps={journey} />
      </main>
      <Footer />
      <AvatarLayerLazy />
    </>
  );
}
