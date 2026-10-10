import {mkdir,copyFile,cp,readFile} from 'node:fs/promises';
import {validateIssue,keyOf} from '../lib.mjs';
const entries=JSON.parse(await readFile('data/archive/index.json','utf8'));if(!entries.length)throw Error('归档不能为空');
for(const entry of entries){if(entry.path!==`data/archive/${keyOf(entry)}.json`)throw Error('非法归档路径');const issue=validateIssue(JSON.parse(await readFile(entry.path,'utf8')));if(keyOf(issue)!==keyOf(entry))throw Error('归档身份不匹配');}
await mkdir('dist',{recursive:true});for(const file of ['index.html','styles.css','app.js','lib.mjs'])await copyFile(file,`dist/${file}`);await cp('data','dist/data',{recursive:true});console.log(`构建完成：${entries.length} 期 → dist/`);
