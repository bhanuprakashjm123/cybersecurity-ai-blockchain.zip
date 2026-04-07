"""
CyberChain AI - Threat Detection Model Training
Uses Scikit-learn + optional TensorFlow deep model
"""

import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import json

# ─────────────────────────────────────────────
# 1. SYNTHETIC DATASET GENERATOR
# ─────────────────────────────────────────────
def generate_network_traffic(n_samples=5000):
    """
    Simulate network traffic features:
    - packet_size, duration, bytes_sent, bytes_recv
    - port, protocol_type, flag, num_failed_logins
    - src_bytes, dst_bytes, land, wrong_fragment
    """
    np.random.seed(42)
    normal_count = int(n_samples * 0.75)
    attack_count = n_samples - normal_count

    # Normal traffic
    normal = pd.DataFrame({
        'packet_size':      np.random.normal(512, 100, normal_count).clip(64, 1500),
        'duration':         np.random.exponential(0.5, normal_count),
        'bytes_sent':       np.random.normal(2000, 500, normal_count).clip(0),
        'bytes_recv':       np.random.normal(5000, 1000, normal_count).clip(0),
        'num_connections':  np.random.poisson(3, normal_count),
        'num_failed_logins':np.zeros(normal_count),
        'port':             np.random.choice([80, 443, 22, 21, 25], normal_count),
        'wrong_fragment':   np.zeros(normal_count),
        'land':             np.zeros(normal_count),
        'urgent':           np.zeros(normal_count),
        'label': 0
    })

    # Attack traffic (DDoS, port scan, brute force, injection)
    attack = pd.DataFrame({
        'packet_size':      np.random.choice(
                                [np.random.normal(64, 5, attack_count // 2),
                                 np.random.normal(1500, 10, attack_count - attack_count // 2)]
                            )[0] if False else np.concatenate([
                                np.random.normal(64, 5, attack_count // 2),
                                np.random.normal(1500, 10, attack_count - attack_count // 2)
                            ]),
        'duration':         np.random.exponential(0.01, attack_count),
        'bytes_sent':       np.random.normal(50000, 10000, attack_count).clip(0),
        'bytes_recv':       np.random.normal(100, 50, attack_count).clip(0),
        'num_connections':  np.random.poisson(500, attack_count),
        'num_failed_logins':np.random.randint(5, 20, attack_count),
        'port':             np.random.randint(1, 65535, attack_count),
        'wrong_fragment':   np.random.randint(0, 5, attack_count),
        'land':             np.random.randint(0, 2, attack_count),
        'urgent':           np.random.randint(0, 3, attack_count),
        'label': 1
    })

    df = pd.concat([normal, attack], ignore_index=True).sample(frac=1, random_state=42)
    return df


# ─────────────────────────────────────────────
# 2. TRAIN MODELS
# ─────────────────────────────────────────────
def train(output_dir='models'):
    os.makedirs(output_dir, exist_ok=True)

    print("📊 Generating synthetic network traffic dataset...")
    df = generate_network_traffic(5000)

    features = ['packet_size', 'duration', 'bytes_sent', 'bytes_recv',
                'num_connections', 'num_failed_logins', 'port',
                'wrong_fragment', 'land', 'urgent']

    X = df[features]
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scaler
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    # ── Random Forest Classifier
    print("🌲 Training Random Forest classifier...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    rf.fit(X_train_s, y_train)
    rf_preds = rf.predict(X_test_s)
    print("\nRandom Forest Report:")
    print(classification_report(y_test, rf_preds, target_names=['Normal', 'Attack']))

    # ── Isolation Forest (anomaly detection, unsupervised)
    print("🔍 Training Isolation Forest (anomaly detector)...")
    iso = IsolationForest(contamination=0.25, random_state=42, n_jobs=-1)
    iso.fit(X_train_s)

    # Save models
    joblib.dump(rf,     f'{output_dir}/rf_classifier.pkl')
    joblib.dump(iso,    f'{output_dir}/isolation_forest.pkl')
    joblib.dump(scaler, f'{output_dir}/scaler.pkl')

    # Save feature list
    with open(f'{output_dir}/features.json', 'w') as f:
        json.dump(features, f)

    print(f"\n✅ Models saved to ./{output_dir}/")
    return rf, iso, scaler, features


if __name__ == '__main__':
    train()
