import pptxgen from 'pptxgenjs';
import fs from 'fs';
import path from 'path';

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Команда MAX Заказы';
pptx.company = 'MAX Заказы';
pptx.subject = 'Презентация решения для хакатона MAX';
pptx.title = 'MAX Заказы — MVP Mini App';
pptx.lang = 'ru-RU';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'ru-RU',
};
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'CUSTOM_WIDE';

const C = {
  navy: '101B3D', blue: '1677FF', cyan: '65D4FF', white: 'FFFFFF',
  ink: '17233E', muted: '63708A', pale: 'EEF5FF', pale2: 'F6F8FC',
  line: 'D7E1F1', green: '137A5B', amber: 'B86A00', amberPale: 'FFF4D9', red: 'B33443',
};
const W = 13.333, H = 7.5;
const outDir = path.resolve('output');
fs.mkdirSync(outDir, { recursive: true });

function addSlide({ dark = false, eyebrow, title, subtitle, note }) {
  const slide = pptx.addSlide();
  slide.background = { color: dark ? C.navy : C.white };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.14, fill: { color: C.blue }, line: { color: C.blue } });
  slide.addText(eyebrow.toUpperCase(), { x: 0.62, y: 0.40, w: 9.9, h: 0.22, fontFace: 'Aptos', fontSize: 8.5, bold: true, charSpacing: 1.4, color: dark ? C.cyan : C.blue, margin: 0 });
  slide.addText(title, { x: 0.62, y: 0.72, w: 11.85, h: 0.58, fontFace: 'Aptos Display', fontSize: 25, bold: true, color: dark ? C.white : C.ink, breakLine: false, margin: 0, fit: 'shrink' });
  if (subtitle) slide.addText(subtitle, { x: 0.62, y: 1.37, w: 11.7, h: 0.48, fontSize: 11.5, color: dark ? 'D4DEEF' : C.muted, margin: 0, breakLine: false, fit: 'shrink' });
  slide.addShape(pptx.ShapeType.line, { x: 0.62, y: 7.02, w: 12.08, h: 0, line: { color: dark ? '38517E' : C.line, width: 0.7 } });
  slide.addText('MAX Заказы · Хакатон MAX', { x: 0.62, y: 7.14, w: 4, h: 0.16, fontSize: 7.3, color: dark ? 'B7C6E2' : C.muted, margin: 0 });
  slide.addText(String(pptx._slides.length).padStart(2, '0'), { x: 12.02, y: 7.10, w: 0.66, h: 0.18, fontSize: 8, color: dark ? 'B7C6E2' : C.muted, align: 'right', margin: 0 });
  if (note) slide.addNotes(note);
  return slide;
}

function label(slide, text, x, y, w, color = C.blue) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.3, rectRadius: 0.06, fill: { color }, line: { color } });
  slide.addText(text, { x: x + 0.1, y: y + 0.075, w: w - 0.2, h: 0.12, fontSize: 7.4, bold: true, color: C.white, align: 'center', margin: 0, fit: 'shrink' });
}

function card(slide, { x, y, w, h, title, body, accent = C.blue, dark = false }) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.07, fill: { color: dark ? '1B2A52' : C.pale2 }, line: { color: dark ? '365381' : C.line, width: 0.8 } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.07, h, fill: { color: accent }, line: { color: accent } });
  slide.addText(title, { x: x + 0.22, y: y + 0.19, w: w - 0.38, h: 0.28, fontSize: 12.5, bold: true, color: dark ? C.white : C.ink, margin: 0, fit: 'shrink' });
  slide.addText(body, { x: x + 0.22, y: y + 0.58, w: w - 0.38, h: h - 0.73, fontSize: 9.6, color: dark ? 'D4DEEF' : C.muted, breakLine: false, margin: 0.01, valign: 'top', fit: 'shrink' });
}

function bulletList(slide, items, x, y, w, size = 12, color = C.ink, bulletColor = C.blue, gap = 0.48) {
  items.forEach((item, i) => {
    const yy = y + i * gap;
    slide.addShape(pptx.ShapeType.ellipse, { x, y: yy + 0.13, w: 0.1, h: 0.1, fill: { color: bulletColor }, line: { color: bulletColor } });
    slide.addText(item, { x: x + 0.2, y: yy, w: w - 0.2, h: 0.34, fontSize: size, color, margin: 0, breakLine: false, fit: 'shrink' });
  });
}

