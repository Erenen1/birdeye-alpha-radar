"""
api.py
======
Entrypoint for the FastAPI server.
Backward compatible with legacy run commands.
"""
import uvicorn
from web.app import create_app
from core.config import server_config

# Instantiate the FastAPI app
app = create_app()

if __name__ == "__main__":
    print(f"Starting Sycon Alpha ML Service on http://{server_config.host}:{server_config.port}")
    uvicorn.run(
        app, 
        host=server_config.host, 
        port=server_config.port
    )
