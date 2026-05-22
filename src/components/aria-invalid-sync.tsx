'use client';

import { useEffect } from 'react';

/**
 * Keeps `aria-invalid` in sync with the visual `:user-invalid` state on every
 * native control inside any `<form>`. CSS handles the visual side; this
 * makes sure screen readers receive the same signal at the same moment
 * (after blur, after submit attempt — not on initial mount).
 *
 * Mounted once at app root via <Providers>. No-op on the server.
 *
 * Pattern from modern-web-guidance/accessible-error-announcement.
 */
export function AriaInvalidSync() {
  useEffect(() => {
    function sync(el: EventTarget | null) {
      if (!(el instanceof HTMLElement)) return;
      if (!el.matches?.('input, textarea, select')) return;
      if (!el.closest('form')) return;
      const invalid = el.matches(':user-invalid');
      if (invalid) {
        el.setAttribute('aria-invalid', 'true');
      } else if (el.hasAttribute('aria-invalid')) {
        el.removeAttribute('aria-invalid');
      }
    }

    function onBlur(event: FocusEvent) {
      sync(event.target);
    }

    function onInput(event: Event) {
      const target = event.target;
      if (target instanceof HTMLElement && target.hasAttribute('aria-invalid')) {
        sync(target);
      }
    }

    document.addEventListener('blur', onBlur, true);
    document.addEventListener('input', onInput);
    return () => {
      document.removeEventListener('blur', onBlur, true);
      document.removeEventListener('input', onInput);
    };
  }, []);

  return null;
}
