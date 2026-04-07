/**
 * CyberChain – Node.js Blockchain Logging Service
 * Connects to local Hardhat/Ganache or Ethereum testnet
 * and logs threat events via smart contract
 */

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const { ethers } = require('ethers');
const crypto   = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// Blockchain Setup
// ─────────────────────────────────────────────
const RPC_URL      = process.env.RPC_URL      || 'http://127.0.0.1:8545';
const PRIVATE_KEY  = process.env.PRIVATE_KEY  || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat #0
const CONTRACT_ADDR= process.env.CONTRACT_ADDR || null;

// Minimal ABI for ThreatLogger contract
const CONTRACT_ABI = [
  "event ThreatLogged(uint256 indexed id, string eventId, string payloadHash, string threatLevel, uint256 timestamp)",
  "function logThreat(string memory eventId, string memory payloadHash, string memory threatLevel) public returns (uint256)",
  "function getThreat(uint256 id) public view returns (string memory, string memory, string memory, uint256)",
  "function getThreatCount() public view returns (uint256)"
];

let provider, signer, contract;
let mockLedger = [];  // fallback when no chain available

async function initBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    await provider.getNetwork();
    signer   = new ethers.Wallet(PRIVATE_KEY, provider);
    if (CONTRACT_ADDR) {
      contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);
      console.log(`✅ Connected to contract at ${CONTRACT_ADDR}`);
    } else {
      console.log('⚠️  No CONTRACT_ADDR set – running in mock ledger mode');
    }
  } catch (err) {
    console.log('⚠️  Blockchain unavailable – using in-memory mock ledger');
  }
}
initBlockchain();

// ─────────────────────────────────────────────
// Helper: mock tx hash
// ─────────────────────────────────────────────
function mockTxHash(eventId) {
  return '0x' + crypto.createHash('sha256').update(eventId + Date.now()).digest('hex');
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status:          'online',
    chain_connected: !!contract,
    mock_entries:    mockLedger.length,
    timestamp:       new Date().toISOString()
  });
});


app.post('/api/blockchain/log', async (req, res) => {
  const { event_id, hash, threat_level } = req.body;

  if (!event_id || !hash || !threat_level) {
    return res.status(400).json({ error: 'Missing event_id, hash, or threat_level' });
  }

  // Try on-chain first
  if (contract) {
    try {
      const tx     = await contract.logThreat(event_id, hash, threat_level);
      const receipt= await tx.wait();
      return res.json({
        success:      true,
        tx_hash:      receipt.hash,
        block_number: receipt.blockNumber,
        on_chain:     true
      });
    } catch (err) {
      console.error('Chain write failed:', err.message);
    }
  }

  // Mock ledger fallback
  const entry = {
    id:          mockLedger.length + 1,
    event_id,
    payload_hash: hash,
    threat_level,
    tx_hash:     mockTxHash(event_id),
    timestamp:   Date.now(),
    on_chain:    false
  };
  mockLedger.push(entry);

  res.json({
    success:   true,
    tx_hash:   entry.tx_hash,
    id:        entry.id,
    on_chain:  false
  });
});


app.get('/api/blockchain/ledger', (req, res) => {
  const page  = parseInt(req.query.page  || '1');
  const limit = parseInt(req.query.limit || '20');
  const start = (page - 1) * limit;

  res.json({
    total:   mockLedger.length,
    page,
    entries: [...mockLedger].reverse().slice(start, start + limit)
  });
});


app.get('/api/blockchain/verify/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const entry = mockLedger.find(e => e.event_id === eventId);

  if (!entry) {
    return res.status(404).json({ found: false, message: 'Event not found on ledger' });
  }

  res.json({ found: true, ...entry });
});


app.get('/api/blockchain/stats', (req, res) => {
  const byLevel = mockLedger.reduce((acc, e) => {
    acc[e.threat_level] = (acc[e.threat_level] || 0) + 1;
    return acc;
  }, {});

  res.json({
    total_logged: mockLedger.length,
    by_level:     byLevel,
    chain_mode:   contract ? 'on-chain' : 'mock'
  });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🔗 Blockchain service on port ${PORT}`));
