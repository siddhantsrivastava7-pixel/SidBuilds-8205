import { useState } from 'react';
import Loader from '../components/Loader';
import SystemBackground from '../components/SystemBackground';
import NavBar from '../components/NavBarDesktop';
import HeroSection from '../components/HeroSection';
import UniverseToSystem from '../components/UniverseToSystem';
import ProjectWorlds from '../components/ProjectWorlds';
import Manifesto from '../components/Manifesto';
import Metrics from '../components/Metrics';
import ClosingCTA from '../components/ClosingCTA';
import Footer from '../components/FooterDesktop';
import CursorGlow from '../components/CursorGlow';
import DepthLayer from '../components/DepthLayer';

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <Loader onComplete={() => setLoaded(true)} />}

      {loaded && (
        <>
          {/* Persistent infinite depth environment */}
          <SystemBackground />
          <CursorGlow />
          <NavBar />

          <main>
            {/* Hero + system map — no parallax offset, this IS the origin */}
            <DepthLayer speed={1} fadeIn={false}>
              <HeroSection />
              <UniverseToSystem />
            </DepthLayer>

            {/* Project worlds — mid layer, slightly slower than scroll */}
            <DepthLayer speed={0.97} fadeIn fadeRange={420} id="work-layer">
              <ProjectWorlds />
            </DepthLayer>

            {/* Manifesto — deeper, more resistance */}
            <DepthLayer speed={0.95} fadeIn fadeRange={380}>
              <Manifesto />
            </DepthLayer>

            {/* Metrics — deep layer */}
            <DepthLayer speed={0.94} fadeIn fadeRange={360}>
              <Metrics />
            </DepthLayer>

            {/* Closing CTA — deepest, most resistance, fades in slowly */}
            <DepthLayer speed={0.92} fadeIn fadeRange={500}>
              <ClosingCTA />
            </DepthLayer>
          </main>

          <DepthLayer speed={0.90} fadeIn fadeRange={300}>
            <Footer />
          </DepthLayer>
        </>
      )}
    </>
  );
}
