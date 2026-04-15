import { motion } from 'framer-motion';

export default function RecFlowCTA() {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '6rem 2rem 10rem',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 45% at 50% 55%, rgba(255,60,60,0.09) 0%, transparent 65%)',
        }}
      />

      {/* Divider */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,60,60,0.2), transparent)', marginBottom: '7rem' }} />

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            fontFamily: "'Space Mono',monospace",
            fontSize: '0.58rem',
            letterSpacing: '0.3em',
            color: '#FF3C3C',
            textTransform: 'uppercase',
            marginBottom: '2rem',
          }}
        >
          EARLY ACCESS
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, delay: 0.05 }}
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 'clamp(2.5rem,5vw,4.2rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            color: '#F0EFEA',
            margin: '0 0 1.5rem 0',
          }}
        >
          Stop overthinking demos.
          <br />
          <span style={{ fontStyle: 'italic', color: '#8A8A9A' }}>Just record.</span>
        </motion.h2>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.15 }}
          style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: '1.05rem',
            color: '#8A8A9A',
            lineHeight: 1.7,
            margin: '0 0 3.5rem 0',
          }}
        >
          RecFlow is in active development. Join the early access list
          and be first to ship cleaner demos, faster.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          {/* Primary */}
          <a
            href="mailto:sid@example.com?subject=RecFlow Early Access"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: "'Space Mono',monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              color: '#050508',
              background: '#FF3C3C',
              border: '1px solid #FF3C3C',
              padding: '0.85rem 2rem',
              textDecoration: 'none',
              transition: 'background 0.25s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#E02020';
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#FF3C3C';
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#050508', display: 'inline-block' }} />
            GET EARLY ACCESS
          </a>

          {/* Secondary */}
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: "'Space Mono',monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              color: '#8A8A9A',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '0.85rem 2rem',
              cursor: 'pointer',
              transition: 'color 0.25s ease, border-color 0.25s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#F0EFEA';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#8A8A9A';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            WATCH DEMO
          </button>
        </motion.div>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            fontFamily: "'Space Mono',monospace",
            fontSize: '0.5rem',
            letterSpacing: '0.1em',
            color: '#4A4A6A',
            marginTop: '2rem',
          }}
        >
          NO SPAM. NOTIFIED WHEN EARLY ACCESS OPENS. THAT'S IT.
        </motion.p>
      </div>
    </section>
  );
}
