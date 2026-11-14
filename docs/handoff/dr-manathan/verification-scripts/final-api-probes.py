"""Bounded real API probes. Secret env input only; allowlisted metadata output only."""
import os,json,datetime,urllib.request,urllib.error,urllib.parse,concurrent.futures
OUTPUT='/workspace/work/final-api-probes.json'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):return None
opener=urllib.request.build_opener(NoRedirect())
def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def request(url,headers=None,body=None,method='GET',timeout=40):
 h={'Accept':'application/json','User-Agent':'MAVAI-bounded-API-audit/1.0'};h.update(headers or {})
 data=json.dumps(body).encode() if body is not None else None
 if data is not None:h['Content-Type']='application/json'
 try:
  with opener.open(urllib.request.Request(url,data=data,headers=h,method=method),timeout=timeout)as r:
   raw=r.read(8*1024*1024)
   try:obj=json.loads(raw) if raw else {}
   except Exception:
    obj={}
    # Streamable HTTP may carry JSON-RPC inside SSE data fields.
    for line in raw.decode('utf-8','replace').splitlines():
     if line.startswith('data:'):
      try:obj=json.loads(line[5:].strip());break
      except Exception:pass
   return r.status,obj,{k.lower():v for k,v in r.headers.items()}
 except urllib.error.HTTPError as e:
  code=e.code;e.close();return code,{},{}
 except Exception:return None,{},{}
def error_verdict(code):return 'auth_or_permission_rejected' if code in (401,403) else ('rate_limited' if code==429 else ('transport_or_client_failure' if code is None else 'http_error'))
def base(provider,var):return {'provider':provider,'variable':var,'timestamp':stamp()}
def hemicycle():
 out=[];row=base('Hemicycle','HEMICYCLE_AI_API');row['operation']='MCP initialize';key=os.environ.get('HEMICYCLE_AI_API','').strip()
 if not key:row.update(http_status=None,result='missing_runtime_secret');return[row]
 headers={'Authorization':'Bearer '+key,'Accept':'application/json, text/event-stream'};url='https://api.hemicycle.ai/mcp'
 code,obj,h=request(url,headers,{'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2025-03-26','capabilities':{},'clientInfo':{'name':'mavai-bounded-api-audit','version':'1.0'}}},'POST')
 row['http_status']=code
 if code!=200:row['result']=error_verdict(code);return[row]
 if not isinstance(obj.get('result'),dict):row['result']='jsonrpc_error' if 'error'in obj else 'unexpected_response';return[row]
 row['result']='initialized';out.append(row)
 session=h.get('mcp-session-id');protocol=obj['result'].get('protocolVersion')
 if session:headers['Mcp-Session-Id']=session
 if isinstance(protocol,str):headers['MCP-Protocol-Version']=protocol
 code,obj,_=request(url,headers,{'jsonrpc':'2.0','method':'notifications/initialized'},'POST')
 nr=base('Hemicycle','HEMICYCLE_AI_API');nr.update(operation='MCP initialized notification',http_status=code,result='sent' if code in (200,202,204) else error_verdict(code));out.append(nr)
 if code not in (200,202,204):return out
 code,obj,_=request(url,headers,{'jsonrpc':'2.0','id':2,'method':'tools/list','params':{}},'POST')
 row=base('Hemicycle','HEMICYCLE_AI_API');row.update(operation='MCP tools/list',http_status=code)
 tools=obj.get('result',{}).get('tools',[]) if isinstance(obj.get('result'),dict) else []
 tool=next((x for x in tools if isinstance(x,dict) and x.get('name')=='lister_jeux'),None)
 if code!=200:row['result']=error_verdict(code)
 elif 'error'in obj:row['result']='jsonrpc_error'
 elif not isinstance(tools,list):row['result']='unexpected_response'
 else:row.update(result='listed',tool_count=len(tools),lister_jeux_available=tool is not None)
 out.append(row)
 if code!=200 or tool is None:return out
 if tool.get('inputSchema',{}).get('required'):row['result']='listed_lister_jeux_requires_arguments_skip';return out
 code,obj,_=request(url,headers,{'jsonrpc':'2.0','id':3,'method':'tools/call','params':{'name':'lister_jeux','arguments':{}}},'POST')
 row=base('Hemicycle','HEMICYCLE_AI_API');row.update(operation='MCP tools/call lister_jeux',http_status=code,documented_credit_cost=0)
 if code!=200:row['result']=error_verdict(code)
 elif 'error'in obj:row['result']='jsonrpc_error'
 elif isinstance(obj.get('result'),dict) and not obj['result'].get('isError',False):
  content=obj['result'].get('content',[]);nonempty=bool(content) or bool(obj['result'].get('structuredContent'))
  row['result']='read_tool_succeeded' if nonempty else 'empty_tool_result'
 else:row['result']='tool_error_or_unexpected_response'
 out.append(row);return out
