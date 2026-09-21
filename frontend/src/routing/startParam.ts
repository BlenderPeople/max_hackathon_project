export type StartRoute = { pathname: string };

/** Map opaque MAX deep-link payloads to application routes. */
export function resolveStartRoute(startParam: string): StartRoute {
  if (startParam.startsWith('service_')) {
    return { pathname: `/services/${startParam.slice('service_'.length)}` };
  }
  if (startParam.startsWith('order_')) {
    return { pathname: `/orders/${startParam.slice('order_'.length)}` };
  }
  return { pathname: '/orders' };
}
