import React, { useState } from 'react';
import { api } from '../utils/api';

const DEFAULT = {
  packet_size: 512, duration: 0.5, bytes_sent: 2000,
  bytes_recv: 5000, num_connections: 3, num_failed_logins: 0,
  port: 443, wrong_fragment: 0, land: 0, urgent: 0
};

const PRESETS = {
  'Normal Traffic': { ...DEFAULT },
  'DDoS Attack':    { packet_size: 64, duration: 0.005, bytes_sent: 80000, bytes_recv: 50, num_connections: 900, num_failed_logins: 0, port: 80, wrong_fragment: 0, land: 0, urgent: 0 },
  'Brute Force':    { packet_size: 200, duration: 0.8, bytes_sent: 500, bytes_recv: 200, num_connections: 5, num_failed_logins: 15, port: 22, wrong_fragment: 0, land: 0, urgent: 0 },
  'Port Scan':      { packet_size: 60, duration: 0.01, bytes_sent: 120, bytes_recv: 0, num_connections: 200, num_failed_logins: 0, port: 31337, wrong_fragment: 0, land: 0, urgent: 0 },
  'Injection':      { packet_size: 1500, duration: 0.02, bytes_sent: 45000, bytes_recv: 80, num_connections: 2, num_failed_logins: 1, port: 3306, wrong_fragment: 0, land: 1, urgent: 2 },
};

const LEVEL_COLORS = { CRITICAL:'#ff2d55', HIGH:'#ff6b00', MEDIUM:'#ffd700', LOW:'#00ff8c' };

export default function Analyzer() {
  const [form, setForm]     = useState({ ...DEFAULT });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState('');

  const submit = async () => {
    setLoading(true); setErr(''); setResult(null);
    try {
      const r = await api.analyze(form);
      setResult(r.data);
    } catch (e) {
      setErr(e.message || 'Analysis failed. Is Flask running?');
    }
    setLoading(false);
  };

  const applyPreset = (name) => setForm({ ...PRESETS[name] });

  return (
    <div style={S.page}>
      <div style={S.left}>
        <div className="panel" style={S.panel}>
          <div style={S.title}>TRAFFIC ANALYZER</div>
          <div style={S.subtitle}>Input network packet features for AI threat analysis</div>

          {/* Presets */}
          <div style={S.presetRow}>
            {Object.keys(PRESETS).map(p => (
              <button key={p} style={S.preset} onClick={() => applyPreset(p)}>{p}</button>
            ))}
          </div>

          {/* Fields */}
          <div style={S.fieldGrid}>
            {Object.entries(form).map(([key, val]) => (
              <div key={key} style={S.fieldGroup}>
                <label style={S.label}>{key.toUpperCase().replace(/_/g,' ')}</label>
                <input
                  style={S.input}
                  type="number" step="any"
                  value={val}
                  onChange={e => setForm(f => ({...f, [key]: parseFloat(e.target.value)||0}))}
                />
              </div>
            ))}
          </div>

          <button style={S.analyzeBtn} onClick={submit} disabled={loading}>
            {loading ? '⟳ ANALYZING...' : '⬡ ANALYZE THREAT'}
          </button>

          {err && <div style={S.err}>{err}</div>}
        </div>
      </div>

      <div style={S.right}>
        {result ? <ResultCard r={result} /> : <Placeholder />}
      </div>
    </div>
  );
}

function ResultCard({ r }) {
  const col = LEVEL_COLORS[r.threat_level] || 'var(--cyan)';
  const isAttack = r.is_attack;

  return (
    <div className="panel" style={{
      ...S.resultCard,
      borderColor: col,
      boxShadow: `0 0 20px ${col}33`,
      ...(isAttack ? { animation: 'pulse-red 2s infinite' } : {})
    }}>
      <div style={{...S.resultHeader, color: col}}>
        {isAttack ? '⚠ THREAT DETECTED' : '✓ TRAFFIC NORMAL'}
      </div>

      <div style={S.bigLabel} className={`tag-${r.threat_level?.toLowerCase()}`}>
        {r.threat_level}
      </div>

      <div style={S.confRow}>
        <span style={S.confLabel}>CONFIDENCE</span>
        <div style={S.confBar}>
          <div style={{...S.confFill, width: `${r.confidence}%`, background: col}}/>
        </div>
        <span style={{color: col, fontFamily:'var(--font-mono)', fontSize:14}}>{r.confidence?.toFixed(1)}%</span>
      </div>

      <div style={S.metaGrid}>
        {[
          ['ATTACK TYPE',   r.attack_type || 'None'],
          ['EVENT ID',      r.id?.slice(0,8) + '…'],
          ['PAYLOAD HASH',  r.payload_hash?.slice(0,16) + '…'],
          ['TX HASH',       r.tx_hash?.slice(0,16) + '…'],
          ['TIMESTAMP',     new Date(r.timestamp).toLocaleTimeString()],
          ['BLOCKCHAIN',    r.tx_hash ? '✓ LOGGED' : '✗ PENDING'],
        ].map(([k,v]) => (
          <div key={k} style={S.meta}>
            <div style={S.metaKey}>{k}</div>
            <div style={S.metaVal}>{v}</div>
          </div>
        ))}
      </div>

      <div style={S.hashBlock}>
        <div style={S.hashLabel}>BLOCKCHAIN TX</div>
        <div style={S.hash}>{r.tx_hash}</div>
      </div>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="panel" style={S.placeholder}>
      <div style={S.placeholderIcon}>⬡</div>
      <div style={S.placeholderText}>AWAITING ANALYSIS</div>
      <div style={S.placeholderSub}>Submit traffic features to run AI threat detection</div>
    </div>
  );
}

