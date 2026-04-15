import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = ['Work', 'Manifesto', 'Contact'];

  return (
    <motion.nav
      className="navbar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: scrolled ? 'rgba(5,5,8,0.96)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.04)' : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00D4FF',
            boxShadow: '0 0 12px #00D4FF',
          }}
        />
        <span
          className="font-mono"
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            color: '#F0EFEA',
            textTransform: 'uppercase',
          }}
        >
          Sidbuilds
        </span>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        {navLinks.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="font-mono"
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              color: '#8A8A9A',
              textDecoration: 'none',
              textTransform: 'uppercase',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#00D4FF')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8A8A9A')}
          >
            {link}
          </a>
        ))}
        <a
          href="https://x.com/EncrypticTV"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
            color: '#8A8A9A',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.4)';
            (e.currentTarget as HTMLElement).style.color = '#00D4FF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
            (e.currentTarget as HTMLElement).style.color = '#8A8A9A';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
      </div>
    </motion.nav>
  );
}
