// app.jsx — Xusta prototype: state, mock data, navigation, tweaks

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useMemo: useMemoA } = React;

// ── Mock data: realistic NSE stocks ─────────────────────────────────────────
// Broker accounts the user has connected. Each holding is tagged with
// the broker that custodies it; the price feed is sourced from one chosen
// broker; the portfolio screen exposes a filter chip to slice by broker.
const SEED_BROKERS = [
  { id: 'zerodha',  name: 'Zerodha',   short: 'Z',  color: 'oklch(0.72 0.16 245)', clientId: 'ZK4837' },
  { id: 'groww',    name: 'Groww',     short: 'G',  color: 'oklch(0.84 0.18 145)', clientId: 'GW9281' },
  { id: 'upstox',   name: 'Upstox',    short: 'U',  color: 'oklch(0.76 0.18 280)', clientId: 'UX5631' },
  { id: 'angelone', name: 'Angel One', short: 'A',  color: 'oklch(0.78 0.16 50)',  clientId: 'AO1290' },
];

const SEED_POSITIONS = [
  { broker: 'angelone', symbol: 'BANKNIFTY', exch: 'NFO', type: 'FUT', expiry: 'MAY', qty:  30, avg:46812.40, ltp:46955.20, dayPct:  0.30 },
  { broker: 'zerodha',  symbol: 'BANKNIFTY', exch: 'NFO', type: 'OPT', opt: 'CE', strike: 46000, expiry: 'MAY', qty:  60, avg:  412.50, ltp:  587.30, dayPct:  3.84 },
  { broker: 'groww',    symbol: 'NIFTY',     exch: 'NFO', type: 'OPT', opt: 'PE', strike: 22200, expiry: 'MAY', qty:  75, avg:  185.20, ltp:  142.85, dayPct: -2.18 },
  { broker: 'upstox',   symbol: 'RELIANCE',  exch: 'NFO', type: 'OPT', opt: 'CE', strike:  3000, expiry: 'JUN', qty: 250, avg:   58.40, ltp:   72.15, dayPct:  1.92 },
];

const SEED_HOLDINGS = [
  { broker: 'zerodha',  symbol: 'TCS',        exch: 'NSE', type: 'EQ', qty: 110, avg: 3274.90, ltp: 3895.20, dayPct:  1.14 },
  { broker: 'groww',    symbol: 'TCS',        exch: 'NSE', type: 'EQ', qty:  90, avg: 3502.10, ltp: 3895.20, dayPct:  1.14 },
  { broker: 'groww',    symbol: 'INFY',       exch: 'NSE', type: 'EQ', qty: 400, avg: 1589.00, ltp: 1620.10, dayPct: -0.41 },
  { broker: 'upstox',   symbol: 'INFY',       exch: 'NSE', type: 'EQ', qty: 150, avg: 1605.50, ltp: 1620.10, dayPct: -0.41 },
  { broker: 'zerodha',  symbol: 'HDFCBANK',   exch: 'NSE', type: 'EQ', qty: 850, avg: 1463.65, ltp: 1487.90, dayPct:  0.18 },
  { broker: 'upstox',   symbol: 'ASIANPAINT', exch: 'NSE', type: 'EQ', qty:  85, avg: 3320.10, ltp: 3248.45, dayPct: -1.28 },
  { broker: 'angelone', symbol: 'BHARTIARTL', exch: 'NSE', type: 'EQ', qty: 320, avg: 1135.20, ltp: 1284.55, dayPct:  0.92 },
  { broker: 'groww',    symbol: 'ITC',        exch: 'NSE', type: 'EQ', qty: 600, avg:  415.40, ltp:  428.80, dayPct:  0.45 },
  { broker: 'zerodha',  symbol: 'SBIN',       exch: 'NSE', type: 'EQ', qty: 450, avg:  658.20, ltp:  812.45, dayPct:  1.78 },
  { broker: 'upstox',   symbol: 'ZOMATO',     exch: 'NSE', type: 'EQ', qty:2000, avg:  142.10, ltp:  162.40, dayPct:  2.59 },
];

