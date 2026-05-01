"""
core/schemas.py
===============
Data validation and serialization boundaries (Pydantic models).

Isolates HTTP payload parsing from internal domain logic.
"""
from typing import List, Optional

from pydantic import BaseModel, Field


class TokenData(BaseModel):
    """Input payload representing a single token's market data."""
    address: str
    symbol:  str
    name:    str = ""
    liquidity:             float = Field(default=0.0, ge=0)
    volume24hUSD:          float = Field(default=0.0, ge=0)
    price24hChangePercent: float = Field(default=0.0)


class PredictRequest(BaseModel):
    """Batch prediction request payload."""
    tokens: List[TokenData]


class PredictionResult(BaseModel):
    """Normalized prediction output sent to the client."""
    address:    str
    verdict:    str
    alphaScore: int
    riskScore:  int
    confidence: float
