import { getLaunchContext } from './bridge/maxBridge';
import { resolveStartRoute } from './routing/startParam';

export default function App() {
  const launch = getLaunchContext();
  const route = resolveStartRoute(launch.startParam);

  return (
    <main className="app-shell">
      <p className="eyebrow">MAX Заказы</p>
      <h1>Каркас Mini App готов</h1>
      <p>
        Рома добавляет экраны и компоненты, Сергей — API и доменную модель,
        Василий подключает MAX Bridge и реальные интеграции.
      </p>
      <dl className="launch-info">
        <div><dt>Источник запуска</dt><dd>{launch.isMax ? 'MAX' : 'браузер'}</dd></div>
        <div><dt>Технический маршрут</dt><dd>{route.pathname}</dd></div>
      </dl>
    </main>
  );
}
