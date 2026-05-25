// screens-extra.jsx — Watchlist + Stock Detail + Profile screens

const { useState: useStateX, useEffect: useEffectX, useRef: useRefX, useMemo: useMemoX } = React;

// ─── WatchlistScreen ────────────────────────────────────────────────────────
function WatchlistScreen({ indices, watchlists, T, activeList, onChangeList, onSelectStock, onOpenOrder }) {
  const [query, setQuery] = useStateX('');
  const list = watchlists[activeList] || [];
  const filtered = query ?
  list.filter((s) => s.symbol.toLowerCase().includes(query.toLowerCase())) :
  list;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: T.text, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em'
          }}>
            <XustaMark T={T} size={20} />
            Watchlist
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: T.surface2, padding: '4px 8px', borderRadius: 999,
            border: `0.5px solid ${T.border}`
          }}>
            <LivePulse color={T.up} size={5} />
            <span className="mono" style={{ fontSize: 10, color: T.text2, fontWeight: 500 }}>
              LIVE · NSE
            </span>
          </div>
        </div>

        {/* Index banner */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 10,
          overflowX: 'auto'
        }}>
          {indices.map((idx) =>
          <IndexChip key={idx.symbol} idx={idx} T={T} />
          )}
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: T.surface2, borderRadius: T.radius.md,
          border: `0.5px solid ${T.borderS}`,
          padding: T.compact ? '8px 12px' : '10px 14px',
          marginBottom: 10
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="6" cy="6" r="4.5" fill="none" stroke={T.text3} strokeWidth="1.4" />
            <path d="M9.5 9.5L13 13" stroke={T.text3} strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search & add"
            style={{
              flex: 1, border: 0, background: 'transparent', color: T.text,
              fontSize: T.sz.md, outline: 'none', padding: 0
            }} />
          
          <span className="mono" style={{ fontSize: T.sz.xs, color: T.text3 }}>
            {list.length}/50
          </span>
        </div>

        {/* Watchlist tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, overflowX: 'auto' }}>
          {Object.keys(watchlists).map((k) => {
            const on = k === activeList;
            return (
              <button key={k} onClick={() => onChangeList(k)} style={{
                border: 0, cursor: 'pointer',
                background: on ? T.surface3 : T.surface2,
                color: on ? T.text : T.text2,
                padding: T.compact ? '5px 10px' : '6px 12px',
                borderRadius: 999, fontSize: T.sz.sm, fontWeight: on ? 600 : 500,
                border: `0.5px solid ${on ? T.border : T.borderS}`,
                flexShrink: 0,
                letterSpacing: '0.02em'
              }}>
                {k} <span style={{ color: T.text3, fontWeight: 500, fontSize: T.sz.xs }}>
                  ({watchlists[k].length})
                </span>
              </button>);

          })}
        </div>
      </div>

      {/* Stock list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>
        {filtered.map((s) =>
        <WatchlistRow key={s.symbol} s={s} T={T}
        onSelectStock={onSelectStock}
        onOpenOrder={onOpenOrder} />
        )}
        {filtered.length === 0 &&
        <div style={{
          textAlign: 'center', color: T.text3, fontSize: T.sz.md,
          padding: '60px 0'
        }}>No stocks match "{query}"</div>
        }
      </div>
    </div>);

}

function IndexChip({ idx, T }) {
  const up = idx.changePct >= 0;
  return (
    <div style={{
      background: T.surface, borderRadius: T.radius.md,
      padding: T.compact ? '6px 10px' : '8px 12px',
      border: `0.5px solid ${T.borderS}`,
      flexShrink: 0, minWidth: 130
    }}>
      <div style={{ fontSize: T.sz.xs, color: T.text3, fontWeight: 600,
        letterSpacing: '0.04em', marginBottom: 2 }}>
        {idx.symbol}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <AnimatedNumber
          value={idx.value} T={T}
          format={(v) => fmtINR(v, 2)}
          style={{ fontSize: T.sz.md, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }} />
        
        <span className="mono" style={{
          fontSize: T.sz.xs, color: up ? T.up : T.down, fontWeight: 600
        }}>{fmtPct(idx.changePct)}</span>
      </div>
    </div>);

}

function WatchlistRow({ s, T, onSelectStock, onOpenOrder }) {
  const up = s.dayPct >= 0;
  const c = up ? T.up : T.down;
  const [dx, setDx] = useStateX(0);
  const [committed, setCommitted] = useStateX(null); // 'buy' | 'sell' | null
  const startX = useRefX(0);
  const draggingRef = useRefX(false);
  const movedRef = useRefX(false);
  const THRESHOLD = 70; // px

  const onPointerDown = (e) => {
    if (committed) return;
    startX.current = e.clientX;
    draggingRef.current = true;
    movedRef.current = false;
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current || committed) return;
    const d = e.clientX - startX.current;
    if (Math.abs(d) > 4) movedRef.current = true;
    // limit
    const lim = 100;
    setDx(Math.max(-lim, Math.min(lim, d)));
  };
  const onPointerUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (!movedRef.current) {
      // treated as tap
      setDx(0);
      onSelectStock(s);
      return;
    }
    if (dx <= -THRESHOLD) {
      // swipe LEFT → BUY
      setCommitted('buy');
      setTimeout(() => {
        onOpenOrder(s, 'buy', 1);
        setDx(0);
        setCommitted(null);
      }, 220);
    } else if (dx >= THRESHOLD) {
      // swipe RIGHT → SELL
      setCommitted('sell');
      setTimeout(() => {
        onOpenOrder(s, 'sell', 1);
        setDx(0);
        setCommitted(null);
      }, 220);
    } else {
      setDx(0);
    }
  };
  const onPointerCancel = () => {
    draggingRef.current = false;
    setDx(0);
  };

  // Direction-aware tint underneath the row
  const direction = dx < 0 ? 'buy' : dx > 0 ? 'sell' : null;
  const progress = Math.min(1, Math.abs(dx) / THRESHOLD);

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background tint that grows from one side */}
      <div style={{
        position: 'absolute', inset: 0,
        background: direction === 'buy' ?
        `linear-gradient(to left, transparent, ${T.up} ${progress * 60}%)` :
        direction === 'sell' ?
        `linear-gradient(to right, transparent, ${T.down} ${progress * 60}%)` :
        'transparent',
        opacity: 0.35,
        pointerEvents: 'none',
        transition: draggingRef.current ? 'none' : 'opacity .2s'
      }} />

      {/* Side label that appears as you swipe */}
      {direction &&
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        [direction === 'buy' ? 'right' : 'left']: 16,
        display: 'flex', alignItems: 'center', gap: 6,
        color: direction === 'buy' ? T.up : T.down,
        fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
        pointerEvents: 'none',
        opacity: progress
      }}>
          {direction === 'buy' && <ArrowLeft />}
          {direction === 'buy' ? 'BUY · 1' : 'SELL · 1'}
          {direction === 'sell' && <ArrowRight />}
        </div>
      }

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: T.compact ? '10px 4px' : '13px 4px',
          borderBottom: `0.5px solid ${T.borderS}`,
          background: T.bg,
          transform: `translateX(${dx}px)`,
          transition: draggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(.3,.7,.4,1)',
          cursor: 'pointer', userSelect: 'none', touchAction: 'pan-y',
          position: 'relative', zIndex: 1
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
            color: T.text, fontWeight: 700, fontSize: T.sz.md,
            letterSpacing: '-0.01em'
          }}>
            <span>{s.symbol}</span>
            <span style={{
              fontSize: T.sz.xs, fontWeight: 500, color: T.text3,
              background: T.surface2, padding: '1px 5px', borderRadius: 3,
              border: `0.5px solid ${T.borderS}`
            }}>{s.exch}</span>
            {s.flag &&
            <span style={{
              fontSize: T.sz.xs, fontWeight: 600,
              color: s.flag === 'EVENT' ? T.warn : s.flag === 'ALERT' ? T.info : T.text3,
              letterSpacing: '0.04em'
            }}>{s.flag}</span>
            }
          </div>
          {s.subtitle &&
          <div style={{ fontSize: T.sz.xs, color: T.text3, marginTop: 1 }}>{s.subtitle}</div>
          }
        </div>
        <div style={{
          width: T.compact ? 88 : 104, textAlign: 'right',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        }}>
          <AnimatedNumber
            value={s.ltp} T={T}
            format={(v) => fmtINR(v)}
            style={{ fontSize: T.sz.md, fontWeight: 600, color: T.text, letterSpacing: '-0.01em' }} />
          
          <span className="mono" style={{ fontSize: T.sz.xs, color: c, fontWeight: 600 }}>
            {fmtSignedINR(s.dayChange, 2)} ({fmtPct(s.dayPct)})
          </span>
        </div>
      </div>
    </div>);

}