def supabase():
 row=base('Supabase','SUPABASE_URL + PUBLISHABLE_KEY_SUPABASE');row['operation']='GET /auth/v1/health';url=os.environ.get('SUPABASE_URL','').strip();key=os.environ.get('PUBLISHABLE_KEY_SUPABASE','').strip()
 if not url or not key:row.update(http_status=None,result='missing_runtime_secret');return[row]
 parsed=urllib.parse.urlsplit(url)
 # Do not forward a secret to an arbitrary URL or via redirects.
 if parsed.scheme!='https' or not parsed.hostname or not parsed.hostname.endswith('.supabase.co') or parsed.username or parsed.password or parsed.port not in (None,443):
  row.update(http_status=None,result='unexpected_supabase_origin_skip');return[row]
 code,obj,_=request(urllib.parse.urlunsplit(('https',parsed.netloc,'/auth/v1/health','','')),{'apikey':key})
 row.update(http_status=code,result='auth_service_health_reachable' if code==200 else error_verdict(code));return[row]
def generate(provider,variable,url,model):
 row=base(provider,variable);row.update(operation='POST /v1/chat/completions',model=model,max_tokens=32);key=os.environ.get(variable,'').strip()
 if not key:row.update(http_status=None,result='missing_runtime_secret');return[row]
 headers={'Authorization':'Bearer '+key}
 if provider=='Featherless':
  # Resolve the exact instructed model from the current official catalogue before making one generation.
  code,models,_=request('https://api.featherless.ai/v1/models',headers)
  chosen=next((m for m in models.get('data',[]) if isinstance(m,dict) and m.get('id')==model),None)
  if code!=200 or chosen is None:row.update(http_status=code,result='model_not_in_current_catalogue_skip');return[row]
  if chosen.get('available_on_current_plan') is False:row.update(http_status=code,result='model_unavailable_on_plan_skip');return[row]
  if chosen.get('status') not in (None,'active'):row.update(http_status=code,result='model_not_active_skip');return[row]
 code,obj,_=request(url,headers,{'model':model,'messages':[{'role':'user','content':'Réponds uniquement OK'}],'max_tokens':32,'temperature':0,'stream':False},'POST',60)
 row['http_status']=code
 if code!=200:row['result']=error_verdict(code);return[row]
 choices=obj.get('choices',[]);choice=choices[0] if isinstance(choices,list) and choices else {};content=choice.get('message',{}).get('content')
 row['nonempty_output']=isinstance(content,str) and bool(content.strip());row['expected_ok']=isinstance(content,str) and content.strip().strip('.!')=='OK'
 usage=obj.get('usage',{})
 if isinstance(usage,dict):
  for key in ('prompt_tokens','completion_tokens','total_tokens'):
   if isinstance(usage.get(key),int):row[key]=usage[key]
  if isinstance(usage.get('cost'),(int,float)):row['reported_cost_usd']=usage['cost']
 row['completion_within_cap']=row.get('completion_tokens',33)<=32 if 'completion_tokens'in row else None
 finish=choice.get('finish_reason')
 if finish in ('stop','length','content_filter','tool_calls'):row['finish_reason']=finish
 row['result']='generation_succeeded' if row['nonempty_output'] and row['completion_within_cap'] is not False and finish not in ('content_filter','tool_calls') else 'generation_incomplete_or_unexpected'
 return[row]
jobs=[hemicycle,supabase,lambda:generate('Mistral','MISTRAL_API_KEY','https://api.mistral.ai/v1/chat/completions','mistral-large-latest'),lambda:generate('Featherless','FEATHERLESS_AI_API','https://api.featherless.ai/v1/chat/completions','Qwen/Qwen3-VL-4B-Instruct')]
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
 for rows in pool.map(lambda f:f(),jobs):results.extend(rows)
with open(OUTPUT,'w')as f:json.dump(results,f,ensure_ascii=False,indent=2)
print(json.dumps(results,ensure_ascii=False,indent=2))
