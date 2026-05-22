// Multi-broker holding display options
// Scenario: TCS held in Zerodha (110 qty @ 3274.90) and Groww (90 qty @ 3502.10)
// LTP 3895.20 → combined: 200 qty, invested ₹7,17,228, value ₹7,79,040, P&L +₹61,812 (+8.62%)

const T = {
  bg:       'oklch(0.17 0.012 240)',
  surface:  'oklch(0.215 0.014 240)',
  surface2: 'oklch(0.26 0.016 240)',
  surface3: 'oklch(0.30 0.018 240)',
  border:   'oklch(0.32 0.014 240)',
  borderS:  'oklch(0.28 0.012 240 / 0.6)',
  text:     'oklch(0.97 0 0)',
  text2:    'oklch(0.72 0.012 240)',
  text3:    'oklch(0.52 0.012 240)',
  up:       'oklch(0.86 0.22 155)',
  down:     'oklch(0.70 0.22 22)',
  info:     'oklch(0.72 0.16 245)',
  warn:     'oklch(0.82 0.16 78)',
};

const BROKERS = {
  zerodha:  { short: 'Z', name: 'Zerodha',  color: 'oklch(0.72 0.16 245)' },
  groww:    { short: 'G', name: 'Groww',    color: 'oklch(0.84 0.18 145)' },
  upstox:   { short: 'U', name: 'Upstox',   color: 'oklch(0.76 0.18 280)' },
  angelone: { short: 'A', name: 'AngelOne', color: 'oklch(0.78 0.16 50)' },
};

// Indian number formatting (1,23,456.78)
const fmtINR = (n, dec = 2) => {
  const sign = n < 0 ? '−' : '';
  const x = Math.abs(n);
  const [intPart, decPart] = x.toFixed(dec).split('.');
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return sign + grouped + (dec ? '.' + decPart : '');
};
const fmtPct = (n) => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2) + '%';
const fmtSignedINR = (n, dec = 2) => (n >= 0 ? '+' : '−') + fmtINR(Math.abs(n), dec);

// Scenario data
const TCS = {
  symbol: 'TCS',
  ltp: 3895.20,
  dayPct: 1.14,
  brokers: [
    { broker: 'zerodha', qty: 110, avg: 3274.90 },
    { broker: 'groww',   qty: 90,  avg: 3502.10 },
  ],
};
TCS.brokers.forEach(b => {
  b.invested = b.qty * b.avg;
  b.value    = b.qty * TCS.ltp;
  b.pnl      = b.value - b.invested;
  b.pnlPct   = b.pnl / b.invested * 100;
});
TCS.qty      = TCS.brokers.reduce((s, b) => s + b.qty, 0);
TCS.invested = TCS.brokers.reduce((s, b) => s + b.invested, 0);
TCS.value    = TCS.brokers.reduce((s, b) => s + b.value, 0);
TCS.pnl      = TCS.value - TCS.invested;
TCS.pnlPct   = TCS.pnl / TCS.invested * 100;
TCS.avg      = TCS.invested / TCS.qty;

// ── Shared row chrome ──────────────────────────────────────────────────────
function RowCard({ children, style }) {
  return (
    <div style={{
      padding: '12px 14px',
      margin: '0 0 8px',
      background: T.surface,
      borderRadius: 10,
      border: `0.5px solid ${T.borderS}`,
      display: 'flex', alignItems: 'center', gap: 12,
      ...style,
    }}>{children}</div>
  );
}

function PnLCol({ pnl, pnlPct, dayPct, ltp }) {
  const up = pnl >= 0;
  const c = up ? T.up : T.down;
  const dayC = dayPct >= 0 ? T.up : T.down;
  return (
    <div style={{
      width: 108, textAlign: 'right', flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
    }}>
      <span className="mono" style={{ fontSize: 11, color: dayC, fontWeight: 600 }}>{fmtPct(dayPct)}</span>
      <span className="mono" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: c, marginTop: 1 }}>
        {fmtSignedINR(pnl, 2)}
      </span>
      <span className="mono" style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>
        LTP {fmtINR(ltp)}
      </span>
    </div>
  );
}

function BrokerDot({ id, size = 6 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: BROKERS[id].color, display: 'inline-block',
    }} />
  );
}

