# Запуск и устройство проекта

## Быстрый старт

1. Скопируйте `.env.example` в `.env` и задайте локальные значения.
2. Выполните `docker compose up --build`.
3. Примените схему и создайте демо-данные:

   ```bash
   docker compose exec api alembic upgrade head
   docker compose exec api python -m app.seed
   ```

   Seed повторяемый. Для входа под демо-мастером/клиентом укажите реальные MAX
   ID в `DEMO_MASTER_MAX_ID` и `DEMO_CUSTOMER_MAX_ID` до запуска seed.
4. Откройте <http://localhost:5173> и проверьте <http://localhost:8000/api/healthz>.
5. OpenAPI доступен по <http://localhost:8000/api/docs>.

Для подключения UI к backend установите `VITE_API_MODE=real` в `.env` и откройте
Mini App из MAX: сервер принимает только подписанный `initData`. Без этого
переключателя UI использует локальные моки.

PostgreSQL доступен сервису `api` по имени `db` внутри Docker-сети; порт БД на
хосте не публикуется, чтобы не конфликтовать с другими локальными базами.

После обновления backend примените новую миграцию:
`docker compose exec api alembic upgrade head`. Для уведомлений укажите рабочий
`MAX_BOT_TOKEN` и запустите `docker compose --profile notifications up -d notifications`.
Отправка идёт после фиксации события заказа в БД. При временной ошибке worker
повторяет попытку; после пяти неудач запись остаётся со статусом `failed` для
разбора. Как и у большинства outbox-доставок, при аварии между ответом MAX и
фиксацией `sent` возможно повторное сообщение.

Файлы заказа хранятся в Docker volume `order_uploads`, недоступном через web
сервер. При изменении Compose пересоздайте только API-контейнер командой
`docker compose up -d --build --force-recreate api`; сам volume при этом
сохраняется. `docker compose down -v` удалит файлы вместе с базой — не
используйте его для обычной перезагрузки.

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
