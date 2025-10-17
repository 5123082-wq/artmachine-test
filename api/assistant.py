import json

IDEAS = [
    "Подбор капсулы из трёх позиций с акцентом на брендовые цвета",
    "Совет по материалам для летней униформы с учётом интенсивной носки",
    "План запуска мерча к событию с чек-листом производства"
]


def handler(request):
    if request.method != "POST":
        return (405, {"allow": "POST"}, b"")

    try:
        payload = request.get_json(force=True, silent=True) or {}
    except Exception:
        payload = {}

    prompt = (payload.get("prompt") or "").strip()
    if not prompt:
        body = json.dumps({"error": "missing_prompt"}).encode("utf-8")
        return (400, {"Content-Type": "application/json"}, body)

    body = json.dumps({"ideas": IDEAS[:3]}).encode("utf-8")
    return (200, {"Content-Type": "application/json"}, body)
