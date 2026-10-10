export const categories = {news:'行业与产品动态',paper:'论文与研究',github:'开源项目',practice:'Skill / MCP 与 AI 实践',blog:'博客与教程',other:'其他资讯'};
export const keyOf = issue => `${issue.issue_date}-r${issue.revision}`;
export function categoryOf(item) { const type = item.editorial_section === 'ai_practice' ? 'practice' : item.type === 'product' ? 'news' : item.type; return categories[type] ? type : 'other'; }
export function safeUrl(value) { try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : null; } catch { return null; } }
export function validateIssue(issue) {
  if (!issue || issue.schema_version !== '1.0' || !/^\d{4}-\d{2}-\d{2}$/.test(issue.issue_date) || !Number.isInteger(issue.revision) || issue.revision < 1 || !Array.isArray(issue.items)) throw new Error('日报格式无效：需要 schema_version=1.0、日期、正整数 revision 和 items 数组');
  if (new Date(issue.issue_date).toISOString().slice(0,10) !== issue.issue_date) throw new Error('日期无效');
  const ids = new Set();
  for (const item of issue.items) { if (!item.item_id || ids.has(item.item_id) || typeof item.title !== 'string') throw new Error('条目需要唯一 item_id 和 title'); ids.add(item.item_id); }
  return issue;
}
export function selectItems(items, category, query) { const q = query.trim().toLocaleLowerCase(); return items.filter(i => (category === 'all' || categoryOf(i) === category) && [i.title,i.summary,i.why_it_matters,i.technical_analysis,i.application].join(' ').toLocaleLowerCase().includes(q)); }
export function readMinutes(items) { const text = items.map(i=>[i.title,i.summary,i.why_it_matters,i.application].join(' ')).join(' '); return Math.max(1,Math.ceil((text.match(/[\u3400-\u9fff]/g)||[]).length/500 + (text.match(/[a-zA-Z0-9]+/g)||[]).length/220)); }
