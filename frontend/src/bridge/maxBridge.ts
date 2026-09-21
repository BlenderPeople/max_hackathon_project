export type LaunchContext = {
  isMax: boolean;
  initData: string;
  startParam: string;
};

type MaxWebApp = {
  initData?: string;
  initDataUnsafe?: { start_param?: string };
  ready?: () => void;
};

declare global {
  interface Window {
    WebApp?: MaxWebApp;
  }
}

/**
 * The only boundary that may read the MAX global object.
 * `initDataUnsafe` is permitted only to choose a client-side route;
 * backend authentication always validates the signed `initData` string.
 */
export function getLaunchContext(): LaunchContext {
  const webApp = window.WebApp;

  if (!webApp) {
    return { isMax: false, initData: '', startParam: '' };
  }

  webApp.ready?.();
  return {
    isMax: true,
    initData: webApp.initData ?? '',
    startParam: webApp.initDataUnsafe?.start_param ?? '',
  };
}