// 01 — technical verification
{
  const s = addSlide({ dark: true, eyebrow: 'Служебный слайд · техническая проверка', title: 'MAX Заказы — данные для запуска и проверки', subtitle: 'MVP Mini App для заказа услуг и ведения заказа в MAX', note: 'Источники: репозиторий проекта; API: https://max-order.site/api/openapi.json. Внешние секреты не добавляются в слайды и передаются проверяющим через защищённый канал.' });
  s.addText('Ссылки', { x: 0.66, y: 2.00, w: 2, h: 0.27, fontSize: 12.5, bold: true, color: C.cyan, margin: 0 });
  const links = [
    ['Mini App', 'https://max-order.site'],
    ['API / health', 'https://max-order.site/api/healthz'],
    ['OpenAPI 3.1', 'https://max-order.site/api/openapi.json'],
    ['Git', 'github.com/BlenderPeople/max_hackathon_project'],
  ];
  links.forEach(([a, b], i) => {
    const yy = 2.42 + i * 0.60;
    s.addText(a, { x: 0.66, y: yy, w: 1.62, h: 0.22, fontSize: 10, bold: true, color: C.white, margin: 0 });
    s.addText(b, { x: 2.30, y: yy, w: 4.15, h: 0.24, fontSize: 9.6, color: 'C9D9F5', margin: 0, fit: 'shrink' });
  });
  s.addText('Перед сдачей — заполнить фактические данные', { x: 7.02, y: 2.00, w: 5.3, h: 0.27, fontSize: 12.5, bold: true, color: 'FFD36A', margin: 0 });
  card(s, { x: 7.02, y: 2.35, w: 5.62, h: 1.44, title: 'Бот и commit hash', body: '1) Вставить ссылку на НОВОГО бота, созданного организаторами.\n2) Выполнить git rev-parse HEAD на VPS и вставить полный SHA развернутого commit.', accent: 'FFD36A', dark: true });
  card(s, { x: 7.02, y: 3.95, w: 5.62, h: 1.36, title: 'Доступ и секреты', body: 'Вход — через аккаунт MAX и подписанный initData, отдельного пароля нет. MAX_BOT_TOKEN, webhook secret и пароль БД — только защищённым каналом проверяющим.', accent: C.cyan, dark: true });
  s.addText('Основной сценарий', { x: 0.66, y: 5.20, w: 2.2, h: 0.25, fontSize: 11.3, bold: true, color: C.cyan, margin: 0 });
  s.addText('Открыть бота → открыть Mini App → выбрать услугу и слот → создать заказ → мастер ведёт этапы / согласования → уведомление в MAX', { x: 0.66, y: 5.52, w: 11.95, h: 0.45, fontSize: 11.4, color: C.white, margin: 0, fit: 'shrink' });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.66, y: 6.14, w: 11.98, h: 0.48, rectRadius: 0.06, fill: { color: '24365E' }, line: { color: '49628E', width: 0.5 } });
  s.addText('Статус на момент подготовки: URL отправлен организаторам; привязку Mini App к новому боту необходимо подтвердить перед демонстрацией.', { x: 0.88, y: 6.28, w: 11.5, h: 0.16, fontSize: 8.8, color: 'FFE1A5', margin: 0, align: 'center' });
}

// 02 — cover/team
{
  const s = addSlide({ eyebrow: '02 · решение и команда', title: 'MAX Заказы', subtitle: 'Mini App, который превращает переписку об услуге в прозрачный заказ', note: 'Источник: PLAN.md, ARCHITECTURE.md в репозитории.' });
  s.addShape(pptx.ShapeType.arc, { x: 8.76, y: 1.98, w: 3.1, h: 3.1, adjustPoint: 0.22, line: { color: C.blue, width: 4, transparency: 18 }, adjustPoint: 0.2 });
  s.addShape(pptx.ShapeType.ellipse, { x: 9.6, y: 2.84, w: 1.4, h: 1.4, fill: { color: C.pale }, line: { color: C.blue, width: 1.2 } });
  s.addText('заказ\nв MAX', { x: 9.82, y: 3.12, w: 0.96, h: 0.6, fontSize: 13, bold: true, color: C.blue, align: 'center', margin: 0 });
  s.addText('Один контур для клиента и мастера:\nуслуга, запись, статусы, согласования, файлы и уведомления.', { x: 0.66, y: 2.22, w: 6.95, h: 0.84, fontSize: 19, bold: true, color: C.ink, margin: 0, fit: 'shrink' });
  const people = [
    ['Василий', 'MAX-интеграция, DevOps, frontend integration'],
    ['Рома', 'UI и продуктовый frontend'],
    ['Сергей', 'backend, доменная модель и API'],
  ];
  people.forEach(([n, r], i) => card(s, { x: 0.66 + i * 3.94, y: 4.42, w: 3.62, h: 1.35, title: n, body: r, accent: [C.blue, '6B5CFF', C.green][i] }));
  label(s, 'MVP · заказ услуг', 0.66, 6.18, 1.92);
  s.addText('Хакатон по разработке чат-ботов и Mini Apps для MAX', { x: 2.82, y: 6.22, w: 6.5, h: 0.16, fontSize: 9.2, color: C.muted, margin: 0 });
}

