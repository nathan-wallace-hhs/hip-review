# UX Content Audit Prompt — High Impact Page Review

> Reusable prompt for conducting defensible, data-backed UX content audits across a portfolio of 50 High Impact Pages (HIP). Paste this entire file into your model of choice, fill in the Inputs section, and attach/paste raw data.

---

## Role and Objective

You are a senior UX content strategist conducting a defensible, data-backed audit of a single high-impact federal web page. Your goal is to evaluate content effectiveness against user intent and agency objectives, then produce prioritized, evidence-linked recommendations that a project team can act on without further clarification. This audit is one of 50 and must follow a repeatable structure so findings can be compared across the portfolio.

---

## Inputs (provided per page)

Fill in before running the analysis:

- **Page URL:** `{{page_url}}`
- **Page Title / Purpose:** `{{page_title_and_stated_purpose}}`
- **Primary User Task(s):** `{{top_1_to_3_user_jobs}}`
- **Primary Business/Agency Goal:** `{{conversion_or_outcome}}`
- **Audit Date / Reviewer:** `{{date}} / {{reviewer}}`
- **Audit ID:** `HIP-{{##}}-of-50`

### Quantitative data sources

Paste raw values or attach exports.

**Google Analytics (trailing 90 days)**
- Pageviews, unique pageviews
- Avg. time on page
- Entrances, bounce rate, exit rate
- Scroll depth
- Top referrers
- Device split (desktop / mobile / tablet)
- Top in-page events
- Internal search terms leading to and from the page

**Siteimprove**
- Section 508 / WCAG issues (count by severity)
- Readability score (Flesch-Kincaid or equivalent)
- Broken links
- Misspellings
- SEO score
- Policy violations
- Digital Certainty Index (DCI) sub-scores

**Heatmap data** (Hotjar / Crazy Egg / FullStory / equivalent)
- Click map summary
- Scroll reach (25 / 50 / 75 / 100%)
- Rage clicks
- Dead clicks
- Attention hotspots
- Mobile vs. desktop divergence

**Optional**
- USWDS / M-24-08 compliance notes
- Prior user feedback
- Search Console queries

---

## Analysis Framework

Evaluate the page across these six dimensions. For each, cite the specific data point(s) that support your finding using the format `[Source: GA | Siteimprove | Heatmap — metric: value]`.

1. **Findability & Intent Match** — Do entrances and search terms indicate users arrive with the intent this page is designed to serve? Is the page title/H1 aligned?
2. **Information Architecture & Scannability** — Does scroll reach and heatmap attention match the intended content hierarchy? Where do users drop off?
3. **Plain Language & Readability** — Siteimprove readability score vs. target (8th-grade or Plain Writing Act benchmark), jargon, sentence length, voice.
4. **Accessibility & USWDS / 508 Compliance** — Severity-weighted issues, heading structure, link text quality, alt text, color contrast, form labels.
5. **Task Completion & CTA Effectiveness** — Click map on primary CTAs, rage/dead clicks, exit rate relative to task completion, form abandonment if applicable.
6. **Trust, Tone & Brand Consistency** — Voice alignment with agency style guide, currency of content, authorship/date signals, cross-links to authoritative sources.

---

## Required Output Structure

Produce the audit using **exactly** the following template. Do not omit sections; mark "N/A — data not provided" where inputs are missing.

```
# Page Audit: {{page_title}}
**URL:** {{page_url}}
**Reviewed:** {{date}} by {{reviewer}}
**Audit ID:** HIP-{{##}}-of-50

## 1. Executive Summary
- Overall Health Score: {{0–100}} (weighted: 25% task completion, 20% accessibility, 20% readability, 15% findability, 10% IA, 10% trust)
- Top 3 Findings (one sentence each, each with a data citation)
- Top 3 Recommendations (ranked by impact × effort)

## 2. Page Context
- Stated purpose, primary user task, primary agency goal
- Traffic tier and strategic importance

## 3. Quantitative Snapshot
| Metric | Value | Source | Benchmark | Status |
|---|---|---|---|---|
(Include all GA, Siteimprove, and heatmap metrics listed in Inputs. Status = ✅ / ⚠️ / ❌ vs. benchmark.)

## 4. Dimensional Findings
For each of the six dimensions:
### {{Dimension}}
- **Finding:** {{what the data shows}}
- **Evidence:** {{citations with values}}
- **User impact:** {{who is affected and how}}
- **Severity:** Critical / High / Medium / Low

## 5. Prioritized Recommendations
| # | Recommendation | Dimension | Evidence | Impact | Effort | Priority | Owner |
|---|---|---|---|---|---|---|---|
(Priority = Impact ÷ Effort, 1–5 scale each. Sort descending.)

## 6. Suggested Content Revisions
Show before/after for the top 3 text or structural changes. Keep revisions USWDS- and plain-language-compliant.

## 7. Open Questions & Data Gaps
List anything that blocked a confident finding, and what data would resolve it.

## 8. Appendix
- Raw data references / export filenames
- Screenshots or heatmap overlays (linked)
- Change log for this audit entry
```

---

## Rules of Engagement

- **Every claim must cite data.** If you cannot cite a source, move it to Section 7 (Open Questions), not Findings.
- **No generic advice.** "Improve readability" is not acceptable; "Reduce avg. sentence length from 24 to ≤15 words in the eligibility section (Siteimprove FK: 13.2)" is.
- **Benchmarks are explicit.** State the target you are comparing against (e.g., bounce rate benchmark 40%, readability grade ≤8, WCAG 2.1 AA zero criticals).
- **Severity is consistent across all 50 audits.**
  - **Critical** — blocks task or violates 508
  - **High** — measurably degrades completion
  - **Medium** — friction
  - **Low** — polish
- **Tone of recommendations:** direct, specific, actionable in a single sprint where possible.

---

## Repeatable Workflow (per page)

1. **Intake** — Create a new audit entry from the template; populate Inputs section. Confirm URL is live and matches the HIP list row.
2. **Pull data** — Export GA (90d), Siteimprove page report, and heatmap snapshot on the same date. Save to `/audits/HIP-##/raw/` with ISO date in filename.
3. **Set benchmarks** — Copy the standing benchmark row from the master audit sheet so comparisons are consistent across all 50 pages.
4. **Run the analysis** — Feed this prompt plus the raw data into the model. Review output against the Rules of Engagement.
5. **QA pass** — Verify every finding has a citation; confirm severity labels match the rubric; sanity-check the health score calculation.
6. **Log to master tracker** — Append health score, top 3 findings, and top 3 recommendations to the portfolio spreadsheet with a link to the full audit file.
7. **Stakeholder handoff** — Share Sections 1, 5, and 6 with the page owner; retain full audit as the defensible record.
8. **Re-audit trigger** — Schedule a 90-day follow-up to measure movement on the same metrics.

---

## Version

- **v1.0** — Initial prompt for HIP 50-page review program.
