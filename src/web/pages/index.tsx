import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { Products } from "../components/Products";
import { BuildLog } from "../components/BuildLog";
import { Principles } from "../components/Principles";
import { About } from "../components/About";
import { Footer } from "../components/Footer";

export default function Index() {
  return (
    <div style={{
      background: "#05070a",
      minHeight: "100vh",
      position: "relative",
    }}>
      {/* Noise overlay — extremely subtle */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.25,
      }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <Navbar />
        <Hero />
        <Products />
        <BuildLog />
        <Principles />
        <About />
        <Footer />
      </div>
    </div>
  );
}