function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <path d="M9 3L3 7l6 4" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
    </svg>);

}
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <path d="M5 3l6 4-6 4" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
    </svg>);

}

// ─── StockDetailScreen ──────────────────────────────────────────────────────
function StockDetailScreen({ stock, T, onBack, onOpenOrder, onOpenChain, initialTab = 'analysis' }) {
  const [tab, setTab] = useStateX(initialTab);
  const [range, setRange] = useStateX('1D');
  const up = stock.dayPct >= 0;
  const c = up ? T.up : T.down;
  const chartData = useMemoX(() => {
    return range === '1D' ? stock.intraday :
    range === '1M' ? genRange(stock.symbol + 'M', stock.ltp, 30, 0.012) :
    range === '6M' ? genRange(stock.symbol + 'S', stock.ltp, 180, 0.018) :
    range === '1Y' ? genRange(stock.symbol + 'Y', stock.ltp, 250, 0.025) :
    range === '5Y' ? genRange(stock.symbol + '5', stock.ltp, 260, 0.035) :
    genRange(stock.symbol + 'A', stock.ltp, 300, 0.045);
  }, [range, stock.symbol, stock.ltp]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '54px 14px 10px'
      }}>
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: '50%',
          background: T.surface2, border: `0.5px solid ${T.border}`,
          color: T.text2, fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: T.text, fontSize: 13, fontWeight: 500, opacity: 0.6 }}>
            {stock.companyName || stock.symbol}
          </div>
        </div>
        {onOpenChain && window.OPTION_CHAIN_SYMBOLS?.has(stock.symbol) && (
          <button onClick={() => onOpenChain(stock)} title="Option chain" style={{
            width: 32, height: 32, borderRadius: '50%',
            background: T.surface2, border: `0.5px solid ${T.border}`,
            color: T.brand, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 12l3-5 3 3 6-7" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 3h4v4" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <button style={{
          width: 32, height: 32, borderRadius: '50%',
          background: T.surface2, border: `0.5px solid ${T.border}`,
          color: T.text2, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 1.5l1.8 4.4 4.7.4-3.6 3.1 1.1 4.6L8 11.6l-4 2.4 1.1-4.6L1.5 6.3l4.7-.4L8 1.5z"
            fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 170px' }}>
        {/* Title + price */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            gap: 12
          }}>
            <div>
              <div style={{
                color: T.text, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em'
              }}>{stock.symbol}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{
                  fontSize: 10, color: T.text3, background: T.surface2,
                  padding: '1px 5px', borderRadius: 3, fontWeight: 500,
                  border: `0.5px solid ${T.borderS}`
                }}>{stock.exch} EQ</span>
                <span style={{ fontSize: 10, color: T.text3, fontWeight: 500 }}>
                  Xusta Prime
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <AnimatedNumber
                value={stock.ltp} T={T}
                format={(v) => fmtINR(v)}
                style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }} />
              
              <div className="mono" style={{
                fontSize: 12, color: c, fontWeight: 600, marginTop: 2
              }}>
                {fmtSignedINR(stock.dayChangeAmt || stock.ltp * stock.dayPct / 100, 2)} ({fmtPct(stock.dayPct)})
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ position: 'relative', padding: '4px 4px 0' }}>
          <div style={{
            position: 'absolute', top: 8, right: 16, zIndex: 5,
            display: 'flex', alignItems: 'center', gap: 4,
            background: T.surface2, padding: '3px 7px', borderRadius: 999,
            border: `0.5px solid ${T.borderS}`
          }}>
            <LivePulse color={c} size={4} />
            <span className="mono" style={{ fontSize: 9, color: T.text2, fontWeight: 500 }}>LIVE</span>
          </div>
          <PriceChart data={chartData} T={T} color={c} height={150} />
        </div>

        {/* Range selector */}
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          padding: '6px 16px 12px'
        }}>
          {['1D', '1M', '6M', '1Y', '5Y', 'ALL'].map((r) => {
            const on = r === range;
            return (
              <button key={r} onClick={() => setRange(r)} style={{
                border: 0, background: on ? T.surface3 : 'transparent',
                color: on ? T.text : T.text2,
                fontSize: T.sz.sm, fontWeight: on ? 700 : 500,
                padding: '4px 10px', borderRadius: 999,
                cursor: 'pointer', letterSpacing: '0.03em'
              }}>{r}</button>);

          })}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          padding: '0 8px',
          borderBottom: `0.5px solid ${T.borderS}`
        }}>
          {[
          { id: 'events', label: 'Events' },
          { id: 'analysis', label: 'Company Analysis' },
          { id: 'financials', label: 'Financials' },
          { id: 'news', label: 'News' }].
          map((t) => {
            const on = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                border: 0, background: 'transparent', cursor: 'pointer',
                color: on ? T.text : T.text3,
                fontSize: T.sz.sm, fontWeight: on ? 700 : 500,
                padding: '10px 6px', position: 'relative',
                letterSpacing: '-0.01em'
              }}>
                {t.label}
                {on &&
                <div style={{
                  position: 'absolute', left: 6, right: 6, bottom: 0,
                  height: 2, background: T.brand, borderRadius: 1
                }} />
                }
              </button>);

          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: '16px' }}>
          {tab === 'analysis' && <AnalysisTab stock={stock} T={T} />}
          {tab === 'events' && <EventsTab stock={stock} T={T} />}
          {tab === 'financials' && <FinancialsTab stock={stock} T={T} />}
          {tab === 'news' && <NewsTab stock={stock} T={T} />}
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 80,
        padding: '10px 14px',
        background: T.dark ?
        'linear-gradient(to top, oklch(0.17 0.012 240) 70%, oklch(0.17 0.012 240 / 0))' :
        'linear-gradient(to top, oklch(0.985 0.003 240) 70%, oklch(0.985 0.003 240 / 0))',
        display: 'flex', gap: 8, alignItems: 'center'
      }}>
        <button style={{
          width: 44, height: 44, borderRadius: '50%',
          background: T.surface2, border: `0.5px solid ${T.border}`,
          cursor: 'pointer', color: T.text2,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M9 16s-6-4-6-9.5A3.5 3.5 0 019 4a3.5 3.5 0 016 2.5C15 12 9 16 9 16z"
            fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={() => onOpenOrder(stock, 'sell')} style={{
          flex: 1, height: 44, borderRadius: T.radius.md,
          background: T.down, color: '#fff', border: 0, cursor: 'pointer',
          fontSize: 14, fontWeight: 700, letterSpacing: '0.08em'
        }}>SELL</button>
        <button onClick={() => onOpenOrder(stock, 'buy')} style={{
          flex: 1, height: 44, borderRadius: T.radius.md,
          background: T.up, color: '#0c1410', border: 0, cursor: 'pointer',
          fontSize: 14, fontWeight: 700, letterSpacing: '0.08em'
        }}>BUY</button>
      </div>
    </div>);

}

