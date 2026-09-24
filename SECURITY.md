# Безопасность разработки

## Локальное окружение

- PostgreSQL, FastAPI и Vite в Compose опубликованы только на `127.0.0.1`.
  Другие устройства сети не смогут подключиться к dev-сервисам.
- Vite использует актуальную исправленную версию и строгий файловый sandbox.
- `.env` игнорируется Git; токен MAX, webhook secret и `initData` не попадают
  в browser bundle, логи или тестовые fixtures.

## MAX

- API-токен передаётся сервером исключительно в заголовке `Authorization`.
- API-образ содержит публичную цепочку сертификатов Минцифры в системном CA
  bundle. TLS-проверка для MAX API не отключается.
- Production webhook должен быть опубликован через HTTPS reverse proxy; сам
  FastAPI-сервис в Compose слушает HTTP на loopback. Обработчик сверяет
  `X-Max-Bot-Api-Secret` и не пишет payload в логи.
- Точный повтор webhook определяется по SHA-256 тела и хранится без payload;
  при будущей обработке событий сохраняйте её эффект в той же транзакции,
  что и запись о доставке.

## Перед публикацией

```powershell
docker compose config
docker compose up --build
docker compose exec api python -m compileall app
docker compose exec web npm run typecheck
docker compose exec web npm run build
docker compose exec web npm audit --omit=dev
```

Production не должен использовать Vite dev-server: frontend собирается в
статические файлы и выдаётся HTTPS reverse proxy/CDN.
