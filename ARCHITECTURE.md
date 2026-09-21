# Архитектура репозитория

## Выбранный контур

- **Frontend:** React 18 + TypeScript + Vite + TanStack Query.
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2, PostgreSQL 16.
- **Локальный запуск:** Docker Compose.

TypeScript компилируется в JavaScript: это совместимо с MAX Mini Apps и при
этом фиксирует границы между UI, API и MAX Bridge до runtime.

## Модули

```text
backend/app/
  api/            HTTP routes, request/response schemas and dependencies
  core/           configuration and cross-cutting infrastructure
  db/             SQLAlchemy engine, sessions and shared Base
  domain/         business entities and rules                 (Сергей)
  repositories/   persistence adapters                        (Сергей)
  services/       application use cases                       (Сергей)
  integrations/   MAX bot, webhook, storage, outbox           (Василий)
frontend/src/
  api/            typed HTTP client and TanStack Query setup  (Василий)
  bridge/         sole access point to MAX Bridge             (Василий)
  components/     reusable visual components                  (Рома)
  features/       feature screens and UI forms                (Рома)
  routing/        deep links and technical routing            (Василий)
```

## Принципы

- React-компоненты не вызывают `fetch` и `window.WebApp` напрямую.
- Frontend использует `api/` и `bridge/` как единственные технические границы.
- Domain-слой не импортирует FastAPI-маршруты и MAX-интеграции.
- Внешние ссылки используют только непрозрачные public tokens.
- `initDataUnsafe` годится лишь для клиентской навигации; backend всегда
  валидирует подписанный `initData`.
- Изменение API сначала фиксируется в OpenAPI и JSON-примере, изменение схемы
  БД согласуется с Сергеем.