// ─── Stock Detail tab content ───────────────────────────────────────────────
function AnalysisTab({ stock, T }) {
  const profile = stock.profile || DEFAULT_PROFILE(stock);
  return (
    <>
      <SectionTitle T={T}>Company Profile</SectionTitle>
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10
      }}>
        <ProfileChip k="Sector" v={profile.sector} T={T} />
        <ProfileChip k="Mkt Cap" v={profile.mktCap} T={T} />
        <ProfileChip k="Rank" v={'#' + profile.rank} T={T} />
      </div>
      <div style={{
        fontSize: T.sz.sm, color: T.text2, lineHeight: 1.6, marginBottom: 18
      }}>{profile.description}</div>

      <SectionTitle T={T}>Shareholding Pattern</SectionTitle>
      <div style={{ marginBottom: 18 }}>
        {profile.shareholding.map((h, i) =>
        <ShareholdingBar key={i} h={h} T={T} />
        )}
      </div>

      <SectionTitle T={T}>Analyst Rating</SectionTitle>
      <div style={{
        background: T.surface, borderRadius: T.radius.md,
        border: `0.5px solid ${T.borderS}`,
        padding: T.compact ? '10px 12px' : '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: T.upDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M9 2v10m0 0l4-4m-4 4l-4-4M3 15h12"
            fill="none" stroke={T.up} strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: T.text, fontSize: T.sz.md, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {profile.rating.verdict}
          </div>
          <div style={{ fontSize: T.sz.xs, color: T.text2, marginTop: 2 }}>
            {profile.rating.detail}
          </div>
        </div>
      </div>
    </>);

}

function EventsTab({ stock, T }) {
  const events = [
  { date: '14 Jun', tag: 'Dividend', title: 'Record date · ₹6.50 per share', color: T.up },
  { date: '02 Jun', tag: 'Results', title: 'Q4 FY26 earnings · Beat estimates', color: T.info },
  { date: '18 May', tag: 'AGM', title: 'Annual general meeting', color: T.text2 },
  { date: '04 May', tag: 'Block Deal', title: 'Promoter sold 0.4% via block deal', color: T.warn },
  { date: '22 Apr', tag: 'Bonus', title: '1:1 bonus issue announced', color: T.up }];

  return (
    <>
      <SectionTitle T={T}>Upcoming & Recent</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map((e, i) =>
        <div key={i} style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          background: T.surface, borderRadius: T.radius.md,
          padding: T.compact ? '10px 12px' : '12px 14px',
          border: `0.5px solid ${T.borderS}`
        }}>
            <div style={{
            width: 44, flexShrink: 0,
            fontSize: T.sz.xs, fontWeight: 600, color: T.text3,
            textTransform: 'uppercase', letterSpacing: '0.04em'
          }} className="mono">{e.date}</div>
            <div style={{ flex: 1 }}>
              <div style={{
              fontSize: T.sz.xs, fontWeight: 600, color: e.color,
              letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2
            }}>{e.tag}</div>
              <div style={{ fontSize: T.sz.sm, color: T.text, fontWeight: 500 }}>{e.title}</div>
            </div>
          </div>
        )}
      </div>
    </>);

}

