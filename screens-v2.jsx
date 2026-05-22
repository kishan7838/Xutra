// screens-v2.jsx — Redesigned screens to match the new reference set.
// Replaces visual treatment of: OrderEntry, Watchlist, Orders, Profile;
// adds the BrandHeader used across pages.

const { useState: useV, useEffect: useEV, useRef: useRV, useMemo: useMV } = React;

// ── BrandHeader: hand-drawn X mark + page title in mint green ──────────────
function BrandHeader({ title, T, trailing, showWordmark = false }) {
  return (
    <div style={{
      padding: '52px 20px 14px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <XustaMarkV2 color={T.brand} size={36} dark={T.dark} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          color: T.brand, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
          fontStyle: 'italic',
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
          lineHeight: 1,
        }}>{title}</span>
        {showWordmark && (
          <span className="script" style={{
            color: T.brand, fontSize: 20, marginLeft: 4,
            opacity: 0.9, lineHeight: 1,
          }}>Xusta</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>{trailing}</div>
    </div>
  );
}

function XustaMarkV2({ color, size = 22, dark = true }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      display: 'inline-block', verticalAlign: 'middle',
      background: color,
      maskImage: 'url(uploads/logo.png)',
      maskSize: 'contain',
      maskRepeat: 'no-repeat',
      maskPosition: 'center',
      maskMode: 'luminance',
      WebkitMaskImage: 'url(uploads/logo.png)',
      WebkitMaskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      WebkitMaskMode: 'luminance',
    }} />
  );
}

// Full lockup: brand mark + "Xusta" script — used on splash / profile card.
function XustaLockup({ color = '#1FE583', size = 80, dark = true }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      <XustaMarkV2 color={color} size={size} dark={dark} />
      <span className="script" style={{
        color, fontSize: size * 0.38, lineHeight: 1, letterSpacing: '0.02em',
      }}>Xusta</span>
    </div>
  );
}

