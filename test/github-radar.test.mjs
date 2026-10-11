import test from 'node:test';import assert from 'node:assert/strict';
import {categoryOf,radarLabels,selectItems} from '../lib.mjs';
import {compareStars,radarQuery,prioritizeCandidates,collectRadar} from '../scripts/github-radar.mjs';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const config={baseline_min_hours:20,baseline_max_hours:28};
const current={node_id:'repo1',stars:1200,observed_at:'2026-10-11T01:00:00Z'};
test('热门项目可单独筛选，旧开源与实践分类兼容',()=>{const items=[{type:'github',title:'Agent',editorial_section:'github_radar'},{type:'github',title:'Release'},{type:'github',title:'Tool',editorial_section:'ai_practice'}];assert.equal(categoryOf(items[1]),'github');assert.equal(categoryOf(items[2]),'practice');assert.deepEqual(selectItems(items,'github_radar','agent'),[items[0]]);});
test('增长需要同仓库和有效时间基线，不把总量或短间隔当日增量',()=>{assert.equal(compareStars(current,null,config).stars_delta,null);assert.equal(compareStars(current,{...current,node_id:'other'},config).stars_delta,null);assert.equal(compareStars(current,{...current,stars:1000,observed_at:'2026-10-11T00:00:00Z'},config).stars_delta,null);assert.equal(compareStars(current,{...current,stars:1000,observed_at:'2026-10-10T01:00:00Z'},config).stars_delta,200);assert.equal(compareStars(current,{...current,stars:1250,observed_at:'2026-10-10T01:00:00Z'},config).stars_delta,-50);});
test('初次采集与真实观测间隔清晰显示，缺失指标不伪造',()=>{assert.deepEqual(radarLabels({}),[]);assert.ok(radarLabels(current).some(x=>x.includes('暂无增长基线')));assert.ok(radarLabels({...current,stars_delta:200,previous_observed_at:'2026-10-10T02:00:00Z'}).some(x=>x==='近 23.0h +200 Stars'));});
test('无效快照时间不能生成虚假增长',()=>{assert.equal(compareStars(current,{node_id:'repo1',stars:1000,observed_at:'invalid'},config).stars_delta,null);});
test('项目发现使用滚动30天，跨月也能生成正确日期',()=>{assert.equal(radarQuery('topic:developer-tools pushed:>={since}',new Date('2026-10-11T01:00:00Z'),30),'topic:developer-tools pushed:>=2026-09-11');});
test('大量历史高 Star 项目不会挤掉新项目候选预算',()=>{
 const tracked=Array.from({length:100},(_,i)=>`old/${i}`);
 const groups=Array.from({length:3},(_,g)=>({lane:'new',items:Array.from({length:10},(_,i)=>({full_name:`new${g}/${i}`}))}));
 groups.push({lane:'activity',items:Array.from({length:20},(_,i)=>({full_name:`active/${i}`}))});
 const result=prioritizeCandidates(tracked,groups,48,24);
 assert.equal(result.length,48);assert.equal(result.filter(x=>x.startsWith('new')).length,24);
 assert.equal(result.filter(x=>x.startsWith('active')).length,12);assert.equal(new Set(result).size,48);
 assert.deepEqual(prioritizeCandidates(tracked,groups,0,24),[]);
});
test('采集按独立新项目查询发现低 Star 仓库，保存创建时间且不伪造增长',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'news-radar-'));let sequence=0;const urls=[];
 try{
  const snapshot=await collectRadar({output:join(dir,'snapshot.json'),now:new Date('2026-10-11T01:00:00Z'),request:async url=>{
   const u=new URL(url);urls.push(u);
   if(u.pathname.endsWith('/search/repositories')){
    const q=u.searchParams.get('q'),fresh=q.includes('created:');
    if(fresh){assert.equal(u.searchParams.get('sort'),'updated');assert.ok(q.includes('created:>=2026-07-13'));assert.ok(q.includes('stars:>=10'));}
    const group=sequence++;return {ok:true,json:async()=>({items:Array.from({length:10},(_,i)=>({full_name:`${fresh?'new':'other'}${group}/${i}`})),total_count:100,incomplete_results:false})};
   }
   const name=u.pathname.slice('/repos/'.length);return {ok:true,json:async()=>({full_name:name,node_id:name,stargazers_count:15,forks_count:0,created_at:'2026-10-01T00:00:00Z',pushed_at:'2026-10-10T00:00:00Z'})};
  }});
  assert.equal(snapshot.repositories.filter(r=>r.full_name.startsWith('new')).length,24);
  assert.ok(snapshot.repositories.every(r=>r.created_at==='2026-10-01T00:00:00Z'&&r.stars_delta===null));
  assert.equal(urls.length,56);
 }finally{await rm(dir,{recursive:true,force:true});}
});