function FinancialsTab({ stock, T }) {
  const rows = [
  { k: 'Revenue (TTM)', v: '₹34,548 Cr', d: '+12.4% YoY', up: true },
  { k: 'Net Profit', v: '₹4,820 Cr', d: '+18.1% YoY', up: true },
  { k: 'EPS', v: '₹50.24', d: '+15.6% YoY', up: true },
  { k: 'P/E Ratio', v: '64.6×', d: 'Sector 52×', up: false },
  { k: 'P/B Ratio', v: '15.8×', d: 'Sector 9.2×', up: false },
  { k: 'ROE', v: '24.8%', d: 'Sector 18%', up: true },
  { k: 'Debt to Equity', v: '0.08', d: 'Low', up: true },
  { k: 'Dividend Yield', v: '0.85%', d: '₹27.50', up: true }];

  return (
    <>
      <SectionTitle T={T}>Key Metrics</SectionTitle>
      <div style={{
        background: T.surface, borderRadius: T.radius.md,
        border: `0.5px solid ${T.borderS}`,
        overflow: 'hidden'
      }}>
        {rows.map((r, i) =>
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: T.compact ? '9px 12px' : '11px 14px',
          borderBottom: i < rows.length - 1 ? `0.5px solid ${T.borderS}` : 'none'
        }}>
            <span style={{ fontSize: T.sz.sm, color: T.text2 }}>{r.k}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="mono" style={{ fontSize: T.sz.xs, color: r.up ? T.up : T.text3 }}>
                {r.d}
              </span>
              <span className="mono" style={{
              fontSize: T.sz.md, fontWeight: 700, color: T.text, letterSpacing: '-0.01em'
            }}>{r.v}</span>
            </div>
          </div>
        )}
      </div>
    </>);

}

function NewsTab({ stock, T }) {
  const news = [
  { src: 'Mint', mins: '12m', title: `${stock.symbol} hits 52-week high on strong volumes` },
  { src: 'Bloomberg', mins: '1h', title: `Analysts raise target by 8% citing margin expansion` },
  { src: 'ET Markets', mins: '3h', title: `${stock.symbol} announces capacity expansion in Gujarat` },
  { src: 'Moneycontrol', mins: '6h', title: `Q1 update: management guides 14-16% growth` }];

  return (
    <>
      <SectionTitle T={T}>Latest</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {news.map((n, i) =>
        <div key={i} style={{
          background: T.surface, borderRadius: T.radius.md,
          border: `0.5px solid ${T.borderS}`,
          padding: T.compact ? '10px 12px' : '12px 14px'
        }}>
            <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
            fontSize: T.sz.xs, color: T.text3, fontWeight: 500
          }}>
              <span style={{
              color: T.info, fontWeight: 700, letterSpacing: '0.04em'
            }}>{n.src.toUpperCase()}</span>
              <span>·</span>
              <span>{n.mins} ago</span>
            </div>
            <div style={{
            fontSize: T.sz.sm, color: T.text, fontWeight: 500, lineHeight: 1.4
          }}>{n.title}</div>
          </div>
        )}
      </div>
    </>);

}

function ProfileChip({ k, v, T }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 6,
      border: `0.5px solid ${T.borderS}`,
      padding: '4px 8px',
      display: 'flex', alignItems: 'baseline', gap: 5
    }}>
      <span style={{ fontSize: T.sz.xs, color: T.text3, fontWeight: 500 }}>{k}</span>
      <span style={{ fontSize: T.sz.sm, color: T.text, fontWeight: 600 }}>{v}</span>
    </div>);

}

function ShareholdingBar({ h, T }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: T.sz.sm, marginBottom: 4
      }}>
        <span style={{ color: T.text2 }}>{h.label}</span>
        <span className="mono" style={{ color: T.text, fontWeight: 600 }}>
          {h.pct.toFixed(2)}%
        </span>
      </div>
      <div style={{
        height: 4, borderRadius: 2,
        background: T.surface2,
        overflow: 'hidden'
      }}>
        <div style={{
          width: h.pct + '%', height: '100%',
          background: h.color,
          borderRadius: 2
        }} />
      </div>
    </div>);

}

function SectionTitle({ children, T }) {
  return (
    <div style={{
      color: T.text, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em',
      marginBottom: 10
    }}>{children}</div>);

}

