// ── useScrollCamera ─────────────────────────────────────────────────────
// Tracks scroll with inertia + velocity. Single source of truth.
// All depth layers read from this. Updates via requestAnimationFrame.

import { useEffect, useRef } from 'react';

export interface ScrollState {
  raw: number;        // actual window.scrollY
  smooth: number;     // inertia-smoothed position
  velocity: number;   // px/frame (smoothed)
  depth: number;      // 0–1 normalised scroll progress
  momentum: number;   // 0–1, peaks on fast scroll, decays to 0
}

type Listener = (state: ScrollState) => void;

// ── Global singleton so all components share one RAF loop ────────────────
let _state: ScrollState = { raw: 0, smooth: 0, velocity: 0, depth: 0, momentum: 0 };
const _listeners = new Set<Listener>();
let _rafId: number | null = null;
let _lastSmooth = 0;
let _lastRaw = 0;
let _velSmooth = 0;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function tick() {
  _rafId = requestAnimationFrame(tick);

  const raw       = window.scrollY;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  // Inertia — smooth follows raw with ~180ms lag
  _lastSmooth = lerp(_lastSmooth, raw, 0.072);

  // Velocity — how fast raw is moving
  const rawDelta  = raw - _lastRaw;
  _lastRaw        = raw;
  _velSmooth      = lerp(_velSmooth, rawDelta, 0.18);

  // Momentum — peaks at fast scroll, decays to 0 when idle
  const momentumTarget = clamp(Math.abs(_velSmooth) / 18, 0, 1);
  const prevMomentum   = _state.momentum;
  const newMomentum    = prevMomentum < momentumTarget
    ? lerp(prevMomentum, momentumTarget, 0.22)   // fast rise
    : lerp(prevMomentum, momentumTarget, 0.035); // slow decay

  _state = {
    raw,
    smooth:   _lastSmooth,
    velocity: _velSmooth,
    depth:    clamp(_lastSmooth / maxScroll, 0, 1),
    momentum: newMomentum,
  };

  _listeners.forEach(fn => fn(_state));
}

function startGlobal() {
  if (_rafId !== null) return;
  _lastSmooth = window.scrollY;
  _lastRaw    = window.scrollY;
  tick();
}

function stopGlobal() {
  if (_rafId !== null) { cancelAnimationFrame(_rafId); _rafId = null; }
}

// ── Hook ─────────────────────────────────────────────────────────────────
export function useScrollCamera(onUpdate: (s: ScrollState) => void) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  useEffect(() => {
    const listener: Listener = (s) => cbRef.current(s);
    _listeners.add(listener);
    startGlobal();
    // Deliver current state immediately
    listener(_state);
    return () => {
      _listeners.delete(listener);
      if (_listeners.size === 0) stopGlobal();
    };
  }, []);
}

// ── Direct read (for canvas loops that run their own RAF) ────────────────
export function getScrollState(): ScrollState { return _state; }
export function initScrollCamera() { startGlobal(); }
