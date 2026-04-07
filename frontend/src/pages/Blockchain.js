import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function Blockchain() {
  const [ledger, setLedger]   = useState([]);
  const [stats,  setStats]    = useState(null);
  const [page,   setPage]     = useState(1);
  const [total,  setTotal]    = useState(0);
  const [verify, setVerify]   = useState('');
  const [vResult,setVResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLedger = async (p=1) => {
    try {
      const [l, s] = await Promise.all([api.ledger(p), api.chainStats()]);
      setLedger(l.data.entries || []);
      setTotal(l.data.total || 0);
      setStats(s.data);
    } catch {}
  };

  useEffect(() => { fetchLedger(page); }, [page]);
  useEffect(() => { const i = setInterval(() => fetchLedger(1), 5000); return () => clearInterval(i); }, []);

  const doVerify = async () => {
    if (!verify.trim()) return;
    setLoading(true); setVResult(null);
    try {
      const r = await api.verify(verify.trim());
      setVResult(r.data);
    } catch (e) {
      setVResult({ found: false, message: 'Not found on ledger' });
    }
    setLoading(false);
  };

  const LEVEL_COLORS = { CRITICAL:'#ff2d55', HIGH:'#ff6b00', MEDIUM:'#ffd700', LOW:'#00ff8c' };

  return (
    <div style={S.page}>
      {/* Stats row */}
      <div style={S.statsRow}>
        {[
          { l:'CHAIN MODE',    v: stats?.chain_mode?.toUpperCase() || 'MOCK', c:'var(--cyan)' },
          { l:'TOTAL LOGGED',  v: stats?.total_logged || 0, c:'var(--text)' },
          { l:'CRITICAL',      v: stats?.by_level?.CRITICAL || 0, c:'#ff2d55' },
          { l:'HIGH',          v: stats?.by_level?.HIGH     || 0, c:'#ff6b00' },
          { l:'MEDIUM',        v: stats?.by_level?.MEDIUM   || 0, c:'#ffd700' },
          { l:'LOW',           v: stats?.by_level?.LOW      || 0, c:'#00ff8c' },
        ].map(x => (
          <div key={x.l} className="panel" style={S.statCard}>
            <div style={{...S.statVal, color: x.c}}>{x.v}</div>
            <div style={S.statLabel}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Verify + Table */}
      <div style={S.body}>
        <div style={S.mainCol}>
          <div className="panel" style={S.panel}>
            <div style={S.panelTitle}>IMMUTABLE THREAT LEDGER</div>

            {/* Verify bar */}
            <div style={S.verifyRow}>
              <input style={S.verifyInput} placeholder="Enter Event ID to verify..."
                value={verify} onChange={e => setVerify(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doVerify()}/>
              <button style={S.verifyBtn} onClick={doVerify} disabled={loading}>
                {loading ? '⟳' : 'VERIFY'}
              </button>
            </div>

            {vResult && (
              <div style={{
                ...S.vResult,
                borderColor: vResult.found ? 'var(--green)' : 'var(--red)',
                color:       vResult.found ? 'var(--green)' : 'var(--red)'
              }}>
                {vResult.found
                  ? `✓ VERIFIED  |  Level: ${vResult.threat_level}  |  TX: ${vResult.tx_hash?.slice(0,20)}…`
                  : `✗ NOT FOUND: ${vResult.message}`}
              </div>
            )}

            {/* Ledger table */}
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>{['#','EVENT ID','PAYLOAD HASH','LEVEL','TX HASH','TIME'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {ledger.map(e => (
                    <tr key={e.id} style={S.tr}>
                      <td style={{...S.td, color:'var(--text2)'}}>{e.id}</td>
                      <td style={{...S.td, fontFamily:'var(--font-mono)', fontSize:10}}>
                        {e.event_id?.slice(0,12)}…
                      </td>
                      <td style={{...S.td, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text2)'}}>
                        {e.payload_hash?.slice(0,16)}…
                      </td>
                      <td style={{...S.td, color: LEVEL_COLORS[e.threat_level] || 'var(--text2)',
                        fontWeight:700, fontSize:11, letterSpacing:1}}>
                        {e.threat_level}
                      </td>
                      <td style={{...S.td, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--cyan)'}}>
                        {e.tx_hash?.slice(0,18)}…
                      </td>
                      <td style={{...S.td, color:'var(--text2)', fontSize:11}}>
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr><td colSpan={6} style={{...S.td, textAlign:'center', color:'var(--muted)', padding:30}}>
                      NO RECORDS — Simulate traffic to populate ledger
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={S.pager}>
              <button style={S.pageBtn} disabled={page === 1}
                onClick={() => setPage(p => p-1)}>← PREV</button>
              <span style={S.pageInfo}>PAGE {page} · {total} RECORDS</span>
              <button style={S.pageBtn} disabled={page * 20 >= total}
                onClick={() => setPage(p => p+1)}>NEXT →</button>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div style={S.sideCol}>
          <div className="panel" style={S.panel}>
            <div style={S.panelTitle}>HOW IT WORKS</div>
            {[
              ['1', 'AI DETECTS', 'Random Forest + Isolation Forest models analyze incoming packet features in real-time.'],
              ['2', 'HASH COMPUTED', 'SHA-256 hash of the full payload is computed to create a tamper-proof fingerprint.'],
              ['3', 'ON-CHAIN LOG', 'The event ID + hash are sent to the ThreatLogger smart contract on Ethereum/Hardhat.'],
              ['4', 'IMMUTABLE', 'Once written to the blockchain, the record cannot be altered or deleted.'],
            ].map(([n,t,d]) => (
              <div key={n} style={S.step}>
                <div style={S.stepNum}>{n}</div>
                <div>
                  <div style={S.stepTitle}>{t}</div>
                  <div style={S.stepDesc}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel" style={{...S.panel, marginTop:12}}>
            <div style={S.panelTitle}>CONTRACT INFO</div>
            <div style={S.contractRow}><span style={S.cKey}>CONTRACT</span>
              <span style={S.cVal}>ThreatLogger.sol</span></div>
            <div style={S.contractRow}><span style={S.cKey}>NETWORK</span>
              <span style={S.cVal}>Hardhat Local / Sepolia</span></div>
            <div style={S.contractRow}><span style={S.cKey}>LANGUAGE</span>
              <span style={S.cVal}>Solidity ^0.8.20</span></div>
            <div style={S.contractRow}><span style={S.cKey}>LIBRARY</span>
              <span style={S.cVal}>ethers.js v6</span></div>
            <div style={S.contractRow}><span style={S.cKey}>MODE</span>
              <span style={{...S.cVal, color:'var(--yellow)'}}>
                {stats?.chain_mode === 'on-chain' ? '🟢 ON-CHAIN' : '🟡 MOCK LEDGER'}
              </span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page:       { padding:20, display:'flex', flexDirection:'column', gap:14 },
  statsRow:   { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 },
  statCard:   { padding:'12px 14px', textAlign:'center' },
  statVal:    { fontFamily:'var(--font-mono)', fontSize:22, fontWeight:700 },
  statLabel:  { fontSize:9, letterSpacing:2, color:'var(--text2)', marginTop:2 },
  body:       { display:'grid', gridTemplateColumns:'1fr 280px', gap:14 },
  mainCol:    {},
  sideCol:    {},
  panel:      { padding:18 },
  panelTitle: { fontWeight:700, fontSize:11, letterSpacing:3, color:'var(--text2)', marginBottom:14 },
  verifyRow:  { display:'flex', gap:8, marginBottom:10 },
  verifyInput:{ flex:1, background:'rgba(0,212,255,0.04)', border:'1px solid var(--border)',
    color:'var(--text)', padding:'8px 12px', fontFamily:'var(--font-mono)', fontSize:12, outline:'none', borderRadius:2 },
  verifyBtn:  { background:'rgba(0,212,255,0.1)', border:'1px solid var(--cyan)', color:'var(--cyan)',
    padding:'0 16px', cursor:'pointer', fontWeight:700, fontSize:11, letterSpacing:2, borderRadius:2 },
  vResult:    { padding:'8px 12px', border:'1px solid', marginBottom:12, fontFamily:'var(--font-mono)',
    fontSize:11, borderRadius:2 },
  tableWrap:  { overflowX:'auto' },
  table:      { width:'100%', borderCollapse:'collapse' },
  th:         { padding:'7px 10px', textAlign:'left', fontSize:9, letterSpacing:2, color:'var(--text2)',
    borderBottom:'1px solid var(--border)', fontWeight:600 },
  tr:         { borderBottom:'1px solid rgba(15,42,69,0.4)' },
  td:         { padding:'7px 10px', fontSize:12 },
  pager:      { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14 },
  pageBtn:    { background:'none', border:'1px solid var(--border)', color:'var(--text2)',
    padding:'5px 12px', cursor:'pointer', fontSize:10, letterSpacing:2, fontFamily:'var(--font-ui)', borderRadius:2 },
  pageInfo:   { fontSize:10, color:'var(--text2)', letterSpacing:1 },
  step:       { display:'flex', gap:12, marginBottom:14 },
  stepNum:    { background:'rgba(0,212,255,0.1)', border:'1px solid var(--cyan)', color:'var(--cyan)',
    width:24, height:24, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:11, fontWeight:700, borderRadius:2 },
  stepTitle:  { fontWeight:700, fontSize:11, letterSpacing:2, marginBottom:3 },
  stepDesc:   { fontSize:11, color:'var(--text2)', lineHeight:1.5 },
  contractRow:{ display:'flex', justifyContent:'space-between', padding:'6px 0',
    borderBottom:'1px solid rgba(15,42,69,0.4)' },
  cKey:       { fontSize:9, letterSpacing:2, color:'var(--text2)' },
  cVal:       { fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text)' },
};
