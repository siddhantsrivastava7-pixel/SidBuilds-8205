// Pure CSS cosmic background — always renders, used as base layer
// WebGL canvas sits on top when available
export default function CosmicBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(123, 79, 232, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(0, 212, 255, 0.07) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(123, 79, 232, 0.05) 0%, transparent 70%),
          #050508
        `,
      }}
    >
      {/* CSS star field */}
      {Array.from({ length: 80 }).map((_, i) => {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 2 + 0.5;
        const opacity = Math.random() * 0.6 + 0.1;
        const delay = Math.random() * 4;
        const duration = Math.random() * 3 + 2;
        const colorRand = Math.random();
        const color = colorRand < 0.6 ? '#F0EFEA' : colorRand < 0.85 ? '#00D4FF' : '#7B4FE8';
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: color,
              opacity,
              boxShadow: color === '#00D4FF' ? `0 0 ${size * 3}px ${color}` : 'none',
              animation: `twinkle ${duration}s ${delay}s ease-in-out infinite alternate`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes twinkle {
          from { opacity: 0.1; }
          to { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
