import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {validateIssue,keyOf} from '../lib.mjs';
const file=process.argv[2];if(!file)throw new Error('用法：npm run import -- <日报.json>');
const issue=validateIssue(JSON.parse(await readFile(file,'utf8')));const key=keyOf(issue);await mkdir('data/archive',{recursive:true});
let entries=[];try{entries=JSON.parse(await readFile('data/archive/index.json','utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const path=`data/archive/${key}.json`;entries=entries.filter(e=>keyOf(e)!==key);entries.push({issue_date:issue.issue_date,revision:issue.revision,title:issue.briefing?.headline||'每日精选',item_count:issue.items.length,path});entries.sort((a,b)=>keyOf(b).localeCompare(keyOf(a),undefined,{numeric:true}));
await writeFile(path,JSON.stringify(issue,null,2)+'\n');await writeFile('data/archive/index.json',JSON.stringify(entries,null,2)+'\n');await writeFile('data/latest.json',await readFile(entries[0].path));console.log(`已导入 ${key}，共 ${entries.length} 期`);
