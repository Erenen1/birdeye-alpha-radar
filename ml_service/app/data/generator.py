"""
data/generator.py
=================
Single Responsibility: Generates synthetic market data simulating Birdeye payloads.
"""
import numpy as np
import pandas as pd

from app.core.config import model_config


class SyntheticDataGenerator:
    """Generates features and labels for token analysis."""

    def __init__(self, seed: int = model_config.random_state):
        self.seed = seed

    def generate(self, n_samples: int = model_config.n_samples) -> pd.DataFrame:
        """
        Generates advanced institutional-grade features.
        
        New Features:
            - smart_money_buy_ratio: Proportion of volume from top wallets (Whales)
            - security_score: Derived from mint auth, freeze auth, and liquidity lock
        """
        np.random.seed(self.seed)

        # 1. Core features
        liquidity    = np.random.uniform(1000, 1_000_000, n_samples)
        volume       = np.random.uniform(100, 5_000_000, n_samples)
        price_change = np.random.uniform(-90, 500, n_samples)
        vol_liq_ratio = volume / liquidity

        # 2. Institutional features
        smart_money_buy_ratio = np.random.uniform(0, 1, n_samples)
        security_score        = np.random.uniform(0, 100, n_samples)

        df = pd.DataFrame({
            'liquidity':             liquidity,
            'volume':                volume,
            'price_change':          price_change,
            'vol_liq_ratio':         vol_liq_ratio,
            'smart_money_buy_ratio': smart_money_buy_ratio,
            'security_score':        security_score
        })

        # 3. Enhanced labeling strategy (Alpha Detection)
        labels = np.zeros(n_samples)
        for i in range(n_samples):
            row = df.iloc[i]
            
            # RUG CONDITIONS (High risk, low security)
            if row['security_score'] < 30 or (row['vol_liq_ratio'] > 10 and row['liquidity'] < 20000):
                labels[i] = 2  
            
            # GEM CONDITIONS (High smart money, good security, healthy growth)
            elif (row['smart_money_buy_ratio'] > 0.7 and 
                  row['security_score'] > 70 and 
                  row['price_change'] > 10):
                labels[i] = 1  
                
            # NEUTRAL / LOW CONVICTION
            else:
                labels[i] = 0

        df['target'] = labels
        return df
