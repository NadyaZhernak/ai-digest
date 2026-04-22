#!/bin/bash
# Stop-хук: валидация статьи перед завершением.
# Проверяет наличие заголовка, описания, обложки и ссылки на источник.
# Exit 0 = разрешить завершение. Exit 2 = продолжить работу.

# Защита от бесконечного цикла: stop_hook_active.
# При повторном вызове (Claude уже пытался завершить и был заблокирован) — разрешаем.
ACTIVE=$(jq -r '.stop_hook_active' 2>/dev/null)
if [ "$ACTIVE" = "true" ]; then
  exit 0
fi

# Ищем последний изменённый markdown-файл в content/
# (адаптируйте путь под структуру вашего проекта)
ARTICLE=$(find content/ -name "*.md" -newer .git/index 2>/dev/null | head -1)

# Если статьи нет — это не цикл публикации, разрешаем завершение
if [ -z "$ARTICLE" ]; then
  exit 0
fi

ERRORS=""

# Проверка: заголовок (строка "title:" в frontmatter)
if ! grep -q "^title:" "$ARTICLE" 2>/dev/null; then
  ERRORS="${ERRORS}Missing title. "
fi

# Проверка: описание (строка "description:" в frontmatter)
if ! grep -q "^description:" "$ARTICLE" 2>/dev/null; then
  ERRORS="${ERRORS}Missing description. "
fi

# Проверка: обложка (строка "cover:" или "image:" в frontmatter)
if ! grep -qE "^(cover|image):" "$ARTICLE" 2>/dev/null; then
  ERRORS="${ERRORS}Missing cover image. "
fi

# Проверка: ссылка на источник (строка "source:" в frontmatter или URL в тексте)
if ! grep -qE "(^source:|https?://)" "$ARTICLE" 2>/dev/null; then
  ERRORS="${ERRORS}Missing source link. "
fi

# Если есть ошибки — блокируем завершение
if [ -n "$ERRORS" ]; then
  echo "Article validation failed: ${ERRORS}" >&2
  echo "File: $ARTICLE" >&2
  exit 2
fi

exit 0