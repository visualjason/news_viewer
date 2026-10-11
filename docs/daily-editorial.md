# 每日 AI 日报与顶会论文分析

关联 Codex 定时任务：AI 资讯每日整理与发布；每天北京时间 09:00。任务通过本机运行，需电脑和 Codex 可用。来源配置见 config/sources.json。该配置是供定时任务读取的编辑规则，不是独立采集服务。

## 日报编辑规则

逐个检查配置的九个来源渠道，对最近 24 小时内容去重并核对原始发布日期。来源没有更新时不要凑数；记录访问失败、未更新、无合格内容等覆盖情况。独立评测必须说明评测机构、模型版本、测试条件、指标及局限。MCP / TinyFish 实践应有代码或具体配置和可验证步骤，不能只凭宣传页认定可复现。不要自动安装、执行第三方仓库代码或调用付费 API。

日常资讯精选 8–15 条，另加一篇视觉顶会论文专题；质量不足允许减少资讯。anxiv-ai 暂映射 arxiv-ai，independent-evaluations 是评测渠道集合，tinyfish-practice-discovery 是实践发现渠道。

## 每日一篇视觉顶会论文

优先 CVPR，次选 ICCV / ECCV。通过正式会议论文集验证会议、年份和收录情况，读取论文正文、实验与补充材料，作者项目页和代码仅作为补充。优先近年有工程价值的研究，轮换检测、分割、多模态、3D、视频和效率方向。阅读 data/archive 与 reports/papers 的历史记录，以 DOI / arXiv ID / 正式论文 URL 去重。经典论文允许选入，但必须标注“历史论文专题”，不能放入最近 24 小时新闻统计。

分析包括：论文题目、作者、会议年份、论文链接、代码链接（仅已核实）、研究问题、关键创新、方法与流程、主要实验和消融、指标与对比条件、局限、应用场景、复现条件和步骤。用数据支撑结论，标明表号或章节。没有全文就不编写实验深读，记录缺口并换选可读论文；确实找不到合格论文则说明原因，不伪造专题。引用适量，使用原创中文分析。

在日报 items 中以 type=paper 收录，technical_analysis 放核心解释，deep_dive 分节呈现。清楚标注“每日论文精读 · CVPR YYYY”等标签，发布时间与本次分析日期分开。

## 历史保存

- data/archive/YYYY-MM-DD-rN.json：完整日报及论文专题；通过现有导入命令维护目录与 latest。
- reports/daily/YYYY-MM-DD-rN.md：可离线阅读的中文日报，包含原始链接与来源覆盖记录。
- reports/papers/YYYY-MM-DD-rN.md：当天论文完整分析，开头记录稳定论文标识、会议年份与分析日期。

所有路径相对于 E:\ai_tool\news_viewer。首次运行按需创建 reports 目录；本文件不代表已有实际分析结果。保持历史文件追加，同日修订递增 revision，不覆盖此前版本。生成内容会提交公开 GitHub 仓库，不得保存密钥和私密采集数据。

## GitHub 热门与飙升

新增用户授权的每日项目精选，独立于最近 24 小时新闻。读取 config/github-radar.json，以 AI topic 搜索、近期活跃项目和 GitHub Trending 发现候选，回查仓库 API 与 README。排除归档、fork 和与 AI 无关项目；只按 Star 不能证明工程质量。默认高 Star 至少 10,000，每期精选最多 4 个，轮换项目，近期重复只有实质更新或显著增长才再次精选。

运行 `node scripts/github-radar.mjs <仓库外输出.json>` 获取候选与真实时间戳，检查 errors/discovery，保留覆盖缺口。审阅后将快照追加至 data/github-stars/YYYY-MM-DD-rN.json，不覆盖旧快照；每次继续跟踪已入选项目，同时从 topic／Trending 发现新候选。增长按相同 node_id 的约 24 小时相邻快照计算，允许 20–28 小时观测间隔，页面显示实际小时数。默认净增至少 100 Star 作为飙升候选，兼顾相对增长率和工程价值。缺少有效基线时增长填 null，不能用总 Star、提交活跃度或短时间增量冒充日增长。GitHub Trending 的页面指标只能注明它自己的窗口与来源，不能混作本地净增量。

日报条目使用 type=github、editorial_section=github_radar，保留稳定项目 ID。github_metrics 包含 stars、observed_at、stars_delta（无基线为 null）、previous_observed_at 和可选 growth_percent；附用途、关注理由、实践建议、许可证说明、证据与局限。API 的 NOASSERTION 不能解释为开源许可证通过。项目榜单只代表已观察候选，不宣称穷尽 GitHub。

本次功能开发可以提交必要代码、配置、文档与测试；之后定时任务仍只提交 data 与 reports 产物。已有同日期刊则追加修订，不覆盖旧版。

## 发布验证

导入 → npm test → npm run build → 检查本次改动 → 只提交本次 data / reports 产物 → 推送 main → 验证 Pages 工作流和线上当期 JSON。发布成功或失败才通知；无实质变化时保持安静。运行过程保留用户已有改动，不能强制推送。
