"""麦当劳 MCP 真机验证脚本（本地测试用，不入库）。
Token 仅从环境变量 MCD_TOKEN 读取，绝不明文写死。
用法: MCD_TOKEN=xxx python mcp_probe.py
"""
import os, json, sys, urllib.request, urllib.error

URL = "https://mcp.mcd.cn"
TOKEN = os.environ.get("MCD_TOKEN")
if not TOKEN:
    print("ERROR: 请通过环境变量 MCD_TOKEN 传入 Token")
    sys.exit(1)

def post(method, params=None, req_id=None, session_id=None):
    body = {"jsonrpc": "2.0", "method": method}
    if req_id is not None:
        body["id"] = req_id
    if params is not None:
        body["params"] = params
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(URL, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json, text/event-stream")
    if session_id:
        req.add_header("Mcp-Session-Id", session_id)
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            sid = r.headers.get("Mcp-Session-Id")
            raw = r.read().decode("utf-8", "replace")
        return sid, parse_response(raw)
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}: {e.read().decode('utf-8','replace')[:500]}"
    except Exception as e:
        return None, f"ERR {type(e).__name__}: {e}"

def parse_response(raw):
    raw = raw.strip()
    if not raw:
        return None
    # SSE format
    if raw.startswith("event:") or "data:" in raw:
        out = []
        for line in raw.splitlines():
            line = line.strip()
            if line.startswith("data:"):
                chunk = line[len("data:"):].strip()
                if chunk and chunk != "[DONE]":
                    try:
                        out.append(json.loads(chunk))
                    except Exception:
                        pass
        return out[-1] if out else raw
    # plain JSON
    try:
        return json.loads(raw)
    except Exception:
        return raw

def main():
    results = {}
    # 1. initialize
    sid, r1 = post("initialize", {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "mcdcat-probe", "version": "0.1"}
    }, req_id=1)
    results["initialize"] = {"session": sid, "result": r1}
    print("=== initialize ===")
    print(json.dumps(r1, ensure_ascii=False)[:800])

    # 2. initialized notification (no id)
    post("notifications/initialized", {}, req_id=None, session_id=sid)

    # 3. tools/list
    _, r3 = post("tools/list", {}, req_id=2, session_id=sid)
    tools = []
    if isinstance(r3, dict):
        tools = r3.get("result", {}).get("tools", [])
    results["tools_count"] = len(tools)
    results["tool_names"] = [t.get("name") for t in tools]
    print("\n=== tools/list ===")
    print(f"count={len(tools)}")
    # print only names + first 3 details
    for t in tools[:3]:
        print(" -", t.get("name"), "::", (t.get("description") or "")[:60])

    # 4. order-list (核心: 订单金额 -> 猫粮)
    _, r4 = post("tools/call", {"name": "order-list", "arguments": {}}, req_id=3, session_id=sid)
    results["order-list"] = r4
    print("\n=== tools/call: order-list ===")
    print(json.dumps(r4, ensure_ascii=False)[:1500])

    # 5. query-meals (公开层只读)
    _, r5 = post("tools/call", {"name": "query-meals", "arguments": {}}, req_id=4, session_id=sid)
    results["query-meals"] = r5
    print("\n=== tools/call: query-meals ===")
    print(json.dumps(r5, ensure_ascii=False)[:1200])

    # 6. list-nutrition-foods (公开层只读)
    _, r6 = post("tools/call", {"name": "list-nutrition-foods", "arguments": {}}, req_id=5, session_id=sid)
    results["list-nutrition-foods"] = r6
    print("\n=== tools/call: list-nutrition-foods ===")
    print(json.dumps(r6, ensure_ascii=False)[:1200])

    # 7. auto-bind-coupons (真实领券，谨慎: 调一次)
    _, r7 = post("tools/call", {"name": "auto-bind-coupons", "arguments": {}}, req_id=6, session_id=sid)
    results["auto-bind-coupons"] = r7
    print("\n=== tools/call: auto-bind-coupons (REAL) ===")
    print(json.dumps(r7, ensure_ascii=False)[:1200])

    # dump full results
    with open(os.path.join(os.path.dirname(__file__), "mcp_probe_result.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    print("\n[Saved] mcp_probe_result.json")

if __name__ == "__main__":
    main()
