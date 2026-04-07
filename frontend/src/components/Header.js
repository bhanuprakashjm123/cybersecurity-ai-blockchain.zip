import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function Header({ activeTab, setActiveTab }) {
  const [status, setStatus] = useState('checking');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const check = async () => {
      try { await api.health(); setStatus('online'); }
      catch { setStatus('offline'); }
    };
    check();
    const i1 = setInterval(check, 10000);
    const i2 = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, []);

  const tabs = ['DASHBOARD', 'ANALYZER', 'BLOCKCHAIN', 'ALERTS'];

  return (
    <header style={S.header}>
      <div style={S.logo}>
        <span style={S.logoIcon}>⬡</span>
        <div>
          <div style={S.logoText}>CYBERCHAIN<span style={S.logoAI}> AI</span></div>
          <div style={S.logoSub}>THREAT DETECTION + BLOCKCHAIN LOGGING</div>
        </div>
      </div>

      <nav style={S.nav}>
        {tabs.map(t => (
          <button key={t} style={{...S.tab, ...(activeTab===t ? S.tabActive : {})}}
            onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      <div style={S.info}>
        <div style={S.clock}>{time.toLocaleTimeString()}</div>
        <div style={{...S.dot, background: status==='online' ? 'var(--green)' : 'var(--red)',
          boxShadow: `0 0 8px ${status==='online' ? 'var(--green)' : 'var(--red)'}`}} />
        <span style={S.statusTxt}>{status.toUpperCase()}</span>
      </div>
    </header>
  );
}

const S = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px', borderBottom: '1px solid var(--border)',
    background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 100
  },
  logo: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: { fontSize: 28, color: 'var(--cyan)', lineHeight: 1 },
  logoText: { fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 20, letterSpacing: 3, color: 'var(--text)' },
  logoAI: { color: 'var(--cyan)' },
  logoSub: { fontSize: 9, color: 'var(--text2)', letterSpacing: 2, marginTop: 1, fontFamily: 'var(--font-mono)' },
  nav: { display: 'flex', gap: 4 },
  tab: {
    background: 'none', border: '1px solid transparent', color: 'var(--text2)',
    padding: '6px 16px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600,
    fontSize: 12, letterSpacing: 2, borderRadius: 2, transition: 'all .2s'
  },
  tabActive: {
    color: 'var(--cyan)', borderColor: 'var(--cyan)',
    background: 'rgba(0,212,255,0.07)', boxShadow: '0 0 10px rgba(0,212,255,0.15)'
  },
  info: { display: 'flex', alignItems: 'center', gap: 8 },
  clock: { fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--cyan)' },
  dot: { width: 8, height: 8, borderRadius: '50%', transition: 'all .5s' },
  statusTxt: { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--text2)' }
};
