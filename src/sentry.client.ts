import * as Sentry from "@sentry/react";

// Sentry initialization:
// - production-only
// - requires DSN
// - privacy-safe: do not send PII, do not attach sensitive app context
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  const emailRegex =
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const phoneRegex =
    /\+?\d[\d\s().-]{7,}\d/;

  const beforeSend: Parameters<typeof Sentry.init>[0]["beforeSend"] = (event) => {
    // Remove Sentry user data (we never set it, but keep this as a hard safety net).
    if (event.user) {
      delete event.user;
    }

    // Redact high-risk request headers if present.
    // Note: Sentry event types are permissive; keep checks defensive.
    const headers = event.request?.headers;
    if (headers && typeof headers === "object") {
      const headerKeys = Object.keys(headers);
      for (const key of headerKeys) {
        const lower = key.toLowerCase();
        if (lower === "authorization" || lower === "cookie") {
          delete (headers as Record<string, unknown>)[key];
        }
      }
    }

    // Optional exception-message sanitization for obvious emails/phones.
    const exceptionValues = event.exception?.values;
    if (Array.isArray(exceptionValues)) {
      for (const v of exceptionValues) {
        if (v && typeof v.value === "string") {
          v.value = v.value
            .replace(emailRegex, "[REDACTED_EMAIL]")
            .replace(phoneRegex, "[REDACTED_PHONE]");
        }
      }
    }

    // Do not delete contexts/extra/request/breadcrumbs wholesale.
    // Keep this scrubbing focused to avoid unnecessary loss of debugging signal.
    return event;
  };

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV ?? "production",
    sendDefaultPii: false,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    beforeSend,
  });
}

