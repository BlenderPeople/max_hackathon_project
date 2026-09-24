# Перед первым push

## Готово

- [x] `.env`, `node_modules`, build-артефакты и Python-кэши исключены из Git.
- [x] Docker Compose поднимает PostgreSQL, API и frontend локально.
- [x] `GET /api/healthz`, backend compileall, frontend typecheck и production build проходят.
- [x] `npm audit` не находит уязвимостей.
- [x] `MAX_BOT_TOKEN` проверен через API без вывода значения в логи.
- [x] Публичные сертификаты Минцифры добавлены в API-образ; TLS-проверка MAX не отключена.

## Сделать перед добавлением файлов

1. [x] `README.md` обновлён: в нём есть цель продукта, стек, быстрый запуск и
   ссылки на основную документацию.
2. Убедиться, что в индекс не попали `.env`, реальные URL production, токен
   бота, webhook secret, `initData`, дамп БД, `node_modules` или `dist`.
3. [x] `PLAN.md` публикуется. `TASK_*.md` остаются локальной внутренней
   декомпозицией и не включаются в первый публичный commit.
4. Просмотреть публичные CA-файлы в `backend/certs/`: они должны остаться
   сертификатами, а не ключами (`.key`, `.pfx`, `.p12` в репозиторий не идут).

## Команды проверки

```powershell
git status --short
git add .
git diff --cached --check
git diff --cached -- . ':!.env'
docker compose config
docker compose exec -T api python -m compileall app
docker compose exec -T web npm run typecheck
docker compose exec -T web npm run build
docker compose exec -T web npm audit --omit=dev
```

Перед `git commit` вручную проверьте вывод `git diff --cached`: Git не должен
содержать строк `MAX_BOT_TOKEN=`, `MAX_WEBHOOK_SECRET=` с ненулевым значением,
`Authorization:`, персональные адреса и содержимое `.env`.

## Первый коммит

Рекомендуемое сообщение:

```text
chore: bootstrap MAX Mini App platform
```

В этот коммит входят каркас frontend/backend, Compose, документация, API draft,
публичные CA-сертификаты и проверки. Не добавляйте незавершённую предметную
логику Сергея или UI-моки Ромы в этот технический стартовый коммит, если они
ещё не согласованы по контракту.

## После push

- CI подготовлен как `.github/ci-template.yml`: Василию нужно перенести его
  в `.github/workflows/ci.yml` с PAT, у которого есть право `workflow`,
  затем проверить первый запуск (frontend typecheck/build, backend tests,
  `docker compose config`);
- настроить secrets только в CI/production environment, а не repository
  variables с публичным доступом;
- после HTTPS-deploy зарегистрировать URL Mini App и webhook в MAX;
- завести защищённые ветки/PR review, если это командный репозиторий.
