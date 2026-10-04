import importlib.util,json,subprocess,sys
from pathlib import Path
repo=sys.argv[1];leaf=sys.argv[2];version=sys.argv[3];importers=sys.argv[4:];wt=Path('/home/nate/Oxy')/repo/'.worktrees'/leaf;ev=Path('/home/nate/Oxy/.agent-evidence/i04-consumer-final-prs')/f'registry-{repo}-current-20261004';src=Path('/home/nate/Oxy/oxy/.worktrees/1519-consumer-rollout-preflight-20261003/scripts/adoption/final-registry-consumers.py');sp=importlib.util.spec_from_file_location('r',src);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);tgz=Path('/home/nate/Oxy/.agent-evidence/root-1519-20261003')/('bloom'+version.replace('.','')+'-publication')/('oxy-so-bloom-'+version+'.tgz');ms=m.member_hashes(tgz.read_bytes());rows=[]
for rel in importers:
 p=Path(subprocess.check_output(['node','-e',"const{createRequire}=require('node:module');console.log(createRequire(process.argv[1]).resolve('@oxy.so/bloom/package.json'))",str(wt/rel)],cwd=wt,text=True).strip()).parent
 for n,h in ms.items():assert m.sha((p/n).read_bytes())==h,(rel,n)
 rows.append({'importer':rel,'version':version,'root':str(p),'files':len(ms),'allFilesEqual':True})
(ev/'bloom-final-importers.json').write_text(json.dumps({'archiveSha256':m.sha(tgz.read_bytes()),'importers':rows},indent=2)+'\n');print(repo,len(rows),'importers',len(ms),'each')
