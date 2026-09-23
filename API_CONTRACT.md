# Контракт первого вертикального среза

Реализация backend опубликована в `/api/openapi.json`. Этот файл фиксирует
согласованный транспортный формат для существующего UI; изменения синхронно
вносятся в `frontend/src/api/contracts.ts`.

## Обязательные endpoints

| Метод | Путь | Назначение |
| --- | --- | --- |
| POST | `/api/auth/max` | Валидация подписанного `initData`, короткая сессия |
| GET | `/api/me` | Пользователь и возможности |
| GET | `/api/businesses/{public_token}` | Публичный профиль мастера |
| GET | `/api/businesses/{public_token}/services` | Активные услуги мастера |
| GET | `/api/services/{public_token}` | Карточка услуги для диплинка |
| POST | `/api/orders` | Создание заказа клиентом или мастером |
| GET | `/api/orders/{public_token}` | Единая ролевая карточка заказа |
| PATCH | `/api/orders/{public_token}` | Разрешённое редактирование заказа |
| POST | `/api/orders/{public_token}/stages/{stage_token}/activate` | Смена этапа |
| GET | `/api/orders/{public_token}/events` | Timeline |
| GET | `/api/orders?filter=all\|attention\|active\|overdue\|completed` | Список заказов |
| POST | `/api/orders/{public_token}/approvals` | Запрос согласования владельцем |
| POST | `/api/approvals/{approval_token}/decision` | Решение клиента `{ "approved": true/false }` |
| POST | `/api/orders/{public_token}/payments` | Ручная оплата `{ "amount": "2000.00", "comment": "Предоплата" }` |
| POST | `/api/orders/{public_token}/complete` | Завершение после всех этапов |
| GET | `/api/services/{public_token}/availability?date=YYYY-MM-DD` | Свободные слоты |
| GET/PUT | `/api/businesses/me/schedule` | Расписание мастера |
| GET/PATCH | `/api/businesses/me` | Профиль мастера |
| POST/PATCH | `/api/services` и `/api/services/{public_token}` | Услуги мастера |
| POST | `/api/orders/{public_token}/files` | Загрузить один файл (multipart, поле `file`) |
| GET | `/api/files/{file_token}/download` | Скачать файл участнику заказа |

Все перечисленные ручки находятся под `/api`. Единственное исключение —
`POST /webhooks/max`, потому что MAX вызывает webhook без API-префикса.

## Правила данных

- В URL и клиентских ответах используем непрозрачные `public_token`, а не
  последовательные database id.
- Backend самостоятельно вычисляет `available_actions`; UI лишь показывает
  разрешённые действия.
- Пока цена ожидает решения клиента, заказ нельзя редактировать. После
  подтверждения итоговую цену нельзя изменить без нового сценария согласования.
- Изменение заказа создаёт запись timeline в той же транзакции.
- Уведомляемые события заказа записываются в `order_events` и
  `notification_outbox` в одной транзакции; отдельный worker отправляет их
  через MAX после commit.

Денежные суммы в JSON — строки в рублях с двумя знаками, например `"5000.00"`.
`OrderDetails` содержит `stages` (рабочие шаги), `timeline`, `pending_approval`,
`amount_paid`, `scheduled_start_at`, `scheduled_end_at`, `files` и
`available_actions`. Статус заказа отдельно принимает `new`, `approval`,
`in_progress`, `done`. `POST /api/orders` принимает `service_public_token`,
`description`, `due_at`, `scheduled_start_at`, `scheduled_end_at`; сервер
проверяет длительность и свободный слот под блокировкой бизнеса.

`POST /api/auth/max` принимает `{ "init_data": "..." }`, возвращает
`session_token`, `expires_at`, `user`. Остальные защищённые ручки принимают
`Authorization: Bearer <session_token>`.

Outbox/worker подключены для нового заказа, согласования, завершения этапа,
оплаты и завершения заказа. Повторные webhook пока не обрабатываются. Файлы
хранятся в приватном Docker volume; принимаются PDF, JPEG, PNG и TXT до 10 МБ.
Оба файловых endpoint требуют bearer-сессию и проверяют участие в заказе.
