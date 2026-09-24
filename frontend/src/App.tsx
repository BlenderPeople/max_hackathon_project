import { Button } from '@maxhub/max-ui';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { getLaunchContext } from './bridge/maxBridge';
import { authenticateMax } from './api/http';
import { AppShell } from './components/AppShell';
import { PageState } from './components/PageState';
import { CreateOrderScreen } from './features/orders/CreateOrderScreen';
import { OrderScreen } from './features/orders/OrderScreen';
import { OrdersScreen } from './features/orders/OrdersScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { ProfileEditScreen } from './features/profile/ProfileEditScreen';
import { PublicProfileScreen } from './features/profile/PublicProfileScreen';
import { ServiceScreen } from './features/services/ServiceScreen';
import { ServicesScreen } from './features/services/ServicesScreen';
import { ServiceEditScreen } from './features/services/ServiceEditScreen';
import { ScheduleScreen } from './features/schedule/ScheduleScreen';
import { resolveStartRoute } from './routing/startParam';

function RootRoute() {
  const launch = getLaunchContext();
  return <Navigate to={resolveStartRoute(launch.startParam).pathname} replace />;
}

export default function App() {
  const launch = getLaunchContext();
  const [booting, setBooting] = useState(true);
  const [authError, setAuthError] = useState(false);
  useEffect(() => {
    if (import.meta.env.VITE_API_MODE !== 'real' || !launch.initData) {
      const timer = window.setTimeout(() => setBooting(false), 320);
      return () => window.clearTimeout(timer);
    }
    let active = true;
    authenticateMax(launch.initData)
      .catch(() => { if (active) setAuthError(true); })
      .finally(() => { if (active) setBooting(false); });
    return () => { active = false; };
  }, [launch.initData]);

  const launchState = new URLSearchParams(window.location.search).get('launch');
  const launchFailed = launchState === 'error' || authError;
  const unauthorized = launchState === 'unauthorized'
    || (import.meta.env.VITE_API_MODE === 'real' && !launch.initData);

  return (
    <AppShell>
      {booting ? (
        <PageState variant="loading" title="Запускаем приложение" description="Проверяем сессию и готовим ваши заказы." />
      ) : launchFailed ? (
        <PageState variant="error" title="Не удалось запустить приложение" description="Закройте окно и откройте Mini App из MAX ещё раз." action={<Button variant="secondary" size="small" onClick={() => window.location.assign('/')}>Повторить</Button>} />
      ) : unauthorized ? (
        <PageState variant="unauthorized" title="Нужен запуск из MAX" description="Откройте приложение через профиль бота, чтобы подтвердить вход." />
      ) : (
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/orders" element={<OrdersScreen />} />
          <Route path="/orders/:publicToken" element={<OrderScreen />} />
          <Route path="/services" element={<ServicesScreen />} />
          <Route path="/services/new" element={<ServiceEditScreen />} />
          <Route path="/services/:publicToken" element={<ServiceScreen />} />
          <Route path="/services/:publicToken/master" element={<PublicProfileScreen />} />
          <Route path="/services/:publicToken/edit" element={<ServiceEditScreen />} />
          <Route path="/services/:publicToken/create" element={<CreateOrderScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/profile/edit" element={<ProfileEditScreen />} />
          <Route path="/schedule" element={<ScheduleScreen />} />
          <Route path="*" element={<PageState variant="empty" title="Экран не найден" description="Вернитесь к списку заказов." action={<Button asChild size="small"><a href="/orders">К заказам</a></Button>} />} />
        </Routes>
      )}
    </AppShell>
  );
}
