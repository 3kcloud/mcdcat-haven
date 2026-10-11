// Vercel Serverless: 代理麦当劳 MCP `order-list`，返回订单总金额
// 原则：
//   1) Token 由请求体传入（玩家自填，ephemeral），服务端不存储、不落日志
//   2) 仅读取订单金额并换算，不返回/不存储订单明细
//   3) 浏览器无法直连 mcp.mcd.cn（CORS），故本代理层必须存在

const MCP_URL = 'https://mcp.mcd.cn';

function parse(raw) {
  const t = (raw || '').trim();
  if (!t) return null;
  if (t.includes('data:')) {
    let out = null;
    for (const line of t.split('\n')) {
      const s = line.trim();
      if (!s.startsWith('data:')) continue;
      const chunk = s.slice(5).trim();
      if (chunk && chunk !== '[DONE]') {
        try { out = JSON.parse(chunk); } catch (e) { /* skip */ }
      }
    }
    return out;
  }
  try { return JSON.parse(t); } catch (e) { return null; }
}

async function rpc(session, method, params, id, token) {
  const body = { jsonrpc: '2.0', method };
  if (id !== null) body.id = id;
  if (params) body.params = params;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (session) headers['Mcp-Session-Id'] = session;
  const r = await fetch(MCP_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const sid = r.headers.get('Mcp-Session-Id') || session;
  const raw = await r.text();
  return { sid, data: parse(raw) };
}

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { json(res, 405, { error: 'POST only' }); return; }

  let token = '';
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    token = (b && b.token) || '';
  } catch (e) {
    token = '';
  }
  if (!token) { json(res, 400, { error: 'missing token' }); return; }

  try {
    const init = await rpc(null, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'mcdcat-haven', version: '1.0.0' },
    }, 1, token);
    await rpc(init.sid, 'notifications/initialized', {}, null, token);
    const call = await rpc(init.sid, 'tools/call', { name: 'order-list', arguments: {} }, 2, token);
    const text = (call.data && call.data.result && call.data.result.content && call.data.result.content[0] && call.data.result.content[0].text) || '';
    // 抽取 realTotalAmount（仅取金额，其余订单信息一律丢弃）
    const amounts = Array.from(text.matchAll(/"realTotalAmount"\s*:\s*"?([\d.]+)"?/g)).map((m) => parseFloat(m[1]));
    const total = amounts.reduce((a, b) => a + b, 0);
    json(res, 200, { total: Math.round(total * 100) / 100, count: amounts.length });
  } catch (e) {
    json(res, 502, { error: 'mcp call failed' });
  }
}
