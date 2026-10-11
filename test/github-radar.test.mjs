import test from 'node:test';import assert from 'node:assert/strict';
import {categoryOf,radarLabels,selectItems} from '../lib.mjs';
import {compareStars} from '../scripts/github-radar.mjs';
const config={baseline_min_hours:20,baseline_max_hours:28};
const current={node_id:'repo1',stars:1200,observed_at:'2026-10-11T01:00:00Z'};
test('热门项目可单独筛选，旧开源与实践分类兼容',()=>{const items=[{type:'github',title:'Agent',editorial_section:'github_radar'},{type:'github',title:'Release'},{type:'github',title:'Tool',editorial_section:'ai_practice'}];assert.equal(categoryOf(items[1]),'github');assert.equal(categoryOf(items[2]),'practice');assert.deepEqual(selectItems(items,'github_radar','agent'),[items[0]]);});
test('增长需要同仓库和有效时间基线，不把总量或短间隔当日增量',()=>{assert.equal(compareStars(current,null,config).stars_delta,null);assert.equal(compareStars(current,{...current,node_id:'other'},config).stars_delta,null);assert.equal(compareStars(current,{...current,stars:1000,observed_at:'2026-10-11T00:00:00Z'},config).stars_delta,null);assert.equal(compareStars(current,{...current,stars:1000,observed_at:'2026-10-10T01:00:00Z'},config).stars_delta,200);assert.equal(compareStars(current,{...current,stars:1250,observed_at:'2026-10-10T01:00:00Z'},config).stars_delta,-50);});
test('初次采集与真实观测间隔清晰显示，缺失指标不伪造',()=>{assert.deepEqual(radarLabels({}),[]);assert.ok(radarLabels(current).some(x=>x.includes('暂无增长基线')));assert.ok(radarLabels({...current,stars_delta:200,previous_observed_at:'2026-10-10T02:00:00Z'}).some(x=>x==='近 23.0h +200 Stars'));});
test('无效快照时间不能生成虚假增长',()=>{assert.equal(compareStars(current,{node_id:'repo1',stars:1000,observed_at:'invalid'},config).stars_delta,null);});