// 03 — executive summary
{
  const s = addSlide({ eyebrow: '03 · executive summary', title: 'Не новый чат — управляемый жизненный цикл заказа', subtitle: 'Сервисная коммуникация остается в MAX, а работа с заказом получает структуру.', note: 'Источник: README.md, API_CONTRACT.md в репозитории.' });
  card(s, { x: 0.66, y: 2.12, w: 3.72, h: 2.38, title: 'Для клиента', body: 'Выбрать услугу, увидеть свободные слоты, оставить описание, проверить цену и статус — без перехода в другой сервис.', accent: C.blue });
  card(s, { x: 4.80, y: 2.12, w: 3.72, h: 2.38, title: 'Для мастера', body: 'Вести расписание и услуги; разбивать заказ на этапы; фиксировать изменения, оплату и запросы на согласование.', accent: '6B5CFF' });
  card(s, { x: 8.94, y: 2.12, w: 3.72, h: 2.38, title: 'Для проверки', body: 'Публичный HTTPS Mini App, FastAPI, OpenAPI, контейнерный запуск и воспроизводимый основный сценарий.', accent: C.green });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.66, y: 5.14, w: 12, h: 0.90, rectRadius: 0.07, fill: { color: C.pale }, line: { color: 'C7DCFA', width: 0.8 } });
  s.addText('Ценность MVP', { x: 0.95, y: 5.39, w: 1.46, h: 0.18, fontSize: 10.5, bold: true, color: C.blue, margin: 0 });
  s.addText('меньше ручной координации в чате, больше прозрачности по заказу — от заявки до завершения', { x: 2.50, y: 5.34, w: 9.82, h: 0.30, fontSize: 16, bold: true, color: C.ink, margin: 0, fit: 'shrink' });
}

// 04 — problem/audience
{
  const s = addSlide({ eyebrow: '04 · аудитория и проблема', title: 'Заказ услуги в чате легко теряет контекст', subtitle: 'Первая целевая аудитория — частные мастера и небольшие сервисные команды, которые уже общаются с клиентами в MAX.', note: 'Гипотеза ЦА сформирована командой для MVP. Пользовательские метрики будут измеряться в пилоте.' });
  s.addText('Как сейчас', { x: 0.66, y: 2.02, w: 1.4, h: 0.25, fontSize: 12, bold: true, color: C.muted, margin: 0 });
  bulletList(s, ['Детали заказа смешиваются с обычной перепиской', 'Слот, цена и актуальный статус подтверждаются вручную', 'Правки и файлы трудно собрать в единую историю'], 0.70, 2.42, 5.38, 13.2, C.ink, C.red, 0.74);
  s.addShape(pptx.ShapeType.line, { x: 6.63, y: 2.04, w: 0, h: 3.5, line: { color: C.line, width: 1 } });
  s.addText('Что меняется с MAX Заказы', { x: 7.07, y: 2.02, w: 4, h: 0.25, fontSize: 12, bold: true, color: C.blue, margin: 0 });
  bulletList(s, ['Услуга и свободное время доступны в Mini App', 'Заказ имеет этапы, timeline и role-based actions', 'Согласование стоимости и уведомления становятся событием заказа'], 7.10, 2.42, 5.42, 13.2, C.ink, C.green, 0.74);
  s.addText('Граница MVP', { x: 0.66, y: 5.95, w: 1.4, h: 0.2, fontSize: 9.4, bold: true, color: C.amber, margin: 0 });
  s.addText('Не маркетплейс и не платежный провайдер: решение организует заказ в существующей коммуникации мастера и клиента.', { x: 2.06, y: 5.92, w: 10.2, h: 0.26, fontSize: 10.5, color: C.muted, margin: 0, fit: 'shrink' });
}

