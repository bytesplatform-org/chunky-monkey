import GLStage from "@/components/gl/GLStage";
import Preloader from "@/components/home/Preloader";
import Header from "@/components/home/Header";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import About from "@/components/home/About";
import Rides from "@/components/home/Rides";
import Attractions from "@/components/home/Attractions";
import Gallery from "@/components/home/Gallery";
import ParkTour from "@/components/home/ParkTour";
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
        {/* the page is solid colour, covering the stage canvas, except where the tour opens a window onto it */}
        <div className="relative bg-cream text-night">
          <div className="bg-yellow">
            <Marquee items={rides.map(r => r.name)} className="py-[0.2em] text-[clamp(3rem,7vw,6.5rem)]" />
          </div>
          <About />
          <Rides />
          <Parks />
        </div>
        <ParkTour />
        <div className="relative bg-cream text-night">
          <Attractions />
          <Promo />
          <Gallery />
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
