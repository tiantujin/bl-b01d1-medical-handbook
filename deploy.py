#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一键部署到 GitHub Pages（通过 GitHub Contents API）

用法：
    python3 deploy.py --dry     # 只预览：列出需要上传/更新的文件，不提交
    python3 deploy.py           # 实际部署
    python3 deploy.py -m "提交说明"   # 自定义提交说明

设计要点：
  · 用 Git blob SHA 全量比对（本地 git hash-object vs 远端 git/trees?recursive=1）
    → 只上传真正有差异的文件，避免重复 PUT 触发 Pages 反复重建。
  · 内置指数退避重试，适配数百 KB 的大文件。
  · Token 只从环境变量或 ~/.config/gh/hosts.yml 读取，绝不写入仓库。

为什么走 Contents API 而不是 git push：
  沙箱 / 受限网络环境常只放行 api.github.com，到 github.com 的 git 传输会失败。
  Contents API 的 PUT 等价于向目标分支提交，效果相同。
"""

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

# ------------------------- 配置 -------------------------
OWNER = "tiantujin"
REPO = "bl-b01d1-medical-handbook"
BRANCH = "main"
SITE_DIR = os.path.dirname(os.path.abspath(__file__))

SKIP_DIRS = {".git", "__pycache__", "node_modules"}
SKIP_FILES = {".DS_Store"}
SKIP_EXT = {".pyc", ".pyo"}
DEFAULT_MESSAGE = "更新站点内容"

API = f"https://api.github.com/repos/{OWNER}/{REPO}/contents"
TREE_API = f"https://api.github.com/repos/{OWNER}/{REPO}/git/trees/{BRANCH}?recursive=1"


# ------------------------- 凭据 -------------------------
def load_token():
    tok = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if tok:
        return tok.strip()
    hosts = os.path.expanduser("~/.config/gh/hosts.yml")
    if os.path.exists(hosts):
        with open(hosts, encoding="utf-8") as f:
            for line in f:
                m = re.search(r"oauth_token:\s*(\S+)", line)
                if m:
                    return m.group(1)
    return None


TOKEN = load_token()
if not TOKEN:
    sys.exit(
        "✗ 未找到 GitHub 凭据。\n"
        "  请先执行 `gh auth login`，或设置环境变量 GITHUB_TOKEN。"
    )

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "User-Agent": "bl-b01d1-deploy",
    "X-GitHub-Api-Version": "2022-11-28",
}


def request(url, method="GET", data=None, tries=5):
    """带指数退避的 HTTP 请求。404 直接返回 (404, {})，便于新文件走 PUT。"""
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, method=method, headers=HEADERS, data=data)
            with urllib.request.urlopen(req, timeout=300) as resp:
                body = resp.read().decode("utf-8") or "{}"
                return resp.status, json.loads(body)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            if e.code == 404:
                return 404, {}
            last = f"HTTP {e.code}: {body[:300]}"
            if e.code in (401, 403, 422):
                break  # 凭据/参数错误，重试无意义
        except Exception as e:  # 网络中断、IncompleteRead 等
            last = f"{type(e).__name__}: {e}"
        if i < tries - 1:
            time.sleep(2 + 3 * i)
    raise RuntimeError(f"{method} {url} 失败 → {last}")


# ------------------------- 指纹比对 -------------------------
def remote_tree():
    """远端所有文件的 blob SHA（Git 对象指纹）。"""
    _, data = request(TREE_API)
    return {e["path"]: e["sha"] for e in data.get("tree", []) if e["type"] == "blob"}


def local_tree():
    """本地所有文件的 blob SHA —— 用 git hash-object 计算，与远端同一套指纹。"""
    out = {}
    for root, dirs, files in os.walk(SITE_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if name in SKIP_FILES or os.path.splitext(name)[1] in SKIP_EXT:
                continue
            full = os.path.join(root, name)
            rel = os.path.relpath(full, SITE_DIR).replace(os.sep, "/")
            try:
                sha = subprocess.check_output(["git", "hash-object", full]).decode().strip()
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue
            out[rel] = sha
    return out


def diff():
    rem, loc = remote_tree(), local_tree()
    added = sorted(set(loc) - set(rem))
    changed = sorted(p for p in set(loc) & set(rem) if loc[p] != rem[p])
    only_remote = sorted(set(rem) - set(loc))
    same = len(set(loc) & set(rem)) - len(changed)
    return added, changed, only_remote, same, len(loc)


# ------------------------- 上传 -------------------------
def upload(rel_path, message):
    full = os.path.join(SITE_DIR, rel_path)
    raw = open(full, "rb").read()
    t0 = time.time()

    status, meta = request(f"{API}/{urllib.parse.quote(rel_path)}?ref={BRANCH}")
    sha = meta.get("sha") if status == 200 else None

    payload = {
        "message": message,
        "content": base64.b64encode(raw).decode("ascii"),
        "branch": BRANCH,
    }
    if sha:
        payload["sha"] = sha

    st, res = request(f"{API}/{urllib.parse.quote(rel_path)}", "PUT",
                      json.dumps(payload).encode("utf-8"))
    action = "更新" if sha else "新增"
    commit = (res.get("commit") or {}).get("sha", "?")[:10]
    print(f"  ✓ [{action}] {rel_path}")
    print(f"      {len(raw):,} B | HTTP {st} | commit {commit} | {time.time() - t0:.1f}s")
    return commit


def pages_status():
    st, d = request(f"https://api.github.com/repos/{OWNER}/{REPO}/pages/builds/latest")
    if st == 404:
        return "（尚无构建记录）", None
    return d.get("status", "?"), (d.get("error") or {}).get("message")


# ------------------------- 主流程 -------------------------
def main():
    ap = argparse.ArgumentParser(description="部署站点到 GitHub Pages")
    ap.add_argument("--dry", action="store_true", help="只预览，不提交")
    ap.add_argument("-m", "--message", default=DEFAULT_MESSAGE, help="提交说明")
    args = ap.parse_args()

    print(f"仓库：{OWNER}/{REPO}（{BRANCH} 分支）")
    print(f"目录：{SITE_DIR}\n")

    added, changed, only_remote, same, total = diff()

    print("=== 内容指纹比对 ===")
    print(f"  本地文件 {total} 个 | 内容一致 {same} 个")
    print(f"  需新增 {len(added)} 个 | 需更新 {len(changed)} 个 | 仅远端有 {len(only_remote)} 个\n")

    for p in added:
        print(f"   + {p}")
    for p in changed:
        print(f"   ~ {p}")
    for p in only_remote:
        print(f"   ? {p}   （本地已无，脚本不会自动删除远端文件）")

    if not added and not changed:
        print("\n✓ 本地与远端已完全一致，无需部署。")
        st, err = pages_status()
        print(f"  Pages 构建状态：{st}" + (f"（错误：{err}）" if err else ""))
        print(f"  线上地址：https://{OWNER}.github.io/{REPO}/")
        return

    if args.dry:
        print(f"\n（--dry 预览模式，未提交。去掉 --dry 即可实际部署）")
        return

    print(f"\n=== 开始上传（{len(added) + len(changed)} 个文件）===")
    for p in added + changed:
        upload(p, args.message)

    print("\n=== 等待 Pages 构建 ===")
    for i in range(20):
        time.sleep(15)
        st, err = pages_status()
        print(f"  [{i + 1}] status={st}" + (f" err={err}" if err else ""))
        if st == "built":
            break
        if st == "errored":
            print("  ✗ 构建失败，请检查 Pages 设置或文件内容")
            return

    print(f"\n✓ 部署完成 → https://{OWNER}.github.io/{REPO}/")
    print("  提示：浏览器可能有缓存，建议加 ?v=时间戳 或强制刷新核对。")


if __name__ == "__main__":
    main()
