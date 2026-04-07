import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
});

/** Create a child logger scoped to a route + optional user context. */
export function routeLogger(route: string, userId?: string | null, email?: string | null) {
  return logger.child({
    route,
    ...(userId && { userId }),
    ...(email && { email }),
  });
}
