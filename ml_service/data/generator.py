"""
data/generator.py
=================
Single Responsibility: Generates synthetic market data simulating Birdeye payloads.
"""
import numpy as np
import pandas as pd

from core.config import model_config


class SyntheticDataGenerator:
    """Generates features and labels for token analysis."""

    def __init__(self, seed: int = model_config.random_state):
        self.seed = seed

    def generate(self, n_samples: int = model_config.n_samples) -> pd.DataFrame:
        """
        Creates a dataset with 'liquidity', 'volume', 'price_change', 
        'vol_liq_ratio' features, and a 'target' label.
        
        Targets:
            0: Neutral
            1: GEM
            2: RUG RISK
        """
        np.random.seed(self.seed)

        # 1. Generate core features
        liquidity    = np.random.uniform(1000, 1_000_000, n_samples)
        volume       = np.random.uniform(100, 5_000_000, n_samples)
        price_change = np.random.uniform(-90, 500, n_samples)
        vol_liq_ratio = volume / liquidity

        df = pd.DataFrame({
            'liquidity':     liquidity,
            'volume':        volume,
            'price_change':  price_change,
            'vol_liq_ratio': vol_liq_ratio
        })

        # 2. Rule-based labeling strategy
        labels = np.zeros(n_samples)
        
        # We iterate here to match legacy logic, though a vectorized approach 
        # (np.where) would be faster for large datasets.
        for i in range(n_samples):
            liq   = df.iloc[i]['liquidity']
            # vol   = df.iloc[i]['volume']
            chg   = df.iloc[i]['price_change']
            ratio = df.iloc[i]['vol_liq_ratio']
            
            if liq < 50_000 and ratio > 5:
                labels[i] = 2  # RUG RISK
            elif chg > 20 and liq > 100_000 and 0.5 < ratio < 3:
                labels[i] = 1  # GEM
            elif chg < -50:
                labels[i] = 2  # RUG RISK

        df['target'] = labels
        return df
