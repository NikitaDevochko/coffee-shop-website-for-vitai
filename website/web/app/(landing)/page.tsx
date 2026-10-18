import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Assortment } from "@/components/sections/Assortment";
import { About } from "@/components/sections/Freshness";
import { Delivery } from "@/components/sections/Delivery";
import { Hero } from "@/components/sections/Hero";
import { LeadSection } from "@/components/sections/LeadSection";
import { Process } from "@/components/sections/Process";

export default function LandingPage() {
  return (
    <>
      {/* Шапка в обычном потоке: скроллится вместе со страницей. */}
      <Header />
      <main className="page__main">
        <Hero />
        <About />
        <Assortment />
        <Process />
        <Delivery />
        <LeadSection />
      </main>
      <Footer />
    </>
  );
}