// ─── ProfileScreen ──────────────────────────────────────────────────────────
function ProfileScreen({ T, totalValue }) {
  const items = [
  { group: 'Funds', rows: [
    { icon: '↓', label: 'Add funds', detail: '' },
    { icon: '↑', label: 'Withdraw', detail: '₹45,230.12 available' },
    { icon: '⟳', label: 'Transactions', detail: '' }]
  },
  { group: 'Account', rows: [
    { icon: '◐', label: 'My investments', detail: '₹' + fmtINR(totalValue, 0) },
    { icon: '☆', label: 'Xusta Prime', detail: 'Active · renews 12 Jul', badge: 'PRIME' },
    { icon: '⌖', label: 'Tax & reports', detail: 'FY 2025-26' },
    { icon: '⚙', label: 'Settings', detail: '' }]
  },
  { group: 'Support', rows: [
    { icon: '?', label: 'Help & Support', detail: '24×7' },
    { icon: '★', label: 'Refer & earn', detail: 'Up to ₹500' },
    { icon: '⤓', label: 'App version', detail: 'v3.18.2' }]
  }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: T.text, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
          marginBottom: 14
        }}>
          <XustaMark T={T} size={20} />
          Account
        </div>

        {/* User card */}
        <div style={{
          background: T.surface, borderRadius: T.radius.lg,
          border: `0.5px solid ${T.borderS}`,
          padding: 14, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: `linear-gradient(135deg, ${T.brand}, ${T.info})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0c1410', fontSize: 20, fontWeight: 700
          }}>AR</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: T.text, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Arjun Rao
            </div>
            <div className="mono" style={{ fontSize: T.sz.xs, color: T.text3, marginTop: 2 }}>
              XU58F92 · arjun@example.com
            </div>
          </div>
          <div style={{
            background: T.upDim, color: T.up,
            padding: '3px 8px', borderRadius: 4,
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em'
          }}>PRIME</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 110px' }}>
        {items.map((g) =>
        <div key={g.group} style={{ marginBottom: 14 }}>
            <div style={{
            fontSize: T.sz.xs, color: T.text3, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '4px 4px 8px'
          }}>{g.group}</div>
            <div style={{
            background: T.surface, borderRadius: T.radius.md,
            border: `0.5px solid ${T.borderS}`,
            overflow: 'hidden'
          }}>
              {g.rows.map((r, i) =>
            <div key={r.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: T.compact ? '10px 12px' : '13px 14px',
              borderBottom: i < g.rows.length - 1 ? `0.5px solid ${T.borderS}` : 'none',
              cursor: 'pointer'
            }}>
                  <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: T.surface2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.text2, fontSize: 14, fontWeight: 600
              }}>{r.icon}</div>
                  <span style={{ flex: 1, color: T.text, fontSize: T.sz.md, fontWeight: 500 }}>
                    {r.label}
                  </span>
                  {r.detail &&
              <span className="mono" style={{ fontSize: T.sz.xs, color: T.text3 }}>{r.detail}</span>
              }
                  <svg width="6" height="10" viewBox="0 0 6 10">
                    <path d="M1 1l4 4-4 4" fill="none" stroke={T.text3} strokeWidth="1.4"
                strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>);

}

// ─── helpers ────────────────────────────────────────────────────────────────
function genRange(seed, end, n, vol) {
  // deterministic per-symbol historical walk that lands on `end`
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 2147483647;
  const rand = () => {h = (h * 1664525 + 1013904223) % 2147483648;return h / 2147483648;};
  const out = new Array(n);
  let v = end * (1 - vol * (rand() - 0.3) * 2);
  for (let i = 0; i < n - 1; i++) {
    v = v * (1 + (rand() - 0.5) * vol);
    out[i] = v;
  }
  out[n - 1] = end;
  return out;
}

const DEFAULT_PROFILE = (stock) => ({
  sector: 'Diversified',
  mktCap: 'Large Cap',
  rank: 12,
  description: `${stock.symbol} is one of India's leading listed companies. Strong fundamentals, consistent profitability and a healthy balance sheet have made it a long-term core holding for retail and institutional investors alike.`,
  shareholding: [
  { label: 'Promoter', pct: 52.63, color: 'oklch(0.82 0.21 152)' },
  { label: 'Mutual Funds', pct: 12.15, color: 'oklch(0.72 0.16 245)' },
  { label: 'DII', pct: 7.42, color: 'oklch(0.82 0.16 78)' },
  { label: 'FII', pct: 17.20, color: 'oklch(0.7 0.18 320)' },
  { label: 'Retail', pct: 10.60, color: 'oklch(0.7 0.06 240)' }],

  rating: {
    verdict: 'Analyst Rating: Overweight',
    detail: '82% of analysts recommend buying this stock. Median price target ₹3,650.'
  }
});

