// home-screen.jsx — Market dashboard: gainers/losers, indices, sectors, news

const { useState: useH, useMemo: useMH } = React;

const TOP_GAINERS = [
  { symbol: 'ADANIENT',   exch: 'NSE', ltp: 2415.30, pct:  6.42 },
  { symbol: 'TATAPOWER',  exch: 'NSE', ltp:  412.85, pct:  4.85 },
  { symbol: 'NYKAA',      exch: 'NSE', ltp:  192.40, pct:  3.92 },
  { symbol: 'ZOMATO',     exch: 'NSE', ltp:  162.40, pct:  3.21 },
  { symbol: 'BAJAJFINSV', exch: 'NSE', ltp: 1648.10, pct:  2.84 },
];
const TOP_LOSERS = [
  { symbol: 'PAYTM',      exch: 'NSE', ltp:  402.55, pct: -4.18 },
  { symbol: 'ASIANPAINT', exch: 'NSE', ltp: 3248.45, pct: -2.65 },
  { symbol: 'NESTLEIND',  exch: 'NSE', ltp: 2475.40, pct: -1.92 },
  { symbol: 'BAJFINANCE', exch: 'NSE', ltp: 6920.10, pct: -1.45 },
  { symbol: 'HUL',        exch: 'NSE', ltp: 2384.20, pct: -1.18 },
];
const SECTORS = [
  { name: 'Banking',    pct:  1.42 },
  { name: 'IT',         pct:  0.85 },
  { name: 'Auto',       pct:  2.18 },
  { name: 'Pharma',     pct: -0.42 },
  { name: 'Energy',     pct:  1.96 },
  { name: 'FMCG',       pct: -0.65 },
  { name: 'Metals',     pct:  2.42 },
  { name: 'Realty',     pct: -1.08 },
];
const HEADLINES = [
  { src: 'Bloomberg',    mins: '8m',  title: 'Sensex hits fresh all-time high on banking rally' },
  { src: 'Mint',         mins: '24m', title: 'RBI keeps repo rate unchanged at 6.5% for ninth time' },
  { src: 'ET Markets',   mins: '1h',  title: 'FII inflows touch ₹12,400 Cr this week, highest YTD' },
  { src: 'Moneycontrol', mins: '2h',  title: 'India IPO market raises ₹4,200 Cr across 8 listings' },
];

function HomeScreen({ T, indices, onOpenStock, onGo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BrandHeader title="Home" T={T} trailing={
        <>
          <IconBtn T={T}><BellIcon /></IconBtn>
          <IconBtn T={T}><SearchIcon /></IconBtn>
        </>
      } />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>
        {/* Greeting */}
        <div style={{
          color: T.text, fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em',
          marginBottom: 4, lineHeight: 1.2,
        }}>Good morning, Arjun</div>
        <div className="mono" style={{
          color: T.text3, fontSize: 10, letterSpacing: '0.07em', marginBottom: 12,
          fontWeight: 600,
        }}>MARKET OPEN · NSE LIVE</div>

        {/* Indices strip */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }}>
          {indices.map(idx => {
            const up = idx.changePct >= 0;
            return (
              <div key={idx.symbol} style={{
                background: T.surface, borderRadius: T.radius.md,
                border: `0.5px solid ${T.borderS}`,
                padding: '10px 12px', minWidth: 130, flexShrink: 0,
              }}>
                <div style={{ fontSize: 10, color: T.text2, fontWeight: 600, letterSpacing: '0.05em' }}>
                  {idx.symbol}
                </div>
                <AnimatedNumber value={idx.value} T={T}
                  format={(v) => fmtINR(v, 2)}
                  style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }} />
                <div className="mono" style={{
                  fontSize: 11, color: up ? T.up : T.down, fontWeight: 700, marginTop: 2,
                }}>{fmtPct(idx.changePct)}</div>
              </div>
            );
          })}
        </div>

        {/* Gainers / Losers row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <MoverCard title="Top Gainers" rows={TOP_GAINERS} T={T} color={T.up} onOpen={onOpenStock} />
          <MoverCard title="Top Losers"  rows={TOP_LOSERS}  T={T} color={T.down} onOpen={onOpenStock} />
        </div>

        {/* Sectors */}
        <SectionHeading T={T}>Sectors today</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SECTORS.map(s => {
            const up = s.pct >= 0;
            return (
              <div key={s.name} style={{
                background: T.surface, borderRadius: 8,
                border: `0.5px solid ${T.borderS}`,
                padding: '10px 12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                <span className="mono" style={{
                  fontSize: 12, fontWeight: 700, color: up ? T.up : T.down,
                }}>{fmtPct(s.pct)}</span>
              </div>
            );
          })}
        </div>

        {/* Market insight strip */}
        <div style={{
          marginTop: 16,
          background: T.surface, borderRadius: T.radius.md,
          border: `0.5px solid ${T.borderS}`,
          padding: '14px 14px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.18,
            background: `linear-gradient(135deg, transparent 30%, ${T.brand} 100%)`,
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              color: T.brand, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
              marginBottom: 6,
            }}>FII ACTIVITY</div>
            <div style={{ color: T.text, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
              Foreign institutions net bought ₹2,140 Cr today.
            </div>
          </div>
        </div>

        {/* News */}
        <SectionHeading T={T}>Top news</SectionHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HEADLINES.map((n, i) => (
            <div key={i} style={{
              background: T.surface, borderRadius: T.radius.md,
              border: `0.5px solid ${T.borderS}`,
              padding: '11px 12px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                fontSize: 10, fontWeight: 600, color: T.text3,
              }}>
                <span style={{ color: T.info, fontWeight: 700, letterSpacing: '0.04em' }}>
                  {n.src.toUpperCase()}
                </span>
                <span>·</span>
                <span>{n.mins} ago</span>
              </div>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 500, lineHeight: 1.5 }}>
                {n.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MoverCard({ title, rows, T, color, onOpen }) {
  return (
    <div style={{
      background: T.surface, borderRadius: T.radius.md,
      border: `0.5px solid ${T.borderS}`,
      padding: '12px 10px 6px',
    }}>
      <div style={{
        color: color, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
        padding: '0 4px 8px',
      }}>{title.toUpperCase()}</div>
      {rows.slice(0, 4).map(r => (
        <div key={r.symbol}
             onClick={() => onOpen && onOpen(r)}
             style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 4px', cursor: 'pointer',
        }}>
          <span style={{
            color: T.text, fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
          }}>{r.symbol}</span>
          <span className="mono" style={{
            color, fontSize: 11, fontWeight: 700,
          }}>{fmtPct(r.pct)}</span>
        </div>
      ))}
    </div>
  );
}

function SectionHeading({ children, T }) {
  return (
    <div style={{
      color: T.text, fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em',
      margin: '18px 0 10px 2px', lineHeight: 1.2,
    }}>{children}</div>
  );
}

Object.assign(window, { HomeScreen });
