import About from "@/components/About";
import Career from "@/components/Career";
import Certifications from "@/components/Certifications";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Skills from "@/components/Skills";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
        <Career />
        <Certifications />
        <Skills />
      </main>
      <Footer />
    </div>
  );
}
