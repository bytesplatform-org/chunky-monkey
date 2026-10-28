import GLStage from "@/components/gl/GLStage";
import Preloader from "@/components/home/Preloader";
import Header from "@/components/home/Header";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import About from "@/components/home/About";
import Rides from "@/components/home/Rides";
import Promo from "@/components/home/Promo";
import Parks from "@/components/home/Parks";
import Parties from "@/components/home/Parties";
import Facilities from "@/components/home/Facilities";
import Visit from "@/components/home/Visit";
import Footer from "@/components/home/Footer";
import Reveals from "@/components/home/Reveals";
import Cursor from "@/components/home/Cursor";
import { rides } from "@/data/site";

export default function Home() {
  return (
    <GLStage>
      <Preloader />
      <Header />
      <main id="main" className="relative z-[1]">
        <Hero />
        {/* everything after the hero sits on solid night, covering the stage canvas */}
        <div className="relative bg-night">
          <Marquee items={rides.map(r => r.name)} className="border-y border-cream/10 py-6 text-[clamp(3rem,7vw,6.5rem)]" />
          <About />
          <Rides />
          <Promo />
          <Parks />
          <Parties />
          <Facilities />
          <Visit />
          <Footer />
        </div>
      </main>
      <Reveals />
      <Cursor />
    </GLStage>
  );
}
