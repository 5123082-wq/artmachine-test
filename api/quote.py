import json

REQUIRED_FIELDS = {"name", "contact", "product"}


def handler(request):
    if request.method != "POST":
        return (405, {"allow": "POST"}, b"")

    try:
        if request.headers.get("content-type", "").startswith("application/json"):
            payload = request.get_json(force=True, silent=True) or {}
        else:
            payload = request.form or {}
    except Exception:
        payload = {}

    missing = [field for field in REQUIRED_FIELDS if not payload.get(field)]
    if missing:
        body = json.dumps({"error": "missing_fields", "fields": missing}).encode("utf-8")
        return (400, {"Content-Type": "application/json"}, body)

    response = {"status": "received"}
    body = json.dumps(response).encode("utf-8")
    return (200, {"Content-Type": "application/json"}, body)
