import React, { useState } from 'react';
import Header    from './components/Header';
import Dashboard from './pages/Dashboard';
import Analyzer  from './pages/Analyzer';
import Blockchain from './pages/Blockchain';
import Alerts    from './pages/Alerts';

export default function App() {
  const [tab, setTab] = useState('DASHBOARD');

  const pages = {
    DASHBOARD:  <Dashboard />,
    ANALYZER:   <Analyzer />,
    BLOCKCHAIN: <Blockchain />,
    ALERTS:     <Alerts />,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header activeTab={tab} setActiveTab={setTab} />
      <main>{pages[tab]}</main>
    </div>
  );
}