// Watchlist universe
const SEED_WATCHLISTS = {
  'Watchlist 1': [
    { symbol: 'RELIANCE',   exch: 'NSE', ltp: 2945.10, dayPct:  0.42, flag: 'EVENT' },
    { symbol: 'HDFCBANK',   exch: 'NSE', ltp: 1422.35, dayPct: -0.57 },
    { symbol: 'INFY',       exch: 'NSE', ltp: 1620.00, dayPct:  0.00, flag: 'ALERT' },
    { symbol: 'TCS',        exch: 'NSE', ltp: 4012.75, dayPct:  1.14 },
    { symbol: 'ZOMATO',     exch: 'NSE', ltp:  162.40, dayPct:  2.59, flag: 'EVENT' },
    { symbol: 'ASIANPAINT', exch: 'NSE', ltp: 3248.45, dayPct: -1.28 },
    { symbol: 'BHARTIARTL', exch: 'NSE', ltp: 1284.55, dayPct:  0.92 },
    { symbol: 'ITC',        exch: 'NSE', ltp:  428.80, dayPct:  0.45 },
    { symbol: 'SBIN',       exch: 'NSE', ltp:  812.45, dayPct:  1.78 },
    { symbol: 'TATAMOTORS', exch: 'NSE', ltp:  945.30, dayPct:  0.87 },
  ],
  'Watchlist 2': [
    { symbol: 'ADANIENT',   exch: 'NSE', ltp: 2410.20, dayPct: -1.45 },
    { symbol: 'LT',         exch: 'NSE', ltp: 3590.10, dayPct:  0.32 },
    { symbol: 'MARUTI',     exch: 'NSE', ltp:11240.55, dayPct:  0.18 },
    { symbol: 'BAJFINANCE', exch: 'NSE', ltp: 6920.10, dayPct: -0.65 },
    { symbol: 'NESTLEIND',  exch: 'NSE', ltp: 2475.40, dayPct:  0.21 },
  ],
  'Watchlist 3': [
    { symbol: 'IRCTC',      exch: 'NSE', ltp:  820.55, dayPct:  1.45 },
    { symbol: 'PAYTM',      exch: 'NSE', ltp:  410.20, dayPct: -2.18 },
    { symbol: 'NYKAA',      exch: 'NSE', ltp:  192.40, dayPct:  3.12 },
    { symbol: 'POLICYBZR',  exch: 'NSE', ltp: 1650.80, dayPct:  0.42 },
  ],
  'Watchlist 4': [
    { symbol: 'NIFTYBEES',  exch: 'NSE', ltp:  248.75, dayPct:  0.42 },
    { symbol: 'GOLDBEES',   exch: 'NSE', ltp:   62.85, dayPct: -0.12 },
    { symbol: 'BANKBEES',   exch: 'NSE', ltp:  512.40, dayPct: -0.22 },
  ],
};

const SEED_INDICES = [
  { symbol: 'NIFTY 50',   value: 22347.20, changePct:  0.45 },
  { symbol: 'BANK NIFTY', value: 46812.55, changePct: -0.22 },
  { symbol: 'SENSEX',     value: 73489.15, changePct:  0.38 },
  { symbol: 'NIFTY MIDCAP',value:51420.10, changePct:  0.91 },
];

// Mock order history
const SEED_ORDERS = [
  { id: 'o1', side: 'SELL', filled: 1175, qty: 1175, time: '11:45:54',
    instrument: 'KALYANKJIL MAY 320 PE', exch: 'NFO', price: 4.10,
    product: 'NRML', orderType: 'LIMIT', status: 'COMPLETE' },
  { id: 'o2', side: 'BUY', filled: 1175, qty: 1175, time: '09:21:00',
    instrument: 'KALYANKJIL MAY 320 PE', exch: 'NFO', price: 5.00,
    product: 'NRML', orderType: 'LIMIT', status: 'COMPLETE' },
  { id: 'o3', side: 'BUY', filled: 0, qty: 500, time: '14:02:31',
    instrument: 'RELIANCE', exch: 'NSE', price: 2920.00,
    product: 'CNC', orderType: 'LIMIT', status: 'OPEN' },
  { id: 'o4', side: 'BUY', filled: 100, qty: 250, time: '13:48:12',
    instrument: 'TATAMOTORS', exch: 'NSE', price: 942.00,
    product: 'MIS', orderType: 'LIMIT', status: 'PARTIAL' },
  { id: 'o5', side: 'SELL', filled: 50, qty: 50, time: '10:12:45',
    instrument: 'TCS', exch: 'NSE', price: 3895.00,
    product: 'CNC', orderType: 'MARKET', status: 'COMPLETE' },
  { id: 'o6', side: 'BUY', filled: 0, qty: 100, time: '—',
    instrument: 'INFY', exch: 'NSE', price: 1580.00,
    product: 'CNC', orderType: 'LIMIT', status: 'GTT' },
  { id: 'o7', side: 'BUY', filled: 0, qty: 600, time: '—',
    instrument: 'ITC', exch: 'NSE', price: 410.00,
    product: 'CNC', orderType: 'SL-M', status: 'GTT' },
];