function IconBtn({ children, T }) {
  return (
    <button style={{
      width: 28, height: 28, border: 0, background: 'transparent',
      color: T.brand, cursor: 'pointer', padding: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}

function SearchIcon({ color = 'currentColor', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke={color} strokeWidth="1.6"/>
      <path d="M14 14l4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function BellIcon({ color = 'currentColor', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 8a5 5 0 0110 0v3l1 2H4l1-2V8z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 16a2 2 0 004 0" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── WatchlistScreenV2 ──────────────────────────────────────────────────────
// Stock universe used by search — covers the major NSE names so typing
// in "Search & add" surfaces matches that aren't already in the list.
const STOCK_UNIVERSE = [
  { symbol: 'RELIANCE',   exch: 'NSE', name: 'Reliance Industries' },
  { symbol: 'HDFCBANK',   exch: 'NSE', name: 'HDFC Bank' },
  { symbol: 'INFY',       exch: 'NSE', name: 'Infosys' },
  { symbol: 'TCS',        exch: 'NSE', name: 'Tata Consultancy Services' },
  { symbol: 'ZOMATO',     exch: 'NSE', name: 'Zomato' },
  { symbol: 'ASIANPAINT', exch: 'NSE', name: 'Asian Paints' },
  { symbol: 'BHARTIARTL', exch: 'NSE', name: 'Bharti Airtel' },
  { symbol: 'ITC',        exch: 'NSE', name: 'ITC' },
  { symbol: 'SBIN',       exch: 'NSE', name: 'State Bank of India' },
  { symbol: 'TATAMOTORS', exch: 'NSE', name: 'Tata Motors' },
  { symbol: 'ADANIENT',   exch: 'NSE', name: 'Adani Enterprises' },
  { symbol: 'ADANIPORTS', exch: 'NSE', name: 'Adani Ports & SEZ' },
  { symbol: 'LT',         exch: 'NSE', name: 'Larsen & Toubro' },
  { symbol: 'MARUTI',     exch: 'NSE', name: 'Maruti Suzuki' },
  { symbol: 'BAJFINANCE', exch: 'NSE', name: 'Bajaj Finance' },
  { symbol: 'BAJAJFINSV', exch: 'NSE', name: 'Bajaj Finserv' },
  { symbol: 'NESTLEIND',  exch: 'NSE', name: 'Nestle India' },
  { symbol: 'HINDUNILVR', exch: 'NSE', name: 'Hindustan Unilever' },
  { symbol: 'KOTAKBANK',  exch: 'NSE', name: 'Kotak Mahindra Bank' },
  { symbol: 'ICICIBANK',  exch: 'NSE', name: 'ICICI Bank' },
  { symbol: 'AXISBANK',   exch: 'NSE', name: 'Axis Bank' },
  { symbol: 'WIPRO',      exch: 'NSE', name: 'Wipro' },
  { symbol: 'HCLTECH',    exch: 'NSE', name: 'HCL Technologies' },
  { symbol: 'TECHM',      exch: 'NSE', name: 'Tech Mahindra' },
  { symbol: 'POWERGRID',  exch: 'NSE', name: 'Power Grid' },
  { symbol: 'NTPC',       exch: 'NSE', name: 'NTPC' },
  { symbol: 'ONGC',       exch: 'NSE', name: 'Oil & Natural Gas Corp' },
  { symbol: 'COALINDIA',  exch: 'NSE', name: 'Coal India' },
  { symbol: 'TATAPOWER',  exch: 'NSE', name: 'Tata Power' },
  { symbol: 'TATASTEEL',  exch: 'NSE', name: 'Tata Steel' },
  { symbol: 'JSWSTEEL',   exch: 'NSE', name: 'JSW Steel' },
  { symbol: 'HINDALCO',   exch: 'NSE', name: 'Hindalco Industries' },
  { symbol: 'GRASIM',     exch: 'NSE', name: 'Grasim Industries' },
  { symbol: 'ULTRACEMCO', exch: 'NSE', name: 'UltraTech Cement' },
  { symbol: 'SUNPHARMA',  exch: 'NSE', name: 'Sun Pharma' },
  { symbol: 'DRREDDY',    exch: 'NSE', name: 'Dr Reddy\u2019s Laboratories' },
  { symbol: 'CIPLA',      exch: 'NSE', name: 'Cipla' },
  { symbol: 'DIVISLAB',   exch: 'NSE', name: 'Divi\u2019s Laboratories' },
  { symbol: 'TITAN',      exch: 'NSE', name: 'Titan Company' },
  { symbol: 'BRITANNIA',  exch: 'NSE', name: 'Britannia Industries' },
  { symbol: 'DABUR',      exch: 'NSE', name: 'Dabur India' },
  { symbol: 'GODREJCP',   exch: 'NSE', name: 'Godrej Consumer Products' },
  { symbol: 'PAYTM',      exch: 'NSE', name: 'One97 Communications (Paytm)' },
  { symbol: 'NYKAA',      exch: 'NSE', name: 'FSN E-Commerce (Nykaa)' },
  { symbol: 'POLICYBZR',  exch: 'NSE', name: 'PB Fintech (Policybazaar)' },
  { symbol: 'IRCTC',      exch: 'NSE', name: 'Indian Railway Catering & Tourism' },
  { symbol: 'BANKNIFTY',  exch: 'NFO', name: 'Bank Nifty Futures' },
  { symbol: 'NIFTY',      exch: 'NFO', name: 'Nifty Futures' },
];

function WatchlistScreenV2({ indices, watchlists, T, activeList, onChangeList, onSelectStock, onOpenOrder, onAddStock, onSelectEvents }) {
  const [query, setQuery] = useV('');
  const list = watchlists[activeList] || [];
  const inListSymbols = useMV(() => new Set(list.map(s => s.symbol)), [list]);

  // Searching: match the FULL universe (not just current list). Empty query
  // shows the watchlist as-is.
  const searchResults = useMV(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    return STOCK_UNIVERSE.filter(s =>
      s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query]);

  // Top 2 indices for hero cards
  const heroes = indices.slice(0, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <BrandHeader title="Watchlist" T={T} trailing={null} />

      <div style={{ padding: '0 16px' }}>
        {/* Big index cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {heroes.map(idx => <HeroIndexCard key={idx.symbol} idx={idx} T={T} />)}
        </div>

        {/* Search */}
        <div style={{
          marginTop: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          background: T.surface, borderRadius: T.radius.md,
          border: `0.5px solid ${T.borderS}`,
          padding: '12px 14px',
        }}>
          <SearchIcon size={16} color={T.text3}/>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search & add"
            style={{
              flex: 1, border: 0, background: 'transparent', color: T.text,
              fontSize: T.sz.md, outline: 'none', padding: 0,
            }}
          />
          <span className="mono" style={{ fontSize: T.sz.xs, color: T.text3 }}>
            {list.length}/50
          </span>
        </div>

        {/* Watchlist pill tabs */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 12, marginBottom: 4,
          overflowX: 'auto',
        }}>
          {Object.keys(watchlists).map((k, i) => {
            const on = k === activeList;
            const ks = `Watchlist ${i + 1}`;
            return (
              <button key={k} onClick={() => onChangeList(k)} style={{
                border: `0.5px solid ${on ? T.brand : T.borderS}`,
                background: on ? 'transparent' : T.surface,
                color: on ? T.brand : T.text2,
                padding: '7px 14px',
                borderRadius: 999, fontSize: T.sz.sm,
                fontWeight: on ? 700 : 500,
                flexShrink: 0, cursor: 'pointer',
                letterSpacing: '0.02em',
              }}>
                {ks} ({watchlists[k].length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Stock list — watchlist contents OR universe search results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 100px' }}>
        {searchResults === null ? (
          // Default: show the current watchlist
          list.map(s => (
            <WatchlistRowV2 key={s.symbol} s={s} T={T}
                            onSelectStock={onSelectStock}
                            onOpenOrder={onOpenOrder}
                            onSelectEvents={onSelectEvents} />
          ))
        ) : searchResults.length === 0 ? (
          <div style={{ textAlign: 'center', color: T.text3, fontSize: T.sz.md, padding: '60px 0' }}>
            No stocks match "{query}"
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 11, color: T.text3, fontWeight: 700, letterSpacing: '0.06em',
              padding: '4px 4px 8px',
            }}>SEARCH RESULTS · NSE UNIVERSE</div>
            {searchResults.map(s => (
              <SearchResultRow key={s.symbol} s={s} T={T}
                inList={inListSymbols.has(s.symbol)}
                onAdd={() => onAddStock && onAddStock(s)}
                onSelectStock={() => {
                  // open detail using existing watchlist entry if present
                  const live = list.find(x => x.symbol === s.symbol);
                  onSelectStock(live || s);
                }} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Compact result row used when the user is searching the universe.
// Shows symbol + company name + In list / Add chip.
function SearchResultRow({ s, inList, T, onSelectStock }) {
  return (
    <div onClick={onSelectStock} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', marginBottom: 6,
      background: T.surface, borderRadius: T.radius.md,
      border: `0.5px solid ${T.borderS}`,
      cursor: 'pointer',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 6,
        background: T.surface2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.text2, fontSize: 12, fontWeight: 700,
      }}>{s.symbol.charAt(0)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: T.text, fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em',
        }}>
          <span>{s.symbol}</span>
          <span style={{
            fontSize: 9, fontWeight: 500, color: T.text3,
            background: T.surface3, padding: '1px 5px', borderRadius: 3,
          }}>{s.exch}</span>
        </div>
        <div style={{
          fontSize: 11, color: T.text3, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{s.name}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); /* placeholder */ }}
        style={{
        border: 0, padding: 0, cursor: 'pointer',
        background: inList ? T.surface3 : T.brand,
        color: inList ? T.text3 : '#08120c',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
        height: 28, width: 60, borderRadius: 999,
      }}>{inList ? 'IN LIST' : '+ ADD'}</button>
    </div>
  );
}

function HeroIndexCard({ idx, T }) {
  const up = idx.changePct >= 0;
  return (
    <div style={{
      background: T.surface, borderRadius: T.radius.md,
      border: `0.5px solid ${T.borderS}`,
      padding: '12px 14px',
      minHeight: 78,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 4,
      }}>
        <span style={{
          fontSize: 11, color: T.text2, fontWeight: 600, letterSpacing: '0.06em',
        }}>{idx.symbol}</span>
        <svg width="18" height="14" viewBox="0 0 18 14">
          {up ? (
            <path d="M1 11l5-5 4 3 7-7M12 2h5v5"
                  stroke={T.up} strokeWidth="1.6" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            <path d="M1 3l5 5 4-3 7 7M12 12h5V7"
                  stroke={T.down} strokeWidth="1.6" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
      </div>
      <AnimatedNumber
        value={idx.value} T={T}
        format={(v) => fmtINR(v, 2)}
        style={{ fontSize: 19, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}
      />
      <div className="mono" style={{
        fontSize: 12, color: up ? T.up : T.down, fontWeight: 700, marginTop: 2,
      }}>{fmtPct(idx.changePct)}</div>
    </div>
  );
}

function WatchlistRowV2({ s, T, onSelectStock, onOpenOrder, onSelectEvents }) {
  const up = s.dayPct >= 0;
  const c = up ? T.up : T.down;
  const [dx, setDx] = useV(0);
  const [committed, setCommitted] = useV(null);
  const startX = useRV(0);
  const draggingRef = useRV(false);
  const movedRef = useRV(false);
  const THRESHOLD = 70;

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
    setDx(Math.max(-100, Math.min(100, d)));
  };
  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (!movedRef.current) { setDx(0); onSelectStock(s); return; }
    if (dx >= THRESHOLD) {
      // swipe LEFT → RIGHT → BUY
      setCommitted('buy');
      setTimeout(() => { onOpenOrder(s, 'buy', 1); setDx(0); setCommitted(null); }, 200);
    } else if (dx <= -THRESHOLD) {
      // swipe RIGHT → LEFT → SELL
      setCommitted('sell');
      setTimeout(() => { onOpenOrder(s, 'sell', 1); setDx(0); setCommitted(null); }, 200);
    } else {
      setDx(0);
    }
  };
  const onPointerCancel = () => { draggingRef.current = false; setDx(0); };

  const direction = dx > 0 ? 'buy' : dx < 0 ? 'sell' : null;
  const progress = Math.min(1, Math.abs(dx) / THRESHOLD);

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: T.surface,
      borderRadius: T.radius.md,
      border: `0.5px solid ${T.borderS}`,
      marginBottom: 8,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: direction === 'buy'
          ? `linear-gradient(to right, transparent, ${T.up} ${progress * 60}%)`
          : direction === 'sell'
          ? `linear-gradient(to left, transparent, ${T.down} ${progress * 60}%)`
          : 'transparent',
        opacity: 0.3, pointerEvents: 'none',
      }} />
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px',
          transform: `translateX(${dx}px)`,
          transition: draggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(.3,.7,.4,1)',
          cursor: 'pointer', userSelect: 'none', touchAction: 'pan-y',
          position: 'relative', zIndex: 1,
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: T.text, fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em',
          }}>
            <span>{s.symbol}</span>
            <span style={{
              fontSize: 10, fontWeight: 500, color: T.text3,
              background: T.surface3, padding: '2px 5px', borderRadius: 3,
            }}>{s.exch}</span>
          </div>
          {s.flag && (
            <span
              onClick={(e) => {
                if (s.flag !== 'EVENT' && s.flag !== 'ALERT') return;
                e.stopPropagation();
                onSelectEvents && onSelectEvents(s);
              }}
              style={{
              fontSize: 10, fontWeight: 700, marginTop: 4,
              color: s.flag === 'EVENT' ? T.info
                   : s.flag === 'ALERT' ? T.warn : T.text3,
              letterSpacing: '0.06em',
              cursor: (s.flag === 'EVENT' || s.flag === 'ALERT') ? 'pointer' : 'default',
              display: 'inline-block',
              padding: '1px 6px',
              borderRadius: 3,
              background: s.flag === 'EVENT' ? 'oklch(0.72 0.16 245 / 0.16)'
                        : s.flag === 'ALERT' ? 'oklch(0.82 0.16 78 / 0.18)' : 'transparent',
            }}>{s.flag}</span>
          )}
        </div>

        <div style={{
          width: 120, textAlign: 'right',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        }}>
          <AnimatedNumber
            value={s.ltp} T={T}
            format={(v) => fmtINR(v)}
            style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}
          />
          <span className="mono" style={{ fontSize: 11, color: c, fontWeight: 600 }}>
            {fmtSignedINR(s.dayChange, 2)} ({fmtPct(s.dayPct)})
          </span>
        </div>
      </div>
    </div>
  );
}

// ── OrdersScreenV2 ─────────────────────────────────────────────────────────
function OrdersScreenV2({ orders, T }) {
  const [tab, setTab] = useV('open');
  const groups = useMV(() => ({
    open:     orders.filter(o => o.status === 'OPEN' || o.status === 'PARTIAL'),
    executed: orders.filter(o => o.status === 'COMPLETE'),
    gtt:      orders.filter(o => o.status === 'GTT'),
    baskets:  [],
  }), [orders]);
  const tabs = [
    { id: 'open',     label: 'OPEN',     count: groups.open.length },
    { id: 'executed', label: 'EXECUTED', count: groups.executed.length },
    { id: 'gtt',      label: 'GTT',      count: groups.gtt.length },
    { id: 'baskets',  label: 'BASKETS',  count: 0 },
  ];
  const rows = groups[tab];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BrandHeader title="Orders" T={T} trailing={
        <>
          <IconBtn T={T}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="3" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3" y="11" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="11" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </IconBtn>
          <IconBtn T={T}><SearchIcon /></IconBtn>
        </>
      } />

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 22, padding: '0 16px',
        borderBottom: `0.5px solid ${T.borderS}`,
      }}>
        {tabs.map(t => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              color: on ? T.brand : T.text3,
              fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
              padding: '4px 0 12px',
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {t.label}
              {t.count > 0 && (
                <span style={{
                  background: on ? T.brandDim : T.surface3,
                  color: on ? T.brand : T.text2,
                  fontSize: 10, fontWeight: 700,
                  minWidth: 18, height: 18, borderRadius: 9,
                  padding: '0 5px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{t.count}</span>
              )}
              {on && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: -1,
                  height: 2, background: T.brand, borderRadius: 1,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{
        padding: '14px 16px 10px',
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <button style={toolBtnStyle(T)}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M2 4h10M3.5 7h7M5 10h4" stroke={T.text3} strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <span style={{ color: T.text2, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em' }}>SORT/FILTER</span>
        </button>
        <div style={{ flex: 1 }} />
        <button style={toolBtnStyle(T)}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="2.5" y="1.5" width="9" height="11" rx="1" fill="none" stroke={T.brand} strokeWidth="1.2"/>
            <path d="M5 5h4M5 7.5h4M5 10h3" stroke={T.brand} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ color: T.brand, fontSize: 13, fontWeight: 500 }}>Contract note</span>
        </button>
        <button style={toolBtnStyle(T)}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="5.5" fill="none" stroke={T.brand} strokeWidth="1.3"/>
            <text x="7" y="9.5" textAnchor="middle" fill={T.brand} fontSize="6" fontWeight="700">C</text>
          </svg>
          <span style={{ color: T.brand, fontSize: 13, fontWeight: 500 }}>Tradebook</span>
        </button>
      </div>

      {/* Order cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>
        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.text3 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text2, marginBottom: 4 }}>
              No {tab} orders
            </div>
            <div style={{ fontSize: 13 }}>
              {tab === 'baskets' ? 'Group multiple orders to place at once.'
                : tab === 'gtt' ? 'Triggered orders will appear here.'
                : 'Your orders will appear here.'}
            </div>
          </div>
        ) : rows.map(o => <OrderCardV2 key={o.id} o={o} T={T} />)}

        {/* Market Insight footer */}
        {rows.length > 0 && (
          <div style={{
            marginTop: 14,
            background: T.surface, borderRadius: T.radius.md,
            border: `0.5px solid ${T.borderS}`,
            padding: '14px 14px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              opacity: 0.15,
              background: 'linear-gradient(135deg, transparent 30%, oklch(0.86 0.22 155 / 0.4) 100%)',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{
                color: T.brand, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                marginBottom: 6,
              }}>MARKET INSIGHT</div>
              <div style={{ color: T.text, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                Tech sector shows bullish momentum in pre-market trading.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function toolBtnStyle(T) {
  return {
    border: 0, background: 'transparent', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 5,
    height: 24, padding: 0,
  };
}

function OrderCardV2({ o, T }) {
  const isBuy = o.side === 'BUY';
  const isComplete = o.status === 'COMPLETE';
  const progress = o.qty ? (o.filled / o.qty) : 0;

  const sideStyle = {
    fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
    padding: '2px 7px', borderRadius: 4,
    background: isBuy ? T.upDim : T.downDim,
    color: isBuy ? T.up : T.down,
    lineHeight: 1.4, flexShrink: 0,
  };

  const statusStyle = {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
    padding: '2px 6px', borderRadius: 3,
    background: isComplete ? T.upDim : 'oklch(0.72 0.16 245 / 0.18)',
    color: isComplete ? T.up : T.info,
    flexShrink: 0,
  };

  return (
    <div style={{
      background: T.surface, borderRadius: T.radius.md,
      border: `0.5px solid ${T.borderS}`,
      padding: '10px 14px 12px',
      marginBottom: 8,
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Left: badge + symbol + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
        }}>
          <span style={sideStyle}>{o.side}</span>
          <span className="mono" style={{ fontSize: 11, color: T.text3, letterSpacing: '0.01em' }}>
            {o.filled} <span style={{ opacity: 0.35 }}>/</span> {o.qty}
          </span>
        </div>
        <div style={{
          color: T.text, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 2,
        }}>{o.instrument.split(' ')[0].toUpperCase()}</div>
        <div className="mono" style={{
          fontSize: 11, color: T.text3, letterSpacing: '0.04em',
        }}>{(o.exch || '').toUpperCase()} · {(o.product || '').toUpperCase()} {(o.orderType || '').toUpperCase()}</div>
      </div>

      {/* Right: status + price + time */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        flexShrink: 0, gap: 3,
      }}>
        <span style={statusStyle}>{o.status === 'PARTIAL' ? 'OPEN' : o.status}</span>
        <span className="mono" style={{
          fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: T.text,
        }}>{fmtINR(o.price)}</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3, color: T.text3, fontSize: 10,
        }}>
          <svg width="9" height="9" viewBox="0 0 11 11">
            <circle cx="5.5" cy="5.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M5.5 2.5v3l2 1.5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          <span className="mono">{o.time}</span>
        </div>
      </div>

      {/* progress bar — only when partially filled */}
      {progress > 0 && progress < 1 && (
        <div style={{
          position: 'absolute', left: 14, right: 14, bottom: 4,
          height: 2, borderRadius: 1, background: T.surface3,
        }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: T.up, borderRadius: 1, transition: 'width .3s',
          }} />
        </div>
      )}
    </div>
  );
}

// ── OrderEntryScreenV2 ─────────────────────────────────────────────────────
function OrderEntryScreenV2({ stock, defaultSide = 'buy', defaultQty = null, T, onSubmit, onBack }) {
  const [side, setSide] = useV(defaultSide); // buy | sell
  const [productType, setProductType] = useV('DELIVERY'); // INTRADAY | DELIVERY | MTF
  const [orderType, setOrderType] = useV('LIMIT'); // MARKET | LIMIT | SL | SL-M
  const [qty, setQty] = useV(defaultQty != null ? defaultQty : 10);
  const [price, setPrice] = useV(stock.ltp);

  useEV(() => { setPrice(stock.ltp); }, [stock.symbol]);
  useEV(() => { setSide(defaultSide); }, [defaultSide]);
  useEV(() => { if (defaultQty != null) setQty(defaultQty); }, [defaultQty, stock.symbol]);

  const isBuy = side === 'buy';
  const sideColor = isBuy ? T.up : T.down;
  const margin = qty * (orderType === 'MARKET' ? stock.ltp : price)
    * (productType === 'INTRADAY' ? 0.2 : productType === 'MTF' ? 0.25 : 1);
  const dayUp = stock.dayPct >= 0;
  const dayPriceColor = dayUp ? T.up : T.down;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '56px 16px 18px',
      }}>
        <button onClick={onBack} style={{
          width: 30, height: 30, border: 0, background: 'transparent',
          color: T.text2, cursor: 'pointer', padding: 0, marginTop: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22">
            <path d="M14 4l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{
            color: T.text, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em',
            lineHeight: 1,
          }}>{stock.symbol}</div>
          <div style={{
            fontSize: 11, color: T.text3, fontWeight: 600, marginTop: 6,
            letterSpacing: '0.06em',
          }}>{stock.exch} • {stock.type || 'EQ'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <AnimatedNumber
            value={stock.ltp} T={T}
            format={(v) => fmtINR(v)}
            style={{
              fontSize: 26, fontWeight: 700,
              color: dayPriceColor,
              letterSpacing: '-0.01em',
            }}
          />
          <div className="mono" style={{
            fontSize: 12, color: dayPriceColor, fontWeight: 600, marginTop: 2,
          }}>
            {isBuy ? fmtPct(stock.dayPct) : `${fmtSignedINR(stock.dayChangeAmt || (stock.ltp * stock.dayPct / 100), 2)} (${fmtPct(stock.dayPct)})`}
          </div>
        </div>
      </div>

      {/* Body scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 200px' }}>
        {/* BUY/SELL toggle */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
          padding: 4,
          border: `0.5px solid ${T.borderS}`,
          borderRadius: T.radius.md,
          background: T.surface,
        }}>
          {[
            { id: 'buy', label: 'BUY' },
            { id: 'sell', label: 'SELL' },
          ].map(o => {
            const on = side === o.id;
            const c = o.id === 'buy' ? T.up : T.down;
            return (
              <button key={o.id} onClick={() => setSide(o.id)} style={{
                height: 42, border: 0, cursor: 'pointer',
                background: on ? c : 'transparent',
                color: on ? '#08120c' : T.text2,
                fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
                borderRadius: 8,
                transition: 'all .15s',
              }}>{o.label}</button>
            );
          })}
        </div>

        {/* Product */}
        <SectionLabel T={T}>PRODUCT</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { id: 'INTRADAY', label: 'INTRADAY', sub: 'MIS' },
            { id: 'DELIVERY', label: 'DELIVERY', sub: 'CNC' },
            { id: 'MTF',      label: 'MTF',      sub: 'MARGIN' },
          ].map(p => {
            const on = productType === p.id;
            return (
              <button key={p.id} onClick={() => setProductType(p.id)} style={{
                height: 64, border: `1px solid ${on ? sideColor : T.borderS}`,
                background: 'transparent', borderRadius: T.radius.md,
                color: on ? sideColor : T.text, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                transition: 'all .15s',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>{p.label}</span>
                <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.8, letterSpacing: '0.06em' }}>{p.sub}</span>
              </button>
            );
          })}
        </div>

        {/* Qty + Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
          <div>
            <SectionLabel T={T} compact>QUANTITY</SectionLabel>
            <NumField T={T} value={qty}
                      onChange={(v) => setQty(Math.max(0, Math.round(v)))}
                      trailing="LOT: 1" />
          </div>
          <div>
            <SectionLabel T={T} compact>PRICE</SectionLabel>
            <NumField T={T}
                      value={orderType === 'MARKET' ? stock.ltp : price}
                      onChange={(v) => setPrice(v)}
                      decimals={2}
                      trailing="TICK: 0.05"
                      locked={orderType === 'MARKET'} />
          </div>
        </div>

        {/* Order type */}
        <SectionLabel T={T}>ORDER TYPE</SectionLabel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['MARKET', 'LIMIT', 'SL', 'SL-M'].map(ot => {
            const on = orderType === ot;
            return (
              <button key={ot} onClick={() => setOrderType(ot)} style={{
                height: 38, padding: '0 22px',
                border: `1px solid ${on ? sideColor : T.borderS}`,
                background: 'transparent',
                color: on ? sideColor : T.text, cursor: 'pointer',
                borderRadius: 999,
                fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
              }}>{ot}</button>
            );
          })}
        </div>

        {/* Market depth */}
        <MarketDepth stock={stock} side={side} T={T} />

        {/* Trend */}
        <TrendCard stock={stock} side={side} T={T} />
      </div>

      {/* Fixed footer: margin + drag-to-buy/sell */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 76,
        padding: '14px 16px 14px',
        background: T.bg,
        borderTop: `0.5px solid ${T.border}`,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 10, color: T.text3, fontWeight: 700, letterSpacing: '0.08em' }}>
              REQUIRED MARGIN
            </div>
            <div className="mono" style={{
              color: T.text, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 2,
            }}>₹{fmtINR(margin)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: T.text3, fontWeight: 700, letterSpacing: '0.08em' }}>
              AVAILABLE CASH
            </div>
            <div className="mono" style={{
              color: T.up, fontSize: 16, fontWeight: 700, marginTop: 4,
            }}>₹{fmtINR(isBuy ? 12450 : 145200)}</div>
          </div>
        </div>

        <DragToConfirm
          T={T}
          side={side}
          onConfirm={() => onSubmit({
            side, symbol: stock.symbol, qty,
            price: orderType === 'MARKET' ? stock.ltp : price,
            productType, orderType, validity: 'DAY',
          })}
        />
      </div>
    </div>
  );
}

function SectionLabel({ children, T, compact = false }) {
  return (
    <div style={{
      fontSize: 11, color: T.text3, fontWeight: 700, letterSpacing: '0.08em',
      margin: compact ? '0 0 6px 2px' : '18px 0 8px 2px',
    }}>{children}</div>
  );
}

function NumField({ T, value, onChange, decimals = 0, trailing, locked }) {
  const [editing, setEditing] = useV(false);
  const [text, setText] = useV(String(value));
  useEV(() => setText(decimals ? value.toFixed(decimals) : String(value)),
        [value, decimals, editing]);
  return (
    <div style={{
      background: 'transparent',
      border: `1px solid ${T.borderS}`,
      borderRadius: T.radius.md,
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      opacity: locked ? 0.8 : 1,
    }}>
      {editing && !locked ? (
        <input autoFocus type="number" value={text}
               onChange={(e) => setText(e.target.value)}
               onBlur={() => { setEditing(false); const n = Number(text); if (!isNaN(n)) onChange(n); }}
               onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
               className="mono"
               style={{
                 flex: 1, border: 0, background: 'transparent', color: T.text,
                 fontSize: 22, fontWeight: 600, outline: 'none', padding: 0,
                 width: 0,
               }} />
      ) : (
        <span onClick={() => !locked && setEditing(true)}
              className="mono"
              style={{
                color: T.text, fontSize: 22, fontWeight: 600,
                letterSpacing: '-0.01em', cursor: locked ? 'default' : 'text',
              }}>{decimals ? value.toFixed(decimals) : value}</span>
      )}
      {trailing && (
        <span className="mono" style={{
          color: T.text3, fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
        }}>{trailing}</span>
      )}
    </div>
  );
}

function MarketDepth({ stock, side, T }) {
  // Synthesize bid/ask around LTP — visual only
  const ltp = stock.ltp;
  const tick = ltp > 500 ? 0.05 : 0.01;
  const make = (i, dir) => ({
    p: +(ltp + dir * tick * (i + 1)).toFixed(2),
    q: Math.round((Math.sin(i * 1.9 + stock.symbol.length) * 800 + 1500)),
  });
  const bids = [0, 1].map(i => make(i, -1));
  const asks = [0, 1].map(i => make(i, +1));
  return (
    <>
      <SectionLabel T={T}> </SectionLabel>
      <div style={{
        background: 'transparent',
        border: `1px solid ${T.borderS}`,
        borderRadius: T.radius.md,
        padding: '14px 16px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10,
        }}>
          <span style={{
            color: T.text, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
          }}>MARKET DEPTH</span>
          <span className="mono" style={{
            color: T.text2, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
          }}>VOL: 12.4M</span>
        </div>
        {[0, 1].map(i => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
            alignItems: 'center',
            padding: '4px 0',
          }}>
            <span className="mono" style={{ fontSize: 12, color: T.up }}>
              {fmtINR(bids[i].p)} ({(bids[i].q/1000).toFixed(1)}K)
            </span>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
            }}>
              <div style={{
                height: 4, borderRadius: 2,
                background: `linear-gradient(to right, ${T.up} ${60 - i * 10}%, ${T.surface3} 0)`,
              }} />
              <div style={{
                height: 4, borderRadius: 2,
                background: `linear-gradient(to right, ${T.down} ${50 - i * 10}%, ${T.surface3} 0)`,
              }} />
            </div>
            <span className="mono" style={{ fontSize: 12, color: T.down, textAlign: 'right' }}>
              {fmtINR(asks[i].p)} ({Math.round(asks[i].q)})
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function TrendCard({ stock, side, T }) {
  const isBuy = side === 'buy';
  const c = isBuy ? T.up : T.down;
  // last 5 min = last 5 points of intraday data (mock)
  const data = stock.intraday ? stock.intraday.slice(-30) : [];
  return (
    <div style={{
      marginTop: 14,
      background: 'transparent',
      border: `1px solid ${T.borderS}`,
      borderRadius: T.radius.md,
      padding: '14px 14px 8px',
      position: 'relative',
    }}>
      <div style={{
        color: T.text, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
        marginBottom: 8,
      }}>LAST 5 MIN TREND</div>
      <div style={{ height: 60 }}>
        <Sparkline data={data} color={c} width={300} height={60} fill={true} strokeWidth={2}/>
      </div>
      <div style={{
        position: 'absolute', right: 14, bottom: 10,
        color: c, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      }}>{isBuy ? 'BULLISH SIGNAL' : 'BEARISH SIGNAL'}</div>
    </div>
  );
}

function DragToConfirm({ T, side, onConfirm }) {
  const isBuy = side === 'buy';
  const c = isBuy ? T.up : T.down;
  const trackRef = useRV(null);
  const [x, setX] = useV(0);
  const [done, setDone] = useV(false);
  const dragRef = useRV({ dragging: false });

  const onPointerDown = (e) => {
    if (done) return;
    e.preventDefault();
    const track = trackRef.current.getBoundingClientRect();
    const max = track.width - 60;
    dragRef.current = { dragging: true, startX: e.clientX, max };
    const move = (ev) => {
      if (!dragRef.current.dragging) return;
      const dx = Math.max(0, Math.min(dragRef.current.max, ev.clientX - dragRef.current.startX));
      setX(dx);
      if (dx >= dragRef.current.max * 0.85) {
        dragRef.current.dragging = false;
        setX(dragRef.current.max);
        setDone(true);
        setTimeout(() => { onConfirm && onConfirm(); }, 220);
        cleanup();
      }
    };
    const up = () => {
      if (dragRef.current.dragging) { setX(0); }
      dragRef.current.dragging = false;
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div ref={trackRef} style={{
      position: 'relative', height: 56, borderRadius: 999,
      background: T.surface,
      border: `0.5px solid ${T.borderS}`,
      overflow: 'hidden',
      userSelect: 'none', touchAction: 'none',
    }}>
      {/* gradient fill */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to right, ${c} 0%, transparent 70%)`,
        opacity: 0.25,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.text2, fontSize: 14, fontWeight: 700, letterSpacing: '0.18em',
        pointerEvents: 'none',
      }}>
        {done ? (isBuy ? 'BUYING…' : 'SELLING…') : isBuy ? 'DRAG TO BUY' : 'DRAG TO SELL'}
      </div>
      <div onPointerDown={onPointerDown} style={{
        position: 'absolute', top: 4, bottom: 4, left: 4,
        width: 48, borderRadius: '50%',
        background: c,
        transform: `translateX(${x}px)`,
        transition: dragRef.current?.dragging ? 'none' : 'transform .25s cubic-bezier(.4,1.6,.5,1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'grab', touchAction: 'none',
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22">
          <path d="M5 11h12M11 5l6 6-6 6" fill="none" stroke="#08120c" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

// ── ProfileScreenV2 ────────────────────────────────────────────────────────
function ProfileScreenV2({ T, totalValue, brokers, feedBroker, onChangeFeedBroker }) {
  const items = [
    { group: 'FUNDS', rows: [
      { icon: <CircleIcon T={T}>+</CircleIcon>, label: 'Add funds' },
      { icon: <DownloadIcon T={T} />, label: 'Withdraw', sub: '₹45,230.12 available' },
      { icon: <RotateIcon T={T} />, label: 'Transactions' },
    ]},
    { group: 'ACCOUNT', rows: [
      { icon: <BookIcon T={T}/>, label: 'My investments', sub: '₹' + fmtINR(totalValue, 0), accent: T.up },
      { icon: <StarIcon T={T}/>, label: 'Xusta Prime', sub: 'Active - renews 12 Jul' },
      { icon: <DocIcon T={T}/>, label: 'Tax & reports', sub: 'FY 2023-24' },
      { icon: <GearIcon T={T}/>, label: 'Settings' },
    ]},
    { group: 'SUPPORT', rows: [
      { icon: <HelpIcon T={T}/>, label: 'Help & Support', sub: '24x7 Support Available' },
      { icon: <GiftIcon T={T}/>, label: 'Refer & earn', sub: 'Earn up to ₹500', accent: T.brand },
    ]},
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BrandHeader title="Profile" T={T} trailing={
        <>
          <IconBtn T={T}><BellIcon /></IconBtn>
          <IconBtn T={T}><SearchIcon /></IconBtn>
        </>
      } />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 110px' }}>
        {/* Brand lockup splash */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: '4px 0 18px',
        }}>
          <XustaLockup color={T.brand} size={56} dark={T.dark} />
        </div>

        {/* User card */}
        <div style={{
          background: T.surface, borderRadius: T.radius.md,
          border: `0.5px solid ${T.borderS}`,
          padding: 12, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -40, top: -40, width: 140, height: 140,
            borderRadius: '50%', background: T.brand, opacity: 0.08,
          }} />
          <div style={{
            width: 56, height: 56, borderRadius: 8,
            background: T.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#08120c', fontSize: 22, fontWeight: 800,
          }}>AR</div>
          <div style={{ flex: 1, zIndex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: T.text, fontSize: 17, fontWeight: 700,
            }}>
              Arjun Rao
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: T.brand, background: T.brandDim,
                padding: '3px 7px', borderRadius: 4,
              }}>PRIME</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>
              XUSAF92 • arjun@example.com
            </div>
          </div>
          <svg width="10" height="16" viewBox="0 0 10 16" style={{ zIndex: 1 }}>
            <path d="M2 1l6 7-6 7" fill="none" stroke={T.text3} strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {items.map(g => (
          <div key={g.group} style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 11, color: T.text3, fontWeight: 700,
              letterSpacing: '0.08em', padding: '0 4px 8px',
            }}>{g.group}</div>
            <div style={{
              background: T.surface, borderRadius: T.radius.md,
              border: `0.5px solid ${T.borderS}`,
              overflow: 'hidden',
            }}>
              {g.rows.map((r, i) => (
                <div key={r.label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 14px',
                  borderBottom: i < g.rows.length - 1 ? `0.5px solid ${T.borderS}` : 'none',
                  cursor: 'pointer',
                }}>
                  <div style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {r.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>{r.label}</div>
                    {r.sub && (
                      <div style={{
                        fontSize: 11, marginTop: 2,
                        color: r.accent || T.text3, fontWeight: 500,
                      }}>{r.sub}</div>
                    )}
                  </div>
                  <svg width="8" height="14" viewBox="0 0 8 14">
                    <path d="M1 1l6 6-6 6" fill="none" stroke={T.text3} strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Connected brokers + price feed source */}
        {brokers && (
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 11, color: T.text3, fontWeight: 700,
              letterSpacing: '0.08em', padding: '0 4px 8px',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>CONNECTED BROKERS</span>
              <span style={{ color: T.brand }}>+ Add</span>
            </div>
            <div style={{
              background: T.surface, borderRadius: T.radius.md,
              border: `0.5px solid ${T.borderS}`,
              overflow: 'hidden',
            }}>
              {brokers.map((b, i) => (
                <div key={b.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderBottom: i < brokers.length - 1 ? `0.5px solid ${T.borderS}` : 'none',
                }}>
                  <BrokerLogo id={b.id} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>{b.name}</div>
                    <div className="mono" style={{ color: T.text3, fontSize: 11, marginTop: 2 }}>
                      {b.clientId}
                    </div>
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    cursor: 'pointer', userSelect: 'none',
                  }}>
                    <input type="radio" name="feed"
                      checked={feedBroker === b.id}
                      onChange={() => onChangeFeedBroker && onChangeFeedBroker(b.id)}
                      style={{ display: 'none' }} />
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: `1.5px solid ${feedBroker === b.id ? T.brand : T.text3}`,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {feedBroker === b.id && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.brand }} />
                      )}
                    </span>
                    <span style={{
                      fontSize: 10, color: feedBroker === b.id ? T.brand : T.text3,
                      fontWeight: 700, letterSpacing: '0.04em',
                    }}>FEED</span>
                  </label>
                </div>
              ))}
            </div>
            <div style={{
              fontSize: 11, color: T.text3, padding: '8px 4px 0',
              lineHeight: 1.4,
            }}>
              Live prices stream from the broker tagged <span style={{ color: T.brand, fontWeight: 700 }}>FEED</span>. Holdings still display from every connected broker.
            </div>
          </div>
        )}

        {/* Logout */}
        <button style={{
          width: '100%', height: 48,
          background: 'oklch(0.70 0.22 22 / 0.10)',
          border: `0.5px solid oklch(0.70 0.22 22 / 0.35)`,
          color: T.down,
          borderRadius: T.radius.md,
          fontSize: 15, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M6 3H3v10h3M11 5l3 3-3 3M14 8H7"
                  fill="none" stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Logout Account
        </button>
      </div>
    </div>
  );
}

// Profile icons
function CircleIcon({ T, children }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: '50%',
      border: `1.2px solid ${T.text2}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: T.text2, fontSize: 14, fontWeight: 500, lineHeight: 1,
    }}>{children}</div>
  );
}
function DownloadIcon({ T }) {
  return (<svg width="18" height="18" viewBox="0 0 18 18">
    <path d="M9 2v9m0 0l-3-3m3 3l3-3M3 14h12" stroke={T.text2} strokeWidth="1.5"
          fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>);
}
function RotateIcon({ T }) {
  return (<svg width="18" height="18" viewBox="0 0 18 18">
    <path d="M3 9a6 6 0 0110-4.3M15 9a6 6 0 01-10 4.3M14 2v3h-3M4 16v-3h3"
          stroke={T.text2} strokeWidth="1.5" fill="none"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>);
}
function BookIcon({ T }) {
  return (<svg width="18" height="18" viewBox="0 0 18 18">
    <rect x="3" y="3" width="12" height="12" rx="1.5" stroke={T.text2} strokeWidth="1.5" fill="none"/>
    <path d="M3 8h12M9 3v12" stroke={T.text2} strokeWidth="1.5"/>
  </svg>);
}
function StarIcon({ T }) {
  return (<svg width="18" height="18" viewBox="0 0 18 18">
    <path d="M9 2l2.2 4.5L16 7.2l-3.5 3.4.8 4.8L9 13.2 4.7 15.4l.8-4.8L2 7.2l4.8-.7L9 2z"
          stroke={T.text2} strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
  </svg>);
}
function DocIcon({ T }) {
  return (<svg width="18" height="18" viewBox="0 0 18 18">
    <path d="M4 2h7l3 3v11H4V2z" stroke={T.text2} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M11 2v3h3M6 9h6M6 12h4" stroke={T.text2} strokeWidth="1.5"
          strokeLinecap="round"/>
  </svg>);
}
function GearIcon({ T }) {
  return (<svg width="18" height="18" viewBox="0 0 18 18">
    <circle cx="9" cy="9" r="2.5" stroke={T.text2} strokeWidth="1.5" fill="none"/>
    <path d="M9 2v2m0 10v2M2 9h2m10 0h2M3.6 3.6l1.5 1.5m7.8 7.8l1.5 1.5m0-10.8l-1.5 1.5M5.1 12.9l-1.5 1.5"
          stroke={T.text2} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>);
}
function HelpIcon({ T }) {
  return (<svg width="18" height="18" viewBox="0 0 18 18">
    <circle cx="9" cy="9" r="6.5" stroke={T.text2} strokeWidth="1.5" fill="none"/>
    <path d="M7 7c0-1 1-2 2-2s2 1 2 2-2 1.5-2 3M9 12v.5" stroke={T.text2}
          strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>);
}
function GiftIcon({ T }) {
  return (<svg width="18" height="18" viewBox="0 0 18 18">
    <rect x="2" y="6" width="14" height="3" stroke={T.text2} strokeWidth="1.5" fill="none"/>
    <rect x="3" y="9" width="12" height="7" stroke={T.text2} strokeWidth="1.5" fill="none"/>
    <path d="M9 6v10M5 6c0-2 1-3 2-3s2 1 2 3M13 6c0-2-1-3-2-3s-2 1-2 3"
          stroke={T.text2} strokeWidth="1.5" fill="none"/>
  </svg>);
}

Object.assign(window, {
  BrandHeader, XustaMarkV2, XustaLockup, SearchIcon, BellIcon,
  WatchlistScreenV2, OrdersScreenV2, OrderEntryScreenV2, ProfileScreenV2,
});
