import os
import sys

print(f"PORT env: {os.environ.get('PORT', 'not set')}", flush=True)

try:
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    print(f"Starting uvicorn on port {port}", flush=True)
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="debug",
        timeout_graceful_shutdown=30,
    )
except Exception as e:
    print(f"STARTUP FAILED: {e}", flush=True)
    import traceback

    traceback.print_exc()
    sys.exit(1)
