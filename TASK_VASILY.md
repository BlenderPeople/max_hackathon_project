# Василий — MAX-интеграция, инфраструктура и frontend integration

## Цель роли

Собрать минимальный, воспроизводимый контур, в котором Mini App можно открыть по HTTPS-ссылке, frontend обращается к API, а бот получает и отправляет события. Не проектируй доменную модель, миграции и бизнесовые REST-ручки: это зона Сергея.

## Результат первого вертикального среза (к вечеру 22 сентября)

- Mini App размещён на публичном HTTPS-домене и открывается в браузере и MAX;
- frontend получает `initData` и `start_param` через MAX Bridge и передаёт `initData` в `POST /api/auth/max`;
- диплинк `https://max.ru/t216_hakaton_bot?startapp=service_<token>` приводит на маршрут услуги; аналогично работает `order_<token>`;
- `POST /webhooks/max` проверяет секрет, не создаёт дублей при повторной доставке и быстро отвечает `200`;
- бот отправляет тестовое сообщение с inline-кнопкой `open_app`;
- команда запускает проект одной командой и имеет `.env.example` без секретов.

## Что создать в начале

Создай каркас, не ожидая готовности Сергея и Ромы:

```text
frontend/                 # React + TypeScript + Vite
  src/
    bridge/               # безопасная обёртка над window.WebApp
    api/                  # typed client, QueryClient, hooks, mock/real switch
    routing/              # чтение start_param и техническая маршрутизация
backend/
  app/
    integrations/max/     # MaxBotClient, webhook, схемы событий
    core/                 # settings, logging, healthcheck
    workers/              # notification outbox worker
    files/                # storage adapter; без доменных моделей
infra/                    # reverse proxy / deploy-конфигурация при необходимости
docker-compose.yml
.env.example
README.md
```

### Первые коммиты

1. `chore: bootstrap frontend backend and local compose` — каталог, запуск, healthcheck, lint/build-заготовки, `.gitignore`, `.env.example`.
2. `feat: add MAX Bridge bootstrap and deep-link routing` — только чтение параметров и безопасный fallback вне MAX.
3. `feat: add MAX bot client and verified webhook endpoint` — HTTP-клиент, секрет webhook, idempotency-key/event-id хранилище или временный адаптер.
4. `ci: validate lint test and frontend build` — самый простой pipeline.

Не храни `MAX_BOT_TOKEN`, webhook secret, URL хранилища и пароли БД в Git или frontend-переменных. Для токена используем только локальный `.env`; в логи токены и `initData` не попадают.

## Контракты, которые нужно согласовать до реализации

С Сергеем в первый час зафиксируй JSON-примеры для:

- `POST /api/auth/max`: вход — подписанный `initData`; выход — короткая сессия и текущий пользователь;
- `GET /api/me`, `GET /api/services/{public_token}`, `POST /api/orders`, `GET /api/orders/{public_token}`;
- транзакционного события «заказ создан» и события смены этапа: получатель, тип, `order_id`, `public_token`, текст, URL;
- загрузки файлов: допустимые MIME/размер, ответ создания, способ скачивания.

С Ромой до подключения экранов согласуй:

- единые TS-типы, статус загрузки/ошибки и query keys;
- маршруты `/services/:token`, `/orders/:token`, `/orders`, `/services`, `/profile`;
- fallback в браузере: demo `start_param` только через явный dev-параметр, не как авторизация;
- поведение back button, внешних ссылок и download на MAX.

## План по дням

### Сейчас / 20 сентября

- Создай каркас и проверь локальный запуск frontend, backend и БД/заглушки через Compose.
- Добавь `GET /healthz`, структурированные логи и конфигурацию через Pydantic Settings.
- Положи выданный токен только в локальный `.env`; выполни `GET https://platform-api2.max.ru/me` и запиши в командный чат лишь `bot_id` и username, не токен.
- Подготовь HTTPS-домен и временную страницу Mini App. URL отправляется организаторам после первого стабильного деплоя.
- Создай в README точные команды: install, run, migration (выполняет Сергей), build, deploy и smoke-test.

### 21–22 сентября

- Реализуй Bridge bootstrap, auth bootstrap и распознавание `service_`/`order_` в `start_param`.
- Реализуй `MaxBotClient` поверх документированного HTTP API, с таймаутами и безопасными логами.
- Сделай webhook: проверка `X-Max-Bot-Api-Secret`, дедупликация по event/update id, быстрый `200`, тяжёлая отправка — через outbox/worker.
- Добавь генератор диплинков и кнопку `open_app` в тестовом уведомлении.
- Сделай первый HTTPS deploy и smoke-test: Mini App → auth → service/order URL → webhook → сообщение бота.

### 23–27 сентября

- Подключай экраны Ромы к стабильному API Сергея через typed client и TanStack Query; не меняй контракт молча.
- Добавь outbox для уведомлений о создании заказа, approval и смене этапа.
- Реализуй storage adapter, загрузку/скачивание файлов и проверку на MAX-клиентах.
- Поддержи переключатель mock/real API только для разработки; production всегда использует real API.
- Проведи mobile/web smoke-test, подготовь demo seed и запасной сценарий показа.

## Правила границ

- Новые таблицы, поля доменных сущностей, permissions и миграции — только после согласования с Сергеем.
- Если изменение API влияет на экран, сначала обновляется OpenAPI/JSON-пример, затем предупреждается Рома.
- Не блокируй команду на реальном MAX: у Bridge, бота и storage должны быть явные адаптеры и локальные тестовые реализации.
- Инфраструктура намеренно простая: один environment и один путь деплоя; без Kubernetes и нескольких облаков.

## Чек-лист перед передачей

- [ ] `docker compose up` поднимает нужный локальный контур.
- [ ] `.env.example` полный, но без секретов.
- [ ] `GET /healthz` работает после deploy.
- [ ] webhook отклоняет неверный secret и не дублирует повторное событие.
- [ ] диплинки услуги и заказа открывают верный экран.
- [ ] тестовая кнопка бота открывает Mini App.
- [ ] README содержит команды запуска и smoke-test.
