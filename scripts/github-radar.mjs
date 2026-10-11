import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
export function compareStars(current,previous,config){
  const hours=(Date.parse(current.observed_at)-Date.parse(previous?.observed_at))/3600000;
  if(!previous||current.node_id!==previous.node_id||!Number.isInteger(current.stars)||!Number.isInteger(previous.stars)||!Number.isFinite(hours)||hours<config.baseline_min_hours||hours>config.baseline_max_hours)return {stars_delta:null,previous_observed_at:null};
  const delta=current.stars-previous.stars;
  return {stars_delta:delta,previous_observed_at:previous.observed_at,growth_percent:previous.stars>0?100*delta/previous.stars:null};
}
export function radarQuery(query,now,days=30){return query.replaceAll('{since}',new Date(now.getTime()-days*86400000).toISOString().slice(0,10));}
export async function collectRadar({output,now=new Date(),request=fetch}={}){
  if(!output)throw Error('用法：node scripts/github-radar.mjs <仓库外输出.json>');
  const config=JSON.parse(await readFile('config/github-radar.json','utf8'));
  const previous=[];try{for(const name of await readdir('data/github-stars'))if(name.endsWith('.json'))previous.push(JSON.parse(await readFile(`data/github-stars/${name}`,'utf8')));}catch(e){if(e.code!=='ENOENT')throw e;}
  const candidates=new Set([...config.watchlist,...previous.flatMap(x=>(x.repositories||[]).map(r=>r.full_name))]),discovery=[],errors=[];
  async function api(path){const r=await request(`https://api.github.com/${path}`,{headers:{Accept:'application/vnd.github+json','User-Agent':'news-viewer-radar'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(`GitHub HTTP ${r.status}: ${path}`);return r.json();}
  const discovered=[];
  for(const template of config.queries){const q=radarQuery(template,now,config.lookback_days);try{const r=await api(`search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${config.search_page_size||10}`);discovery.push({query:q,returned:r.items.length,total_count:r.total_count,incomplete_results:r.incomplete_results});discovered.push(r.items);}catch(e){errors.push(e.message);}}
  for(let i=0;i<Math.max(0,...discovered.map(x=>x.length));i++)for(const group of discovered)if(group[i])candidates.add(group[i].full_name);
  const limit=config.max_candidates||50;
  const priority=new Set([...candidates].slice(0,Math.max(config.watchlist.length,limit-20)));
  for(let i=0;i<Math.max(0,...discovered.map(x=>x.length));i++)for(const group of discovered)if(group[i])priority.add(group[i].full_name);
  const selectedCandidates=[...new Set([...priority,...candidates])].slice(0,limit);
  const repositories=[];
  for(const name of selectedCandidates){try{const r=await api(`repos/${name}`);if(r.archived||r.fork)continue;const current={full_name:r.full_name,node_id:r.node_id,stars:r.stargazers_count,forks:r.forks_count,description:r.description,license:r.license?.spdx_id||null,language:r.language,html_url:r.html_url,pushed_at:r.pushed_at,observed_at:new Date().toISOString()};const baselines=previous.flatMap(x=>x.repositories||[]).filter(x=>x.node_id===current.node_id&&Date.parse(x.observed_at)<Date.parse(current.observed_at)).sort((a,b)=>Math.abs((Date.parse(current.observed_at)-Date.parse(a.observed_at))/3600000-24)-Math.abs((Date.parse(current.observed_at)-Date.parse(b.observed_at))/3600000-24));repositories.push({...current,...compareStars(current,baselines[0],config)});}catch(e){errors.push(`${name}: ${e.message}`);}}
  if(!repositories.length)throw Error(`没有取得仓库指标：${errors.join('; ')}`);
  const snapshot={observed_at:now.toISOString(),scope:'AI and general developer tools; recent 30-day discovery plus historical watchlist; not an exhaustive GitHub ranking',candidate_count:candidates.size,queried_candidates:selectedCandidates.length,lookback_days:config.lookback_days,discovery,errors,repositories};
  await writeFile(output,JSON.stringify(snapshot,null,2)+'\n');
  console.log(`已采集 ${repositories.length} 个项目；${errors.length} 个采集缺口。先审阅输出，再追加到 data/github-stars/，不要覆盖旧快照。`);
  return snapshot;
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/github-radar.mjs'))await collectRadar({output:process.argv[2]});
