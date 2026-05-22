// widgets.jsx — small reusable bits for the Xusta prototype

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Global font injection (runs once) ───────────────────────────────────────
// Loads Plus Jakarta Sans (UI) + JetBrains Mono (prices/numbers) + Pacifico
// (Xusta script wordmark) from Google Fonts, then injects base CSS that:
//   • sets the app-wide font stack
//   • defines .mono with tabular-nums (stops digit-width jitter on live prices)
//   • defines .script for the Xusta wordmark
//   • enables subpixel antialiasing on the body
if (typeof document !== 'undefined' && !document.getElementById('xusta-global-styles')) {
  // Google Fonts link
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600;1,700&family=JetBrains+Mono:wght@400;500;600;700&family=Pacifico&display=swap';
  document.head.appendChild(link);

  // Base CSS
  const style = document.createElement('style');
  style.id = 'xusta-global-styles';
  style.textContent = `
    /* ── App-wide font stack ─────────────────────────────── */
    body, #root, [data-xusta-root] {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      line-height: 1.4;
    }

    /* ── Monospace: prices, quantities, % changes ─────────── */
    /* tabular-nums is CRITICAL — stops layout jitter as digits change width */
    .mono {
      font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum" 1;
      letter-spacing: -0.01em;
    }

    /* ── Script: Xusta brand wordmark ─────────────────────── */
    .script {
      font-family: 'Pacifico', 'Dancing Script', cursive;
      font-style: normal;
      letter-spacing: 0.01em;
    }

    /* ── Button / input font inheritance ──────────────────── */
    button, input, select, textarea {
      font-family: inherit;
    }

    /* ── Uppercase label standard ─────────────────────────── */
    .label-caps {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
  `;
  document.head.appendChild(style);
}

// ── tokens (theme + density) ────────────────────────────────────────────────
// Single source of truth — all screens read from here.
function useTokens(dark, density, brand) {
  return useMemo(() => {
    const compact = density === 'compact';
    // Brand color → headers, logo, active tabs, action accents.
    // Up/Down → always green/red for price semantics (independent of brand).
    // Same light pink accent in both themes.
    const accent = 'oklch(0.82 0.10 14)';
    // Work in any color space — accent may be oklch/hex/rgb.
    const mix = (a, pct) => `color-mix(in oklch, ${a} ${pct}%, transparent)`;
    const T = {
      // surfaces — light mode picks up a faint pink wash
      bg:       dark ? 'oklch(0.17 0.012 240)' : 'oklch(0.985 0.008 12)',
      surface:  dark ? 'oklch(0.215 0.014 240)' : 'oklch(1 0 0)',
      surface2: dark ? 'oklch(0.26 0.016 240)'  : 'oklch(0.965 0.012 12)',
      surface3: dark ? 'oklch(0.30 0.018 240)'  : 'oklch(0.93 0.018 12)',
      border:   dark ? 'oklch(0.32 0.014 240)'  : 'oklch(0.89 0.018 12)',
      borderS:  dark ? 'oklch(0.28 0.012 240 / 0.6)' : 'oklch(0.9 0.015 12 / 0.75)',
      // text — light mode keeps a touch of warmth
      text:     dark ? 'oklch(0.97 0 0)' : 'oklch(0.22 0.018 12)',
      text2:    dark ? 'oklch(0.72 0.012 240)' : 'oklch(0.45 0.015 12)',
      text3:    dark ? 'oklch(0.52 0.012 240)' : 'oklch(0.62 0.015 12)',
      // brand accent (customizable — headers, logo, active states)
      brand:    accent,
      brandSoft: mix(accent, 55),
      brandDim:  mix(accent, dark ? 18 : 22),
      // price semantics — always green/red regardless of brand
      up:       'oklch(0.86 0.22 155)',
      upSoft:   'oklch(0.86 0.22 155 / 0.55)',
      upDim:    dark ? 'oklch(0.86 0.22 155 / 0.16)' : 'oklch(0.86 0.22 155 / 0.18)',
      down:     'oklch(0.70 0.22 22)',
      downSoft: 'oklch(0.82 0.10 22)',
      downDim:  dark ? 'oklch(0.70 0.22 22 / 0.18)'  : 'oklch(0.70 0.22 22 / 0.14)',
      info:     'oklch(0.72 0.16 245)',
      warn:     'oklch(0.82 0.16 78)',
      // density
      row:      compact ? 40 : 52,
      rowPad:   compact ? '6px 12px' : '10px 14px',
      gap:      compact ? 6 : 10,
      gutter:   compact ? 12 : 16,
      sz: {
        xs: compact ? 9.5 : 10.5,
        sm: compact ? 11 : 12,
        md: compact ? 12.5 : 14,
        lg: compact ? 15 : 17,
        xl: compact ? 19 : 22,
        xxl: compact ? 26 : 30,
      },
      radius: { sm: 6, md: 10, lg: 14, xl: 20 },
      dark, compact,
    };
    return T;
  }, [dark, density, brand]);
}

