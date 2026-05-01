"""
core/exceptions.py
==================
Custom domain-specific exceptions.
"""

class ModelServiceError(Exception):
    """Base exception for ML service errors."""
    pass


class ModelNotLoadedError(ModelServiceError):
    """Raised when predictions are requested but the model isn't available."""
    pass
