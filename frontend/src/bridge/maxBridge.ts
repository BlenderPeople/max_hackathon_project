export type LaunchContext = {
  isMax: boolean;
  initData: string;
  startParam: string;
};

type MaxWebApp = {
  initData?: string;
  initDataUnsafe?: { start_param?: string };
  ready?: () => void;
  openMaxLink?: (url: string) => void;
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

/** Open a MAX deep link through Bridge; use a browser fallback for local dev. */
export function openMaxLink(url: string): void {
  if (window.WebApp?.openMaxLink) {
    window.WebApp.openMaxLink(url);
    return;
  }
  window.location.assign(url);
}
