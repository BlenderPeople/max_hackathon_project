# MAX Заказы

MVP Mini App для заказа услуг внутри MAX. Клиент открывает услугу по
диплинку, создаёт заказ, а мастер ведёт его по этапам и отправляет
подтверждения через бота.

## Стек

- Frontend: React 18, TypeScript, Vite, TanStack Query;
- Backend: Python 3.12, FastAPI, SQLAlchemy 2;
- Database: PostgreSQL 16;
- Local development: Docker Compose;
- MAX: Bridge, Bot HTTP API, webhook и диплинки.

## Быстрый старт

```bash
cp .env.example .env
docker compose up --build
```

В PowerShell вместо `cp` используйте `Copy-Item .env.example .env`.
Первый запуск автоматически применяет миграции и создаёт демо-данные;
повторный запуск их не удаляет. По умолчанию интерфейс работает на моках и
не требует MAX-токена.

Откройте Mini App на <http://127.0.0.1:5173>, API healthcheck на
<http://127.0.0.1:8000/api/healthz>, OpenAPI на
<http://127.0.0.1:8000/api/docs>.

Для MAX-интеграции в локальном `.env` необходим `MAX_BOT_TOKEN`; файл не
попадает в Git. API-образ содержит публичную цепочку сертификатов Минцифры и
не отключает TLS-проверку.

## Документация

- [Архитектура](ARCHITECTURE.md)
- [Локальная разработка](DEVELOPMENT.md)
- [Контракт первого вертикального среза](API_CONTRACT.md)
- [Безопасность](SECURITY.md)
- [План MVP](PLAN.md)
- [Проверки перед первым push](PRE_PUSH_CHECKLIST.md)

## Статус

Технический каркас, Docker Compose, healthcheck и MAX webhook boundary готовы.
Backend содержит миграцию, MAX auth, услуги, расписание, заказы, согласования,
этапы, платежи и воспроизводимый demo seed. Frontend умеет работать через
реальный API при `VITE_API_MODE=real`; по умолчанию оставлены моки для работы
Ромы. Очередь уведомлений бота реализована, но требует проверки в реальном
MAX. Загрузка и скачивание файлов подключены к приватному локальному Docker
volume; хранение вне одного хоста и проверка на мобильном клиенте ещё нужны.