// 05 — scenario
{
  const s = addSlide({ eyebrow: '05 · основной пользовательский сценарий', title: 'От услуги до завершенного заказа — в одном потоке', subtitle: 'Сценарий проверяется двумя MAX-аккаунтами: клиентом и мастером.', note: 'Источник: API_CONTRACT.md, backend/app/api/routes/*.py. Доступ к роли определяется сервером после валидации MAX initData.' });
  const steps = [
    ['01', 'Открыть', 'Пользователь запускает бота и открывает Mini App'],
    ['02', 'Выбрать', 'Клиент переходит по услуге, выбирает дату и свободный слот'],
    ['03', 'Создать', 'Сервис фиксирует заказ, описание и запланированное время'],
    ['04', 'Вести', 'Мастер управляет этапами, ценой, файлами и согласованиями'],
    ['05', 'Закрыть', 'Клиент видит историю; обе стороны получают события в MAX'],
  ];
  steps.forEach(([num, title, body], i) => {
    const x = 0.62 + i * 2.52;
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.64, y: 2.22, w: 0.72, h: 0.72, fill: { color: i === 2 ? C.blue : C.pale }, line: { color: i === 2 ? C.blue : C.line, width: 1 } });
    s.addText(num, { x: x + 0.64, y: 2.46, w: 0.72, h: 0.14, fontSize: 9, bold: true, color: i === 2 ? C.white : C.blue, align: 'center', margin: 0 });
    if (i < steps.length - 1) s.addShape(pptx.ShapeType.line, { x: x + 1.40, y: 2.58, w: 1.15, h: 0, line: { color: C.line, width: 1.1, endArrowType: 'triangle' } });
    s.addText(title, { x, y: 3.30, w: 2.0, h: 0.28, fontSize: 13, bold: true, color: C.ink, align: 'center', margin: 0 });
    s.addText(body, { x, y: 3.75, w: 2.0, h: 1.05, fontSize: 9.5, color: C.muted, align: 'center', margin: 0.01, fit: 'shrink' });
  });
  s.addShape(pptx.ShapeType.roundRect, { x: 1.17, y: 5.55, w: 10.95, h: 0.60, rectRadius: 0.06, fill: { color: C.pale }, line: { color: 'C7DCFA', width: 0.6 } });
  s.addText('Результат сценария: заказ не исчезает в чате — у него есть ответственный, текущий этап, следующее действие и история.', { x: 1.40, y: 5.75, w: 10.5, h: 0.18, fontSize: 11.2, bold: true, color: C.ink, align: 'center', margin: 0 });
}

// 06 — metrics
{
  const s = addSlide({ eyebrow: '06 · ожидаемый эффект', title: 'Эффект — гипотеза пилота, а не заявленный факт', subtitle: 'Мы измеряем, делает ли структурированный заказ коммуникацию быстрее и понятнее.', note: 'Все показатели на слайде — план метрик пилота, не результаты исследования.' });
  const metrics = [
    ['Конверсия', 'запуск Mini App → созданный заказ', 'Показывает, понятен ли путь от услуги к заявке'],
    ['Скорость', 'время до подтверждения слота', 'Показывает, сократили ли ручную координацию'],
    ['Прозрачность', 'доля заказов с заполненным статусом / этапом', 'Показывает, используется ли контур ведения заказа'],
    ['Качество', 'доля согласований, закрытых без повторного запроса', 'Проверяет, достаточно ли информации в заказе'],
  ];
  metrics.forEach(([a, b, c], i) => card(s, { x: 0.66 + (i % 2) * 6.03, y: 2.08 + Math.floor(i / 2) * 1.82, w: 5.62, h: 1.40, title: a, body: `${b}\n${c}`, accent: [C.blue, '6B5CFF', C.green, C.amber][i] }));
  s.addText('Пилотный контур', { x: 0.66, y: 5.96, w: 1.6, h: 0.2, fontSize: 9.4, bold: true, color: C.blue, margin: 0 });
  s.addText('3–5 мастеров · реальные услуги · две роли MAX · журнал событий API и обратная связь после завершения заказа', { x: 2.22, y: 5.93, w: 9.95, h: 0.27, fontSize: 10.5, color: C.muted, margin: 0, fit: 'shrink' });
}