// Generate a sparkline (n random walk steps) anchored to LTP.
function genSparkline(seed, ltp, n = 20, vol = 0.012) {
  let r = seed;
  const rand = () => { r = (r * 1664525 + 1013904223) % 4294967296; return r / 4294967296; };
  const out = [];
  let v = ltp * (1 - vol * (rand() - 0.5) * 2);
  for (let i = 0; i < n; i++) {
    v = v * (1 + (rand() - 0.5) * vol);
    out.push(v);
  }
  out[n - 1] = ltp;
  return out;
}
function genIntraday(seed, ltp, openOffset = 0.008) {
  let r = seed;
  const rand = () => { r = (r * 1103515245 + 12345) % 2147483648; return r / 2147483648; };
  const n = 75;
  const open = ltp * (1 + openOffset);
  const out = [open];
  for (let i = 1; i < n - 1; i++) {
    const prev = out[i - 1];
    out.push(prev * (1 + (rand() - 0.5) * 0.004));
  }
  out.push(ltp);
  return out;
}

function enrichPosition(p, seed) {
  const invested = p.qty * p.avg;
  const value = p.qty * p.ltp;
  const pnl = value - invested;
  const dayChange = value * (p.dayPct / 100);
  return {
    ...p, invested, value, pnl, dayChange,
    dayChangeAmt: p.ltp * (p.dayPct / 100),
    sparkline: genSparkline(seed, p.ltp),
    intraday: genIntraday(seed, p.ltp, -p.dayPct / 100),
  };
}

function enrichWatchlistEntry(s, seed) {
  return {
    ...s,
    dayChange: s.ltp * (s.dayPct / 100),
    dayChangeAmt: s.ltp * (s.dayPct / 100),
    sparkline: genSparkline(seed, s.ltp),
    intraday: genIntraday(seed, s.ltp, -s.dayPct / 100),
  };
}

// ── Tweak defaults (persisted via EDITMODE block) ───────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": true,
  "density": "comfortable",
  "brand": "oklch(0.82 0.10 14)"
}/*EDITMODE-END*/;

// Curated brand palette options. The picker also exposes a custom-color
// row below so users can pick anything outside this set.
const BRAND_OPTIONS = [
  '#F5EFE6',                    // warm cream (default)
  'oklch(0.82 0.10 14)',        // soft peach
  'oklch(0.86 0.22 155)',       // mint green
  'oklch(0.78 0.16 50)',        // amber
  'oklch(0.76 0.18 280)',       // lavender
  'oklch(0.72 0.16 245)',       // sky blue
];

