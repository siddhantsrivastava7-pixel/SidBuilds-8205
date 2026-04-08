import { motion } from "framer-motion";
import { useInView } from "./useInView";
import { DUR, EASE_OUT } from "./motion";

export function Footer() {
  const { ref, inView } = useInView({ threshold: 0.15 });

  return (
    <footer
      ref={ref as React.RefObject<HTMLDivElement>}
      className="sb-section"
      style={{ padding: "0 2.5rem", marginTop: 160, paddingBottom: "4rem" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "4rem" }}>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: DUR.enter, ease: EASE_OUT }}
            className="sb-footer-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr",
              gap: "2rem",
              marginBottom: "5rem",
            }}
          >
            {/* Left */}
            <div>
              <div style={{
                fontSize: "0.875rem", fontWeight: 700,
                color: "#3d4d5c", letterSpacing: "-0.02em", marginBottom: "0.875rem",
              }}>
                SidBuilds
              </div>
              <p style={{
                fontSize: "0.8125rem", color: "#1e2a32",
                lineHeight: 1.65, margin: 0, maxWidth: 220,
              }}>
                Building in fintech and developer tooling. Sharing the process.
              </p>
            </div>

            {/* Center */}
            <div>
              <div style={{
                fontSize: "0.6875rem", color: "#1a2530",
                textTransform: "uppercase", letterSpacing: "0.08em",
                fontWeight: 600, marginBottom: "1.25rem",
              }}>
                Products
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {["MeraPolicyAdvisor", "Super Saver"].map((p) => (
                  <a key={p} href="#products" style={{
                    fontSize: "0.8125rem", color: "#2a3540",
                    textDecoration: "none", transition: "color 0.2s ease",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#8b98a5")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#2a3540")}
                  >
                    {p}
                  </a>
                ))}
              </div>
            </div>

            {/* Right */}
            <div>
              <div style={{
                fontSize: "0.6875rem", color: "#1a2530",
                textTransform: "uppercase", letterSpacing: "0.08em",
                fontWeight: 600, marginBottom: "1.25rem",
              }}>
                Connect
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[{ label: "Twitter / X", href: "https://x.com/EncrypticTV" }, { label: "GitHub", href: "https://github.com/siddhantsrivastava7-pixel/" }].map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: "0.8125rem", color: "#2a3540",
                    textDecoration: "none", transition: "color 0.2s ease",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#8b98a5")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#2a3540")}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: DUR.enter, ease: EASE_OUT, delay: 0.08 }}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span style={{ fontSize: "0.75rem", color: "#1a2530" }}>© 2024 SidBuilds</span>
            <span style={{ fontSize: "0.75rem", color: "#151d24" }}>Built in public.</span>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
