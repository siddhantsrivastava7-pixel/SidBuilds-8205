import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { DUR, SPRING_NAV, prefersReducedMotion } from "./motion";

const HIDE_THRESHOLD = 80;
const SCROLL_DELTA   = 8;

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { threshold: 0.35 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [ids]);
  return active;
}

export function Navbar() {
  const navRef      = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [hidden, setHidden] = useState(false);
  const reduced = prefersReducedMotion();

  const rawY    = useMotionValue(0);
  const springY = useSpring(rawY, SPRING_NAV);

  const active = useActiveSection(["hero", "products", "builds", "thinking", "about"]);

  useEffect(() => {
    function onScroll() {
      const y     = window.scrollY;
      const delta = y - lastScrollY.current;
      const nav   = navRef.current;

      if (nav) {
        const scrolled = y > 40;
        const p  = Math.min(Math.max((y - 40) / 120, 0), 1);
        const blur   = scrolled ? `blur(${20 + p * 8}px) saturate(${160 + p * 40}%)` : "none";
        const bg     = scrolled ? `rgba(4,6,9,${0.75 + p * 0.13})` : "transparent";
        const border = scrolled ? `rgba(255,255,255,${0.03 + p * 0.04})` : "transparent";
        const shadow = scrolled
          ? `0 1px 0 rgba(255,255,255,0.025), 0 ${4 + p * 8}px ${16 + p * 20}px rgba(0,0,0,${0.15 + p * 0.2})`
          : "none";
        nav.style.background    = bg;
        nav.style.backdropFilter = blur;
        (nav.style as any).WebkitBackdropFilter = blur;
        nav.style.borderBottomColor = border;
        nav.style.boxShadow = shadow;
      }

      if (!reduced) {
        if (y > HIDE_THRESHOLD) {
          if (delta > SCROLL_DELTA && !hidden) { setHidden(true); rawY.set(-100); }
          else if (delta < -SCROLL_DELTA && hidden) { setHidden(false); rawY.set(0); }
        } else if (hidden) { setHidden(false); rawY.set(0); }
      }
      lastScrollY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, reduced]);

  const links = [
    { label: "Products", id: "products" },
    { label: "Builds",   id: "builds"   },
    { label: "Thinking", id: "thinking" },
    { label: "About",    id: "about"    },
  ];

  return (
    <motion.nav
      ref={navRef as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DUR.slow, ease: "easeOut", delay: 0.1 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        y: reduced ? 0 : springY,
        background: "transparent",
        borderBottom: "1px solid transparent",
        transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
        willChange: "transform",
      }}
    >
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "0 1.25rem", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Brand */}
        <a
          href="#"
          style={{ textDecoration: "none", flexShrink: 0 }}
          onMouseEnter={e => {
            const spans = e.currentTarget.querySelectorAll("span");
            spans.forEach(s => (s as HTMLElement).style.color = "#ffffff");
          }}
          onMouseLeave={e => {
            const [sid, builds] = Array.from(e.currentTarget.querySelectorAll("span")) as HTMLElement[];
            if (sid)    sid.style.color    = "#ffffff";
            if (builds) builds.style.color = "rgba(255,255,255,0.65)";
          }}
        >
          <span style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#ffffff" }}>Sid</span>
            <span style={{ color: "rgba(255,255,255,0.65)", transition: "color 0.2s ease" }}>Builds</span>
          </span>
        </a>

        {/* Nav links — hidden on mobile via CSS */}
        <div className="sb-nav-links" style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {links.map(({ label, id }) => {
            const isActive = active === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                style={{
                  fontSize: "0.8125rem",
                  color: isActive ? "#9aa5b0" : "#5a6370",
                  textDecoration: "none",
                  fontWeight: isActive ? 500 : 400,
                  transition: `color ${DUR.micro}s ease`,
                  position: "relative",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#c4ccd4")}
                onMouseLeave={e => (e.currentTarget.style.color = isActive ? "#9aa5b0" : "#5a6370")}
              >
                {label}
                {isActive && (
                  <span style={{
                    position: "absolute", bottom: -6, left: "50%",
                    transform: "translateX(-50%)",
                    width: 3, height: 3, borderRadius: "50%",
                    background: "#3b82f6", opacity: 0.5,
                  }} />
                )}
              </a>
            );
          })}
        </div>

        {/* CTA — hidden on mobile via CSS */}
        <motion.a
          className="sb-nav-cta"
          href="#about"
          whileHover={reduced ? {} : {
            boxShadow: "0 0 12px rgba(59,130,246,0.18), 0 0 24px rgba(59,130,246,0.07)",
            borderColor: "rgba(59,130,246,0.36)",
            backgroundColor: "rgba(59,130,246,0.17)",
            color: "#a8cbfc",
            y: -1,
          }}
          whileTap={reduced ? {} : { y: 0, scale: 0.985 }}
          transition={{ duration: DUR.fast, ease: "easeOut" }}
          style={{
            display: "inline-flex", alignItems: "center",
            padding: "0.4375rem 1rem", borderRadius: 7,
            background: "rgba(59,130,246,0.12)",
            border: "1px solid rgba(59,130,246,0.2)",
            color: "#7baef8",
            fontSize: "0.8125rem", fontWeight: 500,
            textDecoration: "none", letterSpacing: "-0.005em",
          }}
        >
          Get in touch
        </motion.a>
      </div>
    </motion.nav>
  );
}
