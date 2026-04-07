"""
CyberChain AI – Flask Backend
Handles: threat analysis, model inference, event logging
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import json
import os
import time
import uuid
import hashlib
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────
# Load ML Models (lazy-load if not present)
# ─────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'ml-engine', 'models')

def load_models():
    try:
        rf     = joblib.load(f'{MODEL_DIR}/rf_classifier.pkl')
        iso    = joblib.load(f'{MODEL_DIR}/isolation_forest.pkl')
        scaler = joblib.load(f'{MODEL_DIR}/scaler.pkl')
        with open(f'{MODEL_DIR}/features.json') as f:
            features = json.load(f)
        return rf, iso, scaler, features
    except FileNotFoundError:
        return None, None, None, None

rf_model, iso_model, scaler, FEATURES = load_models()

# In-memory event log (replace with DB in production)
EVENTS = []

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
ATTACK_TYPES = {
    'DDoS':       lambda f: f['num_connections'] > 200,
    'BruteForce': lambda f: f['num_failed_logins'] > 5,
    'PortScan':   lambda f: f['duration'] < 0.05 and f['num_connections'] > 50,
    'Injection':  lambda f: f['bytes_sent'] > 30000 and f['duration'] < 0.1,
    'Unknown':    lambda f: True,
}

def classify_attack_type(feat_dict):
    for name, fn in ATTACK_TYPES.items():
        try:
            if fn(feat_dict):
                return name
        except Exception:
            pass
    return 'Unknown'

def compute_hash(payload: dict) -> str:
    raw = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()

def mock_blockchain_log(event_id, payload_hash, threat_level):
    """
    In production: call the Node.js blockchain service.
    Here we mock the tx hash.
    """
    try:
        resp = requests.post(
            'http://localhost:3001/api/blockchain/log',
            json={'event_id': event_id, 'hash': payload_hash, 'threat_level': threat_level},
            timeout=2
        )
        return resp.json().get('tx_hash', 'MOCK_' + uuid.uuid4().hex[:16].upper())
    except Exception:
        return 'MOCK_TX_' + uuid.uuid4().hex[:16].upper()


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'online',
        'model_loaded': rf_model is not None,
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Accepts network traffic features, returns threat assessment.
    Body: { packet_size, duration, bytes_sent, bytes_recv,
            num_connections, num_failed_logins, port,
            wrong_fragment, land, urgent }
    """
    data = request.get_json(force=True)

    # Build feature vector
    if FEATURES:
        feat_vec = np.array([[data.get(f, 0) for f in FEATURES]], dtype=float)
        feat_scaled = scaler.transform(feat_vec)

        rf_pred    = int(rf_model.predict(feat_scaled)[0])
        rf_proba   = float(rf_model.predict_proba(feat_scaled)[0][1])
        iso_pred   = int(iso_model.predict(feat_scaled)[0])  # -1 = anomaly
        is_attack  = rf_pred == 1 or iso_pred == -1
        confidence = round(rf_proba * 100, 2)
    else:
        # Demo mode – rule-based fallback
        is_attack  = (data.get('num_connections', 0) > 100 or
                      data.get('num_failed_logins', 0) > 3)
        confidence = 87.5 if is_attack else 5.0
        rf_proba   = confidence / 100

    threat_level = (
        'CRITICAL' if rf_proba > 0.85 else
        'HIGH'     if rf_proba > 0.65 else
        'MEDIUM'   if rf_proba > 0.40 else
        'LOW'
    )

    attack_type  = classify_attack_type(data) if is_attack else 'None'
    event_id     = str(uuid.uuid4())
    payload_hash = compute_hash({**data, 'event_id': event_id})
    tx_hash      = mock_blockchain_log(event_id, payload_hash, threat_level)

    event = {
        'id':           event_id,
        'timestamp':    datetime.utcnow().isoformat() + 'Z',
        'is_attack':    is_attack,
        'threat_level': threat_level,
        'attack_type':  attack_type,
        'confidence':   confidence,
        'payload_hash': payload_hash,
        'tx_hash':      tx_hash,
        'features':     data
    }
    EVENTS.append(event)

    return jsonify(event)


@app.route('/api/events', methods=['GET'])
def get_events():
    limit = int(request.args.get('limit', 50))
    return jsonify(list(reversed(EVENTS[-limit:])))


@app.route('/api/simulate', methods=['POST'])
def simulate():
    """Simulate a batch of random traffic events for demo purposes."""
    body     = request.get_json(force=True) or {}
    count    = min(int(body.get('count', 10)), 50)
    results  = []

    for _ in range(count):
        is_attack = np.random.random() < 0.35
        if is_attack:
            feat = {
                'packet_size':       float(np.random.choice([64, 1500])),
                'duration':          round(float(np.random.exponential(0.01)), 4),
                'bytes_sent':        float(np.random.randint(20000, 100000)),
                'bytes_recv':        float(np.random.randint(10, 200)),
                'num_connections':   int(np.random.randint(100, 1000)),
                'num_failed_logins': int(np.random.randint(5, 20)),
                'port':              int(np.random.randint(1, 65535)),
                'wrong_fragment':    int(np.random.randint(0, 5)),
                'land':              int(np.random.randint(0, 2)),
                'urgent':            int(np.random.randint(0, 3)),
            }
        else:
            feat = {
                'packet_size':       float(np.clip(np.random.normal(512, 100), 64, 1500)),
                'duration':          round(float(np.random.exponential(0.5)), 4),
                'bytes_sent':        float(np.clip(np.random.normal(2000, 500), 0, None)),
                'bytes_recv':        float(np.clip(np.random.normal(5000, 1000), 0, None)),
                'num_connections':   int(np.random.poisson(3)),
                'num_failed_logins': 0,
                'port':              int(np.random.choice([80, 443, 22, 21, 25])),
                'wrong_fragment':    0,
                'land':              0,
                'urgent':            0,
            }

        with app.test_request_context(
            '/api/analyze', method='POST',
            json=feat, content_type='application/json'
        ):
            resp = analyze()
            results.append(resp.get_json())

    return jsonify({'simulated': len(results), 'events': results})


@app.route('/api/stats', methods=['GET'])
def stats():
    total   = len(EVENTS)
    attacks = sum(1 for e in EVENTS if e['is_attack'])
    by_type = {}
    by_level= {}
    for e in EVENTS:
        if e['is_attack']:
            by_type[e['attack_type']]   = by_type.get(e['attack_type'], 0) + 1
            by_level[e['threat_level']] = by_level.get(e['threat_level'], 0) + 1

    return jsonify({
        'total_events':  total,
        'total_attacks': attacks,
        'normal_traffic':total - attacks,
        'attack_rate':   round(attacks / total * 100, 1) if total else 0,
        'by_type':       by_type,
        'by_level':      by_level,
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
