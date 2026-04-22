---
name: digest
description: Full digest publishing cycle — topic pick, search, write, cover, PR
disable-model-invocation: true
---

Run one full publishing cycle for the knitting/crochet digest (trends, yarn, techniques, seasonal colors, social microtrends). One article per run. If no unique topic or no cover — abort without publishing.

## Step 1. Pick a topic

Read `digest.config.json`. Iterate topics top to bottom:
- Read existing articles in `src/content/blog/` (titles + tags).
- Take the first topic not yet covered. Go to Step 2.

If all 6 topics are covered — report and exit.

## Step 2. Find a source

Search via Tavily MCP using the topic's `search_query`. Selection criteria (`.claude/rules/editorial-policy.md`):
- Published within the last 3 months.
- Knitting or crochet only.
- Not duplicating existing articles.
- Preferred sources: Ravelry, Vogue Knitting, Interweave, Pinterest, TikTok, Instagram.

Pick one best item. Save its URL for `source`.

## Step 3. Write the article

Load the topic's prompt from `article_prompt_file` (`docs/prompts/prompt-*.md`). Follow:

**Format** (`.claude/rules/article-format.md`):
- File: `src/content/blog/{slug}.md`, slug in kebab-case, English.
- Frontmatter: `title`, `description`, `pubDate` (today), `tags`, `source` (URL from Step 2).
- Title ≤ 80 characters.
- Length 300–500 words (SVG excluded).
- Language: Russian.

**Style** (`.claude/rules/editorial-style.md`):
- Conversational Russian, second person informal («ты»), voice of an expert friend.
- Headings feel like advice to a friend; intro reads like a messenger note.
- Explain complex things simply, never dumbed down. Keep knitting and crochet clearly separated.
- Light irony in the closing line; no pathos.

**Visuals**: embed SVG where it actually helps (season palette, stitch chart, layout). Keep one palette across the whole article.

## Step 4. Generate cover

Invoke the `/cover` skill with a one-sentence article description:

```
/cover <one sentence>
```

Cover is saved to `src/assets/{slug}.png`. Up to 3 retries on Replicate failure. No cover — no publication.

## Step 5. Attach cover

Add to the article's frontmatter:

```yaml
heroImage: '../../assets/{slug}.png'
```

## Step 6. Pull Request

Direct push to `main` is forbidden (editorial policy — every article ships via PR for easy rollback).

- Create branch `digest/{slug}`.
- Stage only the new files: `src/content/blog/{slug}.md` and `src/assets/{slug}.png`.
- Commit in English, result tense: `article added: {slug}`.
- Push the branch and open a PR against `main` via `gh pr create`. PR body: article title, source URL, cover preview.

## Step 7. Report

Print:
- Topic name from `digest.config.json`.
- Article title and file path.
- Cover image path.
- Source URL.
- Created PR URL.
