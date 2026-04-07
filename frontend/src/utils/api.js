import axios from 'axios';

const FLASK = process.env.REACT_APP_FLASK_URL || 'http://localhost:5000';
const NODE  = process.env.REACT_APP_NODE_URL  || 'http://localhost:3001';

export const api = {
  health:       () => axios.get(`${FLASK}/api/health`),
  analyze:   (d) => axios.post(`${FLASK}/api/analyze`, d),
  simulate:  (n) => axios.post(`${FLASK}/api/simulate`, { count: n }),
  events:    (n) => axios.get(`${FLASK}/api/events?limit=${n || 50}`),
  stats:        () => axios.get(`${FLASK}/api/stats`),

  ledger:    (p) => axios.get(`${NODE}/api/blockchain/ledger?page=${p || 1}`),
  chainStats:   () => axios.get(`${NODE}/api/blockchain/stats`),
  verify:    (id) => axios.get(`${NODE}/api/blockchain/verify/${id}`),
};
