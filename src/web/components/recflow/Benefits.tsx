import { motion } from 'framer-motion';

const BENEFITS = [
  {
    number: '01',
    title: 'Instant setup.',
    sub: 'No plugins. No config.',
    body: 'Open the app, click record. RecFlow handles camera access, screen selection, and audio routing automatically. From cold start to recording in under 5 seconds.',
    icon: '⚡',
  },
  {
    number: '02',
    title: 'Screen + webcam.',
    sub: 'Captured in perfect sync.',
    body: 'Your face and your product on screen at the same time. PIP webcam overlay or side-by-side — your choice. One recording session, two feeds, zero drift.',
    icon: '⬛',
  },
  {
    number: '03',
    title: 'Clean output.',
    sub: 'Ship-ready in seconds.',
    body: 'MP4 export optimized for Loom, Twitter, landing pages, email. Trim silences automatically. Add a shareable link. Your demo looks professional without post-production.',
    icon: '◎',
  },
];

export default function Benefits() {
  return (
    <section style={{ position: 'relative', zIndex: 1, padding: '4rem 2rem 8rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginBottom: '4rem' }}
        >
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.3em', color: '#FF3C3C', textTransform: 'uppercase', marginBottom: '1rem' }}>
            WHY RECFLOW
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 'clamp(2rem,4vw,3.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            margin: 0,
            color: '#F0EFEA',
          }}>
            Built for speed.<br />
            <span style={{ fontStyle: 'italic', color: '#8A8A9A' }}>Designed for clarity.</span>
          </h2>
        </motion.div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5px' }}>
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.number}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              style={{
                position: 'relative',
                padding: '2.5rem',
                background: 'rgba(13,13,26,0.7)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(16px)',
                overflow: 'hidden',
              }}
            >
              {/* Top accent line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                background: 'linear-gradient(90deg, #FF3C3C, transparent)',
                opacity: 0.55,
              }} />

              {/* Number */}
              <div style={{
                fontFamily: "'Space Mono',monospace",
                fontSize: '0.5rem',
                letterSpacing: '0.2em',
                color: '#4A4A6A',
                marginBottom: '1.5rem',
              }}>
                {b.number}
              </div>

              {/* Icon */}
              <div style={{ fontSize: '1.5rem', marginBottom: '1.2rem', opacity: 0.7 }}>
                {b.icon}
              </div>

              {/* Title */}
              <h3 style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: '1.35rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#F0EFEA',
                margin: '0 0 0.3rem 0',
              }}>
                {b.title}
              </h3>

              {/* Sub */}
              <div style={{
                fontFamily: "'Space Mono',monospace",
                fontSize: '0.5rem',
                letterSpacing: '0.1em',
                color: '#FF3C3C',
                opacity: 0.75,
                marginBottom: '1.2rem',
              }}>
                {b.sub.toUpperCase()}
              </div>

              {/* Body */}
              <p style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: '0.875rem',
                color: '#8A8A9A',
                lineHeight: 1.75,
                margin: 0,
              }}>
                {b.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
