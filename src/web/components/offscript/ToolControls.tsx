import { DUR } from "../motion";

export type Mode      = "Raw Human" | "Frustrated Rant" | "Founder Voice" | "Casual Internet" | "Sharp Opinion";
export type Emotion   = "Frustration" | "Disbelief" | "Curiosity" | "Confidence" | "Annoyance";
export type Intensity = "Light" | "Medium" | "Aggressive";

export interface ToolOptions {
  mode:      Mode;
  emotion:   Emotion;
  intensity: Intensity;
}

interface Props {
  input:     string;
  options:   ToolOptions;
  loading:   boolean;
  onInput:   (v: string) => void;
  onOptions: (o: ToolOptions) => void;
  onSubmit:  () => void;
  onClear:   () => void;
  onSample:  () => void;
}

const SAMPLE = `In today's fast-paced world, it is more important than ever to leverage the power of effective communication. This comprehensive guide will walk you through the key strategies that successful professionals use to enhance their messaging. Furthermore, it is worth noting that clear, concise communication can significantly improve your outcomes. In conclusion, by implementing these proven techniques, you will be well-positioned to achieve your goals.`;

const MODES:      Mode[]      = ["Raw Human", "Frustrated Rant", "Founder Voice", "Casual Internet", "Sharp Opinion"];
const EMOTIONS:   Emotion[]   = ["Frustration", "Disbelief", "Curiosity", "Confidence", "Annoyance"];
const INTENSITIES: Intensity[] = ["Light", "Medium", "Aggressive"];

function Selector<T extends string>({
  label, options, value, onChange,
}: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <div style={{ fontSize: "0.625rem", fontWeight: 600, color: "#2a3540", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: "0.3rem 0.625rem",
              borderRadius: 5,
              border: `1px solid ${value === opt ? "rgba(201,146,60,0.4)" : "rgba(255,255,255,0.06)"}`,
              background: value === opt ? "rgba(201,146,60,0.12)" : "rgba(255,255,255,0.02)",
              color: value === opt ? "#c9923c" : "#3d4d5c",
              fontSize: "0.75rem", fontWeight: value === opt ? 600 : 400,
              cursor: "pointer",
              transition: `all ${DUR.fast}s ease`,
            }}
            onMouseEnter={e => { if (value !== opt) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { if (value !== opt) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ToolControls({ input, options, loading, onInput, onOptions, onSubmit, onClear, onSample }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          value={input}
          onChange={e => onInput(e.target.value)}
          placeholder="Paste AI-written content here…"
          rows={9}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(6,10,15,0.8)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "1rem 1.125rem",
            color: "#8b98a5",
            fontSize: "0.875rem", lineHeight: 1.7,
            fontFamily: "Inter, sans-serif",
            resize: "vertical",
            outline: "none",
            transition: `border-color ${DUR.fast}s ease`,
          }}
          onFocus={e => ((e.target as HTMLTextAreaElement).style.borderColor = "rgba(201,146,60,0.3)")}
          onBlur={e  => ((e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.06)")}
        />
        {/* Char count */}
        {input.length > 0 && (
          <div style={{ position: "absolute", bottom: 10, right: 12, fontSize: "0.65rem", color: "#1e2a32" }}>
            {input.split(/\s+/).filter(Boolean).length} words
          </div>
        )}
      </div>

      {/* Selectors */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", padding: "1rem 1.125rem", background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10 }}>
        <Selector label="Mode"      options={MODES}       value={options.mode}      onChange={v => onOptions({ ...options, mode: v })} />
        <Selector label="Emotion"   options={EMOTIONS}    value={options.emotion}   onChange={v => onOptions({ ...options, emotion: v })} />
        <Selector label="Intensity" options={INTENSITIES} value={options.intensity} onChange={v => onOptions({ ...options, intensity: v })} />
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
        <button
          onClick={onSubmit}
          disabled={loading || !input.trim()}
          style={{
            flex: 1, minWidth: 140,
            padding: "0.75rem 1.5rem",
            background: loading || !input.trim() ? "rgba(201,146,60,0.12)" : "#c9923c",
            color: loading || !input.trim() ? "#4a3a1a" : "#05070a",
            border: "none", borderRadius: 9,
            fontSize: "0.875rem", fontWeight: 700,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            transition: `all ${DUR.fast}s ease`,
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={e => { if (!loading && input.trim()) (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
        >
          {loading ? "Processing…" : "De-AI This →"}
        </button>

        <button onClick={onSample} style={{
          padding: "0.75rem 1rem",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 9, color: "#3d4d5c",
          fontSize: "0.8rem", fontWeight: 500, cursor: "pointer",
          transition: `all ${DUR.fast}s ease`,
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#6a7a88"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#3d4d5c"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
        >
          Use sample
        </button>

        {input && (
          <button onClick={onClear} style={{
            padding: "0.75rem 1rem",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: 9, color: "#2a3540",
            fontSize: "0.8rem", cursor: "pointer",
            transition: `color ${DUR.fast}s ease`,
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#4a5562")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#2a3540")}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export { SAMPLE };
