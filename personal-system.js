/* =====================================================================
 * personal-system.js · v2.4
 * 个人系统：15项质量Rubric / 实践校准日志 / 四个成长闭环 / 成果档案 / 真实接口地图
 * 所有个人记录仅存 localStorage（当前浏览器），不提交任何服务器。
 * 安全：禁止录入患者身份、真实KOL联系方式、未公开数据、商业秘密、合同、真实预算、账号密码。
 * ===================================================================== */
(function () {
  "use strict";
  var LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem("mms-" + k) || "null"); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem("mms-" + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  /* ===== 1. Rubric 数据：15 项任务 × 5 级行为锚点 ===== */
  var RUBRICS = [
    { id: "insight", name: "医学洞察", levels: ["只有医生说了什么，无上下文与行动价值", "有原始反馈和背景，但未解释为什么重要", "多来源验证，揭示决策背后的原因并提出合理行动", "洞察被转化为 Medical Plan/教育/证据项目/FAQ 并形成结果", "持续影响产品医学策略/证据规划/组织决策，且形成可复制方法"] },
    { id: "visit", name: "KOL 科学拜访", levels: ["无准备/无记录/以讲解为主", "有目的有记录，但洞察产出弱", "拜访闭环：目的→对话→记录→洞察→跟进", "洞察被采纳并驱动行动，KOL 关系深化", "拜访体系化，产出影响策略并沉淀方法"] },
    { id: "medplan", name: "Medical Plan", levels: ["活动清单，无战略逻辑", "有形势分析和目标，但 KPI 不可衡量", "完整框架：洞察→目标→支柱→tactics→KPI→风险→预算", "计划被执行≥70%且季度复盘有数据", "计划影响产品线策略，成为组织方法"] },
    { id: "iep", name: "Integrated Evidence Plan", levels: ["证据缺口清单，无排序", "有评分排序但缺用途映射", "缺口→研究→发表→用途→影响全闭环", "闭环中有项目落地并产生可测影响", "IEP 成为多产品证据治理机制"] },
    { id: "iit", name: "IIT/IIR 方案评审", levels: ["只评估表面可行性", "科学+合规双维度初评", "PICO/证据缺口/数据权/发表权/预算全审并书面反馈", "评审推动方案质量显著提升，无合规遗漏", "评审体系化，沉淀为可复用检查清单"] },
    { id: "rwe", name: "RWE 研究构想", levels: ["只有粗略想法", "有 PICO 与数据源初判", "方案+SAP+偏倚控制+登记+伦理完整构想", "构想获批立项并产出结果", "RWE 能力成为团队可复制资产"] },
    { id: "ab", name: "Advisory Board", levels: ["为开会而开会", "议题与专家匹配，有纪要", "结构化议题+COI+共识输出+行动项", "共识被采纳进策略并闭环", "AB 成为年度策略输入机制"] },
    { id: "satellite", name: "卫星会医学支持", levels: ["只审课件", "议程/讲者/课件全支持", "预判Q&A+现场答疑+会后洞察闭环", "会议产出洞察与跟进项目", "形成会议医学支持标准流程"] },
    { id: "review", name: "医学课件审核", levels: ["只改格式", "查超适应症与数据出处", "逐项清单审核+书面意见+版本管理", "审核意见显著降低合规风险", "审核体系化，培训团队合规"] },
    { id: "mi", name: "MI 应答", levels: ["凭记忆即答", "按模板应答有出处", "标准化应答+台账留痕+时限达成", "高频问题回流 FAQ/培训", "MI 体系化并驱动内容优化"] },
    { id: "competitor", name: "竞品数据解读", levels: ["转述新闻", "核实来源与设计", "设计/人群/终点/随访分析+影响评估+话术更新", "解读驱动策略调整", "建立竞品情报机制"] },
    { id: "pm", name: "项目管理", levels: ["无计划靠记忆", "有时间线和责任人", "RACI+RAID+里程碑+会议纪要完整", "项目按时按质交付并提前化解风险", "项目管理能力可带教他人"] },
    { id: "report", name: "向上汇报", levels: ["流水账", "结论先行有数据", "PREP 结构+风险对策+决策请求", "汇报驱动决策与资源", "汇报成为影响力工具"] },
    { id: "pub", name: "Publication Plan", levels: ["无计划", "有证据清单与目标期刊", "Congress+Manuscript+作者/PSC+披露边界完整", "计划推进并产出发表", "Publication 成为证据战略组成"] },
    { id: "quarter", name: "季度医学价值报告", levels: ["只报活动", "有 Output 量化", "Output/Outcome/Impact/Attribution 完整", "报告驱动下季度资源与优先级", "报告成为医学部价值语言"] }
  ];
  var RUBRIC_DIMS = ["内容完整性", "医学准确性", "证据可追溯性", "合规性", "是否形成行动", "是否产生结果", "是否可复用", "是否影响决策"];

  function rubricPanel() {
    var host = document.getElementById("sys-rubric");
    if (!host) return;
    var scores = LS.get("rubrics") || {};
    var html = "<div style='font-size:12px;color:#5b6b7a;margin-bottom:8px'>15 项核心任务质量 Rubric：Level 1 不合格 → Level 5 战略级。评分与证据仅存本浏览器。评估维度（每项）：" + RUBRIC_DIMS.join("、") + "。常见缺陷与升下级要点见各任务 levels。</div>";
    RUBRICS.forEach(function (r) {
      var s = scores[r.id] || {};
      html += "<details style='border:1px solid #e2e8f0;border-radius:8px;margin:6px 0;padding:8px 12px;background:#f8fafc'>" +
        "<summary style='cursor:pointer;font-weight:600;font-size:13.5px;color:#0d3f5e'>" + r.name + "　当前自评：<b>" + (s.score || "未评") + "</b></summary>" +
        "<table style='font-size:12px'><tr><th>Level</th><th>行为锚点</th></tr>" +
        r.levels.map(function (lv, i) { return "<tr><td>L" + (i + 1) + "</td><td>" + lv + "</td></tr>"; }).join("") +
        "</table>" +
        "<div style='margin-top:8px'><b>自评</b>：<select id='rb-" + r.id + "'><option value=''>未评</option>" +
        [1,2,3,4,5].map(function (i) { return "<option value='" + i + "'" + (s.score == i ? " selected" : "") + ">L" + i + "</option>"; }).join("") +
        "</select>　证据/例子：<input id='rbe-" + r.id + "' style='width:38%' placeholder='本次得分的证据' value='" + (s.evidence || "") + "'/>　" +
        "领导反馈：<input id='rbf-" + r.id + "' style='width:25%' placeholder='反馈' value='" + (s.feedback || "") + "'/>　" +
        "下一步改进：<input id='rbn-" + r.id + "' style='width:25%' placeholder='改进' value='" + (s.next || "") + "'/>　" +
        "复评日期：<input id='rbd-" + r.id + "' style='width:15%' placeholder='2026-09-30' value='" + (s.redate || "") + "'/>　" +
        "<button onclick='MMS.saveRubric(\"" + r.id + "\")'>保存评分</button></div></details>";
    });
    html += "<div style='margin-top:8px'><button onclick='MMS.exportRubrics()'>导出 Rubric 评分</button> <button onclick=\"document.getElementById('imp-rubric').click()\">导入评分</button><input type='file' id='imp-rubric' style='display:none' onchange='MMS.importRubrics(this)'/></div>";
    host.innerHTML = html;
  }
  window.MMS = window.MMS || {};
  MMS.saveRubric = function (id) {
    var s = LS.get("rubrics") || {};
    s[id] = { score: document.getElementById("rb-" + id).value, evidence: document.getElementById("rbe-" + id).value, feedback: document.getElementById("rbf-" + id).value, next: document.getElementById("rbn-" + id).value, redate: document.getElementById("rbd-" + id).value, updated: new Date().toISOString().slice(0, 10) };
    LS.set("rubrics", s); rubricPanel(); alert("已保存（本浏览器）");
  };
  MMS.exportRubrics = function () { exportJSON("rubrics", "rubric-scores.json"); };
  MMS.importRubrics = function (inp) { importJSON("rubrics", inp, rubricPanel); };

  /* ===== 2. 实践校准日志 ===== */
  var CAL_FIELDS = ["日期", "主题", "原有理解", "实际工作中的情况", "差异", "差异产生的原因", "公司真实流程或岗位边界", "直属领导/带教反馈", "正确做法", "下次如何处理", "是否需要更新网站", "需要更新的章节", "是否形成模板", "保密等级"];
  var SEC_LEVELS = ["可公开知识", "个人经验", "公司内部", "严格保密，不进入本网站"];

  function calPanel() {
    var host = document.getElementById("sys-cal");
    if (!host) return;
    var logs = LS.get("calib") || [];
    var view = document.getElementById("cal-view") ? document.getElementById("cal-view").value : "all";
    var rows = logs.filter(function (l) {
      if (view === "30d") { var d = new Date(l.date); var t = new Date(Date.now() - 30 * 864e5); return d >= t; }
      if (view === "topic") return l.topic;
      if (view === "update") return l["是否需要更新网站"] === "是";
      if (view === "mis") return l["差异"];
      if (view === "method") return l["是否形成模板"] === "是";
      if (view === "validated") return l["直属领导/带教反馈"];
      return true;
    });
    var html = "<div style='font-size:12px;color:#5b6b7a;margin-bottom:8px'>把入职前的理论理解与入职后的真实工作逐步校准。<b>安全：</b>「公司内部」「严格保密」内容默认不允许写入本网站正文——只记录<b>抽象化经验</b>，不记录真实人员/患者/预算/合同/未公开数据/商业秘密。个人记录仅存本浏览器。</div>" +
      "<div style='margin-bottom:6px'><b>筛选</b>：<select id='cal-view' onchange='MMS.calPanel()'><option value='all'>全部</option><option value='30d'>最近30天</option><option value='topic'>按主题</option><option value='update'>待更新章节</option><option value='mis'>高频误区</option><option value='method'>已形成个人方法</option><option value='validated'>已被领导验证</option></select></div>" +
      "<details style='border:1px solid #cfe5f2;border-radius:8px;padding:10px;margin:6px 0;background:#eef6fb'><summary style='cursor:pointer;font-weight:600;color:#0d3f5e'>➕ 新增校准记录</summary>" +
      CAL_FIELDS.map(function (f) {
        if (f === "保密等级") return "<div style='margin:4px 0'><label>" + f + "：<select id='calf-sec'><option>可公开知识</option><option>个人经验</option><option>公司内部</option><option>严格保密，不进入本网站</option></select></label></div>";
        if (f === "是否需要更新网站") return "<div style='margin:4px 0'><label>" + f + "：<select id='calf-upd'><option>否</option><option>是</option></select></label></div>";
        return "<div style='margin:4px 0'><label>" + f + "：<input id='calf-" + f + "' style='width:88%'/></label></div>";
      }).join("") +
      "<button onclick='MMS.addCal()'>保存记录</button><span style='font-size:11px;color:#c0392b'> 注意：公司内部/严格保密内容请只写抽象经验</span></details>";
    rows.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    html += "<div style='font-size:12px'><b>记录数：" + rows.length + "</b></div><table style='font-size:11.5px'><tr><th>日期</th><th>主题</th><th>差异</th><th>正确做法</th><th>保密等级</th></tr>" +
      rows.map(function (l) { return "<tr><td>" + (l.date || "") + "</td><td>" + (l.topic || "") + "</td><td>" + (l["差异"] || "") + "</td><td>" + (l["正确做法"] || "") + "</td><td>" + (l["保密等级"] || "") + "</td></tr>"; }).join("") + "</table>" +
      "<div style='margin-top:6px'><button onclick='MMS.exportCal()'>导出校准日志（自动脱敏：仅含可公开/个人经验级）</button> <button onclick=\"document.getElementById('imp-cal').click()\">导入</button><input type='file' id='imp-cal' style='display:none' onchange='MMS.importCal(this)'/></div>";
    host.innerHTML = html;
  }
  MMS.calPanel = calPanel;
  MMS.addCal = function () {
    var logs = LS.get("calib") || [];
    var l = {};
    CAL_FIELDS.forEach(function (f) { l[f] = document.getElementById("calf-" + f) ? document.getElementById("calf-" + f).value : ""; });
    l["保密等级"] = document.getElementById("calf-sec").value;
    l["是否需要更新网站"] = document.getElementById("calf-upd").value;
    l.date = l.date || new Date().toISOString().slice(0, 10);
    if (l["保密等级"].indexOf("严格保密") > -1 && l.topic) { alert("提示：该条已标记严格保密，仅保存在本浏览器；导出时将自动排除。"); }
    logs.push(l); LS.set("calib", logs); calPanel();
  };
  MMS.exportCal = function () {
    var logs = LS.get("calib") || [];
    var safe = logs.filter(function (l) { return (l["保密等级"] || "").indexOf("可公开") > -1 || (l["保密等级"] || "").indexOf("个人经验") > -1; });
    var blob = new Blob([JSON.stringify(safe, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "calibration-safe.json"; a.click();
  };
  MMS.importCal = function (inp) { importJSON("calib", inp, calPanel); };

  /* ===== 3. 四个成长闭环 ===== */
  var LOOPS = [
    { id: "insight", name: "医学洞察闭环", stages: "采集原始观察 → 聚类验证 → 洞察-行动 → 追踪结果 → 回流策略" },
    { id: "project", name: "医学项目闭环", stages: "立项(Charter) → RACI/时间线/RAID → 执行交付 → 复盘归档 → 成果档案" },
    { id: "evidence", name: "证据生成/IIT 闭环", stages: "证据缺口 → 研究构想/评审 → 合同/伦理/启动 → 执行跟进 → 结果/发表 → 用途转化" },
    { id: "medplan", name: "Medical Plan 闭环", stages: "形势分析 → 目标支柱 → tactics/KPI → 执行 → 季度复盘 → 年度迭代" }
  ];
  function loopPanel() {
    var host = document.getElementById("sys-loop");
    if (!host) return;
    var rec = LS.get("loops") || {};
    var html = "<div style='font-size:12px;color:#5b6b7a;margin-bottom:8px'>四条成长主线：不设虚构硬性数量目标，实际任务以入职后的工作机会和领导安排为准。每条记录：当前阶段/目标/输入/标准动作/输出物/Rubric/领导反馈/实际结果/复盘/可迁移能力/是否写入成果档案。</div>";
    LOOPS.forEach(function (L) {
      var r = rec[L.id] || {};
      html += "<details style='border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin:6px 0;background:#f8fafc'><summary style='cursor:pointer;font-weight:600;color:#0d3f5e'>" + L.name + "（" + L.stages + "）　当前阶段：<b>" + (r.stage || "未开始") + "</b></summary>" +
        "<div>当前阶段：<input id='lp-stage-" + L.id + "' style='width:22%' value='" + (r.stage || "") + "'/>　本阶段目标：<input id='lp-goal-" + L.id + "' style='width:30%' value='" + (r.goal || "") + "'/></div>" +
        "<div>标准动作/输出物：<input id='lp-action-" + L.id + "' style='width:45%' value='" + (r.action || "") + "'/>　质量Rubric得分：<input id='lp-score-" + L.id + "' style='width:10%' value='" + (r.score || "") + "'/></div>" +
        "<div>直属领导反馈：<input id='lp-fb-" + L.id + "' style='width:42%' value='" + (r.feedback || "") + "'/>　实际结果：<input id='lp-res-" + L.id + "' style='width:42%' value='" + (r.result || "") + "'/></div>" +
        "<div>复盘/可迁移能力：<input id='lp-rv-" + L.id + "' style='width:45%' value='" + (r.review || "") + "'/>　写入成果档案：<select id='lp-ar-" + L.id + "'><option>否</option><option>是</option></select>　<button onclick='MMS.saveLoop(\"" + L.id + "\")'>保存</button></div></details>";
    });
    host.innerHTML = html;
  }
  MMS.saveLoop = function (id) {
    var rec = LS.get("loops") || {};
    rec[id] = {
      stage: document.getElementById("lp-stage-" + id).value, goal: document.getElementById("lp-goal-" + id).value,
      action: document.getElementById("lp-action-" + id).value, score: document.getElementById("lp-score-" + id).value,
      feedback: document.getElementById("lp-fb-" + id).value, result: document.getElementById("lp-res-" + id).value,
      review: document.getElementById("lp-rv-" + id).value, archive: document.getElementById("lp-ar-" + id).value,
      updated: new Date().toISOString().slice(0, 10)
    };
    LS.set("loops", rec); alert("已保存");
  };

  /* ===== 4. 成果档案 ===== */
  var ACH_FIELDS = ["项目类型", "业务背景", "临床问题", "医学洞察", "证据缺口", "我的判断", "我的权限边界", "我的实际贡献", "协调对象", "遇到的阻力", "如何影响他人", "项目结果", "Output", "Outcome", "Impact", "Attribution", "领导反馈", "失败或不足", "可迁移能力", "STAR表达", "对应能力模型", "当前证据等级", "是否适合绩效汇报", "是否适合晋升答辩", "是否适合未来面试使用"];
  function achPanel() {
    var host = document.getElementById("sys-ach");
    if (!host) return;
    var list = LS.get("ach") || [];
    var stats = LS.get("achstats") || { closed: 0, insightAdopted: 0, templatesUsed: 0, riskAhead: 0, crossDept: 0, leaderConfirm: 0, l1toL3: 0, star: 0 };
    var html = "<div style='font-size:12px;color:#5b6b7a;margin-bottom:8px'>个人成果档案（25 字段）：每完成一个项目归档一条；季度回顾；用于绩效沟通、晋升答辩与面试 STAR。</div>" +
      "<div style='background:#eef6fb;border-radius:8px;padding:8px 12px;font-size:12px;margin-bottom:8px'><b>成果统计面板</b>：完整闭环项目 " + stats.closed + " ｜ 被采纳洞察 " + stats.insightAdopted + " ｜ 被实际使用模板 " + stats.templatesUsed + " ｜ 提前识别风险 " + stats.riskAhead + " ｜ 跨部门成果 " + stats.crossDept + " ｜ 领导确认提升 " + stats.leaderConfirm + " ｜ L1/L2→L3 " + stats.l1toL3 + " ｜ STAR 案例 " + stats.star + "</div>" +
      "<details style='border:1px solid #cfe5f2;border-radius:8px;padding:10px;margin:6px 0;background:#eef6fb'><summary style='cursor:pointer;font-weight:600;color:#0d3f5e'>➕ 新增成果</summary>" +
      ACH_FIELDS.map(function (f) { return "<div style='margin:3px 0'><label>" + f + "：<input id='achf-" + f + "' style='width:88%'/></label></div>"; }).join("") +
      "<button onclick='MMS.addAch()'>保存成果</button></details>" +
      "<table style='font-size:11.5px'><tr><th>项目</th><th>类型</th><th>结果</th><th>STAR可用</th></tr>" +
      list.map(function (l) { return "<tr><td>" + (l["业务背景"] || "").slice(0, 24) + "</td><td>" + (l["项目类型"] || "") + "</td><td>" + (l["项目结果"] || "") + "</td><td>" + (l["是否适合晋升答辩"] || "") + "</td></tr>"; }).join("") + "</table>" +
      "<div style='margin-top:6px'><button onclick='MMS.exportAch()'>导出成果（脱敏）</button> <button onclick=\"document.getElementById('imp-ach').click()\">导入</button><input type='file' id='imp-ach' style='display:none' onchange='MMS.importAch(this)'/></div>";
    host.innerHTML = html;
  }
  MMS.addAch = function () {
    var list = LS.get("ach") || [];
    var l = {};
    ACH_FIELDS.forEach(function (f) { l[f] = document.getElementById("achf-" + f) ? document.getElementById("achf-" + f).value : ""; });
    l.date = new Date().toISOString().slice(0, 10);
    list.push(l); LS.set("ach", list);
    var s = LS.get("achstats") || { closed: 0, insightAdopted: 0, templatesUsed: 0, riskAhead: 0, crossDept: 0, leaderConfirm: 0, l1toL3: 0, star: 0 };
    if (l["项目结果"]) s.closed++;
    if (l["医学洞察"]) s.insightAdopted++;
    if (l["Output"]) s.templatesUsed++;
    if (l["遇到的阻力"]) s.riskAhead++;
    if (l["协调对象"]) s.crossDept++;
    if (l["领导反馈"]) s.leaderConfirm++;
    if (l["对应能力模型"]) s.l1toL3++;
    if (l["是否适合晋升答辩"] === "是") s.star++;
    LS.set("achstats", s); achPanel();
  };
  MMS.exportAch = function () { exportJSON("ach", "achievements-safe.json"); };
  MMS.importAch = function (inp) { importJSON("ach", inp, achPanel); };

  /* ===== 5. 真实接口地图（空白模板） ===== */
  var MAP_FIELDS = ["职能", "岗位/角色", "负责事项", "我可以直接处理的事项", "需其审批的事项", "需要提前多久沟通", "常用沟通方式", "升级路径", "保密等级"];
  function mapPanel() {
    var host = document.getElementById("sys-map");
    if (!host) return;
    var rows = LS.get("map") || [];
    var html = "<div style='font-size:12px;color:#5b6b7a;margin-bottom:8px'>真实接口地图（空白模板，<b>不预填真实姓名</b>）：入职后按公司组织架构填写；仅存本浏览器。</div>" +
      "<details style='border:1px solid #cfe5f2;border-radius:8px;padding:10px;background:#eef6fb'><summary style='cursor:pointer;font-weight:600;color:#0d3f5e'>➕ 新增接口行</summary>" +
      MAP_FIELDS.map(function (f) { return "<div style='margin:3px 0'><label>" + f + "：<input id='mapf-" + f + "' style='width:70%'/></label></div>"; }).join("") +
      "<button onclick='MMS.addMap()'>保存</button></details>" +
      "<table style='font-size:11.5px'><tr><th>职能</th><th>岗位/角色</th><th>负责事项</th><th>可直接处理</th><th>需审批</th><th>沟通方式</th></tr>" +
      rows.map(function (r) { return "<tr><td>" + (r["职能"] || "") + "</td><td>" + (r["岗位/角色"] || "") + "</td><td>" + (r["负责事项"] || "") + "</td><td>" + (r["我可以直接处理的事项"] || "") + "</td><td>" + (r["需其审批的事项"] || "") + "</td><td>" + (r["常用沟通方式"] || "") + "</td></tr>"; }).join("") + "</table>";
    host.innerHTML = html;
  }
  MMS.addMap = function () {
    var rows = LS.get("map") || [];
    var r = {};
    MAP_FIELDS.forEach(function (f) { r[f] = document.getElementById("mapf-" + f) ? document.getElementById("mapf-" + f).value : ""; });
    rows.push(r); LS.set("map", rows); mapPanel();
  };

  /* ===== 6. 备份/恢复（脱敏导出 + 全量导入） ===== */
  MMS.backupAll = function () {
    var all = {};
    ["rubrics", "calib", "loops", "ach", "achstats", "map"].forEach(function (k) { all[k] = LS.get(k); });
    var blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mms-personal-backup.json"; a.click();
  };
  MMS.restoreAll = function (inp) {
    var f = inp.files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var j = JSON.parse(reader.result);
        Object.keys(j).forEach(function (k) { LS.set(k, j[k]); });
        alert("恢复完成"); rubricPanel(); calPanel(); loopPanel(); achPanel(); mapPanel();
      } catch (e) { alert("导入失败：格式错误"); }
    };
    reader.readAsText(f);
  };

  function exportJSON(k, fn) {
    var blob = new Blob([JSON.stringify(LS.get(k) || {}, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fn; a.click();
  }
  function importJSON(k, inp, cb) {
    var f = inp.files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function () { try { LS.set(k, JSON.parse(reader.result)); if (cb) cb(); alert("导入完成"); } catch (e) { alert("导入失败"); } };
    reader.readAsText(f);
  }

  /* ===== 7. 初始化 ===== */
  function init() {
    rubricPanel(); calPanel(); loopPanel(); achPanel(); mapPanel();
    var hint = document.getElementById("sys-sec-hint");
    if (hint) hint.innerHTML = "<b>🔒 数据安全说明</b>：本网站所有个人记录（Rubric/校准日志/成果档案/接口地图/闭环）仅保存在<b>当前浏览器 localStorage</b>，不提交任何远程服务器。禁止录入：患者身份信息、真实KOL联系方式、未公开研究数据、公司商业秘密、合同、真实预算、内部账号/密码。导出文件请自行保管；更换设备需手动备份/恢复。";
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
