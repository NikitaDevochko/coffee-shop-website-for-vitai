import { Assortment } from "@/components/sections/Assortment";
import { Contacts } from "@/components/sections/Contacts";
import { Delivery } from "@/components/sections/Delivery";
import { Freshness } from "@/components/sections/Freshness";
import { Hero } from "@/components/sections/Hero";
import { LeadSection } from "@/components/sections/LeadSection";
import { Subscription } from "@/components/sections/Subscription";
import { site } from "@/lib/content/site";

function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p className="footer__brand">Обжарка «Кварта», {site.city}</p>
        <p className="footer__meta">
          {site.address.full} · {site.hoursLine}
        </p>
        <p className="footer__links">
          <a
            className="footer__link"
            href={site.social.instagram.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            {site.social.instagram.label}
          </a>
          <a
            className="footer__link"
            href={site.social.telegram.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            {site.social.telegram.label}
          </a>
          <a className="footer__link" href="#lead">
            Заявка
          </a>
        </p>
        <p className="footer__note">
          © {new Date().getFullYear()} «Кварта». Жарим партиями по 5 кг с {site.foundedYear} года,
          привозим по пятницам.
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="page__main">
      <Hero />
      <Freshness />
      <Assortment />
      <Subscription />
      <Delivery />
      <Contacts />
      <LeadSection />
      <SiteFooter />
    </main>
  );
}
