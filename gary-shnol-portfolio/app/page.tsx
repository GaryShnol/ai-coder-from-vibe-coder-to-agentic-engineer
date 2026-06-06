import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import Skills from "@/components/Skills";
import Education from "@/components/Education";
import MarketingAgent from "@/components/MarketingAgent";
import DigitalTwin from "@/components/DigitalTwin";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Experience />
        <Skills />
        <Education />
        <MarketingAgent />
        <DigitalTwin />
        <Contact />
      </main>
    </>
  );
}
