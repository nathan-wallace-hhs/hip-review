# Report Insight Dashboard

A static project dashboard for uncovering insights across prompt-based page reviews stored in `reports/` as JSON or Markdown.

## Features

- Loads report files from `reports/index.json`
- Supports both JSON and Markdown report formats
- Filters by search, file type, and tags
- Computes dashboard metrics (report count, average score, pages reviewed, issue count)
- Surfaces recurring issues and highest-scoring report
- Works on GitHub Pages with `.nojekyll`

## Report format

1. Add each report file under `reports/`.
2. Register each report in `reports/index.json`.

### JSON report shape (example)

```json
{
  "title": "Navigation and IA Review",
  "date": "2026-04-10",
  "summary": "...",
  "score": 74,
  "pagesReviewed": 12,
  "tags": ["navigation", "ia"],
  "issues": ["Issue A", "Issue B"],
  "findings": ["Finding A", "Finding B"]
}
```

### Markdown report hints

Use a top-level heading for the title and include metadata lines such as:

- `Date: YYYY-MM-DD`
- `Tags: tag1, tag2`
- `Score: 80`
- `PagesReviewed: 5`

Then add sections:

- `## Summary`
- `## Issues` (as bullet list)
- `## Findings` (as bullet list)

## Run locally

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
