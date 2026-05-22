// screens.jsx — Positions + Order Entry

const { useState: useStateS, useEffect: useEffectS, useRef: useRefS, useMemo: useMemoS } = React;

// ─── PositionsScreen ────────────────────────────────────────────────────────
// Two text-tabs with badge counts: Holdings | Positions (matches screenshot).
// Holdings uses the new HoldingRow (tap to toggle P&L↔LTP emphasis).
function PositionsScreen({ positions, holdings, brokers, brokerFilter, onChangeBrokerFilter, T, onOpenOrder, onSelectStock, onSquareOffAll, seg = 'holdings', onChangeSeg }) {
  const setSeg = (v) => onChangeSeg && onChangeSeg(v);
  const list = seg === 'holdings' ? holdings : positions;

  // Day's P&L totals — surfaced in a fixed band above the tab bar.
  const dayPL = list.reduce((s, p) => s + p.dayChange, 0);
  const totalCurrent = list.reduce((s, p) => s + p.value, 0);
  const dayPct = totalCurrent ? (dayPL / totalCurrent) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <BrandHeader title="Portfolio" T={T} trailing={
        <>
          <IconBtn T={T}><SearchIcon /></IconBtn>
          <IconBtn T={T}><BellIcon /></IconBtn>
        </>
      } />

      {/* Top sub-tab row */}
      <div style={{
        padding: '0 16px',
        display: 'flex', alignItems: 'flex-end', gap: 28,
        borderBottom: `0.5px solid ${T.borderS}`,
      }}>
        {[
          { id: 'holdings',  label: 'Holdings',  count: holdings.length  },
          { id: 'positions', label: 'Positions', count: positions.length },
        ].map(s => {
          const on = seg === s.id;
          return (
            <button key={s.id} onClick={() => setSeg(s.id)} style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              color: on ? T.brand : T.text2,
              fontSize: 15, fontWeight: on ? 700 : 600,
              padding: '0 0 10px', position: 'relative',
              letterSpacing: '-0.02em',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {s.label}
              <span style={{
                background: T.surface3,
                color: on ? T.brand : T.text2,
                fontSize: 10, fontWeight: 700,
                minWidth: 18, height: 18, borderRadius: 9,
                padding: '0 5px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{s.count}</span>
              {on && (
                <div style={{
                  position: 'absolute', left: 0, right: 24, bottom: -1,
                  height: 2, background: T.brand, borderRadius: 1,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Broker filter chips */}
      {brokers && (
        <div style={{
          display: 'flex', gap: 6, padding: '12px 16px 4px',
          overflowX: 'auto',
        }}>
          <button
            onClick={() => onChangeBrokerFilter('all')}
            style={brokerChipStyle(T, brokerFilter === 'all', T.brand)}>
            All ({holdings.length + positions.length})
          </button>
          {brokers.map(b => {
            const count = [...holdings, ...positions].filter(p => p.broker === b.id).length;
            const on = brokerFilter === b.id;
            return (
              <button key={b.id}
                onClick={() => onChangeBrokerFilter(b.id)}
                style={brokerChipStyle(T, on, b.color)}>
                <BrokerLogo id={b.id} size={16} />
                {b.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable body — pad bottom to make room for the fixed footer + tab bar */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 0 150px' }}>
        {seg === 'holdings' && (
          <HoldingsView holdings={holdings} T={T}
                        onSelectStock={onSelectStock}
                        onOpenOrder={onOpenOrder} />
        )}
        {seg === 'positions' && (
          <PositionsView positions={positions} T={T}
                         onSelectStock={onSelectStock}
                         onOpenOrder={onOpenOrder}
                         onSquareOffAll={onSquareOffAll} />
        )}
      </div>

      {/* Day's P&L — solid, fixed band ABOVE the tab bar (outside scroll) */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 78,
        background: T.surface,
        borderTop: `0.5px solid ${T.border}`,
        borderBottom: `0.5px solid ${T.border}`,
        padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 25,
      }}>
        <span style={{ color: T.text2, fontSize: T.sz.md, fontWeight: 500 }}>
          Day's P&amp;L
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <AnimatedNumber
            value={dayPL} T={T}
            format={(v) => fmtSignedINR(v, 2)}
            style={{
              fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em',
              color: dayPL >= 0 ? T.up : T.down,
            }}
          />
          <span className="mono" style={{
            color: dayPL >= 0 ? T.up : T.down, fontSize: T.sz.sm,
          }}>{fmtPct(dayPct)}</span>
        </span>
      </div>
    </div>
  );
}

// Positions view — matches the Holdings layout (summary card, toolbar, tappable rows)
function PositionsView({ positions, T, onSelectStock, onOpenOrder, onSquareOffAll }) {
  const [confirmSquare, setConfirmSquare] = useStateS(false);
  const totalInvested = positions.reduce((s, p) => s + p.invested, 0);
  const totalCurrent = positions.reduce((s, p) => s + p.value, 0);
  const totalPL = positions.reduce((s, p) => s + p.pnl, 0);
  const dayPL = positions.reduce((s, p) => s + p.dayChange, 0);
  const dayPct = totalCurrent ? (dayPL / totalCurrent) * 100 : 0;
  const pnlPct = totalInvested ? (totalPL / totalInvested) * 100 : 0;

  return (
    <>
      {/* Summary card */}
      <div style={{
        background: T.surface, borderRadius: T.radius.lg,
        border: `0.5px solid ${T.borderS}`,
        padding: T.compact ? 12 : 16,
        margin: '0 16px 14px',
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
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: T.text2, fontSize: T.sz.md, fontWeight: 500 }}>P&amp;L</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AnimatedNumber
              value={totalPL} T={T}
              format={(v) => fmtSignedINR(v, 2)}
              style={{
                fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em',
                color: totalPL >= 0 ? T.up : T.down,
              }}
            />
            <span className="mono" style={{
              background: totalPL >= 0 ? T.upDim : T.downDim,
              color: totalPL >= 0 ? T.up : T.down,
              fontSize: 12, fontWeight: 600,
              padding: '2px 7px', borderRadius: 999,
            }}>{fmtPct(pnlPct)}</span>
          </div>
        </div>
      </div>

      {/* Filter / view bar */}
      <div style={{
        padding: '0 16px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
        color: T.info, fontSize: T.sz.sm, fontWeight: 500,
      }}>
        <ProductFilter T={T} />
        <div style={{ flex: 1 }} />
        <button
          onClick={() => positions.length > 0 && setConfirmSquare(true)}
          disabled={positions.length === 0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px',
            background: positions.length === 0 ? 'transparent' : T.downDim,
            color: positions.length === 0 ? T.text3 : T.down,
            border: `0.5px solid ${positions.length === 0 ? T.borderS : T.down}`,
            borderRadius: 6,
            fontSize: T.sz.sm, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: positions.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}>
          Square off all
        </button>
      </div>

      {/* Position rows */}
      <div style={{ paddingTop: 4 }}>
        {positions.map(p => (
          <HoldingRow key={p.symbol} p={p} T={T}
                      onClick={() => onSelectStock(p)}
                      onOpenOrder={onOpenOrder} />
        ))}
        {positions.length === 0 && (
          <div style={{ textAlign: 'center', color: T.text3, fontSize: T.sz.md, padding: '60px 16px' }}>
            No active positions.
          </div>
        )}
      </div>

      {confirmSquare && (
        <SquareOffConfirm
          T={T}
          count={positions.length}
          totalPL={totalPL}
          onCancel={() => setConfirmSquare(false)}
          onConfirm={() => { setConfirmSquare(false); onSquareOffAll && onSquareOffAll(); }} />
      )}
    </>
  );
}

// ─── Square-off-all confirmation modal ───────────────────────────────────────
function SquareOffConfirm({ T, count, totalPL, onCancel, onConfirm }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 100,
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: T.surface,
          borderTop: `0.5px solid ${T.border}`,
          borderRadius: '16px 16px 0 0',
          padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
          color: T.text,
        }}>
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: T.borderS, margin: '0 auto 14px',
        }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: T.downDim, color: T.down,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            Square off all positions?
          </div>
        </div>
        <div style={{
          color: T.text2, fontSize: T.sz.md, lineHeight: 1.55, marginBottom: 14,
          fontWeight: 400,
        }}>
          Closes {count} open position{count > 1 ? 's' : ''} at market price across all connected brokers.
          This cannot be undone.
        </div>
        <div style={{
          background: T.surface2,
          border: `0.5px solid ${T.borderS}`,
          borderRadius: T.radius.md,
          padding: '10px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 18,
        }}>
          <span style={{ color: T.text2, fontSize: T.sz.sm }}>Realising P&amp;L</span>
          <span className="mono" style={{
            fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
            color: totalPL >= 0 ? T.up : T.down,
          }}>{fmtSignedINR(totalPL, 2)}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px 0',
            background: 'transparent',
            border: `0.5px solid ${T.border}`,
            borderRadius: 10,
            color: T.text, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1.4, padding: '12px 0',
            background: T.down,
            border: `0.5px solid ${T.down}`,
            borderRadius: 10,
            color: '#0c0e12', fontSize: 13, fontWeight: 800, letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Square off all</button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color, T }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: T.sz.xs, color: T.text3, textTransform: 'uppercase',
        letterSpacing: '0.04em' }}>{label}</span>
      <span className="mono" style={{
        fontSize: T.sz.sm, color: color || T.text, fontWeight: 600,
      }}>{value}</span>
    </div>
  );
}

// ─── PositionRow ────────────────────────────────────────────────────────────
function PositionRow({ p, T, onOpenOrder, onSelectStock }) {
  const longPressRef = useRefS(null);
  const triggeredRef = useRefS(false);

  const pnlPct = p.invested ? (p.pnl / p.invested) * 100 : 0;
  const up = p.pnl >= 0;
  const c = up ? T.up : T.down;

  const handleDown = () => {
    triggeredRef.current = false;
    longPressRef.current = setTimeout(() => {
      triggeredRef.current = true;
      navigator.vibrate && navigator.vibrate(30);
      onOpenOrder(p, p.qty >= 0 ? 'sell' : 'buy', Math.abs(p.qty));
    }, 500);
  };
  const cancelLongPress = () => {
    clearTimeout(longPressRef.current);
  };
  const handleUp = () => {
    cancelLongPress();
    if (!triggeredRef.current) {
      onSelectStock(p);
    }
  };

  return (
    <div
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: T.compact ? '10px 4px' : '12px 4px',
        borderBottom: `0.5px solid ${T.borderS}`,
        cursor: 'pointer',
        userSelect: 'none', touchAction: 'manipulation',
      }}
    >
      {/* left indicator */}
      <div style={{
        width: 3, alignSelf: 'stretch', borderRadius: 2,
        background: c, opacity: 0.7,
      }} />

      {/* symbol + qty */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 6,
          color: T.text, fontWeight: 700, fontSize: T.sz.md,
          letterSpacing: '-0.01em',
        }}>
          <span>{p.symbol}</span>
          <span style={{
            fontSize: T.sz.xs, fontWeight: 500, color: T.text3,
            background: T.surface2, padding: '1px 5px', borderRadius: 3,
            border: `0.5px solid ${T.borderS}`,
          }}>{p.exch}</span>
          {p.type && (
            <span style={{
              fontSize: T.sz.xs, fontWeight: 600, color: T.info,
              letterSpacing: '0.04em',
            }}>{p.type}</span>
          )}
        </div>
        <div className="mono" style={{
          fontSize: T.sz.xs, color: T.text3, marginTop: 2,
          display: 'flex', gap: 10,
        }}>
          <span>QTY <span style={{ color: T.text2 }}>{p.qty}</span></span>
          <span>AVG <span style={{ color: T.text2 }}>{fmtINR(p.avg)}</span></span>
        </div>
      </div>

      {/* LTP */}
      <div style={{
        width: T.compact ? 56 : 64, textAlign: 'right',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      }}>
        <AnimatedNumber
          value={p.ltp} T={T}
          format={(v) => fmtINR(v)}
          style={{ fontSize: T.sz.md, fontWeight: 600, color: T.text }}
        />
        <span className="mono" style={{ fontSize: T.sz.xs, color: c, marginTop: 1 }}>
          {fmtPct(p.dayPct)}
        </span>
      </div>

      {/* P&L */}
      <div style={{
        width: T.compact ? 68 : 78, textAlign: 'right',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      }}>
        <span className="mono" style={{
          fontSize: T.sz.md, fontWeight: 700, color: c, letterSpacing: '-0.01em',
        }}>{fmtSignedINR(p.pnl, 0)}</span>
        <span className="mono" style={{ fontSize: T.sz.xs, color: c, opacity: 0.8 }}>
          {fmtPct(pnlPct)}
        </span>
      </div>
    </div>
  );
}

// ─── OrderEntryScreen v2 ────────────────────────────────────────────────────
// Redesigned to match new spec: BUY/SELL toggle, product cards, market depth,
// last-5-min sparkline, required margin / available cash, DRAG TO BUY pill.
function OrderEntryScreenLegacy({ stock, defaultSide = 'buy', defaultQty = null, T, onSubmit, onBack }) {
  const [side, setSide] = useStateS(defaultSide); // tracked for visuals; final decided by swipe
  const [productType, setProductType] = useStateS('MTF'); // INTRADAY / DELIVERY / MTF
  const [orderType, setOrderType] = useStateS('LIMIT'); // MARKET / LIMIT
  const [qty, setQty] = useStateS(defaultQty != null ? defaultQty : 50);
  const [limitPrice, setLimitPrice] = useStateS(stock.ltp);
  const [stoploss, setStoploss] = useStateS('');
  const [validity, setValidity] = useStateS('DAY');

  useEffectS(() => { setLimitPrice(stock.ltp); }, [stock.symbol]);
  useEffectS(() => { setSide(defaultSide); }, [defaultSide]);
  useEffectS(() => { if (defaultQty != null) setQty(defaultQty); }, [defaultQty, stock.symbol]);

  const margin = useMemoS(() => {
    const total = qty * (orderType === 'MARKET' ? stock.ltp : limitPrice);
    if (productType === 'INTRADAY') return total * 0.2;
    if (productType === 'MTF') return total * 0.25;
    return total;
  }, [qty, stock.ltp, limitPrice, orderType, productType]);

  const total = qty * (orderType === 'MARKET' ? stock.ltp : limitPrice);
  const savings = productType === 'MTF' ? (total - margin) : 0;
  const availableMargin = 45230.12;

  const dayUp = stock.dayPct >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '54px 14px 12px',
        borderBottom: `0.5px solid ${T.borderS}`,
      }}>
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: '50%',
          background: T.surface2, border: `0.5px solid ${T.border}`,
          color: T.text2, fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ color: T.text, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
              {stock.symbol}
            </span>
            <span style={{
              fontSize: 10, color: T.text3, background: T.surface2,
              padding: '1px 5px', borderRadius: 3, border: `0.5px solid ${T.borderS}`,
              fontWeight: 500,
            }}>{stock.exch} · {stock.type || 'EQ'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <AnimatedNumber
              value={stock.ltp} T={T}
              format={(v) => '₹' + fmtINR(v)}
              style={{ fontSize: 14, fontWeight: 600, color: T.text }}
            />
            <span className="mono" style={{
              fontSize: 11, color: dayUp ? T.up : T.down, fontWeight: 600,
            }}>
              {fmtSignedINR(stock.dayChangeAmt, 2)} ({fmtPct(stock.dayPct)})
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LivePulse color={dayUp ? T.up : T.down} size={5} />
          <span className="mono" style={{ fontSize: 9, color: T.text3, letterSpacing: '0.05em' }}>
            LIVE
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 220px' }}>
        {/* Mini chart */}
        <div style={{
          background: T.surface, borderRadius: T.radius.md,
          border: `0.5px solid ${T.borderS}`,
          padding: '8px 4px 4px', marginBottom: 12,
        }}>
          <PriceChart data={stock.intraday} T={T}
                      color={dayUp ? T.up : T.down}
                      height={T.compact ? 70 : 88} />
          <div style={{ display: 'flex', justifyContent: 'space-between',
            padding: '4px 10px 2px', fontSize: 9, color: T.text3 }}>
            <span className="mono">9:15</span>
            <span className="mono">11:30</span>
            <span className="mono">13:45</span>
            <span className="mono">15:30</span>
          </div>
        </div>

        {/* Side indicator (this updates LIVE from swipe direction too) */}
        <SegRow value={side} onChange={setSide} T={T}
                options={[
                  { id: 'buy', label: 'Buy', color: T.up },
                  { id: 'sell', label: 'Sell', color: T.down },
                ]} highlight />

        {/* Product type */}
        <Label T={T}>Product</Label>
        <SegRow value={productType} onChange={setProductType} T={T}
                options={[
                  { id: 'INTRADAY', label: 'Intraday', sub: '5×' },
                  { id: 'DELIVERY', label: 'Delivery', sub: '1×' },
                  { id: 'MTF',      label: 'MTF',      sub: '4×' },
                ]} />

        {/* Order type */}
        <Label T={T}>Order Type</Label>
        <SegRow value={orderType} onChange={setOrderType} T={T}
                options={[
                  { id: 'MARKET', label: 'Market' },
                  { id: 'LIMIT',  label: 'Limit'  },
                  { id: 'SL',     label: 'SL'     },
                  { id: 'SL-M',   label: 'SL-M'   },
                ]} />

        {/* Quantity */}
        <Label T={T}>Quantity</Label>
        <DraggableQuantity value={qty} onChange={setQty} T={T} />

        {/* Price fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          <FieldBox label={orderType === 'MARKET' ? 'Market Price' : 'Limit Price'}
                    T={T}
                    locked={orderType === 'MARKET'}>
            {orderType === 'MARKET' ? (
              <span className="mono" style={{ color: T.text2, fontSize: T.sz.lg, fontWeight: 600 }}>
                ₹{fmtINR(stock.ltp)}
              </span>
            ) : (
              <input
                type="number"
                step="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(Number(e.target.value) || 0)}
                className="mono"
                style={{
                  width: '100%', border: 0, background: 'transparent',
                  color: T.text, fontSize: T.sz.lg, fontWeight: 600,
                  outline: 'none', padding: 0,
                }}
              />
            )}
          </FieldBox>
          <FieldBox label="Stoploss" T={T}>
            <input
              type="text"
              value={stoploss}
              onChange={(e) => setStoploss(e.target.value)}
              placeholder="Optional"
              className="mono"
              style={{
                width: '100%', border: 0, background: 'transparent',
                color: T.text, fontSize: T.sz.lg, fontWeight: 600,
                outline: 'none', padding: 0,
              }}
            />
          </FieldBox>
        </div>

        {/* Validity */}
        <Label T={T}>Validity</Label>
        <SegRow value={validity} onChange={setValidity} T={T}
                options={[
                  { id: 'DAY', label: 'DAY' },
                  { id: 'IOC', label: 'IOC' },
                  { id: 'GTT', label: 'GTT' },
                ]} />

        {/* MTF savings info */}
        {productType === 'MTF' && (
          <div style={{
            background: T.dark ? 'oklch(0.72 0.16 245 / 0.12)' : 'oklch(0.72 0.16 245 / 0.10)',
            borderLeft: `2px solid ${T.info}`,
            borderRadius: T.radius.sm,
            padding: T.compact ? '8px 10px' : '10px 12px',
            marginTop: 12,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ marginTop: 2, flexShrink: 0 }}>
              <circle cx="7" cy="7" r="6" fill="none" stroke={T.info} strokeWidth="1.2"/>
              <path d="M7 3.5v4M7 9.5v0.5" stroke={T.info} strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <div style={{ fontSize: T.sz.sm, color: T.text2, lineHeight: 1.4 }}>
              You're paying <b style={{ color: T.text }}>75% less</b> on this trade with
              <b style={{ color: T.info }}> Margin Trade Funding</b>. Save ₹{fmtINR(savings, 0)} today.
            </div>
          </div>
        )}

        {/* Margin summary */}
        <div style={{
          marginTop: 14, padding: T.compact ? '10px 12px' : '12px 14px',
          background: T.surface, borderRadius: T.radius.md,
          border: `0.5px solid ${T.borderS}`,
        }}>
          <RowKV label="Order value" value={'₹' + fmtINR(total)} T={T} />
          <RowKV label="Margin required" value={'₹' + fmtINR(margin)} T={T} strong />
          <RowKV label="Available margin"
                 value={'₹' + fmtINR(availableMargin)}
                 sub={availableMargin >= margin ? '✓ Sufficient' : '⚠ Insufficient'}
                 subColor={availableMargin >= margin ? T.up : T.down}
                 T={T} />
        </div>
      </div>

      {/* Swipe pad pinned bottom */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 80,
        padding: '12px 14px 0',
        background: T.dark
          ? 'linear-gradient(to top, oklch(0.17 0.012 240) 70%, oklch(0.17 0.012 240 / 0))'
          : 'linear-gradient(to top, oklch(0.985 0.003 240) 70%, oklch(0.985 0.003 240 / 0))',
      }}>
        <BidirectionalSwipe
          T={T}
          onBuy={() => onSubmit({ side: 'buy', symbol: stock.symbol, qty,
                                   price: orderType === 'MARKET' ? stock.ltp : limitPrice,
                                   productType, orderType, validity })}
          onSell={() => onSubmit({ side: 'sell', symbol: stock.symbol, qty,
                                    price: orderType === 'MARKET' ? stock.ltp : limitPrice,
                                    productType, orderType, validity })}
        />
      </div>
    </div>
  );
}

// helpers
function Label({ children, T }) {
  return (
    <div style={{
      fontSize: T.sz.xs, color: T.text3, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.07em',
      margin: '14px 0 6px 4px', lineHeight: 1.2,
    }}>{children}</div>
  );
}

function SegRow({ value, onChange, options, T, highlight = false }) {
  return (
    <div style={{
      display: 'flex', gap: 4,
      background: T.surface2, padding: 3,
      borderRadius: 10, border: `0.5px solid ${T.borderS}`,
    }}>
      {options.map(o => {
        const on = value === o.id;
        const color = o.color;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            flex: 1, padding: T.compact ? '6px 0' : '9px 0',
            border: 0, cursor: 'pointer', borderRadius: 7,
            background: on
              ? (highlight && color ? color : T.surface3)
              : 'transparent',
            color: on
              ? (highlight && color ? (color === T.up ? '#0c1410' : '#fff') : T.text)
              : T.text2,
            fontSize: T.sz.sm,
            fontWeight: on ? 700 : 500,
            letterSpacing: '0.02em',
            transition: 'all .15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <span>{o.label}</span>
            {o.sub && (
              <span style={{
                fontSize: T.sz.xs, fontWeight: 500,
                opacity: on ? 0.7 : 0.6,
              }}>{o.sub}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FieldBox({ label, locked, children, T }) {
  return (
    <div style={{
      background: T.surface2,
      borderRadius: T.radius.md,
      padding: T.compact ? '8px 10px' : '10px 12px',
      border: `0.5px solid ${T.borderS}`,
      opacity: locked ? 0.65 : 1,
    }}>
      <div style={{
        fontSize: T.sz.xs, color: T.text3, fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
      }}>{label}</div>
      {children}
    </div>
  );
}

function RowKV({ label, value, sub, subColor, strong, T }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '4px 0',
    }}>
      <span style={{ fontSize: T.sz.sm, color: T.text2 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {sub && (
          <span style={{ fontSize: T.sz.xs, color: subColor || T.text3, fontWeight: 500 }}>
            {sub}
          </span>
        )}
        <span className="mono" style={{
          fontSize: strong ? T.sz.md : T.sz.sm,
          color: T.text, fontWeight: strong ? 700 : 600,
        }}>{value}</span>
      </span>
    </div>
  );
}

function XustaMark({ T, size = 22 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      display: 'inline-block',
      background: T.brand,
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

function brokerChipStyle(T, on, accent) {
  // Use color-mix to apply alpha so this works regardless of whether
  // `accent` is a hex (#RRGGBB) or an oklch()/rgb() string.
  const tint = `color-mix(in oklch, ${accent} 18%, transparent)`;
  return {
    border: `0.5px solid ${on ? accent : T.borderS}`,
    background: on ? tint : T.surface,
    color: on ? T.text : T.text2,
    padding: '6px 10px',
    borderRadius: 999, fontSize: 11, fontWeight: 600,
    flexShrink: 0, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    letterSpacing: '0.02em', whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  };
}

Object.assign(window, {
  PositionsScreen, XustaMark, brokerChipStyle, ProductFilter,
});

// ─── ProductFilter: dropdown for product type (All / GTT / MTF / Intraday / Normal) ─
function ProductFilter({ T, value: controlledValue, onChange }) {
  const OPTIONS = ['All', 'GTT', 'MTF', 'Intraday', 'Normal'];
  const [internal, setInternal] = useStateS('All');
  const value = controlledValue ?? internal;
  const setValue = onChange ?? setInternal;
  const [open, setOpen] = useStateS(false);
  const wrapRef = useRefS(null);

  useEffectS(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px',
          background: T.surface2,
          color: T.text2,
          border: `0.5px solid ${T.borderS}`,
          borderRadius: 6,
          fontSize: T.sz.sm, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
        <span>{value}</span>
        <svg width="9" height="9" viewBox="0 0 9 9" style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform .15s',
        }}>
          <path d="M1.5 3l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.3"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          minWidth: 140,
          background: T.surface,
          border: `0.5px solid ${T.border}`,
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          padding: 4,
          zIndex: 50,
        }}>
          {OPTIONS.map(opt => {
            const on = opt === value;
            return (
              <button
                key={opt}
                onClick={() => { setValue(opt); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '8px 10px',
                  background: on ? T.surface2 : 'transparent',
                  border: 'none', borderRadius: 6,
                  color: on ? T.text : T.text2,
                  fontSize: T.sz.sm, fontWeight: on ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left',
                }}>
                <span>{opt}</span>
                {on && (
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="1.6"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
