import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../utils/api';

const COLORS = {
  CRITICAL: '#ff2d55', HIGH: '#ff6b00', MEDIUM: '#ffd700', LOW: '#00ff8c'
};

export default function Dashboard() {
  const [stats,  setStats]  = useState(null);
  const [events, setEvents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [simulating, setSimulating] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [s, e] = await Promise.all([api.stats(), api.events(100)]);
      setStats(s.data);
      setEvents(e.data);
      // Build 20-point timeline from recent events
      const buckets = {};
      e.data.slice(0, 60).reverse().forEach((ev, i) => {
        const b = Math.floor(i / 3);
        buckets[b] = buckets[b] || { t: b, attacks: 0, normal: 0 };
        ev.is_attack ? buckets[b].attacks++ : buckets[b].normal++;
      });
      setTimeline(Object.values(buckets).slice(-20));
    } catch {}
  }, []);

  useEffect(() => { refresh(); const i = setInterval(refresh, 5000); return () => clearInterval(i); }, [refresh]);

  const simulate = async () => {
    setSimulating(true);
    try { await api.simulate(15); await refresh(); }
    catch {}
    setSimulating(false);
  };

  const pieData = stats ? Object.entries(stats.by_level || {}).map(([k, v]) => ({ name: k, value: v })) : [];

  return (
    <div style={S.page}>

      {/* Stat cards */}
      <div style={S.grid4}>
        {[
          { label: 'TOTAL EVENTS',   val: stats?.total_events   || 0, color: 'var(--cyan)',   icon: '◈' },
          { label: 'ATTACKS FOUND',  val: stats?.total_attacks  || 0, color: 'var(--red)',    icon: '⚠' },
          { label: 'NORMAL TRAFFIC', val: stats?.normal_traffic || 0, color: 'var(--green)',  icon: '✓' },
          { label: 'ATTACK RATE',    val: `${stats?.attack_rate || 0}%`, color: 'var(--orange)', icon: '⬡' },
        ].map(c => (
          <div key={c.label} className="panel" style={S.card}>
            <div style={{...S.cardIcon, color: c.color}}>{c.icon}</div>
            <div style={{...S.cardVal, color: c.color}}>{c.val}</div>
            <div style={S.cardLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={S.grid2}>
        {/* Timeline chart */}
        <div className="panel" style={S.chartPanel}>
          <div style={S.panelTitle}>TRAFFIC TIMELINE</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="ca" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff2d55" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ff2d55" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="cn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff8c" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff8c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={false} axisLine={false}/>
              <YAxis tick={{fill:'#3a5c78', fontSize:10}} axisLine={false}/>
              <Tooltip contentStyle={{background:'#0b1422',border:'1px solid #0f2a45',color:'#c8e4f5'}}/>
              <Area type="monotone" dataKey="normal"  stroke="#00ff8c" fill="url(#cn)" strokeWidth={1.5}/>
              <Area type="monotone" dataKey="attacks" stroke="#ff2d55" fill="url(#ca)" strokeWidth={1.5}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Threat distribution pie */}
        <div className="panel" style={S.chartPanel}>
          <div style={S.panelTitle}>THREAT LEVELS</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" paddingAngle={3}>
                {pieData.map((e, i) => (
                  <Cell key={i} fill={COLORS[e.name] || '#3a5c78'}
                    stroke={COLORS[e.name] || '#3a5c78'} strokeWidth={1}/>
                ))}
              </Pie>
              <Tooltip contentStyle={{background:'#0b1422',border:'1px solid #0f2a45',color:'#c8e4f5'}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={S.legend}>
            {Object.entries(COLORS).map(([k,v]) => (
              <div key={k} style={S.legendRow}>
                <div style={{...S.dot, background: v}}/>
                <span style={{color:'var(--text2)', fontSize:11}}>{k}</span>
                <span style={{color: v, marginLeft:'auto', fontSize:12}}>
                  {stats?.by_level?.[k] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attack types bar */}
      <div className="panel" style={{...S.chartPanel, width:'100%'}}>
        <div style={S.panelTitle}>ATTACK TYPES DETECTED</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={Object.entries(stats?.by_type || {}).map(([k,v]) => ({name:k, count:v}))}>
            <XAxis dataKey="name" tick={{fill:'#5a8caa', fontSize:11}} axisLine={false}/>
            <YAxis tick={{fill:'#3a5c78', fontSize:10}} axisLine={false}/>
            <Tooltip contentStyle={{background:'#0b1422',border:'1px solid #0f2a45',color:'#c8e4f5'}}/>
            <Bar dataKey="count" fill="var(--cyan)" radius={[2,2,0,0]} maxBarSize={40}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent events table */}
      <div className="panel" style={S.tablePanel}>
        <div style={{...S.panelTitle, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span>RECENT EVENTS</span>
          <button style={S.btn} onClick={simulate} disabled={simulating}>
            {simulating ? '⟳ SIMULATING...' : '▶ SIMULATE TRAFFIC'}
          </button>
        </div>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{['TIMESTAMP','TYPE','LEVEL','CONFIDENCE','TX HASH'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {events.slice(0,20).map(e => (
                <tr key={e.id} style={S.tr}>
                  <td style={S.td}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td style={{...S.td, color: e.is_attack ? 'var(--red)' : 'var(--green)'}}>
                    {e.is_attack ? e.attack_type : 'NORMAL'}
                  </td>
                  <td style={{...S.td}} className={`tag-${e.threat_level?.toLowerCase()}`}>
                    {e.threat_level}
                  </td>
                  <td style={S.td}>{e.confidence?.toFixed(1)}%</td>
                  <td style={{...S.td, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--cyan)'}}>
                    {e.tx_hash?.slice(0,18)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const S = {
  page:       { padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 },
  grid4:      { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  card:       { padding: 20, textAlign: 'center' },
  cardIcon:   { fontSize: 22, marginBottom: 8 },
  cardVal:    { fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700 },
  cardLabel:  { color: 'var(--text2)', fontSize: 10, letterSpacing: 2, marginTop: 4 },
  chartPanel: { padding: 16 },
  panelTitle: { fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, letterSpacing: 3,
    color: 'var(--text2)', marginBottom: 12 },
  legend:     { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 },
  legendRow:  { display: 'flex', alignItems: 'center', gap: 8 },
  dot:        { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  tablePanel: { padding: '16px' },
  tableWrap:  { overflowX: 'auto', marginTop: 8 },
  table:      { width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-ui)' },
  th:         { padding: '8px 12px', textAlign: 'left', fontSize: 10, letterSpacing: 2,
    color: 'var(--text2)', borderBottom: '1px solid var(--border)', fontWeight: 600 },
  tr:         { borderBottom: '1px solid rgba(15,42,69,0.5)', transition: 'background .15s', animation: 'fadeInUp .3s' },
  td:         { padding: '7px 12px', fontSize: 13 },
  btn:        {
    background: 'rgba(0,212,255,0.1)', border: '1px solid var(--cyan)', color: 'var(--cyan)',
    padding: '5px 14px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 11,
    letterSpacing: 1, fontWeight: 700, borderRadius: 2
  }
};
