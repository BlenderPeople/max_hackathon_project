# Запуск и устройство проекта

## Быстрый старт

1. Скопируйте `.env.example` в `.env` и задайте локальные значения.
2. Выполните `docker compose up --build`.
3. Откройте <http://localhost:5173> и проверьте <http://localhost:8000/api/healthz>.
4. OpenAPI доступен по <http://localhost:8000/api/docs>.

Для остановки: `docker compose down`. Для удаления только локальной базы и чистого запуска: `docker compose down -v`.

Не добавляйте `.env`, токен MAX, webhook secret или `initData` в Git и логи.

## Структура

```text
backend/app/
  api/             HTTP-слой: маршруты и схемы запросов/ответов
  core/            конфигурация и сквозная инфраструктура
  db/              engine, сессия и базовый класс SQLAlchemy
  domain/          модели и бизнес-правила (Сергей)
  repositories/    доступ к данным (Сергей)
  services/        use cases (Сергей)
  integrations/    MAX, storage, outbox (Василий)
frontend/src/
  api/             клиент API и query hooks (Василий)
  bridge/          единственная обёртка MAX Bridge (Василий)
  components/      переиспользуемые UI-компоненты (Рома)
  features/        экраны и формы (Рома)
  routing/         диплинки и технические маршруты (Василий)
```

## Границы

- Сергей владеет моделями, миграциями, permissions и API-контрактом.
- Рома владеет UI: компоненты не вызывают `fetch` напрямую.
- Василий владеет Bridge, API-client слоем, MAX-ботом, webhook, файлами и deploy.
- `initDataUnsafe` не используется как авторизация: подпись проверяет backend.
- Схему БД меняем только после согласования с Сергеем; изменения API сначала отражаем в OpenAPI/JSON-примере.

## Проверки до передачи изменений

```powershell
docker compose config
docker compose up --build
docker compose exec api python -m compileall app
docker compose exec web npm run typecheck
docker compose exec web npm run build
```

`docker compose down -v` удаляет локальный Docker volume с базой. Не выполняйте
эту команду, если нужны данные текущей разработки.
