import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface MetricProps {
  value: string;
  label: string;
  sub?: string;
  accent: string;
  delay?: number;
}

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / 60;
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 20);
    return () => clearInterval(interval);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

function MetricCard({ value, label, sub, accent, delay = 0 }: MetricProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: '2.5rem',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Corner accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '40px',
          height: '40px',
          borderLeft: '1px solid rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }}
      />

      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)`,
          pointerEvents: 'none',
          filter: 'blur(20px)',
        }}
      />

      <div
        className="metric-number"
        style={{
          fontSize: 'clamp(3rem, 6vw, 5rem)',
          color: '#F0EFEA',
          marginBottom: '0.5rem',
          position: 'relative',
        }}
      >
        <span style={{ color: accent }}>{value}</span>
      </div>

      <div
        className="font-body"
        style={{
          fontSize: '1rem',
          color: '#F0EFEA',
          marginBottom: '0.4rem',
          fontWeight: 500,
        }}
      >
        {label}
      </div>

      {sub && (
        <div
          className="font-mono"
          style={{
            fontSize: '0.6rem',
            color: '#4A4A6A',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {sub}
        </div>
      )}
    </motion.div>
  );
}

export default function Metrics() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const metrics = [
    { value: '4+', label: 'Products launched', sub: 'AND COUNTING', accent: '#00D4FF' },
    { value: '₹50Cr+', label: 'Capital advised', sub: 'VIA MERAPOLICS', accent: '#C9A84C' },
    { value: '10K+', label: 'Users reached', sub: 'ACROSS PRODUCTS', accent: '#7B4FE8' },
    { value: '2+', label: 'Years building', sub: 'IN THE OPEN', accent: '#00D4FF' },
  ];

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '8rem 2rem',
        background: 'transparent',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Horizontal gradient line top */}
      <div className="gradient-line" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}
        >
          <div>
            <div
              className="font-mono"
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.3em',
                color: '#00D4FF',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              PROOF OF WORK
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#F0EFEA',
                lineHeight: 1.0,
                margin: 0,
              }}
            >
              Numbers that
              <br />
              <span style={{ fontStyle: 'italic', color: '#8A8A9A' }}>earn attention.</span>
            </h2>
          </div>

          <p
            className="font-body"
            style={{
              fontSize: '0.9rem',
              color: '#8A8A9A',
              maxWidth: '280px',
              lineHeight: 1.7,
              textAlign: 'right',
            }}
          >
            Not vanity metrics.
            <br />
            Evidence of systems that worked.
          </p>
        </motion.div>

        {/* Metrics grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5px',
          }}
        >
          {metrics.map((m, i) => (
            <MetricCard key={i} {...m} delay={i * 0.1} />
          ))}
        </div>
      </div>

      <div className="gradient-line" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
    </section>
  );
}
