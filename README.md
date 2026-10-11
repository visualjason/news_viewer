# News Viewer

中文每日精选阅读器。原生 HTML、CSS、ES Modules，无第三方运行时依赖。界面参考 [Report Daily](https://stayfoolish8.github.io/report-daily-pages/#/2026-10-07-r1) 的阅读组织方式，代码独立实现，演示内容为本项目自编。

## 本地运行

安装 Node.js 20+，在仓库目录执行：

```sh
npm start
```

打开 http://127.0.0.1:4173 。不要直接双击 HTML，浏览器需要 HTTP 服务读取 JSON。

## 添加日报

以 `data/demo.json` 为最小示例，填写自己的内容后执行：

```sh
npm run import -- path/to/issue.json
npm test
npm run build
```

导入命令更新 `data/archive/日期-r修订号.json`、`data/archive/index.json` 和 `data/latest.json`。同日期、同修订号再次导入会替换该期；历史修订应递增 revision。日期较晚、修订号较高的期刊视为最新。前端以目录为唯一索引，latest.json 供外部工具使用。

必需字段：`schema_version: "1.0"`、`issue_date: "YYYY-MM-DD"`、正整数 `revision`、`items` 数组。条目必需 `item_id`（期内唯一）、`title`。可选字段：`type`、`editorial_section`、`summary`、`why_it_matters`、`application`、`technical_analysis`、`evidence_note`、`caveats`、`deep_dive`、`key_facts`、`sources`、`canonical_url`、`practice`。总览使用 `briefing.headline/takeaway/actions`。

支持 news、product、paper、github、blog 类型；`editorial_section: "ai_practice"` 归入实践类；未知类型归入其他资讯。兼容参考站主要公开日报字段，不包含它的内部运行报告或生成后台。

## 发布到 GitHub Pages

在仓库 Settings → Pages → Build and deployment 中选择 **GitHub Actions**。提交 main 分支后，工作流自动测试、构建并发布 dist。预期地址：https://visualjason.github.io/news_viewer/ 。首次启用前需由仓库管理员设置 Pages。

## 功能与边界

- 历史日报、日期筛选、前后翻页和可分享的 hash 链接。
- 分类目录、组合搜索、详情展开、证据和原文链接。
- 响应式排版、键盘焦点、状态提示、减少动画偏好。
- 纯文本 DOM 渲染；来源链接仅允许 HTTP/HTTPS。
- 不提供采集、定时生成、模型调用或事实核验；从上游导入 JSON。
- 默认数据明确标注为演示，不复制参考站新闻正文。

技术分析与实现方案见 `docs/implementation.md`。

## GitHub 热门与飙升

日报新增独立分类，展示 AI 项目及通用开发工具的用途、Star 总数、真实观测增量与采集时间。优先最近 30 天活跃或有重要更新的项目，包括命令行、编辑器、前后端、数据库、测试、构建及 DevOps。高 Star 是编辑精选，不是 GitHub 全站排名；首次采集显示“暂无增长基线”。项目精选不计入最近 24 小时新发布新闻。

采集命令：`node scripts/github-radar.mjs <仓库外输出.json>`。配置见 `config/github-radar.json`，增长规则与历史保存见 `docs/daily-editorial.md`。采集器只读取公开 API 并输出候选快照，需由每日任务核实项目内容后导入日报。