// 07 — architecture
{
  const s = addSlide({ eyebrow: '07 · архитектура', title: 'Чистые границы: MAX, интерфейс, домен и доставка событий', subtitle: 'Интеграции изолированы, а бизнес-правила не зависят от UI или транспорта.', note: 'Источник: ARCHITECTURE.md; OpenAPI: https://max-order.site/api/openapi.json.' });
  const boxes = [
    { x: 0.66, title: 'MAX', body: 'Bot\nMini App\nBridge / initData', color: C.blue },
    { x: 3.23, title: 'React + TS', body: 'features\napi client\nbridge adapter', color: '6B5CFF' },
    { x: 5.80, title: 'FastAPI', body: 'routes / schemas\nservices / domain\nMAX webhook', color: C.green },
    { x: 8.37, title: 'PostgreSQL', body: 'users / services\norders / events\noutbox', color: C.amber },
    { x: 10.94, title: 'Worker', body: 'outbox\nMAX notifications\nretry after commit', color: C.blue },
  ];
  boxes.forEach((b, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: b.x, y: 2.45, w: 1.78, h: 2.06, rectRadius: 0.07, fill: { color: C.pale2 }, line: { color: C.line, width: 0.8 } });
    s.addShape(pptx.ShapeType.rect, { x: b.x, y: 2.45, w: 1.78, h: 0.1, fill: { color: b.color }, line: { color: b.color } });
    s.addText(b.title, { x: b.x + 0.16, y: 2.82, w: 1.46, h: 0.3, fontSize: 12, bold: true, color: C.ink, align: 'center', margin: 0, fit: 'shrink' });
    s.addText(b.body, { x: b.x + 0.13, y: 3.35, w: 1.52, h: 0.72, fontSize: 9.2, color: C.muted, align: 'center', margin: 0, fit: 'shrink' });
    if (i < boxes.length - 1) s.addShape(pptx.ShapeType.line, { x: b.x + 1.82, y: 3.48, w: 0.57, h: 0, line: { color: C.line, width: 1.2, endArrowType: 'triangle' } });
  });
  s.addShape(pptx.ShapeType.roundRect, { x: 1.55, y: 5.46, w: 10.20, h: 0.62, rectRadius: 0.06, fill: { color: C.navy }, line: { color: C.navy } });
  s.addText('Деплой: Docker Compose production + Caddy HTTPS · API-договор: OpenAPI 3.1 · данные: PostgreSQL + миграции Alembic', { x: 1.84, y: 5.68, w: 9.60, h: 0.18, fontSize: 10.4, color: C.white, align: 'center', margin: 0, fit: 'shrink' });
}

// 08 — data/security
{
  const s = addSlide({ eyebrow: '08 · данные и интеграции', title: 'Авторизация MAX — без отдельного пароля', subtitle: 'Backend проверяет подписанный initData; интерфейс получает только короткую сессию.', note: 'Источники: MAX Mini Apps validation documentation: https://dev.max.ru/docs/webapps/validation ; SECURITY.md в репозитории.' });
  card(s, { x: 0.66, y: 2.08, w: 3.72, h: 2.48, title: 'Идентификация', body: 'MAX initData → серверная HMAC-проверка → session token с TTL. initDataUnsafe не используется как источник доверия.', accent: C.blue });
  card(s, { x: 4.80, y: 2.08, w: 3.72, h: 2.48, title: 'Данные заказа', body: 'Публичные opaque tokens в URL. Статусы, этапы, согласования, платежи и timeline хранятся в PostgreSQL.', accent: C.green });
  card(s, { x: 8.94, y: 2.08, w: 3.72, h: 2.48, title: 'События и файлы', body: 'Outbox записывается в одной транзакции с заказом; worker отправляет уведомление после commit. Файлы — private volume MVP.', accent: '6B5CFF' });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.66, y: 5.25, w: 12, h: 0.74, rectRadius: 0.07, fill: { color: C.amberPale }, line: { color: 'F4D68E', width: 0.7 } });
  s.addText('Не публикуем в презентации или Git', { x: 0.95, y: 5.51, w: 2.65, h: 0.16, fontSize: 10.1, bold: true, color: C.amber, margin: 0 });
  s.addText('MAX_BOT_TOKEN · webhook secret · пароли БД · bearer-сессии. Для проверки — передача организаторам защищённым способом.', { x: 3.50, y: 5.48, w: 8.72, h: 0.20, fontSize: 9.5, color: C.ink, margin: 0, fit: 'shrink' });
}

