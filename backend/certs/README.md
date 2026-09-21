# Доверенные сертификаты MAX

Эта папка содержит только публичные сертификаты цепочки Минцифры, необходимые
Linux-контейнеру для проверки TLS-соединения с `platform-api2.max.ru`.

- `russian-trusted-root-ca.crt` — Russian Trusted Root CA;
- `russian-trusted-sub-ca-2029.crt` и `russian-trusted-sub-ca-2027.crt` —
  установленные в Windows промежуточные CA.

При пересборке API-образа Dockerfile добавляет их в системный CA bundle командой
`update-ca-certificates`. Не заменяйте TLS-проверку на `verify=False`.

`MaxBotClient` явно использует этот системный bundle, а не стандартный bundle
пакета `certifi`, чтобы сертификаты действительно применялись в `httpx`.
