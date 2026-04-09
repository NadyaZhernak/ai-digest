# AI Digest Pipeline — Design Spec

**Дата:** 2026-04-09  
**Статус:** approved  
**Контекст:** Часть курса Claude Code Basics (8 ступеней). Текущая ступень — 3. Мануальный запуск — ступень 5, cron — ступень 8.

---

## Проблема и цель

Сейчас статьи дайджеста пишутся вручную. Цель — автоматизировать полный цикл: поиск актуальных новостей о вязании → написание статьи → генерация обложки → публикация через PR.

---

## Архитектура

**Подход:** Claude как оркестратор (Tool Use). Claude получает набор инструментов и самостоятельно управляет порядком их вызовов.

**Платформа:** GitHub Actions + Vercel.  
- GitHub Actions выполняет пайплайн.  
- Vercel авто-деплоит сайт при каждом мёрдже в `main`.

### Порядок шагов (выполняет Claude)

1. `read_existing_articles` — читает существующие статьи, чтобы избежать дублей
2. `search_news` — ищет свежие новости через Tavily API
3. Выбирает тему (на основе новостей + анализа существующих статей)
4. Пишет статью в формате Markdown с frontmatter
5. `generate_cover_image` — генерирует обложку через Replicate. Промпт = базовый `image_prompt` из конфига для выбранной темы + детали из написанной статьи (конкретная техника, пряжа, настроение)
6. `create_pull_request` — коммитит `.md` + обложку в новую ветку, создаёт PR, авто-мёрджит

---

## Инструменты Claude

| Tool | Вход | Выход |
|------|------|-------|
| `read_existing_articles` | — | Список заголовков и тегов существующих статей |
| `search_news` | `query: str` | Список статей с заголовком, URL, описанием (Tavily API) |
| `generate_cover_image` | `prompt: str` | Путь к сохранённому файлу в `src/assets/` |
| `create_pull_request` | `title: str`, `content: str`, `image_path: str` | URL созданного PR |

---

## Структура файлов

```
nadya-ai-digest/
├── src/
│   ├── content/blog/          # статьи (существующее)
│   ├── assets/                # обложки (существующее)
│   └── scripts/
│       └── pipeline/
│           ├── index.ts       # точка входа — оркестратор
│           ├── search.ts      # заглушка Tavily (readExistingArticles, searchNews)
│           ├── write.ts       # заглушка Claude API (buildStubArticle, стиль)
│           ├── cover.ts       # заглушка Replicate (generateCoverImage)
│           └── publish.ts     # коммит + деплой (createPullRequest)
├── digest.config.json         # темы поиска + промпты для обложек
└── .github/
    └── workflows/
        └── digest.yml         # GH Actions workflow
```

---

## Конфиг `digest.config.json`

```json
{
  "topics": [
    {
      "name": "yarn_trends",
      "search_query": "yarn trends knitting crochet 2026",
      "image_prompt": "flat lay of textured bouclé yarn, warm beige and dusty rose tones, soft natural light, minimal background, editorial style"
    },
    {
      "name": "color_trends",
      "search_query": "color trends knitwear fashion 2026",
      "image_prompt": "color swatches of yarn arranged in palette, muted earthy tones, overhead shot, clean white background"
    },
    {
      "name": "social_microtrends",
      "search_query": "knitting crochet TikTok Pinterest trends",
      "image_prompt": "cozy knitted accessories flat lay, phone and yarn, trendy aesthetic, soft shadows"
    },
    {
      "name": "techniques",
      "search_query": "knitting crochet techniques tutorials 2026",
      "image_prompt": "close-up of knitting needles and yarn texture, hands working on fabric, warm studio light"
    }
  ],
  "article": {
    "language": "ru",
    "word_count": "300-500",
    "style": "formal"
  }
}
```

---

## GitHub Actions Workflow

```yaml
name: AI Digest Pipeline

on:
  workflow_dispatch:        # ступень 5 — мануальный запуск
  schedule:
    - cron: '0 9 * * 0'   # ступень 8 — каждое воскресенье в 9:00

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run pipeline
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
          REPLICATE_API_TOKEN: ${{ secrets.REPLICATE_API_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Обработка ошибок

| Ситуация | Поведение |
|----------|-----------|
| Tavily вернул пусто | До 3 попыток с разными запросами из конфига. При неудаче — workflow завершается с ошибкой |
| Replicate упал | До 3 попыток. При неудаче — PR не создаётся, workflow завершается с ошибкой |
| Claude не нашёл незаезженную тему | PR не создаётся, причина пишется в лог |
| GitHub API ошибка | Workflow падает с ошибкой, артефакты (статья + обложка) сохраняются как GH Actions artifacts |

**Правило:** либо публикуется полноценная статья с обложкой, либо не публикуется ничего.

---

## Секреты (GitHub Actions Secrets)

| Переменная | Назначение |
|-----------|-----------|
| `ANTHROPIC_API_KEY` | Claude API |
| `TAVILY_API_KEY` | Tavily Search API |
| `REPLICATE_API_TOKEN` | Replicate (генерация обложек) |
| `GITHUB_TOKEN` | Создание PR и авто-мёрдж (встроенный в GH Actions) |

> **Требование:** авто-мёрдж должен быть включён в настройках репозитория: GitHub → Settings → General → Allow auto-merge.

---

## Верификация

1. Запустить `workflow_dispatch` вручную из GitHub Actions UI
2. Убедиться, что в репозитории появился PR с `.md`-файлом и обложкой в `src/assets/`
3. После авто-мёрджа — проверить, что Vercel задеплоил новую статью
4. Проверить, что новая тема не дублирует существующие статьи