const S = {
  page:         { display:'grid', gridTemplateColumns:'1fr 380px', gap:16, padding:20, height:'calc(100vh - 70px)', overflow:'hidden' },
  left:         { overflowY:'auto' },
  right:        { overflowY:'auto' },
  panel:        { padding:24 },
  title:        { fontWeight:700, fontSize:14, letterSpacing:3, color:'var(--cyan)', marginBottom:4 },
  subtitle:     { color:'var(--text2)', fontSize:12, marginBottom:16 },
  presetRow:    { display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 },
  preset:       { background:'rgba(0,212,255,0.05)', border:'1px solid var(--border)', color:'var(--text2)',
    padding:'4px 10px', cursor:'pointer', fontSize:11, fontFamily:'var(--font-ui)', borderRadius:2, letterSpacing:1 },
  fieldGrid:    { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 },
  fieldGroup:   { display:'flex', flexDirection:'column', gap:4 },
  label:        { fontSize:9, letterSpacing:2, color:'var(--text2)', fontFamily:'var(--font-mono)' },
  input:        { background:'rgba(0,212,255,0.04)', border:'1px solid var(--border)', color:'var(--text)',
    padding:'7px 10px', fontFamily:'var(--font-mono)', fontSize:13, outline:'none', borderRadius:2 },
  analyzeBtn:   { width:'100%', padding:'12px', background:'rgba(0,212,255,0.1)', border:'2px solid var(--cyan)',
    color:'var(--cyan)', fontSize:13, fontWeight:700, letterSpacing:3, cursor:'pointer', borderRadius:2 },
  err:          { color:'var(--red)', fontSize:12, marginTop:12, fontFamily:'var(--font-mono)' },
  resultCard:   { padding:24, border:'2px solid', transition:'all .3s' },
  resultHeader: { fontFamily:'var(--font-ui)', fontWeight:700, fontSize:16, letterSpacing:2, marginBottom:16 },
  bigLabel:     { fontSize:40, fontWeight:700, letterSpacing:4, marginBottom:20, fontFamily:'var(--font-ui)' },
  confRow:      { display:'flex', alignItems:'center', gap:10, marginBottom:20 },
  confLabel:    { fontSize:9, letterSpacing:2, color:'var(--text2)', flexShrink:0 },
  confBar:      { flex:1, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' },
  confFill:     { height:'100%', borderRadius:3, transition:'width .8s ease' },
  metaGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 },
  meta:         { background:'var(--bg2)', padding:'8px 10px', borderRadius:2 },
  metaKey:      { fontSize:9, letterSpacing:2, color:'var(--text2)', marginBottom:3 },
  metaVal:      { fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text)' },
  hashBlock:    { background:'var(--bg2)', padding:10, borderRadius:2 },
  hashLabel:    { fontSize:9, letterSpacing:2, color:'var(--text2)', marginBottom:4 },
  hash:         { fontFamily:'var(--font-mono)', fontSize:10, color:'var(--cyan)', wordBreak:'break-all' },
  placeholder:  { height:'100%', minHeight:400, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', padding:40, textAlign:'center' },
  placeholderIcon:{ fontSize:60, color:'var(--border)', marginBottom:16, animation:'pulse-red 3s infinite' },
  placeholderText:{ fontSize:14, letterSpacing:3, color:'var(--muted)', marginBottom:8 },
  placeholderSub: { fontSize:11, color:'var(--text2)', maxWidth:260 },
};
