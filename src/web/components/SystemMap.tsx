import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const nodes = [
  { id: 'core', label: 'SIDDHANT', sub: 'CORE SYSTEM', x: 50, y: 50, color: '#F0EFEA', size: 'large' },
  { id: 'mera', label: 'MeraPolicyAdvisor', sub: 'FINANCIAL ENGINE', x: 20, y: 20, color: '#C9A84C', size: 'medium' },
  { id: 'saver', label: 'Super Saver', sub: 'AI OPTIMIZATION', x: 78, y: 22, color: '#00D4FF', size: 'medium' },
  { id: 'recall', label: 'Recall', sub: 'MEMORY LAYER', x: 18, y: 75, color: '#7B4FE8', size: 'medium' },
  { id: 'recflow', label: 'RecFlow',         sub: 'DEMO RECORDER',     x: 80, y: 76, color: '#FF3C3C', size: 'medium' },
];

const connections = [
  ['core', 'mera'],
  ['core', 'saver'],
  ['core', 'recall'],
  ['core', 'recflow'],
];

export default function SystemMap() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.25 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!sectionRef.current) return;
      gsap.fromTo(
        mapRef.current,
        { opacity: 0, scale: 0.85, y: 40 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'top 10%',
            toggleActions: 'play reverse play reverse',
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const getNodePos = (id: string) => nodes.find(n => n.id === id);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '8rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', marginBottom: '5rem' }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            color: '#00D4FF',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}
        >
          PRODUCT ECOSYSTEM
        </div>
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#F0EFEA',
            lineHeight: 1.0,
            margin: 0,
          }}
        >
          The architecture
          <br />
          <span style={{ fontStyle: 'italic', color: '#8A8A9A' }}>behind the brand.</span>
        </h2>
      </motion.div>

      {/* System map */}
      <div
        ref={mapRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '700px',
          height: '400px',
        }}
      >
        {/* SVG connection lines */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          <defs>
            <linearGradient id="line-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#7B4FE8" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {connections.map(([from, to], i) => {
            const f = getNodePos(from);
            const t = getNodePos(to);
            if (!f || !t) return null;
            return (
              <motion.line
                key={i}
                x1={`${f.x}%`} y1={`${f.y}%`}
                x2={`${t.x}%`} y2={`${t.y}%`}
                stroke="url(#line-cyan)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: 'power2.out' }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: 'back.out' }}
          >
            {node.size === 'large' ? (
              <div
                style={{
                  padding: '1rem 1.5rem',
                  background: 'rgba(10,10,22,0.96)',
                  border: '1px solid rgba(240,239,234,0.12)',
                  // backdropFilter removed — breaks macOS over WebGL
                  textAlign: 'center',
                  boxShadow: '0 0 40px rgba(255,255,255,0.04)',
                }}
              >
                <div
                  className="font-mono"
                  style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#4A4A6A', marginBottom: '0.3rem' }}
                >
                  FOUNDER
                </div>
                <div
                  className="font-display"
                  style={{ fontSize: '1.4rem', fontWeight: 700, color: node.color }}
                >
                  {node.label}
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: '0.55rem', color: '#4A4A6A', letterSpacing: '0.15em', marginTop: '0.3rem' }}
                >
                  {node.sub}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '0.6rem 1rem',
                  background: 'rgba(10,10,22,0.94)',
                  border: `1px solid ${node.color}22`,
                  // backdropFilter removed — breaks macOS over WebGL
                  textAlign: 'center',
                }}
              >
                <div
                  className="font-mono"
                  style={{ fontSize: '0.65rem', fontWeight: 700, color: node.color, letterSpacing: '0.05em' }}
                >
                  {node.label}
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: '0.5rem', color: '#4A4A6A', letterSpacing: '0.12em', marginTop: '0.2rem' }}
                >
                  {node.sub}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
