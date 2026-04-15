export default function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '2.5rem 3rem',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'rgba(5,5,8,0.97)',
      }}
    >
      <div
        className="font-mono"
        style={{
          fontSize: '0.6rem',
          color: '#4A4A6A',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        © 2024 Siddhant Srivastava — Sidbuilds
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <a
          href="https://x.com/EncrypticTV"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono"
          style={{
            fontSize: '0.6rem',
            color: '#4A4A6A',
            letterSpacing: '0.12em',
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#00D4FF')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#4A4A6A')}
        >
          X / Twitter
        </a>
        <a
          href="mailto:siddhantsrivastava7@gmail.com"
          className="font-mono"
          style={{
            fontSize: '0.6rem',
            color: '#4A4A6A',
            letterSpacing: '0.12em',
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#00D4FF')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#4A4A6A')}
        >
          Email
        </a>
      </div>

      <div className="font-mono" style={{ fontSize: '0.55rem', color: '#2A2A3A', letterSpacing: '0.1em' }}>
        SID.OS v2.4.1 — ALL SYSTEMS OPERATIONAL
      </div>
    </footer>
  );
}
