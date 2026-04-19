#!/usr/bin/env node
/**
 * Import issues.md into GitHub Issues.
 *
 * Usage:
 *   GH_TOKEN=github_pat_xxx node scripts/import-issues.mjs [--dry-run]
 *
 * Idempotent: skips issues whose title already exists in the repo.
 * Creates milestones and labels on the fly.
 *
 * Expected env:
 *   GH_TOKEN  Fine-grained PAT with repo Contents + Issues write.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const OWNER = 'papa-moussa';
const REPO = 'ecommerce';
const TOKEN = process.env.GH_TOKEN;
const DRY = process.argv.includes('--dry-run');

if (!TOKEN) {
  console.error('✗ GH_TOKEN environment variable missing.');
  console.error('  In bash : GH_TOKEN=github_pat_xxx node scripts/import-issues.mjs');
  console.error('  In PS   : $env:GH_TOKEN="github_pat_xxx"; node scripts\\import-issues.mjs');
  process.exit(1);
}

const API = 'https://api.github.com';
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function gh(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function paginate(path) {
  const all = [];
  let page = 1;
  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const chunk = await gh('GET', `${path}${sep}per_page=100&page=${page}`);
    all.push(...chunk);
    if (chunk.length < 100) break;
    page++;
  }
  return all;
}

/** Parse issues.md into {milestone, title, labels, body}[]. */
function parseIssues(md) {
  const lines = md.split(/\r?\n/);
  const issues = [];
  let currentMilestone = null;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const msMatch = line.match(/^## Milestone: (.+)$/);
    if (msMatch) {
      currentMilestone = msMatch[1].trim();
      i++;
      continue;
    }
    const issueHeader = line.match(/^### #(\d+) — (.+)$/);
    if (issueHeader) {
      const title = issueHeader[2].trim();
      // Collect everything up to next `### ` or `## `
      let j = i + 1;
      while (j < lines.length && !/^### #\d+ — /.test(lines[j]) && !/^## /.test(lines[j])) {
        j++;
      }
      const bodyLines = lines.slice(i + 1, j);
      const rawBody = bodyLines.join('\n').replace(/^\s*---\s*$/gm, '').trim();

      // Extract labels line
      const labelLine = bodyLines.find((l) => /^\*\*Labels\*\*/.test(l));
      let labels = [];
      if (labelLine) {
        labels = [...labelLine.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      }

      issues.push({
        milestone: currentMilestone,
        title,
        labels,
        body: rawBody,
      });
      i = j;
      continue;
    }
    i++;
  }
  return issues;
}

async function ensureMilestone(title, cache) {
  if (cache.has(title)) return cache.get(title);
  if (DRY) { console.log(`  [dry] would create milestone: ${title}`); cache.set(title, -1); return -1; }
  const created = await gh('POST', `/repos/${OWNER}/${REPO}/milestones`, { title });
  cache.set(title, created.number);
  console.log(`  + milestone: ${title} (#${created.number})`);
  return created.number;
}

async function ensureLabel(name, existing) {
  if (existing.has(name)) return;
  if (DRY) { console.log(`  [dry] would create label: ${name}`); existing.add(name); return; }
  // random-ish pastel color per label
  const colors = { backend:'1f77b4', frontend:'2ca02c', infra:'7f7f7f', security:'d62728', performance:'ff7f0e', marketing:'9467bd', 'mvp-critical':'b10b0b', database:'17becf', admin:'8c564b', seo:'bcbd22', ux:'e377c2' };
  const color = colors[name] ?? '999999';
  try {
    await gh('POST', `/repos/${OWNER}/${REPO}/labels`, { name, color });
    existing.add(name);
    console.log(`  + label: ${name}`);
  } catch (e) {
    if (String(e).includes('already_exists')) { existing.add(name); return; }
    throw e;
  }
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const md = readFileSync(resolve(here, '..', 'issues.md'), 'utf8');
  const parsed = parseIssues(md);
  console.log(`→ Parsed ${parsed.length} issues from issues.md`);

  console.log('→ Verifying repo access…');
  await gh('GET', `/repos/${OWNER}/${REPO}`);

  console.log('→ Loading existing milestones / labels / issues…');
  const existingMilestones = await paginate(`/repos/${OWNER}/${REPO}/milestones?state=all`);
  const msCache = new Map(existingMilestones.map((m) => [m.title, m.number]));

  const existingLabels = await paginate(`/repos/${OWNER}/${REPO}/labels`);
  const labelSet = new Set(existingLabels.map((l) => l.name));

  const existingIssues = await paginate(`/repos/${OWNER}/${REPO}/issues?state=all`);
  const existingTitles = new Set(existingIssues.filter((i) => !i.pull_request).map((i) => i.title));

  const needed = new Set(parsed.flatMap((p) => p.labels));
  for (const l of needed) await ensureLabel(l, labelSet);

  const milestoneTitles = [...new Set(parsed.map((p) => p.milestone).filter(Boolean))];
  for (const t of milestoneTitles) await ensureMilestone(t, msCache);

  let created = 0, skipped = 0;
  for (const issue of parsed) {
    if (existingTitles.has(issue.title)) { skipped++; continue; }
    const body = {
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
      milestone: msCache.get(issue.milestone) ?? undefined,
    };
    if (DRY) {
      console.log(`  [dry] would create: ${issue.title}`);
    } else {
      await gh('POST', `/repos/${OWNER}/${REPO}/issues`, body);
      console.log(`  + issue: ${issue.title}`);
      // small courtesy delay to stay well under secondary rate limits
      await new Promise((r) => setTimeout(r, 400));
    }
    created++;
  }

  console.log(`\n✓ Done. Created: ${created}, skipped (already exists): ${skipped}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