// ─── OrdersScreen ───────────────────────────────────────────────────────────
function OrdersScreen({ orders, T, onSelectOrder }) {
  const [tab, setTab] = useStateX('open');
  const groups = useMemoX(() => ({
    open: orders.filter((o) => o.status === 'OPEN' || o.status === 'PARTIAL'),
    executed: orders.filter((o) => o.status === 'COMPLETE'),
    gtt: orders.filter((o) => o.status === 'GTT'),
    baskets: []
  }), [orders]);

  const tabs = [
  { id: 'open', label: 'Open', count: groups.open.length },
  { id: 'executed', label: 'Executed', count: groups.executed.length },
  { id: 'gtt', label: 'GTT', count: groups.gtt.length },
  { id: 'baskets', label: 'Baskets', count: 0 }];


  const rows = groups[tab];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: T.text, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em'
          }}>
            Orders
          </div>
          <button style={{
            border: 0, background: T.surface2, cursor: 'pointer',
            width: 30, height: 30, borderRadius: 999,
            color: T.text2, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 22,
          borderBottom: `0.5px solid ${T.borderS}`,
          padding: '0 0 0 2px'
        }}>
          {tabs.map((t) => {
            const on = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                border: 0, background: 'transparent', cursor: 'pointer',
                color: on ? T.info : T.text3,
                fontSize: 15, fontWeight: on ? 700 : 500,
                padding: '8px 0 10px',
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                {t.label}
                {t.count > 0 &&
                <span style={{
                  background: on ? T.info : T.surface3,
                  color: on ? '#0c1410' : T.text2,
                  fontSize: 10, fontWeight: 700,
                  minWidth: 16, height: 16, borderRadius: 8,
                  padding: '0 5px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                }}>{t.count}</span>
                }
                {on &&
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: -1,
                  height: 2, background: T.info, borderRadius: 1
                }} />
                }
              </button>);

          })}
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          padding: '12px 0', color: T.info
        }}>
          <button style={iconBtnStyle(T)}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <button style={iconBtnStyle(T)}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="5" cy="4" r="1.5" fill={T.bg} stroke="currentColor" strokeWidth="1.2" />
              <circle cx="11" cy="8" r="1.5" fill={T.bg} stroke="currentColor" strokeWidth="1.2" />
              <circle cx="6" cy="12" r="1.5" fill={T.bg} stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
          <div style={{ flex: 1 }} />
          <button style={{ ...iconBtnStyle(T), gap: 5, padding: '0 4px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <rect x="2.5" y="1.5" width="9" height="11" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 5h4M5 7.5h4M5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Contract note</span>
          </button>
          <button style={{ ...iconBtnStyle(T), gap: 5, padding: '0 4px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 4v6M4 7h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Tradebook</span>
          </button>
        </div>
      </div>

      {/* Order list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>
        {rows.length === 0 ?
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          color: T.text3
        }}>
            <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: T.surface2, margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `0.5px solid ${T.borderS}`
          }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M4 7h16M4 12h16M4 17h10" fill="none" stroke={T.text3} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ fontSize: T.sz.md, fontWeight: 600, color: T.text2, marginBottom: 4 }}>
              No {tab} orders
            </div>
            <div style={{ fontSize: T.sz.sm }}>
              {tab === 'baskets' ? 'Group multiple orders together to place them in one go.' :
            tab === 'gtt' ? 'Set a trigger price for orders to fire when conditions are met.' :
            'Your orders will appear here.'}
            </div>
          </div> :
        rows.map((o) =>
        <OrderRow key={o.id} o={o} T={T} onClick={() => onSelectOrder && onSelectOrder(o)} />
        )}
      </div>
    </div>);

}

function iconBtnStyle(T) {
  return {
    border: 0, background: 'transparent', cursor: 'pointer',
    color: T.info, display: 'inline-flex', alignItems: 'center',
    height: 28, padding: 0
  };
}

function OrderRow({ o, T, onClick }) {
  const isBuy = o.side === 'BUY';
  const isComplete = o.status === 'COMPLETE';
  const isOpen = o.status === 'OPEN' || o.status === 'PARTIAL';
  const isGtt = o.status === 'GTT';

  const sideStyle = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    padding: '3px 7px', borderRadius: 3,
    background: isBuy ? 'oklch(0.72 0.16 245 / 0.18)' : 'oklch(0.66 0.22 24 / 0.18)',
    color: isBuy ? T.info : T.down
  };

  const statusStyle = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    padding: '3px 7px', borderRadius: 3,
    background: isComplete ? 'oklch(0.82 0.21 152 / 0.18)' :
    isOpen ? 'oklch(0.82 0.16 78 / 0.18)' :
    'oklch(0.72 0.16 245 / 0.18)',
    color: isComplete ? T.up : isOpen ? T.warn : T.info
  };

  return (
    <div onClick={onClick} style={{
      padding: '14px 4px 14px 4px',
      borderBottom: `0.5px solid ${T.borderS}`,
      cursor: 'pointer'
    }}>
      {/* Top meta row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 6
      }}>
        <span style={sideStyle}>{o.side}</span>
        <span className="mono" style={{
          fontSize: 12, color: T.text2, fontWeight: 500
        }}>{o.filled}/{o.qty}</span>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: T.text3, fontSize: 11
        }}>
          <svg width="11" height="11" viewBox="0 0 11 11">
            <circle cx="5.5" cy="5.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M5.5 2.5v3l2 1.5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span className="mono">{o.time}</span>
        </div>
        <span style={statusStyle}>{o.status === 'PARTIAL' ? 'OPEN' : o.status}</span>
      </div>

      {/* Symbol + price line */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4
      }}>
        <span style={{
          color: T.text, fontSize: 15, fontWeight: 600, letterSpacing: '0.01em',
          textTransform: 'uppercase'
        }}>{o.instrument}</span>
        <span style={{ fontSize: T.sz.sm, color: T.text3 }}>
          {isGtt ? 'Trigger' : 'Avg.'}
          <span className="mono" style={{
            color: T.text, fontWeight: 700, marginLeft: 6,
            fontSize: 15, letterSpacing: '-0.01em'
          }}>{fmtINR(o.price)}</span>
        </span>
      </div>

      {/* Bottom meta */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, color: T.text3
      }}>
        <span>{o.exch}</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <span>{o.product}</span>
          <span>{o.orderType}</span>
        </span>
      </div>
    </div>);

}

