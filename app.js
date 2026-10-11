import {categories,keyOf,categoryOf,safeUrl,validateIssue,selectItems,readMinutes,radarLabels} from './lib.mjs';
const $ = id => document.getElementById(id);
const node = (tag,text,cls) => { const e=document.createElement(tag); if(text != null)e.textContent=text; if(cls)e.className=cls; return e; };
let catalog=[], issue, activeCategory='all', generation=0;
const message = text => { $('status').textContent=text; $('status').hidden=!text; };
const anchor = (text,url) => { const e=node('a',text); const href=safeUrl(url); if(href){e.href=href;e.target='_blank';e.rel='noopener noreferrer';} return e; };
function paragraph(parent,title,text){if(!text)return; const box=node('div',null,'insight');box.append(node('b',title),node('p',text));parent.append(box);}
function toggleArchive(open){$('archive').hidden=!open;$('archive-toggle').setAttribute('aria-expanded',String(open));if(open)$('archive-date').focus();else $('archive-toggle').focus();}
function renderArchive(){
  const list=$('archive-list');list.replaceChildren();
  const entries=catalog.filter(e=>!$('archive-date').value||e.issue_date===$('archive-date').value);
  for(const entry of entries){const a=node('a');a.href=`#/${entry.key}`;a.append(node('b',`${entry.issue_date} · r${entry.revision}`),node('span',entry.title||'每日精选'));if(issue&&entry.key===keyOf(issue))a.setAttribute('aria-current','page');list.append(a);}
  if(!entries.length)list.append(node('p','这个日期暂无日报。'));
}
function renderStories(){
  const items=selectItems(issue.items,activeCategory,$('search').value);$('count').textContent=`${items.length} / ${issue.items.length} 篇`;
  $('stories').replaceChildren();$('contents').replaceChildren();
  for(const [type,name] of Object.entries(categories)){
    const group=items.filter(i=>categoryOf(i)===type);if(!group.length)continue;
    const jump=node('a',`${name} · ${group.length}`);jump.href=`#category-${type}`;jump.onclick=e=>{e.preventDefault();document.getElementById(`category-${type}`).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};$('contents').append(jump);
    const section=node('section',null,'category');section.id=`category-${type}`;section.append(node('h2',name));
    for(const item of group){
      const card=node('article',null,'story');const meta=node('div',null,'story-meta');meta.append(node('span',name,'badge'),node('span',item.publisher||item.sources?.[0]?.publisher||''));card.append(meta,node('h3',item.title),node('p',item.summary||'','summary'));paragraph(card,'值得关注',item.why_it_matters);paragraph(card,'建议行动',item.application);
      const metrics=radarLabels(item.github_metrics);if(metrics.length){const strip=node('div',null,'github-metrics');for(const label of metrics)strip.append(node('span',label));card.insertBefore(strip,card.querySelector('h3'));}
      const details=node('details');details.append(node('summary','深入详情与原始证据 ＋'));const body=node('div',null,'detail-body');paragraph(body,'编辑解读',item.technical_analysis);paragraph(body,'证据范围',item.evidence_note);
      for(const part of item.deep_dive||[]){body.append(node('h4',part.heading),node('p',part.content));for(const id of part.ref_ids||[]){const source=(item.sources||[]).find(s=>s.ref_id===id);if(source)body.append(anchor(`↗ ${source.publisher||source.title}`,source.url));}}
      paragraph(body,'限制与边界',item.caveats);
      if(item.practice){body.append(node('h4','实践复现卡'));for(const field of ['try_it','requirements','limitations'])for(const text of item.practice[field]||[])body.append(node('p',text));}
      const facts=node('ul');for(const fact of item.key_facts||[])facts.append(node('li',fact.fact));body.append(facts,node('h4','原始来源'));for(const source of item.sources||[])body.append(anchor(source.title||source.url,source.url));details.append(body);card.append(details);
      if(safeUrl(item.canonical_url))card.append(anchor('阅读原始来源 ↗',item.canonical_url));section.append(card);
    }$('stories').append(section);
  }
  if(!items.length)$('stories').append(node('p',issue.items.length?'没有匹配的内容，请调整搜索或分类。':'本期暂无资讯。','empty'));
  for(const b of $('filters').children)b.setAttribute('aria-pressed',String(b.dataset.category===activeCategory));
}
function render(){
  $('day').textContent=issue.issue_date.slice(-2);$('date').textContent=issue.issue_date.replaceAll('-',' / ');document.title=`News Viewer · ${issue.issue_date}`;
  $('headline').textContent=issue.briefing?.headline||'今天，哪些变化值得关注？';$('takeaway').textContent=issue.briefing?.takeaway||issue.snapshot_summary||'';$('read-time').textContent=`${issue.items.length} 篇 · 约 ${readMinutes(issue.items)} 分钟 / 深入详情另计`;
  const actions=issue.briefing?.actions||[];$('actions').hidden=!actions.length;$('actions').querySelector('ul').replaceChildren(...actions.map(a=>node('li',a)));
  $('filters').replaceChildren();for(const [type,name] of Object.entries({all:'全部分类',...categories})){if(type!=='all'&&!issue.items.some(i=>categoryOf(i)===type))continue;const b=node('button',name);b.dataset.category=type;b.onclick=()=>{activeCategory=type;renderStories();};$('filters').append(b);}
  $('selection').replaceChildren(node('p',`本期收录 ${issue.items.length} 条。${issue.source_stats?.raw_candidates != null ? `候选记录 ${issue.source_stats.raw_candidates} 条。` : ''}`));for(const text of issue.selection_notes||[])$('selection').append(node('p',text));
  const warnings=[...(issue.quality_report?.hard_failures||[]),...(issue.quality_report?.warnings||[])];for(const text of warnings)$('selection').append(node('p',`质量提醒：${text}`));
  const index=catalog.findIndex(e=>e.key===keyOf(issue));$('position').textContent=`${issue.issue_date} · 修订 r${issue.revision} · ${index===0?'最新一期':'历史归档'}`;
  for(const [id,entry] of [['prev',catalog[index+1]],['next',index>0?catalog[index-1]:null],['latest',index>0?catalog[0]:null]]){$(id).disabled=!entry;$(id).onclick=()=>{if(entry)location.hash=`/${entry.key}`;};}
  renderStories();renderArchive();
}
async function json(path){const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw new Error(`读取失败 (${response.status})`);return response.json();}
async function load(){const version=++generation;const key=location.hash.replace(/^#\//,'')||catalog[0]?.key;const entry=catalog.find(e=>e.key===key);if(!entry){message('未找到这一期，请打开历史日报选择。');return;}message('正在加载…');try{const data=validateIssue(await json(`./${entry.path}`));if(version!==generation)return;if(keyOf(data)!==key)throw new Error('日期与目录不一致');issue=data;activeCategory='all';$('search').value='';render();message('');$('archive').hidden=true;$('archive-toggle').setAttribute('aria-expanded','false');window.scrollTo(0,0);}catch(error){if(version===generation){message(`日报加载失败：${error.message}。请重试或选择其他日期。`);if(!issue)$('headline').textContent='暂时无法读取日报';}}}
$('archive-toggle').onclick=()=>toggleArchive($('archive').hidden);$('archive-close').onclick=()=>toggleArchive(false);$('archive-date').onchange=renderArchive;$('archive-clear').onclick=()=>{$('archive-date').value='';renderArchive();};$('search').oninput=()=>{if(issue)renderStories();};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('archive').hidden)toggleArchive(false);});
try{const entries=await json('./data/archive/index.json');catalog=entries.filter(e=>/^\d{4}-\d{2}-\d{2}$/.test(e.issue_date)&&Number.isInteger(e.revision)&&e.revision>0&&e.path===`data/archive/${e.issue_date}-r${e.revision}.json`).map(e=>({...e,key:keyOf(e)})).sort((a,b)=>b.key.localeCompare(a.key,undefined,{numeric:true}));if(!catalog.length)throw new Error('暂无已发布日报');window.addEventListener('hashchange',load);await load();}catch(error){$('headline').textContent='日报尚未就绪';message(error.message);}
