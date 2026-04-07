<<<<<<< HEAD
# ⬡ CyberChain AI — Cyber Attack Detection + Blockchain Logging

> Real-time AI-powered network threat detection with immutable on-chain audit logging.

---

## 🏗 Architecture

```
cyberchain/
├── ml-engine/          # Python · Scikit-learn threat detection models
├── backend-flask/      # Python · Flask REST API (inference + events)
├── backend-node/       # Node.js · Blockchain logging service (ethers.js)
├── blockchain/         # Solidity · ThreatLogger smart contract (Hardhat)
└── frontend/           # React · Cyberpunk dashboard UI
```

### Tech Stack

| Layer      | Technology |
|------------|------------|
| AI/ML      | Python, Scikit-learn (Random Forest + Isolation Forest) |
| Backend    | Flask (Python), Node.js + Express |
| Blockchain | Ethereum · Solidity · ethers.js v6 · Hardhat |
| Frontend   | React 18, Recharts, Axios |

---

## 🚀 Quick Start

### 1 — Train the ML Model

```bash
cd ml-engine
pip install -r requirements.txt
python train_model.py
# → saves models/ folder (rf_classifier.pkl, isolation_forest.pkl, scaler.pkl)
```

### 2 — Start Flask API

```bash
cd backend-flask
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

> **Note:** If models haven't been trained yet, Flask falls back to a rule-based demo mode automatically.

### 3 — Start Blockchain Node (optional but recommended)

```bash
cd backend-node
npm install
cp .env.example .env
node server.js
# Runs on http://localhost:3001
```

### 4 — Deploy Smart Contract (optional)

```bash
cd blockchain
npm install
# Terminal A: start local chain
npx hardhat node
# Terminal B: deploy
npx hardhat run scripts/deploy.js --network localhost
# Copy the printed address into backend-node/.env → CONTRACT_ADDR=0x...
```

### 5 — Start React Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
# Opens http://localhost:3000
```

---

## 🖥 Dashboard Pages

| Page | Description |
|------|-------------|
| **DASHBOARD** | Live stats, traffic timeline, attack type breakdown, recent events |
| **ANALYZER** | Manual packet analysis with preset attack scenarios |
| **BLOCKCHAIN** | Immutable ledger viewer + event ID verifier |
| **ALERTS** | Real-time filterable attack alert feed with full detail pane |

---

## 🤖 AI Models

### Random Forest Classifier
- Supervised learning on 10 packet features
- 100 estimators, max depth 12
- Outputs: `is_attack` (0/1) + probability score

### Isolation Forest
- Unsupervised anomaly detection
- Detects unusual traffic that doesn't match normal distribution
- Acts as second layer of detection

### Features Used
```
packet_size, duration, bytes_sent, bytes_recv,
num_connections, num_failed_logins, port,
wrong_fragment, land, urgent
```

### Attack Types Detected
- **DDoS** — high connection count, low duration
- **Brute Force** — many failed logins
- **Port Scan** — rapid multi-port short connections
- **Injection** — large bytes with anomalous flags

---

## ⛓ Blockchain Logging

Every detected threat is:
1. Assigned a UUID event ID
2. SHA-256 hashed (payload fingerprint)
3. Logged to `ThreatLogger.sol` on-chain (or mock ledger)
4. Permanently verifiable via event ID

### Smart Contract Functions
```solidity
logThreat(eventId, payloadHash, threatLevel) → uint256
getThreat(id) → (eventId, hash, level, timestamp)
verifyPayload(eventId, hash) → bool
```

---

## 🔌 API Reference

### Flask (port 5000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/health`   | Health check |
| POST | `/api/analyze`  | Analyze packet features |
| POST | `/api/simulate` | Simulate random traffic batch |
| GET  | `/api/events`   | Get recent events |
| GET  | `/api/stats`    | Aggregate statistics |

### Node.js (port 3001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/health`              | Health check |
| POST | `/api/blockchain/log`      | Log event to chain |
| GET  | `/api/blockchain/ledger`   | Paginated ledger |
| GET  | `/api/blockchain/verify/:id` | Verify event ID |
| GET  | `/api/blockchain/stats`    | Chain statistics |

---

## 🌐 Deployment Notes

- For Sepolia testnet: add `SEPOLIA_RPC` + `PRIVATE_KEY` to `.env`
- For Hyperledger Fabric: replace ethers.js calls with Fabric SDK in `server.js`
- TensorFlow deep model: uncomment `tensorflow` in `ml-engine/requirements.txt` and extend `train_model.py`

---

## 📄 License

MIT — Free to use and extend.
=======
# cybersecurity-ai-blockchain.zip
“A hybrid security project combining Cybersecurity, AI, and Blockchain to detect threats, secure data, and provide tamper-proof logging. Includes ML-based anomaly detection, smart contracts, and a simple interface for demonstrating modern secure digital systems.”
>>>>>>> 9d62195d7f88e37ed9aaf89cc161fcae2ffdd238
