// option-chain.jsx — Classic CE | Strike | PE option chain with weekly+monthly
// expiry chips, ATM highlight, and swipe-per-cell B/S quick actions.
//
// Universe (mocked spot prices live-driven by parent):
//   NIFTY 50, BANK NIFTY, RELIANCE, TCS, INFY, HDFCBANK
//
// Per cell: LTP, Chg%, OI. Tap → order entry (BUY default). Swipe → quick B/S.

const { useState: useOC, useMemo: useMOC, useEffect: useEOC, useRef: useROC } = React;

// ── Universe config ────────────────────────────────────────────────────────
// Strike step, lot size, expiry kind (weekly available for indices only).
const OC_UNIVERSE = {
  'NIFTY 50':   { display: 'NIFTY',     step: 50,  lot:  75, weekly: true,  ivBase: 13.5 },
  'BANK NIFTY': { display: 'BANKNIFTY', step: 100, lot:  30, weekly: true,  ivBase: 15.2 },
  'RELIANCE':   { display: 'RELIANCE',  step: 20,  lot: 250, weekly: false, ivBase: 22.4 },
  'TCS':        { display: 'TCS',       step: 20,  lot: 175, weekly: false, ivBase: 18.7 },
  'INFY':       { display: 'INFY',      step: 10,  lot: 400, weekly: false, ivBase: 24.1 },
  'HDFCBANK':   { display: 'HDFCBANK',  step: 10,  lot: 550, weekly: false, ivBase: 16.9 },
};

// Symbols that have a chain available. Used by entry points to decide whether
// to surface an "Option chain" affordance for a given watchlist row.
const OPTION_CHAIN_SYMBOLS = new Set(Object.keys(OC_UNIVERSE));
window.OPTION_CHAIN_SYMBOLS = OPTION_CHAIN_SYMBOLS;

