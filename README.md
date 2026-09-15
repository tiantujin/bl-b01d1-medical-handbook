# BL-B01D1 医学经理知识手册与职场工具

面向**上市后医学经理（实体瘤 / 乳腺癌产品线）**的完整业务手册网站，覆盖从「读懂产品」到「会做业务」到「持续进阶」的全流程。

- 🌐 **线上站点**：https://tiantujin.github.io/bl-b01d1-medical-handbook/
- 📦 **仓库**：https://github.com/tiantujin/bl-b01d1-medical-handbook
- 🏷️ **当前版本**：v2.5.1（2026-09-15）· 共 **57 章**

## 📄 站点内容

### 主站

| 页面 | 说明 |
|---|---|
| `index.html` | **主手册（57 章）**：工作台（六大中心 + 15 场景 + 全站搜索 + 证据标签）+ 专业百科 01–54 章（产品认知 / 证据与方法 / 医学职能 / 职场成长 / 工作方法）+ **55–57 章研究设计与统计实操**（样本量设计 / 单臂 IIT 设计形式 / 多队列设计） |
| `BL-B01D1医学经理知识手册与职场工具-合并版-2026-09-15.html` | 与 `index.html` 同内容的单文件合并版，供离线打开 / 下载 |

### 配套专题页

| 页面 | 说明 |
|---|---|
| `乳腺癌治疗格局与ADC布局mapping-2026-09.html` | 分型 × 分期的治疗格局映射、ADC 布局矩阵、HER3 临床现状、各 ADC 不良反应汇总 |
| `BL-B01D1关键问题应答速查-2026-09.html` | **Q&A Playbook · 6 大板块 43 题**（竞品差异 / ADC 序贯与耐药 / 联合治疗 / 新辅助与围手术期洗脱 / 数据成熟度 / 红线话术），含实时搜索 |
| `iza-bren临床研究全景与乳腺癌数据详解-2026-09.html` | 已公布结果研究 16 项逐项明细 + 在研 Mapping + 乳腺癌逐篇/逐分期/逐亚组/逐安全信号解读 + 数据缺口清单 |
| `mapping记忆矩阵-2026-09.html` | 把两个 mapping 压缩为 7 张矩阵 + 助记口诀，便于记忆 |
| `站点结构化索引与注入更新对比报告-2026-09-15.html` | 57 章逐章锚点 + 块边界偏移 + 字符级 diff + 索引层变更 |

### 资料与数据

| 文件 | 说明 |
|---|---|
| `data/*.json` | **单一事实源**（product / indications / trials / efficacy / safety / competitors / guidelines / references / evidence-gaps / version-history） |
| `data/index-diffdata.json`、`data/index-rows.json` | 结构化索引数据（章节快照含块边界、逐章 diff 结果） |
| `data-registry.js` | 自动证据标签、一致性提示、待核实工作台、搜索前缀筛选 |
| `personal-system.js` | localStorage 个人系统（Rubric / 实践校准 / 成长闭环 / 成果档案 / 备份恢复） |
| `BL-B01D1上市后医学经理工作百科全书.md`、`.html` | ⚠️ **早期版本（v1.0）**，未经过 2026-08-30 合规审计，**请勿对外引用** |
| `BL-B01D1上市后课题方向与学术资源图谱.html` | 课题方向与 PI 图谱 |
| `mTNBC随机对照研究设计与统计方法对比报告.html` | mTNBC RCT 设计对比 |
| `BL-B01D1_TNBC获批即用材料包.html` | TNBC 材料包 |
| `职场工具模板.xlsx`、`BL-B01D1年度证据规划表.xlsx` | 工作表模板 |
| `BL-B01D1产品深度研究报告.html`、`BL-B01D1工作百科全书-学习地图.html`、`BL-B01D1深度理解进阶路线与资料清单.html` | 深度研究 / 学习地图 / 进阶路线 |
| `审计与合规报告-v2.3.html`、`重构交付报告-v2.3.html`、`我的职业定位.html` | 审计与个人定位 |

## 🚀 部署（GitHub Pages）

站点由 **GitHub Pages** 托管，来源为 `main` 分支根目录（`main` / `/`），已开启强制 HTTPS，构建状态 `built`。

### 一键重新部署

```bash
# 1) 预览哪些文件需要上传（不实际提交）
python3 deploy.py --dry

# 2) 实际部署（比对本地与远端内容指纹，仅上传变化与新增的文件）
python3 deploy.py
```

脚本行为：
- 用 **Git blob SHA 全量比对**（本地 `git hash-object` vs 远端 `git/trees?recursive=1`），**只上传真正有差异的文件**，避免无意义的重复提交触发 Pages 反复重建；
- 自动跳过 `.git/`、`.DS_Store`；
- 新增文件自动走 `PUT`（无需 sha），已有文件自动取 sha 后更新；
- 内置 5 次指数退避重试，适配大文件（数百 KB）上传；
- 部署后等待并打印 Pages 构建状态与线上复核提示。

### 凭据

脚本按以下顺序读取 GitHub token（**不会**写入仓库）：

1. 环境变量 `GITHUB_TOKEN`
2. `~/.config/gh/hosts.yml` 中的 `oauth_token`（GitHub CLI 登录后自动生成）

> 说明：本沙箱环境仅放行 `api.github.com`，`git push` / `git ls-remote` 到 `github.com` 不通，因此部署走 **Contents API**（等价于提交到 `main`）。

### 本地预览

```bash
cd site && python3 -m http.server 8080
# 打开 http://localhost:8080
```

## ⚠️ 声明

- 本网站为**个人学习资料**，不代表公司官方立场；
- **一切产品信息以国家药监局批准的最新版说明书及公司官方材料为准**；
- 未获批适应症（如 TNBC）信息为研究进展性质，**不得用于主动推广**；
- 跨研究数据比较一律**非头对头**；
- 数据检索截止 2026-09-15（手册正文 2026-08-30）。