// ── Draggable dark/light toggle button ────────────────────────────────────
function DarkToggleBtn({ dark, T, onToggle }) {
  const [pos, setPos] = useStateA({ x: null, y: null }); // null = use default
  const drag = useRefA(null); // { startX, startY, initX, initY, moved, parentW, parentH }
  const btnRef = useRefA(null);

  const BTN = 31; // button hit-area diameter

  // Default position: top-right of the parent (phone canvas in desktop mode,
  // viewport on actual phones). null pos → resolved at render via right/top.
  const cx = pos.x;
  const cy = pos.y;

  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const parent = btnRef.current?.offsetParent;
    const pRect = parent?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight };
    const myRect = btnRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const pParentRect = parent?.getBoundingClientRect() || { left: 0, top: 0 };
    drag.current = {
      startX: e.clientX, startY: e.clientY,
      initX: myRect.left - pParentRect.left,
      initY: myRect.top  - pParentRect.top,
      parentW: pRect.width, parentH: pRect.height,
      moved: false,
    };
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (!drag.current.moved && Math.hypot(dx, dy) > 4) drag.current.moved = true;
    if (!drag.current.moved) return;
    const nx = Math.min(Math.max(drag.current.initX + dx, 6), drag.current.parentW - BTN - 6);
    const ny = Math.min(Math.max(drag.current.initY + dy, 8), drag.current.parentH - BTN - 60);
    setPos({ x: nx, y: ny });
  };

  const onPointerUp = (e) => {
    if (!drag.current) return;
    const wasMoved = drag.current.moved;
    drag.current = null;
    if (!wasMoved) onToggle();
  };

  // If user has dragged it, use absolute coords; otherwise default to the
  // bottom-right corner just above the tab bar — keeps it clear of the
  // BrandHeader (which sits at the very top on every screen).
  const positional = (cx == null || cy == null)
    ? { right: 14, bottom: 88 }
    : { left: cx, top: cy };

  return (
    <div
      ref={btnRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'absolute',
        ...positional,
        width: BTN, height: BTN,
        zIndex: 60,
        borderRadius: '50%',
        background: dark
          ? 'rgba(255,255,255,0.10)'
          : 'rgba(0,0,0,0.07)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'grab',
        color: T.text2,
        userSelect: 'none',
        touchAction: 'none',
        boxShadow: dark
          ? '0 1px 6px rgba(0,0,0,0.35)'
          : '0 1px 6px rgba(0,0,0,0.14)',
        transition: 'background 0.2s',
      }}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const T = useTokens(t.dark, t.density, t.brand);

  useEffectA(() => {
    document.body.classList.toggle('light-stage', !t.dark);
  }, [t.dark]);


  // Live ticking state
  const [positions, setPositions] = useStateA(() =>
    SEED_POSITIONS.map((p, i) => enrichPosition(p, i * 9173 + 1))
  );
  const [holdings, setHoldings] = useStateA(() =>
    SEED_HOLDINGS.map((p, i) => enrichPosition(p, i * 7919 + 3))
  );
  const [watchlists, setWatchlists] = useStateA(() => {
    const out = {};
    Object.keys(SEED_WATCHLISTS).forEach(k => {
      out[k] = SEED_WATCHLISTS[k].map((s, i) =>
        enrichWatchlistEntry(s, i * 8191 + k.charCodeAt(k.length - 1) * 137));
    });
    return out;
  });
  const [indices, setIndices] = useStateA(SEED_INDICES);

  // tick every 1.8s — small random walk on everything
  useEffectA(() => {
    const id = setInterval(() => {
      const drift = () => 1 + (Math.random() - 0.5) * 0.0014;
      setPositions(prev => prev.map(p => {
        const newLtp = +(p.ltp * drift()).toFixed(2);
        const dayPct = p.dayPct * 0.96 + (Math.random() - 0.5) * 0.05;
        return enrichPosition({ ...p, ltp: newLtp, dayPct: +dayPct.toFixed(3) },
                              Math.floor(Math.random() * 99999));
      }));
      setHoldings(prev => prev.map(p => {
        const newLtp = +(p.ltp * drift()).toFixed(2);
        const dayPct = p.dayPct * 0.97 + (Math.random() - 0.5) * 0.05;
        return enrichPosition({ ...p, ltp: newLtp, dayPct: +dayPct.toFixed(3) },
                              Math.floor(Math.random() * 99999));
      }));
      setWatchlists(prev => {
        const out = {};
        Object.keys(prev).forEach(k => {
          out[k] = prev[k].map(s => {
            const newLtp = +(s.ltp * drift()).toFixed(2);
            const dayPct = s.dayPct * 0.96 + (Math.random() - 0.5) * 0.06;
            return enrichWatchlistEntry({ ...s, ltp: newLtp, dayPct: +dayPct.toFixed(3) },
                                        Math.floor(Math.random() * 99999));
          });
        });
        return out;
      });
      setIndices(prev => prev.map(idx => ({
        ...idx,
        value: +(idx.value * drift()).toFixed(2),
        changePct: +(idx.changePct * 0.97 + (Math.random() - 0.5) * 0.04).toFixed(3),
      })));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  // Screen routing — independent of tab so back navigation works
  const [tab, setTab] = useStateA('home');
  const [screen, setScreen] = useStateA('home'); // home | watchlist | detail | order | positions | profile | orders | chain
  // Navigation stack so multi-hop flows (watchlist → detail → chain → order)
  // pop in the correct reverse order. Each entry is { screen, tab }.
  const [navStack, setNavStack] = useStateA([]);
  const pushNav = () => setNavStack(s => [...s, { screen, tab }]);
  const popNav = (fallbackScreen = 'watchlist', fallbackTab = 'watchlist') => {
    setNavStack(s => {
      const prev = s[s.length - 1];
      const next = s.slice(0, -1);
      if (prev) { setScreen(prev.screen); setTab(prev.tab); }
      else      { setScreen(fallbackScreen); setTab(fallbackTab); }
      return next;
    });
  };
  const [detailInitialTab, setDetailInitialTab] = useStateA('analysis');
  const [activeStock, setActiveStock] = useStateA(null);
  const [defaultSide, setDefaultSide] = useStateA('buy');
  const [defaultQty, setDefaultQty] = useStateA(null);
  const [toast, setToast] = useStateA(null);
  const [activeList, setActiveList] = useStateA('Watchlist 1');
  const [brokerFilter, setBrokerFilter] = useStateA('all'); // 'all' | broker.id
  const [feedBroker, setFeedBroker] = useStateA('zerodha'); // which broker the live LTP feed comes from
  const [portfolioSeg, setPortfolioSeg] = useStateA('holdings'); // 'holdings' | 'positions' — survives navigation

  // Pick latest data for activeStock from any of the lists
  const stockLive = useMemoA(() => {
    if (!activeStock) return null;
    // Indices live in their own array — keep the spot ticking when an option
    // chain is open on NIFTY/BANKNIFTY.
    const idx = indices.find(i => i.symbol === activeStock.symbol);
    if (idx) return {
      ...activeStock,
      ltp: idx.value,
      dayPct: idx.changePct,
      dayChangeAmt: idx.value * idx.changePct / 100,
    };
    // For derivatives the strike + opt + expiry uniquely identify the contract.
    // Skip the position-merge so we don't show a different strike's data.
    if (activeStock.type === 'OPT' || activeStock.type === 'FUT') {
      return activeStock;
    }
    const all = [...positions, ...holdings, ...Object.values(watchlists).flat()];
    // Match on symbol + exchange + instrument type so an equity (NSE EQ) isn't
    // confused with an option/future on the same symbol (NFO OPT/FUT). Falls
    // back to a symbol-only match, then the source stock.
    const sym  = activeStock.symbol;
    const exch = activeStock.exch;
    const typ  = activeStock.type ?? 'EQ';
    return (
      all.find(p => p.symbol === sym && p.exch === exch && (p.type ?? 'EQ') === typ)
      || all.find(p => p.symbol === sym && p.exch === exch)
      || all.find(p => p.symbol === sym && (p.type ?? 'EQ') === 'EQ')
      || all.find(p => p.symbol === sym)
      || activeStock
    );
  }, [activeStock, positions, holdings, watchlists, indices]);

  const openDetail = (stock, initialTab = 'analysis') => {
    pushNav();
    setActiveStock(stock);
    setDetailInitialTab(initialTab);
    setScreen('detail');
  };

  const openOrder = (stock, side = 'buy', qty = null) => {
    pushNav();
    setActiveStock(stock);
    setDefaultSide(side);
    setDefaultQty(qty);
    setScreen('order');
  };

  const submitOrder = (order) => {
    setScreen('positions');
    setTab('portfolio');
    setToast({
      type: order.side,
      msg: `${order.side === 'buy' ? 'Buy' : 'Sell'} order placed · ${order.qty} ${order.symbol} @ ₹${fmtINR(order.price)}`,
    });
  };

  // Open the option chain for the given underlying. `stock` may be a watchlist
  // entry or any object with .symbol; if the symbol isn't in OC_UNIVERSE we
  // bail (the caller should already have gated the affordance).
  const openChain = (stock) => {
    if (!stock || !window.OPTION_CHAIN_SYMBOLS?.has(stock.symbol)) return;
    pushNav();
    setActiveStock(stock);
    setScreen('chain');
  };

  const handleTab = (id) => {
    setTab(id);
    setNavStack([]); // tab switch resets back-stack — each tab is a fresh root
    if (id === 'home') setScreen('home');
    else if (id === 'watchlist') setScreen('watchlist');
    else if (id === 'portfolio') setScreen('positions');
    else if (id === 'orders') setScreen('orders');
    else if (id === 'profile') setScreen('profile');
  };

  // Apply broker filter for portfolio
  const filteredPositions = useMemoA(() =>
    brokerFilter === 'all' ? positions : positions.filter(p => p.broker === brokerFilter)
  , [positions, brokerFilter]);
  const filteredHoldings = useMemoA(() =>
    brokerFilter === 'all' ? holdings : holdings.filter(p => p.broker === brokerFilter)
  , [holdings, brokerFilter]);

  const totalPortfolioValue = useMemoA(() =>
    holdings.reduce((s, p) => s + p.value, 0)
  , [holdings]);

  // Expose a navigation hook for testing/screenshotting.
  useEffectA(() => {
    window.__xustaNav = (target, opts = {}) => {
      if (target === 'detail') {
        const s = opts.symbol
          ? watchlists['Watchlist 1'].find(x => x.symbol === opts.symbol)
          : watchlists['Watchlist 1'][0];
        openDetail(s);
      } else if (target === 'order') {
        const s = opts.symbol
          ? watchlists['Watchlist 1'].find(x => x.symbol === opts.symbol)
          : watchlists['Watchlist 1'][0];
        openOrder(s, opts.side || 'buy', opts.qty ?? 1);
      } else if (target === 'positions') {
        setTab('portfolio'); setScreen('positions');
      } else if (target === 'orders') {
        setTab('orders'); setScreen('orders');
      } else if (target === 'watchlist') {
        setTab('watchlist'); setScreen('watchlist');
      } else if (target === 'profile') {
        setTab('profile'); setScreen('profile');
      } else if (target === 'chain') {
        // Build a synthetic stock entry from indices or watchlist
        let s;
        if (opts.symbol === 'NIFTY 50' || opts.symbol === 'BANK NIFTY') {
          const idx = indices.find(i => i.symbol === opts.symbol);
          s = idx ? { symbol: idx.symbol, exch: 'NSE', ltp: idx.value, dayPct: idx.changePct } : null;
        } else {
          const sym = opts.symbol || 'NIFTY 50';
          s = watchlists['Watchlist 1'].find(x => x.symbol === sym)
              || { symbol: sym, exch: 'NSE', ltp: 0, dayPct: 0 };
        }
        if (s) openChain(s);
      }
    };
  });

  return (
    <>
      <div style={{
          position: 'absolute', inset: 0,
          background: T.bg,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
              {/* ── Dark / Light mode toggle (draggable) ── */}
            <DarkToggleBtn dark={t.dark} T={T} onToggle={() => setTweak('dark', !t.dark)} />

            {screen === 'home' && (
              <HomeScreen
                T={T}
                indices={indices}
                onOpenStock={(s) => {
                  // Try to find the full stock in watchlists; fall back to the seed
                  const all = Object.values(watchlists).flat();
                  const full = all.find(x => x.symbol === s.symbol) || s;
                  openDetail(full);
                }}
              />
            )}
            {screen === 'watchlist' && (
              <WatchlistScreenV2
                indices={indices}
                watchlists={watchlists}
                activeList={activeList}
                onChangeList={setActiveList}
                T={T}
                onSelectStock={openDetail}
                onOpenOrder={openOrder}
                onOpenChain={openChain}
                onSelectEvents={(s) => openDetail(s, 'events')}
                onAddStock={(s) => {
                  setWatchlists(prev => {
                    const cur = prev[activeList] || [];
                    if (cur.find(x => x.symbol === s.symbol)) return prev;
                    const seed = (cur.length + activeList.length) * 7919 + 11;
                    const ltp = 100 + (s.symbol.charCodeAt(0) * 9) % 3000;
                    const fresh = enrichWatchlistEntry({
                      symbol: s.symbol, exch: s.exch, ltp, dayPct: 0,
                    }, seed);
                    setToast({ type: 'info',
                      msg: `${s.symbol} added to ${activeList}` });
                    return { ...prev, [activeList]: [fresh, ...cur] };
                  });
                }}
              />
            )}
            {screen === 'detail' && stockLive && (
              <StockDetailScreen
                stock={stockLive}
                T={T}
                initialTab={detailInitialTab}
                onBack={() => popNav('watchlist', 'watchlist')}
                onOpenOrder={openOrder}
                onOpenChain={openChain}
              />
            )}
            {screen === 'positions' && (
              <PositionsScreen
                positions={filteredPositions}
                holdings={filteredHoldings}
                brokers={SEED_BROKERS}
                brokerFilter={brokerFilter}
                onChangeBrokerFilter={setBrokerFilter}
                T={T}
                onOpenOrder={openOrder}
                onSelectStock={openDetail}
                onSquareOffAll={() => {
                  const n = filteredPositions.length;
                  if (!n) return;
                  // Remove the currently-visible positions from the master list
                  const ids = new Set(filteredPositions.map(p => `${p.symbol}|${p.broker}`));
                  setPositions(prev => prev.filter(p => !ids.has(`${p.symbol}|${p.broker}`)));
                  setToast({ type: 'info', msg: `Squared off ${n} position${n > 1 ? 's' : ''} at market` });
                }}
                seg={portfolioSeg}
                onChangeSeg={setPortfolioSeg}
              />
            )}
            {screen === 'order' && stockLive && (
              <OrderEntryScreenV2
                key={`${stockLive.symbol}-${defaultSide}`}
                stock={stockLive}
                defaultSide={defaultSide}
                defaultQty={defaultQty}
                T={T}
                onSubmit={submitOrder}
                onBack={() => popNav('watchlist', 'watchlist')}
              />
            )}
            {screen === 'orders' && (
              <OrdersScreenV2 orders={SEED_ORDERS} T={T} />
            )}
            {screen === 'profile' && (
              <ProfileScreenV2
                T={T}
                totalValue={totalPortfolioValue}
                brokers={SEED_BROKERS}
                feedBroker={feedBroker}
                onChangeFeedBroker={setFeedBroker}
              />
            )}
            {screen === 'chain' && stockLive && (
              <OptionChainScreen
                symbol={stockLive.symbol}
                spot={stockLive.ltp}
                dayPct={stockLive.dayPct}
                dayChange={stockLive.dayChangeAmt || (stockLive.ltp * stockLive.dayPct / 100)}
                T={T}
                onBack={() => popNav('watchlist', 'watchlist')}
                onOpenOrder={openOrder}
              />
            )}

            <Toast message={toast?.msg} type={toast?.type} T={T} onClose={() => setToast(null)} />
            {/* Bottom nav hidden on stack-pushed screens (Stock Detail, Order
                Entry, Option Chain) so the back affordance is primary. */}
            {screen !== 'detail' && screen !== 'order' && screen !== 'chain' && (
              <TabBar active={tab} onChange={handleTab} T={T} />
            )}
          </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand color">
          <TweakColor label="Preset" value={t.brand}
                      options={BRAND_OPTIONS}
                      onChange={(v) => setTweak('brand', v)} />
          <TweakColor label="Custom" value={t.brand}
                      onChange={(v) => setTweak('brand', v)} />
        </TweakSection>
        <TweakSection label="Appearance">
          <TweakToggle label="Dark mode" value={t.dark}
                       onChange={(v) => setTweak('dark', v)} />
          <TweakRadio label="Density" value={t.density}
                      options={['compact', 'comfortable']}
                      onChange={(v) => setTweak('density', v)} />
        </TweakSection>
        <TweakSection label="Try it">
          <div style={{
            fontSize: 11, lineHeight: 1.5, color: 'rgba(41,38,27,0.65)',
            padding: '4px 2px',
          }}>
            <div>• <b>Tap</b> a watchlist row to see stock detail.</div>
            <div>• <b>Swipe left</b> on a watchlist row for quick Buy / Sell.</div>
            <div>• <b>Long-press</b> a position to quick-trade.</div>
            <div>• <b>Drag</b> the quantity number to scrub.</div>
            <div>• <b>Drag knob ← Buy · Sell →</b> to confirm.</div>
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('stage')).render(<App />);