// ── Expiry helpers ─────────────────────────────────────────────────────────
// Indian options expire Thursday. Weekly = next 3 Thursdays. Monthly = last
// Thursday of the next 3 months. Today is mocked as today's date; expiries
// are computed relative to it.
function nextThursday(from) {
  const d = new Date(from);
  const days = (4 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + days);
  return d;
}
function lastThursdayOfMonth(year, monthIdx) {
  const d = new Date(year, monthIdx + 1, 0); // last day of month
  while (d.getDay() !== 4) d.setDate(d.getDate() - 1);
  return d;
}
function buildExpiries(symbol) {
  const cfg = OC_UNIVERSE[symbol];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeklyDates = [];
  if (cfg && cfg.weekly) {
    let cur = today;
    for (let i = 0; i < 3; i++) {
      cur = nextThursday(cur);
      cur.setHours(0, 0, 0, 0);
      weeklyDates.push(new Date(cur));
    }
  }
  const monthlyDates = [];
  let y = today.getFullYear(), m = today.getMonth();
  for (let i = 0; i < 3; i++) {
    const lt = lastThursdayOfMonth(y, m + i);
    lt.setHours(0, 0, 0, 0);
    if (lt > today) monthlyDates.push(lt);
  }
  // De-dupe (a weekly expiry can also be a monthly — when the next Thursday
  // is the last Thursday of the month, both arrays contain that date).
  const seen = new Set(monthlyDates.map(d => +d));
  const weekly = weeklyDates.filter(d => !seen.has(+d));
  return { weekly, monthly: monthlyDates };
}
const MONTHS_3 = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function fmtExpiry(d) {
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS_3[d.getMonth()]}`;
}
function daysTo(d) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.max(0, Math.round((d - today) / 86400000));
}

// ── Strike generation + pricing ────────────────────────────────────────────
// Centered around spot. 11 strikes above, 11 below (22 strikes + ATM row).
function generateStrikes(spot, step) {
  const atm = Math.round(spot / step) * step;
  const arr = [];
  for (let i = -11; i <= 11; i++) arr.push(atm + i * step);
  return arr;
}
// Deterministic-ish "random" so the chain doesn't flicker on every render
function seededRand(seed) {
  let r = seed | 0;
  return () => { r = (r * 1664525 + 1013904223) | 0; return ((r >>> 0) / 4294967296); };
}
// Simplified pricing: intrinsic + time value. Time value scales with
// sqrt(t/365) and IV, and is dampened the further from ATM.
function priceLeg(opt, strike, spot, daysLeft, ivPct) {
  const intrinsic = opt === 'CE' ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
  const t = Math.max(1, daysLeft) / 365;
  const moneyness = Math.abs(spot - strike) / spot;
  const tvBase = spot * (ivPct / 100) * Math.sqrt(t) * 0.4;
  const tv = tvBase * Math.exp(-Math.pow(moneyness * 6, 2));
  return Math.max(0.05, +(intrinsic + tv).toFixed(2));
}
function buildChainRows({ symbol, spot, expiry }) {
  const cfg = OC_UNIVERSE[symbol];
  if (!cfg) return { atm: 0, rows: [] };
  const strikes = generateStrikes(spot, cfg.step);
  const atm = Math.round(spot / cfg.step) * cfg.step;
  const days = daysTo(expiry);
  const iv = cfg.ivBase + Math.min(8, days * 0.15);
  const seed = symbol.charCodeAt(0) * 1031 + (+expiry % 7919);
  const rand = seededRand(seed);

  const rows = strikes.map((K) => {
    const ce = priceLeg('CE', K, spot, days, iv);
    const pe = priceLeg('PE', K, spot, days, iv);
    // Random Chg% biased toward direction of moneyness
    const moneyness = (spot - K) / spot;
    const ceChg = +((moneyness * 8) + (rand() - 0.5) * 12).toFixed(2);
    const peChg = +((-moneyness * 8) + (rand() - 0.5) * 12).toFixed(2);
    // OI: gaussian around ATM (highest at ATM, secondary peaks at round strikes)
    const dist = Math.abs(K - atm) / cfg.step;
    const ceOiBase = Math.exp(-Math.pow(dist / 5, 2)) * 1_400_000;
    const peOiBase = Math.exp(-Math.pow(dist / 5, 2)) * 1_300_000;
    const roundBonus = (K % (cfg.step * 5) === 0) ? 1.6 : 1;
    const ceOi = Math.round((ceOiBase + rand() * 200_000) * roundBonus);
    const peOi = Math.round((peOiBase + rand() * 200_000) * roundBonus);
    return {
      strike: K,
      ce: { ltp: ce, chgPct: ceChg, oi: ceOi, itm: K < spot },
      pe: { ltp: pe, chgPct: peChg, oi: peOi, itm: K > spot },
    };
  });
  return { atm, strikes, rows, iv };
}

// ── Number formatting ──────────────────────────────────────────────────────
const fmtCompact = (n) => {
  if (n >= 1e7) return (n / 1e7).toFixed(2) + 'Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(2) + 'L';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
};
const fmtStrike = (n) => n.toLocaleString('en-IN');

// ── OptionChainScreen ──────────────────────────────────────────────────────
function OptionChainScreen({ symbol, spot, dayPct, dayChange, T, onBack, onOpenOrder }) {
  // Default to next weekly (if available) or nearest monthly
  const expiries = useMOC(() => buildExpiries(symbol), [symbol]);
  const allExp = useMOC(() => [...expiries.weekly, ...expiries.monthly]
    .sort((a, b) => a - b), [expiries]);
  const [expIdx, setExpIdx] = useOC(0);
  const expiry = allExp[Math.min(expIdx, allExp.length - 1)] || new Date();
  const expiryDays = daysTo(expiry);

  const { atm, rows } = useMOC(
    () => buildChainRows({ symbol, spot, expiry }),
    [symbol, spot, +expiry]
  );

  const up = (dayPct || 0) >= 0;
  const priceColor = up ? T.up : T.down;
  const cfg = OC_UNIVERSE[symbol] || {};

  // Auto-scroll ATM row to center on first render and when expiry changes
  const scrollRef = useROC(null);
  const atmRowRef = useROC(null);
  useEOC(() => {
    const sc = scrollRef.current;
    const row = atmRowRef.current;
    if (!sc || !row) return;
    const offset = row.offsetTop - sc.clientHeight / 2 + row.offsetHeight / 2;
    sc.scrollTop = Math.max(0, offset);
  }, [symbol, +expiry]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '54px 14px 8px',
      }}>
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: '50%',
          background: T.surface2, border: `0.5px solid ${T.border}`,
          color: T.text2, fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8,
          }}>
            <span style={{
              color: T.text, fontSize: 20, fontWeight: 700,
              letterSpacing: '-0.02em',
            }}>{cfg.display || symbol}</span>
            <span style={{
              fontSize: 9, color: T.text3, background: T.surface2,
              padding: '2px 6px', borderRadius: 3, fontWeight: 600,
              letterSpacing: '0.05em', border: `0.5px solid ${T.borderS}`,
            }}>NFO</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2,
          }}>
            <span className="mono" style={{
              color: T.text, fontSize: 14, fontWeight: 600,
              letterSpacing: '-0.01em',
            }}>{fmtStrike(+spot.toFixed(2))}</span>
            <span className="mono" style={{
              color: priceColor, fontSize: 11, fontWeight: 600,
            }}>
              {dayChange != null
                ? `${up ? '+' : '−'}${Math.abs(dayChange).toFixed(2)}`
                : ''}
              {' ('}{up ? '+' : '−'}{Math.abs(dayPct).toFixed(2)}{'%)'}
            </span>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3,
          background: T.surface2, padding: '4px 8px', borderRadius: 999,
          border: `0.5px solid ${T.borderS}`,
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%', background: T.up,
            boxShadow: `0 0 6px ${T.up}`,
          }} />
          <span className="mono" style={{
            fontSize: 9, color: T.text2, fontWeight: 600, letterSpacing: '0.05em',
          }}>LIVE</span>
        </div>
      </div>

      {/* ── Expiry selector ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 14px 10px',
        overflowX: 'auto',
      }}>
        {allExp.map((d, i) => {
          const on = i === Math.min(expIdx, allExp.length - 1);
          const isWeekly = expiries.weekly.some(w => +w === +d);
          const days = daysTo(d);
          return (
            <button key={+d} onClick={() => setExpIdx(i)} style={{
              border: `0.5px solid ${on ? T.brand : T.borderS}`,
              background: on ? `color-mix(in oklch, ${T.brand} 16%, transparent)` : T.surface,
              color: on ? T.text : T.text2,
              padding: '7px 12px', borderRadius: 999,
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.02em',
              fontFamily: 'inherit',
            }}>
              <span>{fmtExpiry(d)}</span>
              <span className="mono" style={{
                fontSize: 9, color: on ? T.brand : T.text3,
                fontWeight: 700, letterSpacing: '0.05em',
              }}>
                {isWeekly ? 'W' : 'M'} · {days}D
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table head ── */}
      <ChainHeader T={T} />

      {/* ── Strikes ── */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '0 0 100px',
      }}>
        {rows.map(r => (
          <ChainRow
            key={r.strike}
            ref={r.strike === atm ? atmRowRef : null}
            row={r}
            atm={r.strike === atm}
            symbol={symbol}
            expiry={expiry}
            T={T}
            onOpenOrder={onOpenOrder}
          />
        ))}
      </div>
    </div>
  );
}

function ChainHeader({ T }) {
  const cell = {
    fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em',
    color: T.text3, textTransform: 'uppercase',
  };
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 64px 1fr',
      alignItems: 'center',
      padding: '6px 12px',
      borderTop: `0.5px solid ${T.borderS}`,
      borderBottom: `0.5px solid ${T.borderS}`,
      background: T.surface,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingRight: 10, gap: 8,
      }}>
        <span style={{ ...cell, color: T.up, letterSpacing: '0.1em' }}>CALLS</span>
        <span style={cell}>OI</span>
        <span style={cell}>CHG%</span>
        <span style={cell}>LTP</span>
      </div>
      <div style={{ ...cell, textAlign: 'center', color: T.text2 }}>STRIKE</div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingLeft: 10, gap: 8,
      }}>
        <span style={cell}>LTP</span>
        <span style={cell}>CHG%</span>
        <span style={cell}>OI</span>
        <span style={{ ...cell, color: T.down, letterSpacing: '0.1em' }}>PUTS</span>
      </div>
    </div>
  );
}

// ── Strike row with per-cell swipe-to-B/S ──────────────────────────────────
const ChainRow = React.forwardRef(function ChainRow(
  { row, atm, symbol, expiry, T, onOpenOrder }, ref
) {
  return (
    <div ref={ref} style={{
      display: 'grid',
      gridTemplateColumns: '1fr 64px 1fr',
      alignItems: 'stretch',
      borderBottom: `0.5px solid ${T.borderS}`,
      background: atm
        ? `color-mix(in oklch, ${T.brand} 8%, transparent)`
        : 'transparent',
      position: 'relative',
    }}>
      <SwipeCell side="CE" leg={row.ce} strike={row.strike}
                 symbol={symbol} expiry={expiry} T={T}
                 onOpenOrder={onOpenOrder} />
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: atm
          ? `color-mix(in oklch, ${T.brand} 14%, transparent)`
          : T.surface2,
        borderLeft: `0.5px solid ${T.borderS}`,
        borderRight: `0.5px solid ${T.borderS}`,
        gap: 2,
      }}>
        <span className="mono" style={{
          color: atm ? T.brand : T.text, fontSize: 13,
          fontWeight: 700, letterSpacing: '-0.01em',
        }}>{fmtStrike(row.strike)}</span>
        {atm && (
          <span style={{
            fontSize: 7.5, fontWeight: 700, color: T.brand,
            letterSpacing: '0.12em',
          }}>ATM</span>
        )}
      </div>
      <SwipeCell side="PE" leg={row.pe} strike={row.strike}
                 symbol={symbol} expiry={expiry} T={T}
                 onOpenOrder={onOpenOrder} />
    </div>
  );
});

function SwipeCell({ side, leg, strike, symbol, expiry, T, onOpenOrder }) {
  const isCE = side === 'CE';
  const itm = leg.itm;
  const chgUp = leg.chgPct >= 0;
  const chgColor = chgUp ? T.up : T.down;

  const [dx, setDx] = useOC(0);
  const [committed, setCommitted] = useOC(null);
  const startX = useROC(0);
  const dragging = useROC(false);
  const moved = useROC(false);
  const THRESHOLD = 60;

  const makeStockShim = (action) => {
    const tradingSym = OC_UNIVERSE[symbol]?.display || symbol; // "NIFTY", "BANKNIFTY", "RELIANCE"
    return {
      symbol: tradingSym,
      exch: 'NFO', type: 'OPT', opt: side, strike,
      expiry: fmtExpiry(expiry), // "28 MAY" — string, not Date
      ltp: leg.ltp,
      dayPct: leg.chgPct,
      companyName: `${tradingSym} ${fmtExpiry(expiry)} ${strike} ${side}`,
    };
  };

  const onPointerDown = (e) => {
    if (committed) return;
    startX.current = e.clientX;
    dragging.current = true;
    moved.current = false;
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current || committed) return;
    const d = e.clientX - startX.current;
    if (Math.abs(d) > 4) moved.current = true;
    setDx(Math.max(-90, Math.min(90, d)));
  };
  const finish = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!moved.current) {
      setDx(0);
      onOpenOrder && onOpenOrder(makeStockShim(), 'buy', OC_UNIVERSE[symbol]?.lot || 1);
      return;
    }
    if (dx >= THRESHOLD) {
      setCommitted('buy');
      setTimeout(() => {
        onOpenOrder && onOpenOrder(makeStockShim(), 'buy', OC_UNIVERSE[symbol]?.lot || 1);
        setDx(0); setCommitted(null);
      }, 200);
    } else if (dx <= -THRESHOLD) {
      setCommitted('sell');
      setTimeout(() => {
        onOpenOrder && onOpenOrder(makeStockShim(), 'sell', OC_UNIVERSE[symbol]?.lot || 1);
        setDx(0); setCommitted(null);
      }, 200);
    } else {
      setDx(0);
    }
  };
  const onPointerUp = finish;
  const onPointerCancel = () => { dragging.current = false; setDx(0); };

  const direction = dx > 0 ? 'buy' : dx < 0 ? 'sell' : null;
  const progress = Math.min(1, Math.abs(dx) / THRESHOLD);

  // Backplate hint
  const buyColor = T.up, sellColor = T.down;
  const hint = direction === 'buy' ? buyColor : direction === 'sell' ? sellColor : null;

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Hint backplate */}
      {hint && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `color-mix(in oklch, ${hint} ${progress * 30}%, transparent)`,
          display: 'flex', alignItems: 'center',
          justifyContent: direction === 'buy' ? 'flex-start' : 'flex-end',
          padding: '0 14px',
          color: hint, fontWeight: 700, letterSpacing: '0.08em', fontSize: 11,
          pointerEvents: 'none',
        }}>
          {direction === 'buy' ? 'BUY ▸' : '◂ SELL'}
        </div>
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{
          padding: '9px 12px',
          transform: `translateX(${dx}px)`,
          transition: dragging.current ? 'none' : 'transform 0.22s cubic-bezier(.3,.7,.4,1)',
          cursor: 'pointer', userSelect: 'none', touchAction: 'pan-y',
          background: itm
            ? `color-mix(in oklch, ${isCE ? T.up : T.down} 5%, ${T.surface})`
            : T.surface,
          opacity: committed ? 0.6 : 1,
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: isCE ? 'row' : 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span className="mono" style={{
            fontSize: 9.5, color: T.text3, fontWeight: 600,
            letterSpacing: '0.04em', minWidth: 42,
            textAlign: isCE ? 'left' : 'right',
          }}>{fmtCompact(leg.oi)}</span>
          <span className="mono" style={{
            fontSize: 10, color: chgColor, fontWeight: 600,
            minWidth: 44, textAlign: 'center',
          }}>
            {chgUp ? '+' : '−'}{Math.abs(leg.chgPct).toFixed(2)}%
          </span>
          <span className="mono" style={{
            fontSize: 13, color: T.text, fontWeight: 700,
            letterSpacing: '-0.01em', minWidth: 56,
            textAlign: isCE ? 'right' : 'left',
          }}>{leg.ltp.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OptionChainScreen, OC_UNIVERSE });
