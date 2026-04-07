import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

const LEVEL_CONFIG = {
  CRITICAL: { color: '#ff2d55', bg: 'rgba(255,45,85,0.08)',  icon: '🔴', priority: 4 },
  HIGH:     { color: '#ff6b00', bg: 'rgba(255,107,0,0.08)',  icon: '🟠', priority: 3 },
  MEDIUM:   { color: '#ffd700', bg: 'rgba(255,215,0,0.08)',  icon: '🟡', priority: 2 },
  LOW:      { color: '#00ff8c', bg: 'rgba(0,255,140,0.05)',  icon: '🟢', priority: 1 },
};

export default function Alerts() {
  const [events,  setEvents]  = useState([]);
  const [filter,  setFilter]  = useState('ALL');
  const [paused,  setPaused]  = useState(false);
  const [selected,setSelected]= useState(null);
  const pauseRef = useRef(false);

  useEffect(() => { pauseRef.current = paused; }, [paused]);

  useEffect(() => {
    const fetch = async () => {
      if (pauseRef.current) return;
      try {
        const r = await api.events(100);
        setEvents(r.data.filter(e => e.is_attack));
      } catch {}
    };
    fetch();
    const i = setInterval(fetch, 3000);
    return () => clearInterval(i);
  }, []);

  const levels = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const filtered = filter === 'ALL' ? events : events.filter(e => e.threat_level === filter);

  return (
    <div style={S.page}>
      {/* Left: alert feed */}
      <div style={S.left}>
        <div style={S.topBar}>
          <div style={S.filterRow}>
            {levels.map(l => (
              <button key={l}
                style={{...S.filterBtn, ...(filter===l ? {
                  borderColor: l==='ALL' ? 'var(--cyan)' : LEVEL_CONFIG[l]?.color,
                  color:       l==='ALL' ? 'var(--cyan)' : LEVEL_CONFIG[l]?.color,
                  background:  l==='ALL' ? 'rgba(0,212,255,0.08)' : LEVEL_CONFIG[l]?.bg,
                } : {})}}
                onClick={() => setFilter(l)}>{l}</button>
            ))}
          </div>
          <button style={{...S.pauseBtn, borderColor: paused ? 'var(--yellow)' : 'var(--border)',
            color: paused ? 'var(--yellow)' : 'var(--text2)'}}
            onClick={() => setPaused(p => !p)}>
            {paused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
        </div>

        <div style={S.feed}>
          {filtered.length === 0 && (
            <div style={S.empty}>NO THREATS DETECTED — system secure</div>
          )}
          {filtered.map(e => {
            const cfg = LEVEL_CONFIG[e.threat_level] || LEVEL_CONFIG.LOW;
            return (
              <div key={e.id}
                style={{...S.alertRow, borderLeftColor: cfg.color, background: cfg.bg,
                  ...(selected?.id===e.id ? {outline:`1px solid ${cfg.color}`} : {})}}
                onClick={() => setSelected(selected?.id===e.id ? null : e)}>
                <div style={S.alertLeft}>
                  <span style={S.alertIcon}>{cfg.icon}</span>
                  <div>
                    <div style={{...S.alertTitle, color: cfg.color}}>
                      {e.attack_type?.toUpperCase()} ATTACK
                    </div>
                    <div style={S.alertMeta}>
                      {new Date(e.timestamp).toLocaleTimeString()} &nbsp;·&nbsp;
                      Conf: {e.confidence?.toFixed(1)}% &nbsp;·&nbsp;
                      Port: {e.features?.port}
                    </div>
                  </div>
                </div>
                <div style={{...S.badge, color: cfg.color, borderColor: cfg.color}}>
                  {e.threat_level}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: detail pane */}
      <div style={S.right}>
        {selected ? <DetailPane e={selected} /> : (
          <div className="panel" style={S.placeholder}>
            <div style={S.phIcon}>⚠</div>
            <div style={S.phText}>SELECT AN ALERT</div>
            <div style={S.phSub}>Click any alert to view full details and blockchain record</div>
          </div>
        )}

        {/* Summary counts */}
        <div className="panel" style={{marginTop:14, padding:14}}>
          <div style={S.summaryTitle}>ACTIVE ALERT SUMMARY</div>
          {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => {
            const count = events.filter(e => e.threat_level === lvl).length;
            return (
              <div key={lvl} style={S.summaryRow}>
                <span style={{color: cfg.color, fontSize:11, fontWeight:700, letterSpacing:1}}>{lvl}</span>
                <div style={S.summaryBar}>
                  <div style={{
                    height:'100%', width: `${Math.min(count / Math.max(events.length,1) * 100, 100)}%`,
                    background: cfg.color, borderRadius:2, transition:'width .5s'
                  }}/>
                </div>
                <span style={{color: cfg.color, fontFamily:'var(--font-mono)', fontSize:12, minWidth:20}}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailPane({ e }) {
  const cfg = LEVEL_CONFIG[e.threat_level] || LEVEL_CONFIG.LOW;
  return (
    <div className="panel" style={{padding:20, border:`1px solid ${cfg.color}`, boxShadow:`0 0 16px ${cfg.color}22`}}>
      <div style={{color: cfg.color, fontWeight:700, fontSize:14, letterSpacing:3, marginBottom:16}}>
        {cfg.icon} {e.attack_type} — {e.threat_level}
      </div>
      <div style={S.detailGrid}>
        {[
          ['EVENT ID',      e.id],
          ['TIMESTAMP',     new Date(e.timestamp).toLocaleString()],
          ['CONFIDENCE',    `${e.confidence?.toFixed(2)}%`],
          ['ATTACK TYPE',   e.attack_type],
          ['THREAT LEVEL',  e.threat_level],
          ['PAYLOAD HASH',  e.payload_hash?.slice(0,20) + '…'],
        ].map(([k,v]) => (
          <div key={k} style={S.dRow}>
            <span style={S.dKey}>{k}</span>
            <span style={{...S.dVal, color: k==='THREAT LEVEL' ? cfg.color : 'var(--text)'}}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{marginTop:14}}>
        <div style={S.dKey}>PACKET FEATURES</div>
        <div style={S.featGrid}>
          {e.features && Object.entries(e.features).map(([k,v]) => (
            <div key={k} style={S.feat}>
              <span style={S.featKey}>{k}</span>
              <span style={S.featVal}>{typeof v === 'number' ? v.toFixed(2) : v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{marginTop:14, background:'var(--bg2)', padding:10, borderRadius:2}}>
        <div style={S.dKey}>BLOCKCHAIN TX HASH</div>
        <div style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--cyan)', marginTop:4, wordBreak:'break-all'}}>
          {e.tx_hash}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:       { display:'grid', gridTemplateColumns:'1fr 320px', gap:16, padding:20, height:'calc(100vh - 70px)' },
  left:       { display:'flex', flexDirection:'column', gap:12, overflow:'hidden' },
  right:      { overflowY:'auto' },
  topBar:     { display:'flex', justifyContent:'space-between', alignItems:'center' },
  filterRow:  { display:'flex', gap:6 },
  filterBtn:  { background:'none', border:'1px solid var(--border)', color:'var(--text2)',
    padding:'5px 12px', cursor:'pointer', fontFamily:'var(--font-ui)', fontSize:10,
    letterSpacing:2, fontWeight:700, borderRadius:2, transition:'all .2s' },
  pauseBtn:   { background:'none', border:'1px solid', padding:'5px 12px', cursor:'pointer',
    fontFamily:'var(--font-ui)', fontSize:10, letterSpacing:2, fontWeight:700, borderRadius:2 },
  feed:       { flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 },
  empty:      { textAlign:'center', padding:40, color:'var(--muted)', fontSize:11, letterSpacing:2 },
  alertRow:   { padding:'10px 14px', borderLeft:'3px solid', borderRadius:'0 3px 3px 0',
    cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center',
    transition:'opacity .2s', animation:'fadeInUp .3s' },
  alertLeft:  { display:'flex', alignItems:'center', gap:10 },
  alertIcon:  { fontSize:18 },
  alertTitle: { fontWeight:700, fontSize:12, letterSpacing:1 },
  alertMeta:  { fontSize:10, color:'var(--text2)', marginTop:2, fontFamily:'var(--font-mono)' },
  badge:      { border:'1px solid', borderRadius:2, padding:'2px 8px', fontSize:9, fontWeight:700, letterSpacing:2 },
  placeholder:{ padding:40, display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', textAlign:'center', minHeight:200 },
  phIcon:     { fontSize:40, color:'var(--border)', marginBottom:12 },
  phText:     { fontSize:12, letterSpacing:3, color:'var(--muted)' },
  phSub:      { fontSize:11, color:'var(--text2)', marginTop:6, maxWidth:240 },
  summaryTitle:{ fontSize:10, letterSpacing:3, color:'var(--text2)', marginBottom:10 },
  summaryRow: { display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  summaryBar: { flex:1, height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' },
  detailGrid: { display:'flex', flexDirection:'column', gap:6 },
  dRow:       { display:'flex', justifyContent:'space-between', padding:'5px 0',
    borderBottom:'1px solid rgba(15,42,69,0.4)' },
  dKey:       { fontSize:9, letterSpacing:2, color:'var(--text2)' },
  dVal:       { fontSize:11, fontFamily:'var(--font-mono)' },
  featGrid:   { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:4, marginTop:6 },
  feat:       { background:'var(--bg2)', padding:'5px 8px', borderRadius:2 },
  featKey:    { fontSize:8, color:'var(--text2)', letterSpacing:1, display:'block' },
  featVal:    { fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text)' },
};
