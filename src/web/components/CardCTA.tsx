import { useRef } from "react";
import { DUR } from "./motion";

interface CardCTAProps {
  label: string;
  color: string;       // resting color
  hoverColor: string;  // hover color
}

export function CardCTA({ label, color, hoverColor }: CardCTAProps) {
  const arrowRef = useRef<HTMLSpanElement>(null);
  const textRef  = useRef<HTMLSpanElement>(null);

  const onEnter = () => {
    if (arrowRef.current) arrowRef.current.style.transform = "translateX(4px)";
    if (textRef.current)  textRef.current.style.color = hoverColor;
  };
  const onLeave = () => {
    if (arrowRef.current) arrowRef.current.style.transform = "translateX(0)";
    if (textRef.current)  textRef.current.style.color = color;
  };

  return (
    <div
      style={{ marginTop: "2.5rem" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <span
        ref={textRef}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          fontSize: "0.875rem", fontWeight: 600,
          color, letterSpacing: "-0.01em",
          transition: `color ${DUR.fast}s ease`,
          userSelect: "none",
        }}
      >
        {label}
        <span
          ref={arrowRef}
          style={{
            display: "inline-block",
            transition: `transform ${DUR.fast}s ease`,
          }}
        >
          →
        </span>
      </span>
    </div>
  );
}