function BrokerChip({ id, qty }) {
  const b = BROKERS[id];
  return (
    <span className="mono" style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 6px 2px 5px',
      background: T.surface2,
      border: `0.5px solid ${T.borderS}`,
      borderRadius: 4,
      fontSize: 10, fontWeight: 600, color: T.text2,
      letterSpacing: '0.04em',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: b.color,
      }} />
      <span style={{ textTransform: 'uppercase' }}>{b.name}</span>
      {qty != null && <span style={{ color: T.text3 }}>· {qty}</span>}
    </span>
  );
}

// ── Option A: Per-broker rows (current behaviour) ──────────────────────────
function VariantPerBrokerRows() {
  return (
    <div>
      {TCS.brokers.map((b, i) => (
        <RowCard key={b.broker}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{
              fontSize: 11, color: T.text3, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>Qty {b.qty} <span style={{ opacity: 0.4, margin: '0 2px' }}>•</span> Avg {fmtINR(b.avg)}</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: T.text3 }}>
                <BrokerDot id={b.broker} />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {BROKERS[b.broker].name}
                </span>
              </span>
            </div>
            <div style={{ color: T.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>TCS</div>
            <div className="mono" style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>
              Invested {fmtINR(b.invested, 2)}
            </div>
          </div>
          <PnLCol pnl={b.pnl} pnlPct={b.pnlPct} dayPct={TCS.dayPct} ltp={TCS.ltp} />
        </RowCard>
      ))}
    </div>
  );
}

// ── Option B: Aggregated row, broker dots ──────────────────────────────────
function VariantAggregatedDots() {
  return (
    <RowCard>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{
          fontSize: 11, color: T.text3, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>Qty {TCS.qty} <span style={{ opacity: 0.4, margin: '0 2px' }}>•</span> Avg {fmtINR(TCS.avg)}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {TCS.brokers.map(b => <BrokerDot key={b.broker} id={b.broker} size={7} />)}
            <span style={{ marginLeft: 2, fontSize: 10, color: T.text3 }}>{TCS.brokers.length}</span>
          </span>
        </div>
        <div style={{ color: T.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>TCS</div>
        <div className="mono" style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>
          Invested {fmtINR(TCS.invested, 2)}
        </div>
      </div>
      <PnLCol pnl={TCS.pnl} pnlPct={TCS.pnlPct} dayPct={TCS.dayPct} ltp={TCS.ltp} />
    </RowCard>
  );
}

// ── Option C: Aggregated row, expandable ───────────────────────────────────
function VariantExpandable() {
  const [open, setOpen] = React.useState(true);
  return (
    <div>
      <div onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
        <RowCard style={open ? { borderRadius: '10px 10px 0 0', marginBottom: 0 } : {}}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{
              fontSize: 11, color: T.text3, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>Qty {TCS.qty} <span style={{ opacity: 0.4, margin: '0 2px' }}>•</span> Avg {fmtINR(TCS.avg)}</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span style={{ color: T.text3, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {TCS.brokers.length} BROKERS
              </span>
            </div>
            <div style={{ color: T.text, fontSize: 15, fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              TCS
              <span style={{
                fontSize: 10, color: T.text3,
                transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .15s',
              }}>▸</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>
              Invested {fmtINR(TCS.invested, 2)}
            </div>
          </div>
          <PnLCol pnl={TCS.pnl} pnlPct={TCS.pnlPct} dayPct={TCS.dayPct} ltp={TCS.ltp} />
        </RowCard>
      </div>
      {open && (
        <div style={{
          background: T.surface2,
          border: `0.5px solid ${T.borderS}`,
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: '6px 14px 8px',
          marginBottom: 8,
        }}>
          {TCS.brokers.map(b => (
            <div key={b.broker} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderTop: b !== TCS.brokers[0] ? `0.5px dashed ${T.borderS}` : 'none',
            }}>
              <BrokerDot id={b.broker} size={8} />
              <span className="mono" style={{
                fontSize: 11, color: T.text2, fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'uppercase', width: 64,
              }}>{BROKERS[b.broker].name}</span>
              <span className="mono" style={{ fontSize: 11, color: T.text3, flex: 1 }}>
                {b.qty} <span style={{ opacity: 0.4 }}>@</span> {fmtINR(b.avg)}
              </span>
              <span className="mono" style={{
                fontSize: 12, color: b.pnl >= 0 ? T.up : T.down, fontWeight: 700,
              }}>{fmtSignedINR(b.pnl, 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Option D: Aggregated row, broker chips ────────────────────────────────
function VariantBrokerChips() {
  return (
    <RowCard>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{
          fontSize: 11, color: T.text3, fontWeight: 500,
        }}>
          Qty {TCS.qty} <span style={{ opacity: 0.4, margin: '0 2px' }}>•</span> Avg {fmtINR(TCS.avg)}
        </div>
        <div style={{ color: T.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>TCS</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
          {TCS.brokers.map(b => <BrokerChip key={b.broker} id={b.broker} qty={b.qty} />)}
        </div>
      </div>
      <PnLCol pnl={TCS.pnl} pnlPct={TCS.pnlPct} dayPct={TCS.dayPct} ltp={TCS.ltp} />
    </RowCard>
  );
}

// ── Option E: Aggregated row + distribution bar ───────────────────────────
function VariantDistributionBar() {
  return (
    <RowCard>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{
          fontSize: 11, color: T.text3, fontWeight: 500,
        }}>
          Qty {TCS.qty} <span style={{ opacity: 0.4, margin: '0 2px' }}>•</span> Avg {fmtINR(TCS.avg)}
        </div>
        <div style={{ color: T.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>TCS</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            flex: 1, height: 4, borderRadius: 2, overflow: 'hidden',
            display: 'flex', background: T.surface2,
          }}>
            {TCS.brokers.map(b => (
              <div key={b.broker} style={{
                width: `${(b.qty / TCS.qty) * 100}%`,
                background: BROKERS[b.broker].color,
              }} />
            ))}
          </div>
          <span className="mono" style={{ fontSize: 10, color: T.text3, letterSpacing: '0.04em' }}>
            {TCS.brokers.map(b => `${BROKERS[b.broker].short}${Math.round(b.qty / TCS.qty * 100)}`).join(' · ')}
          </span>
        </div>
      </div>
      <PnLCol pnl={TCS.pnl} pnlPct={TCS.pnlPct} dayPct={TCS.dayPct} ltp={TCS.ltp} />
    </RowCard>
  );
}

// ── Option F: Stacked card (combined header + nested mini-rows always visible) ─
function VariantStackedCard() {
  return (
    <div style={{
      background: T.surface,
      borderRadius: 10,
      border: `0.5px solid ${T.borderS}`,
      overflow: 'hidden',
      marginBottom: 8,
    }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>
            Qty {TCS.qty} <span style={{ opacity: 0.4, margin: '0 2px' }}>•</span> Avg {fmtINR(TCS.avg)}
          </div>
          <div style={{ color: T.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>TCS</div>
          <div className="mono" style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>
            Invested {fmtINR(TCS.invested, 2)}
          </div>
        </div>
        <PnLCol pnl={TCS.pnl} pnlPct={TCS.pnlPct} dayPct={TCS.dayPct} ltp={TCS.ltp} />
      </div>
      <div style={{ background: 'rgba(0,0,0,0.18)', padding: '4px 14px 8px' }}>
        {TCS.brokers.map((b, i) => (
          <div key={b.broker} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
            borderTop: i > 0 ? `0.5px dashed ${T.borderS}` : 'none',
          }}>
            <BrokerDot id={b.broker} size={6} />
            <span className="mono" style={{
              fontSize: 10, color: T.text2, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', width: 60,
            }}>{BROKERS[b.broker].name}</span>
            <span className="mono" style={{ fontSize: 11, color: T.text3, flex: 1 }}>
              {b.qty} @ {fmtINR(b.avg)}
            </span>
            <span className="mono" style={{
              fontSize: 11, color: b.pnl >= 0 ? T.up : T.down, fontWeight: 700,
            }}>{fmtSignedINR(b.pnl, 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Option G: Toggle (aggregated vs by-broker) ─────────────────────────────
function VariantToggle() {
  const [mode, setMode] = React.useState('aggregated');
  return (
    <div>
      <div style={{
        display: 'flex', gap: 0, padding: 3,
        background: T.surface2,
        border: `0.5px solid ${T.borderS}`,
        borderRadius: 8,
        marginBottom: 10,
        alignSelf: 'flex-start', width: 'fit-content',
      }}>
        {[['aggregated', 'Combined'], ['split', 'By broker']].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} style={{
            padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: mode === k ? T.surface3 : 'transparent',
            color: mode === k ? T.text : T.text3,
            fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
          }}>{l}</button>
        ))}
      </div>
      {mode === 'aggregated' ? <VariantAggregatedDots /> : <VariantPerBrokerRows />}
    </div>
  );
}

// ── Canvas ─────────────────────────────────────────────────────────────────
function ArtboardFrame({ children, label }) {
  return (
    <div style={{
      width: 380, background: T.bg, padding: 18,
      minHeight: 200,
    }}>
      {children}
    </div>
  );
}

function Note({ children }) {
  return (
    <div className="mono" style={{
      fontSize: 11, lineHeight: 1.55, color: T.text3,
      padding: '14px 18px 6px',
      maxWidth: 380,
    }}>{children}</div>
  );
}

function MultiBrokerCanvas() {
  const variants = [
    {
      id: 'per-broker',
      label: 'A · Per-broker rows (current)',
      note: 'Each account = its own row. Honest about reality, but the symbol repeats and you scan it as two unrelated holdings.',
      el: <VariantPerBrokerRows />,
    },
    {
      id: 'dots',
      label: 'B · Aggregated + broker dots',
      note: 'One TCS row with totals. Tiny coloured dots hint at which brokers hold it. Cleanest, least info.',
      el: <VariantAggregatedDots />,
    },
    {
      id: 'expandable',
      label: 'C · Aggregated + expandable',
      note: 'Default collapsed (combined totals). Tap to reveal per-broker breakdown inline. Best of both — recommended default.',
      el: <VariantExpandable />,
    },
    {
      id: 'chips',
      label: 'D · Aggregated + broker chips',
      note: 'Combined row with named chips showing each broker + qty. Heavier visually; works when ≤3 brokers per holding.',
      el: <VariantBrokerChips />,
    },
    {
      id: 'distribution',
      label: 'E · Aggregated + split bar',
      note: 'Tiny colour-coded distribution bar shows broker split %. Pretty; reads at a glance; loses qty detail.',
      el: <VariantDistributionBar />,
    },
    {
      id: 'stacked',
      label: 'F · Stacked card',
      note: 'Combined header + nested mini-rows always visible. Densest single-symbol card — great if user mostly wants the breakdown.',
      el: <VariantStackedCard />,
    },
    {
      id: 'toggle',
      label: 'G · Global toggle',
      note: 'Segmented control above the whole list flips between Combined and By-broker. Lets the user pick once for the session.',
      el: <VariantToggle />,
    },
  ];

  return (
    <DesignCanvas title="Multi-broker Holdings — Display Options" subtitle="TCS · Zerodha 110 + Groww 90 · LTP ₹3,895.20">
      <DCSection id="options" title="Variants" subtitle="Same data, seven treatments">
        {variants.map(v => (
          <DCArtboard key={v.id} id={v.id} label={v.label} width={380} height={v.id === 'per-broker' ? 250 : v.id === 'expandable' || v.id === 'stacked' ? 230 : v.id === 'toggle' ? 260 : 140}>
            <ArtboardFrame>{v.el}</ArtboardFrame>
          </DCArtboard>
        ))}
      </DCSection>

      <DCSection id="notes" title="Notes & trade-offs">
        {variants.map(v => (
          <DCArtboard key={v.id + '-note'} id={v.id + '-note'} label={v.label} width={380} height={140}>
            <div style={{ background: T.bg, padding: 18, minHeight: 140 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: T.text,
                marginBottom: 8, letterSpacing: '-0.005em',
              }}>{v.label}</div>
              <div className="mono" style={{
                fontSize: 11, lineHeight: 1.55, color: T.text2,
              }}>{v.note}</div>
            </div>
          </DCArtboard>
        ))}
      </DCSection>
    </DesignCanvas>
  );
}

window.MultiBrokerCanvas = MultiBrokerCanvas;
