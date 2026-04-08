import { useState } from "react";
import { ToolControls, SAMPLE } from "./ToolControls";
import { ToolResults } from "./ToolResults";
import { processText } from "./processor";
import type { ToolOptions } from "./ToolControls";
import type { ProcessResult } from "./ToolResults";

const DEFAULT_OPTIONS: ToolOptions = {
  mode:      "Raw Human",
  emotion:   "Confidence",
  intensity: "Medium",
};

export function DeAiTool() {
  const [input,   setInput]   = useState("");
  const [options, setOptions] = useState<ToolOptions>(DEFAULT_OPTIONS);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<ProcessResult | null>(null);

  const submit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await processText(input, options);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setInput("");
    setResult(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: "1.5rem" }} className="sb-tool-grid">
      {/* Left — input */}
      <ToolControls
        input={input}
        options={options}
        loading={loading}
        onInput={setInput}
        onOptions={setOptions}
        onSubmit={submit}
        onClear={clear}
        onSample={() => setInput(SAMPLE)}
      />

      {/* Right — output */}
      {(result || loading) && (
        <div>
          {loading && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 200, color: "#2a3540", fontSize: "0.8125rem",
              border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10,
              gap: "0.625rem",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c9923c", display: "inline-block", animation: "sb-pulse 1.2s ease-in-out infinite" }} />
              Processing…
            </div>
          )}
          {result && !loading && <ToolResults result={result} />}
        </div>
      )}
    </div>
  );
}