// ── format helpers ──────────────────────────────────────────────────────────
const fmtINR = (n, dec = 2) => {
  const sign = n < 0 ? '−' : '';
  const x = Math.abs(n);
  // Indian grouping: 1,23,456.78
  const [intPart, decPart] = x.toFixed(dec).split('.');
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return sign + grouped + (dec ? '.' + decPart : '');
};
const fmtPct = (n) => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2) + '%';
const fmtSignedINR = (n, dec = 2) => (n >= 0 ? '+' : '−') + fmtINR(Math.abs(n), dec);

// Render a full instrument label.
// Equity:  HDFCBANK
// Future:  BANKNIFTY MAY FUT
// Option:  BANKNIFTY MAY 46000 CE
const instrumentLabel = (p) => {
  if (!p) return '';
  if (p.type === 'FUT') return `${p.symbol}${p.expiry ? ' ' + p.expiry : ''} FUT`;
  if (p.type === 'OPT' || p.opt) {
    const parts = [p.symbol];
    if (p.expiry) parts.push(p.expiry);
    if (p.strike != null) parts.push(String(p.strike));
    if (p.opt) parts.push(p.opt);
    return parts.join(' ');
  }
  return p.symbol;
};

// ── AnimatedNumber: flash up/down when value changes ────────────────────────
function AnimatedNumber({ value, format = (v) => v.toFixed(2), T, style }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState(null);
  useEffect(() => {
    if (value === prev.current) return;
    setFlash(value > prev.current ? 'up' : 'down');
    prev.current = value;
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [value]);
  const color = flash === 'up' ? T.up : flash === 'down' ? T.down : (style?.color || T.text);
  return (
    <span className="mono" style={{
      ...style, color,
      fontVariantNumeric: 'tabular-nums',
      transition: 'color 0.5s ease',
    }}>{format(value)}</span>
  );
}

// ── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ data, width = 60, height = 22, color = '#34d399', fill = true, strokeWidth = 1.5 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 2) - 1]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  const last = data[data.length - 1], first = data[0];
  const up = last >= first;
  const c = color || (up ? '#34d399' : '#f87171');
  const gid = useMemo(() => 'sg' + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="0.25" />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
        </>
      )}
      <path d={path} fill="none" stroke={c} strokeWidth={strokeWidth}
            strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={1.5} fill={c} />
    </svg>
  );
}

