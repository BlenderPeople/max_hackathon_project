# Deploy на Beget VPS

## До запуска

1. Создайте VPS с Docker, публичным IPv4 и Ubuntu 24.04.
2. Создайте поддомен, например `max.example.ru`, и добавьте A-запись на IPv4 VPS.
3. Откройте на сервере только порты `22`, `80` и `443`.
4. Дождитесь DNS: `nslookup max.example.ru` должен вернуть IPv4 VPS.

## На сервере

```bash
git clone <URL-репозитория> /opt/max-order
cd /opt/max-order
cp .env.production.example .env
nano .env
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

В `.env` замените все `REPLACE_...`, а также `max.example.ru` на настоящий
домен. Для секретов можно выполнить `openssl rand -hex 32`.

После того как A-запись указывает на VPS, Caddy самостоятельно получает и
обновляет TLS-сертификат. Проверка:

```bash
curl -fsS https://max.example.ru/api/healthz
docker compose -f docker-compose.prod.yml logs --tail=100 web api notifications
```

## MAX

В настройках Mini App укажите `https://max.example.ru`. Webhook URL:
`https://max.example.ru/webhooks/max`; secret — значение
`MAX_WEBHOOK_SECRET` из серверного `.env`.

`postgres_data`, `order_uploads` и данные Caddy — именованные Docker volumes.
Не запускайте `docker compose down -v` на рабочем сервере: команда удаляет
базу и файлы заказов.