// ─── HoldingsView (new, matches screenshot 1) ───────────────────────────────
function HoldingsView({ holdings, T, onSelectStock, onOpenOrder }) {
  const [mode, setMode] = useStateX('pnl'); // pnl | ltp (toggled per-row globally)
  const totalInvested = holdings.reduce((s, p) => s + p.invested, 0);
  const totalCurrent = holdings.reduce((s, p) => s + p.value, 0);
  const totalPnL = totalCurrent - totalInvested;
  const dayPL = holdings.reduce((s, p) => s + p.dayChange, 0);
  const dayPct = totalCurrent ? dayPL / totalCurrent * 100 : 0;
  const pnlPct = totalInvested ? totalPnL / totalInvested * 100 : 0;

  return (
    <>
      {/* Summary card */}
      <div style={{
        background: T.surface, borderRadius: T.radius.lg,
        border: `0.5px solid ${T.borderS}`,
        padding: T.compact ? 12 : 16,
        margin: '0 16px 14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ color: T.text3, fontSize: T.sz.sm, marginBottom: 4 }}>Invested</div>
            <div className="mono" style={{ color: T.text, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {fmtINR(totalInvested, 2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: T.text3, fontSize: T.sz.sm, marginBottom: 4 }}>Current</div>
            <div className="mono" style={{ color: T.text, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {fmtINR(totalCurrent, 2)}
            </div>
          </div>
        </div>
        <div style={{
          paddingTop: 12, borderTop: `0.5px solid ${T.borderS}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ color: T.text2, fontSize: T.sz.md, fontWeight: 500 }}>P&amp;L</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AnimatedNumber
              value={totalPnL} T={T}
              format={(v) => fmtSignedINR(v, 2)}
              style={{
                fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em',
                color: totalPnL >= 0 ? T.up : T.down
              }} />
            
            <span className="mono" style={{
              background: totalPnL >= 0 ? T.upDim : T.downDim,
              color: totalPnL >= 0 ? T.up : T.down,
              fontSize: 12, fontWeight: 600,
              padding: '2px 7px', borderRadius: 999
            }}>{fmtPct(pnlPct)}</span>
          </div>
        </div>
      </div>

      {/* Filter / view bar */}
      <div style={{
        padding: '0 16px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
        color: T.info, fontSize: T.sz.sm, fontWeight: 500
      }}>
        <ProductFilter T={T} />
        <div style={{ flex: 1 }} />
      </div>

      {/* Holdings rows (aggregate same symbol across brokers) */}
      <div style={{
        paddingTop: 4,
      }}>
        {groupHoldingsBySymbol(holdings).map((g) =>
          g.brokers.length > 1 ? (
            <HoldingGroupRow key={g.key} g={g} T={T}
              onClick={() => onSelectStock(g.brokers[0])}
              onOpenOrder={onOpenOrder} />
          ) : (
            <HoldingRow key={g.key} p={g.brokers[0]} T={T}
              onClick={() => onSelectStock(g.brokers[0])}
              onOpenOrder={onOpenOrder} />
          )
        )}
      </div>
    </>);

}

function HoldingRow({ p, T, onClick, onOpenOrder }) {
  const longPressRef = useRefX(null);
  const triggeredRef = useRefX(false);

  const pnlPct = p.invested ? p.pnl / p.invested * 100 : 0;
  const up = p.pnl >= 0;
  const c = up ? T.up : T.down;
  const dayUp = p.dayPct >= 0;
  const dayC = dayUp ? T.up : T.down;

  const handleDown = () => {
    triggeredRef.current = false;
    longPressRef.current = setTimeout(() => {
      triggeredRef.current = true;
      onClick && onClick();
    }, 500);
  };
  const cancelLongPress = () => clearTimeout(longPressRef.current);
  const handleUp = () => {
    cancelLongPress();
    if (!triggeredRef.current && onOpenOrder) onOpenOrder(p, 'sell', p.qty);
  };

  return (
    <div
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      style={{
        padding: T.compact ? '10px 14px' : '12px 14px',
        margin: '0 14px 8px',
        background: T.surface,
        borderRadius: T.radius.md,
        border: `0.5px solid ${T.borderS}`,
        cursor: 'pointer', userSelect: 'none',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>

      {/* Left: qty/avg, SYMBOL, invested */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{
          fontSize: 11, color: T.text3, fontWeight: 500, letterSpacing: '0.02em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>Qty {p.qty} <span style={{ opacity: 0.4, margin: '0 2px' }}>•</span> Avg {fmtINR(p.avg)}</span>
          {p.broker && (
            <>
              <span style={{ opacity: 0.4 }}>•</span>
              <BrokerLogo id={p.broker} size={14} />
              <span style={{ fontSize: 10, fontWeight: 600, color: T.text3,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>{brokerNameOf(p.broker)}</span>
            </>
          )}
        </div>
        <div style={{
          color: T.text, fontSize: 15, fontWeight: 700,
          letterSpacing: '-0.01em', marginTop: 2,
          display: 'flex', alignItems: 'center', gap: 6,
          textTransform: 'uppercase',
          minWidth: 0,
        }}>
          <span style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{instrumentLabel(p)}</span>
          {p.flag && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: T.info,
              letterSpacing: '0.05em', flexShrink: 0,
            }}>{p.flag}</span>
          )}
        </div>
        <div className="mono" style={{
          fontSize: 11, color: T.text3, marginTop: 2,
        }}>
          Invested {fmtINR(p.invested, 2)}
        </div>
      </div>

      {/* Right: day% / P&L / LTP */}
      <div style={{
        width: 108, textAlign: 'right', flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      }}>
        <span className="mono" style={{
          fontSize: 11, color: dayC, fontWeight: 600,
        }}>{fmtPct(p.dayPct)}</span>
        <AnimatedNumber value={p.pnl} T={T}
          format={(v) => fmtSignedINR(v, 2)}
          style={{
            fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: c,
            marginTop: 1,
          }} />
        <span className="mono" style={{
          fontSize: 10, color: T.text3, marginTop: 2,
        }}>LTP {fmtINR(p.ltp)}</span>
      </div>
    </div>);

}

Object.assign(window, {
  WatchlistScreen, StockDetailScreen, ProfileScreen,
  OrdersScreen, HoldingsView, HoldingRow, HoldingGroupRow, groupHoldingsBySymbol,
});

// ── Group holdings of the same instrument across brokers ────────────────────
function groupHoldingsBySymbol(holdings) {
  const map = new Map();
  for (const h of holdings) {
    // Key by full instrument identity so F&O contracts (different strikes /
    // expiries / CE-PE) stay separate even if the underlying symbol matches.
    const key = `${h.symbol}|${h.exch || ''}|${h.type || ''}|${h.expiry || ''}|${h.strike != null ? h.strike : ''}|${h.opt || ''}`;
    if (!map.has(key)) map.set(key, { key, symbol: h.symbol, exch: h.exch, type: h.type, expiry: h.expiry, strike: h.strike, opt: h.opt, brokers: [] });
    map.get(key).brokers.push(h);
  }
  // Aggregate totals per group
  const out = [];
  for (const g of map.values()) {
    const qty      = g.brokers.reduce((s, b) => s + b.qty, 0);
    const invested = g.brokers.reduce((s, b) => s + b.invested, 0);
    const value    = g.brokers.reduce((s, b) => s + b.value, 0);
    const pnl      = value - invested;
    const dayChg   = g.brokers.reduce((s, b) => s + (b.dayChange || 0), 0);
    const ref      = g.brokers[0];
    out.push({
      ...g,
      qty, invested, value, pnl,
      avg: qty ? invested / qty : 0,
      ltp: ref.ltp,
      dayPct: ref.dayPct,
      dayChange: dayChg,
      flag: ref.flag,
    });
  }
  return out;
}

// ── HoldingGroupRow: combined header + expandable per-broker breakdown ──────
function HoldingGroupRow({ g, T, onClick, onOpenOrder }) {
  const [open, setOpen] = useStateX(false);
  const up = g.pnl >= 0;
  const c = up ? T.up : T.down;
  const dayC = g.dayPct >= 0 ? T.up : T.down;

  // Sort breakdown rows by qty desc so the largest position leads
  const rows = [...g.brokers].sort((a, b) => b.qty - a.qty);

  return (
    <div style={{ margin: '0 14px 8px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: T.compact ? '10px 14px' : '12px 14px',
          background: T.surface,
          borderRadius: open ? `${T.radius.md}px ${T.radius.md}px 0 0` : T.radius.md,
          border: `0.5px solid ${T.borderS}`,
          borderBottom: open ? `0.5px dashed ${T.borderS}` : `0.5px solid ${T.borderS}`,
          cursor: 'pointer', userSelect: 'none',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{
            fontSize: 11, color: T.text3, fontWeight: 500, letterSpacing: '0.02em',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            <span>Qty {g.qty} <span style={{ opacity: 0.4, margin: '0 2px' }}>•</span> Avg {fmtINR(g.avg)}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              {rows.map(b => (
                <BrokerLogo key={b.broker} id={b.broker} size={13} />
              ))}
              <span style={{ marginLeft: 3, fontSize: 10, fontWeight: 600, color: T.text3, letterSpacing: '0.06em' }}>
                {rows.length} BROKERS
              </span>
            </span>
          </div>
          <div style={{
            color: T.text, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
            marginTop: 2, display: 'flex', alignItems: 'center', gap: 6,
            textTransform: 'uppercase', minWidth: 0,
          }}>
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{instrumentLabel(g.brokers[0])}</span>
            <span style={{
              fontSize: 10, color: T.text3, flexShrink: 0,
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform .15s', display: 'inline-block',
            }}>▸</span>
            {g.flag && (
              <span style={{ fontSize: 9, fontWeight: 700, color: T.info, letterSpacing: '0.05em', flexShrink: 0 }}>{g.flag}</span>
            )}
          </div>
          <div className="mono" style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>
            Invested {fmtINR(g.invested, 2)}
          </div>
        </div>

        <div style={{
          width: 108, textAlign: 'right', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        }}>
          <span className="mono" style={{ fontSize: 11, color: dayC, fontWeight: 600 }}>{fmtPct(g.dayPct)}</span>
          <AnimatedNumber value={g.pnl} T={T}
            format={(v) => fmtSignedINR(v, 2)}
            style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: c, marginTop: 1 }} />
          <span className="mono" style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>LTP {fmtINR(g.ltp)}</span>
        </div>
      </div>

      {open && (
        <div style={{
          background: T.surface2,
          border: `0.5px solid ${T.borderS}`,
          borderTop: 'none',
          borderRadius: `0 0 ${T.radius.md}px ${T.radius.md}px`,
          padding: '4px 14px 8px',
        }}>
          {rows.map((b, i) => {
            const bPnl = b.pnl;
            const bPnlPct = b.invested ? bPnl / b.invested * 100 : 0;
            const bUp = bPnl >= 0;
            const bc = bUp ? T.up : T.down;
            return (
              <div key={b.broker}
                onClick={(e) => { e.stopPropagation(); onOpenOrder && onOpenOrder(b, 'sell', b.qty); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderTop: i > 0 ? `0.5px dashed ${T.borderS}` : 'none',
                  cursor: 'pointer',
                }}>
                <BrokerLogo id={b.broker} size={18} />
                <span className="mono" style={{
                  fontSize: 10, color: T.text2, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  width: 68, flexShrink: 0,
                }}>{brokerNameOf(b.broker)}</span>
                <span className="mono" style={{ fontSize: 11, color: T.text3, flex: 1, minWidth: 0 }}>
                  {b.qty} <span style={{ opacity: 0.45 }}>@</span> {fmtINR(b.avg)}
                </span>
                <span className="mono" style={{
                  fontSize: 12, color: bc, fontWeight: 700, letterSpacing: '-0.01em',
                  textAlign: 'right',
                }}>
                  {fmtSignedINR(bPnl, 0)}
                  <span style={{ marginLeft: 6, opacity: 0.75, fontSize: 10 }}>{fmtPct(bPnlPct)}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// broker lookup helpers (kept on window so HoldingRow can use without prop drilling)
const BROKER_MAP = {
  zerodha:  { short: 'Z', name: 'Zerodha',  color: 'oklch(0.72 0.16 245)', logo: 'uploads/ZERODHA.png' },
  groww:    { short: 'G', name: 'Groww',    color: 'oklch(0.84 0.18 145)', logo: 'uploads/GROWW.png' },
  upstox:   { short: 'U', name: 'Upstox',   color: 'oklch(0.76 0.18 280)', logo: 'uploads/UPSTOX.png' },
  angelone: { short: 'A', name: 'AngelOne', color: 'oklch(0.78 0.16 50)',  logo: 'uploads/ANGLEONE.png' },
};
function brokerColorOf(id) { return (BROKER_MAP[id] || {}).color || 'oklch(0.7 0 0)'; }
function brokerShortOf(id) { return (BROKER_MAP[id] || {}).short || '?'; }
function brokerNameOf(id)  { return (BROKER_MAP[id] || {}).name  || id; }
function brokerLogoOf(id)  { return (BROKER_MAP[id] || {}).logo  || null; }

function BrokerLogo({ id, size = 22 }) {
  const logo = brokerLogoOf(id);
  const r = Math.round(size * 0.22);
  if (logo) {
    return (
      <img src={logo} width={size} height={size}
           style={{
             borderRadius: r, objectFit: 'contain',
             display: 'block', flexShrink: 0,
           }}
           alt={brokerNameOf(id)} />
    );
  }
  return (
    <span style={{
      width: size, height: size, borderRadius: r, flexShrink: 0,
      background: brokerColorOf(id), color: '#08120c',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.5), fontWeight: 800,
    }}>{brokerShortOf(id)}</span>
  );
}

Object.assign(window, { brokerColorOf, brokerShortOf, brokerNameOf, brokerLogoOf, BrokerLogo });