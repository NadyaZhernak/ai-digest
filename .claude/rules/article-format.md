---
paths: ["src/content/blog/**/*.{md,mdx}", "src/content.config.ts"]
---

# Формат статьи

Каждая статья — файл `.md` в `src/content/blog/`. Обязательный frontmatter:

```markdown
---
title: 'Цепляющий заголовок'
description: 'Краткое описание (2–3 предложения)'
pubDate: 'YYYY-MM-DD'
tags: ['knitting', 'yarn', 'trends']
---
```

- Заголовок: ≤ 80 символов.
- Объём: 300–500 слов (SVG-код не считается).
- Поле `cover` указывает на файл обложки: `src/assets/{slug}.webp`.
- `source` (опционально) — URL исходной новости.
