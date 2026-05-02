"""
model/features.py
=================
Engineers raw market data into high-order quant features (Velocity, Acceleration, Confluence).
"""
import pandas as pd
import numpy as np
from app.core.schemas import TokenData

class FeatureEngineer:
    """Transforms raw token snapshots into velocity and acceleration vectors."""

    @staticmethod
    def engineer(token: TokenData) -> pd.DataFrame:
        # 1. Base values
        liq = max(token.liquidity or 1.0, 1.0)
        vol = token.volume24hUSD or 0.0
        
        # 2. Velocity Metrics (Change per unit of time/liquidity)
        # We assume price24hChange is a velocity metric. 
        # But we also want Volatility/Liquidity ratio as a proxy for 'market heat'
        vol_liq_ratio = vol / liq
        
        # 3. Acceleration Proxies
        # If we had 1h and 24h data, we could calculate true acceleration.
        # For now, we simulate 'momentum' using buy/sell pressure and smart money
        buy_pressure = token.smartMoneyBuyRatio or 0.5
        momentum = (token.price24hChangePercent or 0.0) * buy_pressure
        
        # 4. Security & Integrity as dampeners
        security_mult = (token.securityScore or 50.0) / 100.0
        sybil_penalty = (token.sybilScore or 0.0) / 100.0
        integrity_score = (token.securityScore or 50.0) * (1 - sybil_penalty)

        return pd.DataFrame([{
            'liquidity':             liq,
            'volume':                vol,
            'vol_liq_ratio':         vol_liq_ratio,
            'price_change':          token.price24hChangePercent or 0.0,
            'smart_money_ratio':     buy_pressure,
            'security_score':        token.securityScore or 50.0,
            'sybil_score':           token.sybilScore or 0.0,
            'whale_quality':         token.whaleQualityIndex or 0.0,
            'integrity_score':       integrity_score,
            'momentum':              momentum,
            'risk_adjusted_vol':     vol * security_mult,
            'liquidity_density':     liq / 1_000_000 
        }])
