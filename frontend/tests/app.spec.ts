import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);
}

test('orders, filters and dark theme are usable', async ({ page }, testInfo) => {
  await page.goto('/orders');
  await expect(page.getByRole('heading', { name: 'Ваши заказы' })).toBeVisible();
  await expect(page.getByText('Обрезка трёх яблонь')).toBeVisible();
  await page.getByRole('tab', { name: 'Завершены' }).click();
  await expect(page.getByText('Формирование кроны клёна')).toBeVisible();
  await page.getByRole('button', { name: 'Включить тёмную тему' }).click();
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('orders.png') });
});

test('customer creates an order from service', async ({ page }, testInfo) => {
  await page.goto('/services/svc_7Qm2pL8kVx4N');
  await expect(page.getByRole('heading', { name: 'Обрезка деревьев' })).toBeVisible();
  await page.getByRole('button', { name: 'Заказать' }).click();
  await page.getByPlaceholder('Например, обрезать три яблони и вывезти ветки').fill('Обрезать две старые яблони и убрать сухие ветки');
  await page.locator('input[type="date"]').fill('2026-09-25');
  await page.getByRole('button', { name: 'Создать заказ' }).click();
  await expect(page.getByText('Заказ создан').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Обрезка деревьев' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('created-order.png') });
});

test('server-provided master actions open payment dialog', async ({ page }, testInfo) => {
  await page.goto('/orders/ord_M4sT8vN1cZ6A');
  await expect(page.getByRole('button', { name: 'Добавить оплату' })).toBeVisible();
  await page.getByRole('button', { name: 'Добавить оплату' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Зафиксировать оплату' })).toBeVisible();
  const boxes = await dialog.locator('.dialog-form > label, .dialog-form > button[type="submit"]').evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom };
  }));
  expect(boxes).toHaveLength(3);
  expect(boxes[0].bottom).toBeLessThanOrEqual(boxes[1].top);
  expect(boxes[1].bottom).toBeLessThanOrEqual(boxes[2].top);
  const dialogBox = await dialog.boundingBox();
  const viewport = page.viewportSize();
  const dialogBackground = await dialog.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(dialogBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(viewport!.height);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('payment-dialog.png') });
});

test('client approval is available without role inference', async ({ page }) => {
  await page.goto('/orders/ord_B9kP2xR7mQ4L');
  await expect(page.getByText('Нужно ваше подтверждение')).toBeVisible();
  await page.getByRole('button', { name: 'Согласовать' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Подтвердить' }).click();
  await expect(page.getByText('Стоимость подтверждена')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Согласовать' })).toHaveCount(0);
});

test('profile, files and launch feedback states are populated', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Алексей Воронцов' })).toBeVisible();
  await expect(page.getByText('Профиль подтверждён')).toBeVisible();

  await page.goto('/orders/ord_C8dJ3wF5hS2E');
  await expect(page.getByText('акт-выполненных-работ.pdf')).toBeVisible();
  await expect(page.getByText('результат.jpg')).toBeVisible();

  await page.goto('/orders?launch=error');
  await expect(page.getByRole('heading', { name: 'Не удалось запустить приложение' })).toBeVisible();
  await page.goto('/orders?launch=unauthorized');
  await expect(page.getByRole('heading', { name: 'Нужен запуск из MAX' })).toBeVisible();
});

test('master manages profile, services and schedule', async ({ page }) => {
  await page.goto('/profile/edit');
  await page.getByLabel('Специализация').fill('Арборист и садовый мастер');
  await page.getByRole('button', { name: 'Сохранить профиль' }).click();
  await expect(page.getByRole('heading', { name: 'Арборист и садовый мастер' })).toBeVisible();

  await page.goto('/services/new');
  await page.getByLabel('Название').fill('Подготовка сада к зиме');
  await page.getByLabel('Описание').fill('Обрежу растения, подготовлю сад и дам рекомендации по сезонному уходу.');
  await page.getByLabel('Цена от, ₽').fill('6500');
  await page.getByLabel('Длительность, минут').fill('180');
  await page.getByRole('button', { name: 'Добавить услугу' }).click();
  await expect(page.getByRole('heading', { name: 'Подготовка сада к зиме' })).toBeVisible();

  await page.goto('/schedule');
  await expect(page.getByRole('heading', { name: 'Недельный график' })).toBeVisible();
  await expect(page.getByText('Ближайшие записи')).toBeVisible();
  await page.getByRole('button', { name: 'Сохранить расписание' }).click();
  await expectNoHorizontalOverflow(page);
});

test('customer can open the public master profile', async ({ page }) => {
  await page.goto('/services/svc_7Qm2pL8kVx4N');
  await page.getByRole('link', { name: 'Открыть профиль мастера' }).click();
  await expect(page.getByRole('heading', { name: 'Алексей Воронцов' })).toBeVisible();
  await expect(page.getByText('8 лет практики')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Записаться' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
