---
name: digest
description: Full digest publishing cycle — topic pick, search, write, cover, PR
disable-model-invocation: true
---

Run one full publishing cycle for the knitting/crochet digest (trends, yarn, techniques, seasonal colors, social microtrends). One article per run. If no unique topic or no cover — abort without publishing.

## Step 1. Pick a topic

Read `digest.config.json`. Iterate topics top to bottom and pick the first one that can produce a new article:
- Read existing articles in `src/content/blog/` — collect their slugs and titles.
- Each topic may cover multiple sub-themes; existing articles do **not** block a topic from being selected again.
- A topic is skippable only if there is no unique angle left (determined in Step 2 after searching).
- Go to Step 2 with the first topic in the list.

If Tavily search (Step 2) returns nothing new for the selected topic, move to the next topic. If all 6 topics are exhausted with no unique source — report and exit.

## Step 2. Find a source

Search via Tavily MCP using the topic's `search_query`. Selection criteria (`.claude/rules/editorial-policy.md`):
- Published within the last 3 months.
- Knitting or crochet only.
- Preferred sources: Ravelry, Vogue Knitting, Interweave, Pinterest, TikTok, Instagram.
- **Duplicate check**: the resulting article's proposed slug or title must not match any existing file in `src/content/blog/` (exact slug match or near-identical title). Different angle on the same broad topic is fine.

If no unique source is found for this topic — skip to the next topic in Step 1. Pick one best item. Save its URL for `source`.

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

**Visuals**: SVG is added only if the article falls into one of these three categories (see `.claude/rules/article-format.md`):
  1. Article about yarn texture or material — embed texture/sample illustration.
  2. Tutorial for a specific knitted/crocheted item — embed stitch chart or construction diagram.
  3. Any article mentioning specific colors — embed a color palette with color swatches and names.

For all other cases (trends, history, styling, social microtrends) — no SVG. If SVG is used, it must be inline: `<svg>...</svg>` directly in the article text — no code blocks, ASCII art, or placeholders.

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

## Step 6. Report

Print:
- Topic name from `digest.config.json`.
- Article title and file path.
- Cover image path.
- Source URL.
- Created PR URL.
