import concurrent.futures
import datetime
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def request(url, headers=None, body=None):
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), headers=headers or {})
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=25) as response:
            return response.status, response.read(2_000_000).decode('utf-8', 'replace'), response.headers
    except urllib.error.HTTPError as error:
        return error.code, '', error.headers
    except Exception:
        return None, '', {}

def row(service, variable, status, scope, **extra):
    return {'provider': service, 'variable': variable, 'http_status': status,
            'scope': scope, 'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(), **extra}

def get_probe(service, variable, url):
    value = os.environ.get(variable, '').strip() if variable else ''
    if variable and not value:
        return row(service, variable, None, 'secret_absent')
    status, body, _ = request(url, {'Authorization': 'Bearer ' + value} if value else {})
    return row(service, variable or '(none)', status, 'authenticated_get' if variable and status == 200 else 'control_or_failed_get')

def mcp_json(body):
    try:
        return json.loads(body)
    except Exception:
        for line in body.splitlines():
            if line.startswith('data:'):
                try:
                    return json.loads(line[5:].strip())
                except Exception:
                    pass
    return {}

def hemicycle():
    key = os.environ.get('HEMICYCLE_AI_API', '').strip()
    if not key:
        return row('Hemicycle MCP', 'HEMICYCLE_AI_API', None, 'secret_absent')
    headers = {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}
    status, body, response_headers = request('https://api.hemicycle.ai/mcp', headers, {
        'jsonrpc': '2.0', 'id': 1, 'method': 'initialize', 'params': {
            'protocolVersion': '2025-03-26', 'capabilities': {},
            'clientInfo': {'name': 'mavai-readonly-audit', 'version': '0.1.0'}}})
    result = mcp_json(body)
    if status != 200 or 'result' not in result:
        return row('Hemicycle MCP', 'HEMICYCLE_AI_API', status, 'initialize_failed')
    if response_headers.get('mcp-session-id'):
        headers['Mcp-Session-Id'] = response_headers.get('mcp-session-id')
    headers['MCP-Protocol-Version'] = result['result'].get('protocolVersion', '2025-03-26')
    request('https://api.hemicycle.ai/mcp', headers, {'jsonrpc': '2.0', 'method': 'notifications/initialized'})
    listed_status, listed_body, _ = request('https://api.hemicycle.ai/mcp', headers, {'jsonrpc': '2.0', 'id': 2, 'method': 'tools/list', 'params': {}})
    listing = mcp_json(listed_body)
    tools = listing.get('result', {}).get('tools', [])
    return row('Hemicycle MCP', 'HEMICYCLE_AI_API', listed_status, 'initialize_and_tools_list' if tools else 'tools_list_failed',
               tool_count=len(tools), tool_names=[tool.get('name') for tool in tools if isinstance(tool.get('name'), str)])

def artcb():
    base = os.environ.get('ARTCB_API_URL', '').strip()
    parsed = urllib.parse.urlsplit(base)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
        return row('ARTcB health', 'ARTCB_API_URL', None, 'url_absent_or_invalid')
    status, _, _ = request(base.rstrip('/') + '/health')
    return row('ARTcB health', 'ARTCB_API_URL', status, 'unauthenticated_health_only')

jobs = [
    lambda: get_probe('Featherless plan', '', 'https://api.featherless.ai/v1/plan'),
    lambda: get_probe('Featherless plan', 'FEATHERLESS_AI_API', 'https://api.featherless.ai/v1/plan'),
    lambda: get_probe('OpenAI alternate', 'OPENAI_API_KEY2', 'https://api.openai.com/v1/models'),
    hemicycle, artcb,
]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(lambda job: job(), jobs))
Path('/workspace/work/api-additional-probes.json').write_text(json.dumps(results, indent=2))
print(json.dumps(results, indent=2))
