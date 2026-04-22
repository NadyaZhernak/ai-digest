#!/bin/bash
# Блокировка опасных команд в Claude Code.
# Хук PreToolUse: получает JSON на stdin, проверяет команду.
# Exit 0 = разрешить. Exit 2 = заблокировать.

# Читаем команду из JSON на stdin
CMD=$(jq -r '.tool_input.command' 2>/dev/null)

# Если jq не смог прочитать — пропускаем
if [ -z "$CMD" ] || [ "$CMD" = "null" ]; then
    exit 0
fi

# Список опасных паттернов
for PATTERN in "rm -rf" "sudo" "chmod 777" \
    "drop table" "git push --force" \
    "git reset --hard"; do
    if echo "$CMD" | grep -qi "$PATTERN"; then
        echo "Blocked: $PATTERN" >&2
        exit 2
    fi
done

exit 0