// 09 — scale
{
  const s = addSlide({ eyebrow: '09 · масштабирование', title: 'MVP уже разделён на точки роста', subtitle: 'Мы не усложняем первый релиз, но фиксируем заменяемые границы заранее.', note: 'Источник: ARCHITECTURE.md, PLAN.md. Архитектурные направления — план развития, а не реализованные функции.' });
  const rows = [
    ['Хранение файлов', 'Private Docker volume', 'S3-совместимое объектное хранилище'],
    ['Уведомления', 'Outbox worker в Compose', 'Отдельный воркер / очередь / мониторинг ретраев'],
    ['Бизнесы', 'Один владелец и каталог услуг', 'Команды, филиалы, роли и тарифы'],
    ['Вертикали', 'Услуги с записью по слотам', 'Ремонт, beauty, консультации, выездные работы'],
  ];
  s.addText('Сейчас', { x: 3.22, y: 1.98, w: 1.0, h: 0.18, fontSize: 9.3, bold: true, color: C.muted, align: 'center', margin: 0 });
  s.addText('Следующий шаг', { x: 8.30, y: 1.98, w: 1.5, h: 0.18, fontSize: 9.3, bold: true, color: C.blue, align: 'center', margin: 0 });
  rows.forEach(([a, b, c], i) => {
    const y = 2.38 + i * 0.92;
    s.addText(a, { x: 0.72, y: y + 0.22, w: 2.15, h: 0.18, fontSize: 10.4, bold: true, color: C.ink, margin: 0, fit: 'shrink' });
    s.addShape(pptx.ShapeType.roundRect, { x: 3.08, y, w: 3.45, h: 0.58, rectRadius: 0.05, fill: { color: C.pale2 }, line: { color: C.line, width: 0.7 } });
    s.addText(b, { x: 3.25, y: y + 0.19, w: 3.10, h: 0.16, fontSize: 9.2, color: C.muted, align: 'center', margin: 0, fit: 'shrink' });
    s.addShape(pptx.ShapeType.line, { x: 6.72, y: y + 0.29, w: 1.05, h: 0, line: { color: C.blue, width: 1.2, endArrowType: 'triangle' } });
    s.addShape(pptx.ShapeType.roundRect, { x: 7.95, y, w: 4.7, h: 0.58, rectRadius: 0.05, fill: { color: C.pale }, line: { color: 'BFD8FC', width: 0.7 } });
    s.addText(c, { x: 8.12, y: y + 0.19, w: 4.35, h: 0.16, fontSize: 9.2, color: C.ink, align: 'center', margin: 0, fit: 'shrink' });
  });
}

// 10 — risk
{
  const s = addSlide({ eyebrow: '10 · ограничения и риски', title: 'Риски не скрываем — у каждого есть следующий шаг', subtitle: 'Состояние и допущения отделены от функциональности, которая уже есть в коде.', note: 'Источники: README.md, SECURITY.md, DEPLOY_BEGET.md. Статус привязки Mini App необходимо подтвердить на момент защиты.' });
  const risks = [
    ['Привязка Mini App', 'Новый бот должен быть связан с ранее отправленным HTTPS URL', 'Подтвердить у организаторов / в настройках, затем пройти /start и открыть Mini App', C.amber],
    ['Реальная доставка', 'MAX webhook и уведомления требуют прогона на боевом боте', 'Прогнать два MAX-аккаунта и проверить логи api + notifications', C.blue],
    ['MVP-хранилище', 'Файлы живут на одном VPS', 'Для пилота — backup; для роста — S3-совместимое хранилище', '6B5CFF'],
    ['Проверка API', 'Нужны воспроизводимые тестовые данные и manifest оценщика', 'Подготовить DATA-API.yaml по точной схеме организаторов и отдельный набор данных', C.green],
  ];
  risks.forEach(([a, b, c, accent], i) => {
    const x = 0.66 + (i % 2) * 6.03, y = 2.10 + Math.floor(i / 2) * 1.85;
    card(s, { x, y, w: 5.64, h: 1.43, title: a, body: `${b}\n→ ${c}`, accent });
  });
}

