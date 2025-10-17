import json
from datetime import datetime, timezone

def handler(request):
    if request.method != "GET":
        return (405, {"allow": "GET"}, b"")

    payload = {
        "ok": True,
        "service": "art-machine",
        "ts": datetime.now(timezone.utc).isoformat()
    }
    body = json.dumps(payload).encode("utf-8")
    return (200, {"Content-Type": "application/json"}, body)
