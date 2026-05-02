"""
data/generator.py
=================
Single Responsibility: Generates synthetic market data simulating Birdeye payloads.
"""
import numpy as np
import pandas as pd

from app.core.config import model_config


class SyntheticDataGenerator:
    """Generates high-fidelity features simulating market anomalies."""

    def __init__(self, seed: int = model_config.random_state):
        self.seed = seed

    def generate(self, n_samples: int = model_config.n_samples) -> pd.DataFrame:
        """
        Simulates high-fidelity market regimes:
        - Regime 1: Organic Growth (Gem)
        - Regime 2: Wash Trading / Pump & Dump (Rug)
        - Regime 3: Stagnation (Neutral)
        """
        np.random.seed(self.seed)

        # 1. Use Log-Normal for financial data (more realistic distribution)
        liquidity = np.random.lognormal(mean=10, sigma=1.5, size=n_samples)
        volume    = np.random.lognormal(mean=11, sigma=2.0, size=n_samples)
        price_change = np.random.uniform(-95, 300, n_samples)
        
        # 2. Advanced features simulation
        smart_money_ratio = np.random.beta(a=2, b=2, size=n_samples) 
        security_score = np.random.triangular(0, 70, 100, n_samples)
        sybil_score = np.random.exponential(scale=10, size=n_samples).clip(0, 100) # Most have low sybil
        whale_quality = np.random.normal(loc=50, scale=20, size=n_samples).clip(0, 100)

        vol_liq_ratio = volume / liquidity
        momentum = price_change * smart_money_ratio
        integrity_score = security_score * (1 - (sybil_score / 100.0))
        security_mult = security_score / 100.0
        risk_adjusted_vol = volume * security_mult
        liquidity_density = liquidity / 1_000_000

        df = pd.DataFrame({
            'liquidity':             liquidity,
            'volume':                volume,
            'vol_liq_ratio':         vol_liq_ratio,
            'price_change':          price_change,
            'smart_money_ratio':     smart_money_ratio,
            'security_score':        security_score,
            'sybil_score':           sybil_score,
            'whale_quality':         whale_quality,
            'integrity_score':       integrity_score,
            'momentum':              momentum,
            'risk_adjusted_vol':     risk_adjusted_vol,
            'liquidity_density':     liquidity_density
        })

        # 3. Expert-System Labeling (Pattern Recognition)
        labels = np.zeros(n_samples)
        for i in range(n_samples):
            row = df.iloc[i]
            
            # GEM: High Momentum + Integrity + Smart Money Quality
            if (row['momentum'] > 40 and row['integrity_score'] > 75 and 
                row['whale_quality'] > 60 and row['vol_liq_ratio'] < 4):
                labels[i] = 1
            
            # RUG: Sybil attack OR Low Integrity OR Extreme Wash Trading
            elif row['sybil_score'] > 50 or row['integrity_score'] < 35 or row['vol_liq_ratio'] > 12:
                labels[i] = 2
            
            # FAIL-SAFE
            elif row['price_change'] < -50:
                labels[i] = 2
                
            else:
                labels[i] = 0

        df['target'] = labels
        return df
