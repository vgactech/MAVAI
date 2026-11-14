"""Read-only documented GET probes. Emits an allowlist only; never emits credentials/bodies/errors."""
import os,json,re,datetime,urllib.request,urllib.error,concurrent.futures
OUTPUT='/workspace/work/api-probes.json'
DOCS={
 'OpenAI':'https://developers.openai.com/api/reference/resources/models/methods/list',
 'Mistral':'https://docs.mistral.ai/api/endpoint/models',
 'ElevenLabs':'https://elevenlabs.io/docs/api-reference/user/get',
 'Featherless':'https://featherless.ai/docs/api-reference-models'}
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):return None
opener=urllib.request.build_opener(NoRedirect())
def probe(provider,url,variable,header_name=None,prefix='',count_field=None,public=False):
 row={'provider':provider,'variable':variable or '(none)','http_status':None,'auth_verdict':'not_tested','timestamp':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 key=os.environ.get(variable,'').strip() if variable else ''
 if variable and not key:row['auth_verdict']='missing_runtime_secret';return row
 if variable=='MAVAI_DR_MANATHAN' and not re.fullmatch(r'(?:sk_)?[A-Za-z0-9_-]{20,200}',key):
  row['auth_verdict']='candidate_skipped_non_key_syntax';return row
 headers={'Accept':'application/json','User-Agent':'MAVAI-readonly-API-audit/1.0'}
 if variable:headers[header_name]=prefix+key
 try:
  with opener.open(urllib.request.Request(url,headers=headers,method='GET'),timeout=25) as response:
   row['http_status']=response.status
   if response.status==200:
    row['auth_verdict']='public_endpoint_reachable_key_not_validated' if public else ('authenticated_get_succeeded' if variable else 'unauthenticated_get_succeeded')
    if count_field:
     try:
      obj=json.loads(response.read(8*1024*1024)); items=obj.get(count_field)
      if isinstance(items,list):row['count']=len(items)
     except Exception:pass
   else:row['auth_verdict']='unexpected_http_status'
 except urllib.error.HTTPError as exc:
  row['http_status']=exc.code
  row['auth_verdict']='auth_or_permission_rejected' if exc.code in (401,403) else ('rate_limited' if exc.code==429 else 'http_error')
  exc.close()
 except Exception:row['auth_verdict']='transport_or_client_failure'
 return row
jobs=[
 ('OpenAI','https://api.openai.com/v1/models',None,None,'','data',False),
 ('OpenAI','https://api.openai.com/v1/models','OPENAI_API_KEY','Authorization','Bearer ','data',False),
 ('Mistral','https://api.mistral.ai/v1/models',None,None,'','data',False),
 ('Mistral','https://api.mistral.ai/v1/models','MISTRAL_API_KEY','Authorization','Bearer ','data',False),
 ('ElevenLabs user','https://api.elevenlabs.io/v1/user',None,None,'',None,False),
 ('ElevenLabs user','https://api.elevenlabs.io/v1/user','ELEVENLABS_API_KEY','xi-api-key','',None,False),
 ('ElevenLabs voices','https://api.elevenlabs.io/v1/voices',None,None,'','voices',False),
 ('ElevenLabs voices','https://api.elevenlabs.io/v1/voices','ELEVENLABS_API_KEY','xi-api-key','','voices',False),
 ('ElevenLabs user','https://api.elevenlabs.io/v1/user','MAVAI_DR_MANATHAN','xi-api-key','',None,False),
 ('ElevenLabs voices','https://api.elevenlabs.io/v1/voices','MAVAI_DR_MANATHAN','xi-api-key','','voices',False),
 ('Featherless','https://api.featherless.ai/v1/models',None,None,'','data',True),
 ('Featherless','https://api.featherless.ai/v1/models','FEATHERLESS_AI_API','Authorization','Bearer ','data',True),
]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 results=list(pool.map(lambda x:probe(*x),jobs))
# An endpoint open without auth cannot prove the supplied key is valid.
for endpoint in ('ElevenLabs voices',):
 if any(r['provider']==endpoint and r['variable']=='(none)' and r['http_status']==200 for r in results):
  for r in results:
   if r['provider']==endpoint and r['http_status']==200:r['auth_verdict']='public_endpoint_reachable_key_not_validated'
with open(OUTPUT,'w') as f:json.dump(results,f,ensure_ascii=False,indent=2)
print(json.dumps(results,ensure_ascii=False,indent=2))