// 11 — API delivery package
{
  const s = addSlide({ eyebrow: '11 · собственный API', title: 'Пакет для технической проверки API', subtitle: 'То, что должно лежать рядом с презентацией и быть доступно в период проверки.', note: 'Источник требований: текст задания, предоставленный организаторами. API-контракт: https://max-order.site/api/openapi.json.' });
  const items = [
    ['HTTPS API', 'https://max-order.site/api\nhealth: /healthz'],
    ['OpenAPI 3.1', '/api/openapi.json\nинтерактивно: /api/docs'],
    ['Учетные записи', 'Две роли через два MAX-аккаунта:\nклиент и мастер; отдельного пароля нет'],
    ['Тестовые данные', 'Отдельный JSON/CSV: мастер, услуга, свободный слот, заказ; не production-персональные данные'],
    ['DATA-API.yaml', 'Добавить по точной schema version организаторов: base URL, проверки, роли, запросы, статусы и обязательные поля'],
    ['Обязательный прогон', 'GET healthz → авторизация в Mini App → POST order → смена этапа / событие → проверка уведомления'],
  ];
  items.forEach(([a, b], i) => card(s, { x: 0.66 + (i % 3) * 4.08, y: 2.06 + Math.floor(i / 3) * 1.95, w: 3.72, h: 1.50, title: a, body: b, accent: [C.blue, '6B5CFF', C.green, C.amber, C.red, C.blue][i] }));
  s.addShape(pptx.ShapeType.roundRect, { x: 0.66, y: 6.17, w: 12.0, h: 0.44, rectRadius: 0.05, fill: { color: C.amberPale }, line: { color: 'F4D68E', width: 0.6 } });
  s.addText('Важно: schema version DATA-API.yaml в требованиях не приведена — перед сдачей взять точный шаблон у организаторов, а не угадывать формат.', { x: 0.92, y: 6.31, w: 11.5, h: 0.15, fontSize: 8.7, color: C.amber, align: 'center', margin: 0, fit: 'shrink' });
}

// 12 — source/finish
{
  const s = addSlide({ dark: true, eyebrow: '12 · источники и готовность к защите', title: 'Что показать на демонстрации', subtitle: 'Короткая защита строится на одном реальном сценарии, а не на обещаниях.', note: 'Источники: https://dev.max.ru/docs/webapps/bridge ; https://dev.max.ru/docs/webapps/validation ; https://github.com/BlenderPeople/max_hackathon_project ; локальные документы README.md, API_CONTRACT.md, ARCHITECTURE.md, SECURITY.md.' });
  s.addText('Демонстрация · 3–4 минуты', { x: 0.66, y: 2.00, w: 3.8, h: 0.27, fontSize: 12.5, bold: true, color: C.cyan, margin: 0 });
  const demo = [
    '1. Открыть бота, показать кнопку запуска Mini App',
    '2. Открыть услугу, выбрать свободный слот, создать заказ',
    '3. Со второго MAX-аккаунта показать ведение этапа или согласование',
    '4. Открыть карточку заказа, timeline и событие/уведомление',
  ];
  bulletList(s, demo, 0.66, 2.43, 6.05, 11.5, C.white, C.cyan, 0.62);
  s.addShape(pptx.ShapeType.roundRect, { x: 7.35, y: 2.05, w: 5.29, h: 2.84, rectRadius: 0.08, fill: { color: '1B2A52' }, line: { color: '365381', width: 0.8 } });
  s.addText('Перед отправкой презентации', { x: 7.66, y: 2.42, w: 4.7, h: 0.24, fontSize: 12.4, bold: true, color: 'FFD36A', margin: 0 });
  bulletList(s, ['Указать актуальную ссылку нового бота', 'Заменить SHA на commit, реально развернутый на VPS', 'Проверить URL API извне и прикрепить DATA-API.yaml', 'Передать секреты только защищённым каналом'], 7.66, 2.90, 4.55, 9.8, 'E3ECFB', 'FFD36A', 0.47);
  s.addText('Источники', { x: 0.66, y: 5.55, w: 1.0, h: 0.18, fontSize: 9.5, bold: true, color: C.cyan, margin: 0 });
  s.addText('Документация MAX: dev.max.ru/docs/webapps/bridge · dev.max.ru/docs/webapps/validation\nРепозиторий: github.com/BlenderPeople/max_hackathon_project · API: max-order.site/api/openapi.json', { x: 1.62, y: 5.52, w: 10.6, h: 0.42, fontSize: 8.9, color: 'D4DEEF', margin: 0, fit: 'shrink' });
}

await pptx.writeFile({ fileName: path.join(outDir, 'MAX_Заказы_презентация_хакатон_MAX.pptx') });