// ── Big chart with hover crosshair ──────────────────────────────────────────
function PriceChart({ data, color, T, height = 140 }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => {
      if (ref.current) setW(ref.current.offsetWidth);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const pad = 8;
  const innerH = height - pad * 2;
  const pts = data.map((v, i) => [i * stepX, pad + innerH - ((v - min) / range) * innerH]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${w},${height} L0,${height} Z`;
  const up = data[data.length - 1] >= data[0];
  const c = color || (up ? T.up : T.down);

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const i = Math.max(0, Math.min(data.length - 1, Math.round(x / stepX)));
    setHover({ i, x: pts[i][0], y: pts[i][1] });
  };

  return (
    <div ref={ref} style={{ position: 'relative', height, userSelect: 'none', touchAction: 'none' }}
         onMouseMove={onMove} onMouseLeave={() => setHover(null)}
         onTouchMove={(e) => {
           const t = e.touches[0];
           onMove({ clientX: t.clientX, clientY: t.clientY });
         }}
         onTouchEnd={() => setHover(null)}>
      <svg width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="pc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.3" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1="0" x2={w} y1={pad + innerH * f} y2={pad + innerH * f}
                stroke={T.borderS} strokeDasharray="2 4" strokeWidth="0.5" />
        ))}
        <path d={area} fill="url(#pc-grad)" />
        <path d={path} fill="none" stroke={c} strokeWidth="1.75"
              strokeLinecap="round" strokeLinejoin="round" />
        {hover && (
          <>
            <line x1={hover.x} x2={hover.x} y1={0} y2={height}
                  stroke={T.text3} strokeWidth="0.5" strokeDasharray="3 3" />
            <circle cx={hover.x} cy={hover.y} r={5} fill={T.bg} stroke={c} strokeWidth="2" />
          </>
        )}
        {!hover && (
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]}
                  r={3} fill={c} />
        )}
      </svg>
      {hover && (
        <div className="mono" style={{
          position: 'absolute',
          left: Math.min(Math.max(0, hover.x - 30), w - 60),
          top: 4,
          fontSize: T.sz.xs, color: T.text, background: T.surface3,
          padding: '2px 6px', borderRadius: 4, pointerEvents: 'none',
        }}>{fmtINR(data[hover.i])}</div>
      )}
    </div>
  );
}

// ── LivePulse: little blinking dot ──────────────────────────────────────────
function LivePulse({ color = '#34d399', size = 6 }) {
  return (
    <span style={{
      position: 'relative', display: 'inline-block',
      width: size, height: size,
    }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, animation: 'xusta-pulse 1.6s ease-out infinite',
      }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color,
      }} />
      <style>{`
        @keyframes xusta-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          80%,100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>
    </span>
  );
}

// ── DraggableQuantity: drag the number left/right to scrub ──────────────────
function DraggableQuantity({ value, onChange, T, min = 0, max = 99999, step = 1 }) {
  const startRef = useRef({ x: 0, val: 0 });
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);

  const onPointerDown = (e) => {
    if (editing) return;
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    setDragging(true);
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const next = Math.max(min, Math.min(max, startRef.current.val + Math.round(dx / 4) * step));
      onChange(next);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: T.surface2, borderRadius: T.radius.md,
      padding: T.compact ? '8px 10px' : '12px 14px',
      border: `0.5px solid ${T.border}`,
    }}>
      <button onClick={() => onChange(Math.max(min, value - step))} style={{
        width: T.compact ? 28 : 34, height: T.compact ? 28 : 34, borderRadius: '50%',
        border: `0.5px solid ${T.border}`, background: T.surface3,
        color: T.text, fontSize: 18, fontWeight: 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>−</button>
      {editing ? (
        <input
          autoFocus
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          className="mono"
          style={{
            flex: 1, textAlign: 'center', border: 0, background: 'transparent',
            color: T.text, fontSize: T.sz.xl, fontWeight: 600, outline: 'none',
            width: 0, padding: 0,
          }}
        />
      ) : (
        <div
          onPointerDown={onPointerDown}
          onDoubleClick={() => setEditing(true)}
          className="mono"
          style={{
            flex: 1, textAlign: 'center', color: T.text,
            fontSize: T.sz.xl, fontWeight: 600,
            cursor: dragging ? 'ew-resize' : 'ew-resize',
            userSelect: 'none', touchAction: 'none',
          }}
          title="Drag to scrub · Double-click to type"
        >{value}</div>
      )}
      <button onClick={() => onChange(Math.min(max, value + step))} style={{
        width: T.compact ? 28 : 34, height: T.compact ? 28 : 34, borderRadius: '50%',
        border: `0.5px solid ${T.border}`, background: T.surface3,
        color: T.text, fontSize: 18, fontWeight: 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>+</button>
    </div>
  );
}

// ── BidirectionalSwipe: drag LEFT = BUY, drag RIGHT = SELL ──────────────────
// The single source of confirmation. Knob lives center; dragging past a
// threshold in either direction confirms the order in that direction.
function BidirectionalSwipe({ onBuy, onSell, T, disabled = false }) {
  const trackRef = useRef(null);
  const knobRef = useRef(null);
  const [x, setX] = useState(0);
  const [committed, setCommitted] = useState(null); // 'buy' | 'sell' | null
  const dragRef = useRef({ startX: 0, dragging: false });

  // threshold: 38% of half-track from center
  const reset = useCallback(() => {
    setX(0);
    setCommitted(null);
  }, []);

  const onPointerDown = (e) => {
    if (disabled || committed) return;
    e.preventDefault();
    const track = trackRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      half: track.width / 2 - 30, // knob radius padding
      dragging: true,
    };
    const move = (ev) => {
      if (!dragRef.current.dragging) return;
      let dx = ev.clientX - dragRef.current.startX;
      const half = dragRef.current.half;
      dx = Math.max(-half, Math.min(half, dx));
      setX(dx);
      const t = half * 0.78;
      if (dx <= -t) {
        setCommitted('buy');
        dragRef.current.dragging = false;
        setTimeout(() => { onBuy && onBuy(); }, 250);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      } else if (dx >= t) {
        setCommitted('sell');
        dragRef.current.dragging = false;
        setTimeout(() => { onSell && onSell(); }, 250);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      }
    };
    const up = () => {
      dragRef.current.dragging = false;
      // snap back if no commit
      if (!committed) setX(0);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // expose reset for parent
  useEffect(() => {
    if (committed) {
      const t = setTimeout(reset, 1400);
      return () => clearTimeout(t);
    }
  }, [committed, reset]);

  const ratio = Math.abs(x) / 120; // 0..1-ish progress
  const direction = x < 0 ? 'buy' : x > 0 ? 'sell' : null;
  const activeColor = direction === 'buy' ? T.up : direction === 'sell' ? T.down : null;

  return (
    <div
      ref={trackRef}
      style={{
        position: 'relative',
        height: 64,
        borderRadius: 999,
        background: T.surface2,
        border: `0.5px solid ${T.border}`,
        overflow: 'hidden',
        userSelect: 'none', touchAction: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* directional tint fills (left = buy green, right = sell red) */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: '50%',
        width: '50%',
        background: `linear-gradient(to left, transparent, ${T.up} ${Math.min(100, ratio * 140)}%)`,
        opacity: direction === 'buy' ? 0.35 : 0.08,
        transition: dragRef.current.dragging ? 'none' : 'opacity .2s',
      }} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: '50%',
        width: '50%',
        background: `linear-gradient(to right, transparent, ${T.down} ${Math.min(100, ratio * 140)}%)`,
        opacity: direction === 'sell' ? 0.35 : 0.08,
        transition: dragRef.current.dragging ? 'none' : 'opacity .2s',
      }} />

      {/* labels */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: direction === 'buy' ? T.up : T.text2,
          fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
          opacity: committed === 'sell' ? 0 : 1,
          transition: 'all .2s',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 3L3 7l6 4" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          BUY
        </div>
        <div style={{
          color: committed ? (committed === 'buy' ? T.up : T.down) : T.text3,
          fontSize: 11, fontWeight: 500, letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {committed === 'buy' ? 'Buying…' : committed === 'sell' ? 'Selling…' : 'Drag ← Buy · Sell →'}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: direction === 'sell' ? T.down : T.text2,
          fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
          opacity: committed === 'buy' ? 0 : 1,
          transition: 'all .2s',
        }}>
          SELL
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M5 3l6 4-6 4" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* knob */}
      <div
        ref={knobRef}
        onPointerDown={onPointerDown}
        style={{
          position: 'absolute', top: 6, bottom: 6,
          left: '50%',
          width: 52,
          marginLeft: -26,
          borderRadius: 999,
          background: committed === 'buy' ? T.up : committed === 'sell' ? T.down : T.surface3,
          border: `0.5px solid ${T.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transform: `translateX(${x}px)`,
          transition: dragRef.current.dragging ? 'none' : 'transform .25s cubic-bezier(.5,1.5,.5,1), background .2s',
          cursor: disabled ? 'not-allowed' : 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'none',
        }}
      >
        {committed ? (
          <svg width="22" height="22" viewBox="0 0 22 22">
            <path d="M5 11l4 4 8-8" fill="none" stroke="#0c0e12" strokeWidth="2.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <div style={{ display: 'flex', gap: 2 }}>
            <span style={{ color: T.text2, fontWeight: 700, fontSize: 16 }}>‹</span>
            <span style={{ color: T.text2, fontWeight: 700, fontSize: 16 }}>›</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type = 'info', T, onClose }) {
  // Hold the latest onClose in a ref so the auto-dismiss timer is NOT reset
  // on every parent re-render (price ticker re-renders every second).
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => closeRef.current && closeRef.current(), 2200);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  const c = type === 'buy' ? T.up : type === 'sell' ? T.down : T.info;
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 100, zIndex: 100,
      background: T.surface, borderLeft: `3px solid ${c}`,
      borderRadius: T.radius.md, padding: '12px 14px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'toast-in 0.25s ease',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', background: c,
        boxShadow: `0 0 12px ${c}`,
      }} />
      <div style={{ flex: 1, color: T.text, fontSize: T.sz.md, fontWeight: 500 }}>
        {message}
      </div>
      <style>{`
        @keyframes toast-in {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── TabBar ─────────────────────────────────────────────────────────────────
function TabBar({ active, onChange, T }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: (
      <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 10l7-6 7 6v7a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1v-7z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    )},
    { id: 'watchlist', label: 'Watchlist', icon: (
      <svg width="20" height="20" viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M6 7h8M6 10h8M6 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    )},
    { id: 'orders', label: 'Orders', icon: (
      <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 7h11l-3-3M17 13H6l3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    )},
    { id: 'portfolio', label: 'Portfolio', icon: (
      <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 16V8m4 8V4m4 12v-6m4 6v-10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    )},
    { id: 'profile', label: 'Profile', icon: (
      <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    )},
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 28, paddingTop: 8,
      background: T.bg,
      borderTop: `0.5px solid ${T.borderS}`,
      display: 'flex',
      justifyContent: 'space-around',
      zIndex: 30,
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: on ? T.brand : T.text3,
            padding: '4px 4px', flex: 1,
          }}>
            {t.icon}
            <span style={{ fontSize: 10, fontWeight: on ? 700 : 500, letterSpacing: '0.06em' }}>
              {t.label.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  useTokens, fmtINR, fmtPct, fmtSignedINR, instrumentLabel,
  AnimatedNumber, Sparkline, PriceChart, LivePulse,
  DraggableQuantity, BidirectionalSwipe, Toast, TabBar,
});
