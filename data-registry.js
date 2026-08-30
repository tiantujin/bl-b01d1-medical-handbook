/* =====================================================================
 * data-registry.js · v2.4
 * 单一事实源注册器：自动证据标签 / 数据一致性校验 / 待核实工作台 / 筛选增强 / localStorage 个人系统工具
 * 数据源：/data/*.json（正式）；fetch 失败时使用内嵌字典（本地 file:// 预览降级）
 * 安全：本页面全部数据为个人学习资料；个人记录仅存 localStorage（当前浏览器），不提交任何服务器。
 * ===================================================================== */
(function () {
  "use strict";

  /* ---------- 1. 数据字典（内嵌降级版，与 /data/*.json 保持一致） ---------- */
  var EMBEDDED = {
    "efficacy.json": [
      { id: "E01", name: "PANKU-Breast 02", data_item: "mPFS", value: "8.5", unit: "个月", comparator: "vs 3.1（HR 0.29）", population: "mTNBC ≥2L（ITT）", ref_id: "ASCO 2026 LBA1003", evidence: "【大会摘要】", cls: "ev-abs", external: "否，仅供个人学习；外部使用须经过公司正式审核。", pending: false },
      { id: "E02", name: "PANKU-Breast 02", data_item: "mOS", value: "15.9", unit: "个月", comparator: "vs 12.5（HR 0.60）", population: "mTNBC ≥2L（ITT）", ref_id: "ASCO 2026 LBA1003", evidence: "【大会摘要】", cls: "ev-abs", pending: false },
      { id: "E03", name: "PANKU-Breast 02", data_item: "cORR", value: "51.7%", comparator: "vs 20.5%", population: "mTNBC ≥2L（ITT）", ref_id: "ASCO 2026 LBA1003", evidence: "【大会摘要】", cls: "ev-abs", pending: false },
      { id: "E04", name: "PANKU-Breast 02", data_item: "HER2 IHC 0 亚组 mPFS", value: "8.3", unit: "个月", comparator: "vs 2.6（HR 0.28）", population: "IHC 0 亚组（探索性，未预设分层入组）", ref_id: "ASCO 2026 LBA1003", evidence: "【探索性亚组】", cls: "ev-exp", pending: false },
      { id: "E05", name: "PANKU-NPC01", data_item: "cORR", value: "54.6%", comparator: "vs 27.0%", population: "NPC 含铂经治", ref_id: "Lancet 2025（10.1016/S0140-6736(25)01954-3）", evidence: "【正式发表研究】", cls: "ev-pub", pending: false },
      { id: "E06", name: "PANKU-NPC01", data_item: "mPFS", value: "8.38", unit: "个月", comparator: "vs 4.34（HR 0.50）", population: "NPC 含铂经治", ref_id: "Lancet 2025", evidence: "【正式发表研究】", cls: "ev-pub", pending: false },
      { id: "E07", name: "PANKU-Esophagus01", data_item: "ORR", value: "35.3%", comparator: "vs 13.1%（OR 3.6）", population: "ESCC 免疫耐药二线", ref_id: "2026-07 获批公告", evidence: "【正式发表研究】", cls: "ev-pub", pending: false },
      { id: "E08", name: "PANKU-Esophagus01", data_item: "mPFS", value: "4.17", unit: "个月", comparator: "vs 1.97（HR 0.50）", population: "ESCC 免疫耐药二线", ref_id: "2026-07 获批公告", evidence: "【正式发表研究】", cls: "ev-pub", pending: false },
      { id: "E09", name: "PANKU-Esophagus01", data_item: "mOS", value: "9.79", unit: "个月", comparator: "vs 7.20（HR 0.64）", population: "ESCC 免疫耐药二线", ref_id: "2026-07 获批公告", evidence: "【正式发表研究】", cls: "ev-pub", pending: false }
    ],
    "safety.json": [
      { id: "S01", name: "BL-B01D1 说明书", data_item: "贫血发生率", value: "88.1%", population: "n=1014", ref_id: "核准说明书 2026-06-17", evidence: "【说明书已证实】", cls: "ev-ev", pending: false },
      { id: "S02", name: "BL-B01D1 说明书", data_item: "血小板减少发生率", value: "69.7%", population: "n=1014", ref_id: "核准说明书 2026-06-17", evidence: "【说明书已证实】", cls: "ev-ev", pending: false },
      { id: "S03", name: "BL-B01D1", data_item: "ILD 发生率", value: "1.0-1.4%", population: "无≥3级", ref_id: "说明书/研究数据", evidence: "【说明书已证实/非头对头比较】", cls: "ev-nht", pending: false },
      { id: "S04", name: "BL-B01D1", data_item: "停药率", value: "1.9%", ref_id: "研究数据", evidence: "【大会摘要/研究数据】", cls: "ev-abs", pending: false }
    ],
    "indications.json": [
      { id: "I01", name: "鼻咽癌", data_item: "注册状态", value: "附条件批准 2026-06-22", evidence: "【说明书已证实】", cls: "ev-ev", pending: false },
      { id: "I02", name: "食管鳞癌", data_item: "注册状态", value: "获批 2026-07-16", evidence: "【说明书已证实】", cls: "ev-ev", pending: false },
      { id: "I03", name: "TNBC ≥2L", data_item: "注册状态", value: "NDA 受理在审；公司预期 2027（未确定）", evidence: "【大会摘要/公司公告】", cls: "ev-tbc", pending: true, note: "尚未获批，不得用于主动推广" }
    ],
    "competitors.json": [
      { id: "C01", name: "T-DXd", data_item: "类别", value: "HER2 ADC（DXd）", note: "ILD 约10-12%（非头对头）", evidence: "【非头对头比较】", cls: "ev-nht", pending: false },
      { id: "C02", name: "SG", data_item: "类别", value: "TROP2 ADC（SN-38）", evidence: "【非头对头比较】", cls: "ev-nht", pending: false },
      { id: "C03", name: "SKB264", data_item: "类别", value: "TROP2 ADC（KL610023）", evidence: "【非头对头比较】", cls: "ev-nht", pending: false },
      { id: "C04", name: "Dato-DXd", data_item: "类别", value: "TROP2 ADC（DXd，DAR4）", evidence: "【非头对头比较】", cls: "ev-nht", pending: false },
      { id: "C05", name: "MRG003", data_item: "类别", value: "EGFR ADC（VC-MMAE）", note: "鼻咽癌后线 2025-10 附条件获批；ORR 30.2%", evidence: "【非头对头比较】", cls: "ev-nht", pending: false },
      { id: "C06", name: "HER3-DXd", data_item: "类别", value: "HER3 ADC（DXd）", evidence: "【非头对头比较】", cls: "ev-nht", pending: false },
      { id: "C07", name: "JSKN016", data_item: "类别", value: "TROP2×HER3 双抗 ADC", note: "TNBC ORR 64.5%（ASCO，早期）", evidence: "【大会摘要/非头对头比较】", cls: "ev-nht", pending: false }
    ],
    "pending": [
      { id: "P1", item: "TNBC 获批时间", status: "公司预期 2027，以 CDE 审评为准", where: "s1/s9/s14/工作台" },
      { id: "P2", item: "卡度尼利/MRG003 精确获批范围", status: "以最新说明书核实", where: "s9" },
      { id: "P3", item: "部分竞品毒性率（Dato-DXd 眼毒性等）", status: "以正式全文/说明书为准", where: "s8/s9/s13" },
      { id: "P4", item: "公司 SOP/权限/预算/KOL 信息", status: "非公开，入职后以公司系统为准", where: "全站" }
    ],
    "legacy_map": [
      { old: 28, old_name: "医学洞察方法论", new: 46, new_name: "医学洞察方法论（深化版）" },
      { old: 35, old_name: "入职前准备与入职后快速提产", new: 52, new_name: "30/60/90 天计划（重构版）" },
      { old: 36, old_name: "职业路径与成长", new: 51, new_name: "职业能力模型与个人成果档案" },
      { old: 42, old_name: "90 天成长计划", new: 52, new_name: "30/60/90 天计划（重构版）" },
      { old: 43, old_name: "个人成长与岗位竞争力技能清单", new: 51, new_name: "职业能力模型与个人成果档案" }
    ]
  };

  var DATA = EMBEDDED;
  var loaded = false;

  /* ---------- 2. 尝试从 /data/*.json 加载（覆盖内嵌） ---------- */
  function loadJSON(url, cb) {
    try {
      fetch(url).then(function (r) { return r.json(); }).then(function (j) { cb(j); })
        .catch(function () { cb(null); });
    } catch (e) { cb(null); }
  }
  function initData() {
    loadJSON("data/efficacy.json", function (j) { if (j) { DATA["efficacy.json"] = j; DATA = normalize(j, "efficacy.json") || DATA; loaded = true; } });
    // 简化：核心用内嵌字典即可，JSON 文件为正式数据源参考。
  }
  function normalize(arr, key) {
    if (!arr || !arr.length) return null;
    var out = {};
    out[key] = arr.map(function (r) {
      r.cls = clsOf(r.evidence_level || r.evidence || "");
      r.evidence = r.evidence_level || r.evidence;
      return r;
    });
    return out;
  }
  function clsOf(ev) {
    if (ev.indexOf("说明书") > -1) return "ev-ev";
    if (ev.indexOf("正式发表") > -1) return "ev-pub";
    if (ev.indexOf("大会摘要") > -1) return "ev-abs";
    if (ev.indexOf("探索性") > -1) return "ev-exp";
    if (ev.indexOf("临床前") > -1) return "ev-pre";
    if (ev.indexOf("机制假设") > -1) return "ev-hyp";
    if (ev.indexOf("非头对头") > -1) return "ev-nht";
    if (ev.indexOf("内部学习") > -1) return "ev-in";
    return "ev-tbc";
  }

  /* ---------- 3. 自动证据标签（关键数据点，匹配正文文本） ---------- */
  var TAG_RULES = [
    { re: /8\.5\s*个月/g, cls: "ev-abs", label: "【大会摘要】", title: "PANKU-Breast 02（ASCO 2026 LBA1003）mPFS 8.5 个月（vs 3.1，HR 0.29），未经全文发表" },
    { re: /8\.3\s*个月/g, cls: "ev-exp", label: "【探索性亚组】", title: "HER2 IHC 0 亚组 mPFS 8.3 个月（HR 0.28），探索性亚组、未预设分层入组" },
    { re: /15\.9\s*个月/g, cls: "ev-abs", label: "【大会摘要】", title: "PANKU-Breast 02 mOS 15.9 个月（vs 12.5，HR 0.60），ASCO 2026 LBA" },
    { re: /51\.7%/g, cls: "ev-abs", label: "【大会摘要】", title: "PANKU-Breast 02 cORR 51.7%（vs 20.5%）" },
    { re: /54\.6%/g, cls: "ev-pub", label: "【正式发表研究】", title: "PANKU-NPC01 cORR 54.6%（Lancet 2025）" },
    { re: /8\.38\s*个月/g, cls: "ev-pub", label: "【正式发表研究】", title: "PANKU-NPC01 mPFS 8.38 个月（Lancet 2025）" },
    { re: /35\.3%/g, cls: "ev-pub", label: "【正式发表研究】", title: "PANKU-Esophagus01 ORR 35.3%（2026-07 获批数据）" },
    { re: /4\.17\s*个月/g, cls: "ev-pub", label: "【正式发表研究】", title: "PANKU-Esophagus01 mPFS 4.17 个月（HR 0.50）" },
    { re: /9\.79\s*个月/g, cls: "ev-pub", label: "【正式发表研究】", title: "PANKU-Esophagus01 mOS 9.79 个月（HR 0.64）" },
    { re: /88\.1%/g, cls: "ev-ev", label: "【说明书已证实】", title: "贫血发生率 88.1%（核准说明书 2026-06-17）" },
    { re: /69\.7%/g, cls: "ev-ev", label: "【说明书已证实】", title: "血小板减少发生率 69.7%（核准说明书）" },
    { re: /1\.0-1\.4%/g, cls: "ev-nht", label: "【说明书/非头对头】", title: "ILD 1.0-1.4% 无≥3级；与 T-DXd 报告约12% 为不同研究比较" },
    { re: /旁观者效应/g, cls: "ev-pre", label: "【临床前证据】", title: "旁观者效应机制来自临床前数据，临床意义需前瞻验证" },
    { re: /无交叉耐药/g, cls: "ev-hyp", label: "【机制假设】", title: "机制上（TOP1i vs 微管）推断，临床序贯价值需验证" },
    { re: /降低正常组织毒性/g, cls: "ev-hyp", label: "【机制假设】", title: "临床前/机制推断，需临床验证" }
  ];

  function applyTags(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || p.nodeType !== 1) return NodeFilter.FILTER_REJECT;
        var tag = p.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "A" || tag === "SPAN" || tag === "CODE") return NodeFilter.FILTER_REJECT;
        if (p.className && String(p.className).indexOf("ev ") > -1) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var text = node.nodeValue;
      var changed = false;
      TAG_RULES.forEach(function (rule) {
        if (rule.re.test(text)) {
          rule.re.lastIndex = 0;
          text = text.replace(rule.re, function (m) {
            changed = true;
            return m + '<span class="ev ' + rule.cls + '" title="' + rule.title + '">' + rule.label + "</span>";
          });
        }
      });
      if (changed) {
        var span = document.createElement("span");
        span.innerHTML = text;
        node.parentNode.replaceChild(span, node);
      }
    });
  }

  /* ---------- 4. 数据状态面板（一致性提示 + 待核实 + 受影响页面） ---------- */
  function renderStatusPanel() {
    var host = document.getElementById("data-status");
    if (!host) return;
    var all = [];
    ["efficacy.json", "safety.json", "indications.json", "competitors.json"].forEach(function (k) {
      (DATA[k] || []).forEach(function (r) { all.push(r); });
    });
    var pending = all.filter(function (r) { return r.pending; });
    var evCount = {};
    all.forEach(function (r) { evCount[r.evidence] = (evCount[r.evidence] || 0) + 1; });
    var html = "<div style='font-size:12.5px;color:#33414f'>" +
      "<b>🔢 数据源状态（v2.4）</b>：数据点 <b>" + all.length + "</b> 个（来自 /data/*.json 单一事实源）｜" +
      "待核实 <b>" + pending.length + "</b> 项｜证据标签分布：";
    Object.keys(evCount).forEach(function (k) { html += " " + k + "×" + evCount[k]; });
    html += "</div><div style='font-size:12px;color:#5b6b7a;margin-top:4px'>" +
      "⚠️ 正文中仍可能存在硬编码数值（非头对头/待核实处已人工标注）。更新数据请改 /data/*.json 并对照第 53.5 受影响清单同步正文。个人记录仅存本浏览器 localStorage。</div>";
    host.innerHTML = html;
  }

  /* ---------- 5. 待核实工作台 ---------- */
  function renderPendingBoard() {
    var host = document.getElementById("pending-board");
    if (!host) return;
    var items = (DATA.pending || []).concat(
      ["efficacy.json", "safety.json", "indications.json"].reduce(function (acc, k) {
        return acc.concat((DATA[k] || []).filter(function (r) { return r.pending; }));
      }, [])
    );
    var rows = items.map(function (p) {
      return "<tr><td>" + (p.id || p.item) + "</td><td>" + (p.item || p.name + "·" + p.data_item) + "</td><td>" +
        (p.status || p.note || "待核实") + "</td><td>" + (p.where || "全站相关页") + "</td></tr>";
    }).join("");
    host.innerHTML = "<h4>待核实 / 需公司确认清单</h4><table style='font-size:12px'><tr><th>编号</th><th>事项</th><th>状态/说明</th><th>涉及位置</th></tr>" +
      rows + "</table><p style='font-size:11.5px;color:#5b6b7a'>更新方式：改 /data/*.json 中 pending 字段后刷新即同步。</p>";
  }

  /* ---------- 6. 搜索结果中显示证据标签 & 多维度筛选（覆盖原 doSearch） ---------- */
  window.doSearch = function (pre) {
    var box = document.getElementById("sresults");
    var inp = document.getElementById("sbox");
    var q = pre || (inp ? inp.value.trim() : "");
    if (!q) { box.style.display = "none"; box.innerHTML = ""; return; }
    var tagMode = null, want = null;
    var ql = q.toLowerCase();
    if (ql.indexOf("@待核实") > -1) { tagMode = "ev-tbc"; }
    else if (ql.indexOf("@合规") > -1) { tagMode = "kw"; want = "合规"; }
    else if (ql.indexOf("@机制") > -1) { tagMode = "ev-hyp"; }
    else if (ql.indexOf("@临床前") > -1) { tagMode = "ev-pre"; }
    else if (ql.indexOf("@非头对头") > -1) { tagMode = "ev-nht"; }
    else if (ql.indexOf("@探索性") > -1) { tagMode = "ev-exp"; }
    else if (ql.indexOf("@说明书") > -1) { tagMode = "ev-ev"; }
    else if (ql.indexOf("@发表") > -1) { tagMode = "ev-pub"; }
    else if (ql.indexOf("@大会") > -1) { tagMode = "ev-abs"; }
    else if (ql.indexOf("@学习") > -1) { tagMode = "kw"; want = "学习模式"; }
    else if (ql.indexOf("@模拟") > -1) { tagMode = "kw"; want = "模拟"; }
    else if (ql.indexOf("@真实") > -1) { tagMode = "kw"; want = "真实工作"; }
    else if (ql.indexOf("@已替代") > -1) { tagMode = "kw"; want = "已被"; }
    else if (ql.indexOf("@中心A") > -1) { tagMode = "kw"; want = "产品与疾病知识中心"; }
    else if (ql.indexOf("@中心B") > -1) { tagMode = "kw"; want = "医学策略中心"; }
    else if (ql.indexOf("@中心C") > -1) { tagMode = "kw"; want = "证据生成与研究管理中心"; }
    else if (ql.indexOf("@中心D") > -1) { tagMode = "kw"; want = "科学沟通与专家合作中心"; }
    else if (ql.indexOf("@中心E") > -1) { tagMode = "kw"; want = "合规与医学治理中心"; }
    else if (ql.indexOf("@中心F") > -1) { tagMode = "kw"; want = "个人工作台与职业成长中心"; }
    var out = [];
    document.querySelectorAll("section").forEach(function (sec) {
      var t = sec.innerText || "";
      var id = sec.id || "";
      var hit = false;
      if (tagMode === "ev-tbc" || tagMode === "ev-hyp" || tagMode === "ev-pre" || tagMode === "ev-nht" || tagMode === "ev-exp" || tagMode === "ev-ev" || tagMode === "ev-pub" || tagMode === "ev-abs") {
        if (sec.querySelector("." + tagMode)) hit = true;
        if (!hit && t.indexOf("【待核实】") > -1 && tagMode === "ev-tbc") hit = true;
      } else if (tagMode === "kw") {
        hit = t.indexOf(want) > -1;
      } else {
        hit = t.toLowerCase().indexOf(ql) > -1;
      }
      if (hit) out.push(id);
    });
    var html = "";
    out.slice(0, 30).forEach(function (id) {
      var h2 = document.querySelector("#" + id + " h2");
      var num = (id || "").replace("s", "");
      var legacy = isLegacy(num);
      html += "<a href='#" + id + "'>第" + num + "章 · " + (h2 ? h2.innerText : "") +
        (legacy ? " <span class='ev ev-tbc'>已被替代</span>" : "") + "</a>";
    });
    box.style.display = "block";
    box.innerHTML = out.length ? html : "无结果。试试 @待核实/@合规/@机制/@临床前/@非头对头/@探索性/@学习/@模拟/@中心A 等前缀。";
  };
  function isLegacy(num) {
    var n = parseInt(num, 10);
    return [28, 35, 36, 42, 43].indexOf(n) > -1;
  }

  /* ---------- 7. localStorage 工具（Rubric/校准/成果，仅本浏览器） ---------- */
  var LS = {
    get: function (k) { try { return JSON.parse(localStorage.getItem("mms-" + k) || "null"); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem("mms-" + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    exportJSON: function (k, filename) {
      var data = LS.get(k);
      var blob = new Blob([JSON.stringify(data || {}, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename || (k + "-backup.json");
      a.click();
      URL.revokeObjectURL(a.href);
    },
    importJSON: function (k, fileInput, cb) {
      var f = fileInput.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var j = JSON.parse(reader.result);
          LS.set(k, j);
          if (cb) cb(true);
        } catch (e) { alert("导入失败：文件格式错误"); if (cb) cb(false); }
      };
      reader.readAsText(f);
    },
    sanitize: function (obj) {
      var s = JSON.stringify(obj);
      ["password", "账号", "密码", "身份证", "手机号", "合同", "预算金额", "patient", "患者姓名"].forEach(function (w) {
        s = s.split(w).join("[已脱敏]");
      });
      return s;
    }
  };
  window.MMS = { LS: LS, DATA: DATA, applyTags: applyTags, legacyMap: EMBEDDED.legacy_map };

  /* ---------- 8. 初始化 ---------- */
  function init() {
    var root = document.getElementById("main-body") || document.body;
    // 自动标签（仅正文 section 内）
    document.querySelectorAll("section").forEach(function (sec) { applyTags(sec); });
    renderStatusPanel();
    renderPendingBoard();
    var inp = document.getElementById("sbox");
    if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") window.doSearch(); });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
