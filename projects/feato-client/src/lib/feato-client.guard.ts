import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { FeatoClient } from './feato-client.service';

export interface FeatoGuardOptions {
  /** Value to use when flag is not loaded / missing. Defaults to `false`. */
  fallback?: boolean;

  /** Optional redirect target when access is denied. */
  redirectTo?: string | UrlTree;
}

/**
 * Route guard based on a Feato feature flag.
 *
 * - If the flag resolves to `true` → allows navigation.
 * - If the flag resolves to `false`/`undefined` → denies navigation (or returns a UrlTree if `redirectTo` is provided).
 */
export function featoGuard(flagKey: string, options: FeatoGuardOptions = {}): CanActivateFn {
  return () => {
    const client = inject(FeatoClient);
    const router = options.redirectTo ? inject(Router) : undefined;

    const value = client.flag(flagKey)();
    const allowed = value ?? options.fallback ?? false;

    if (!allowed && options.redirectTo) {
      return typeof options.redirectTo === 'string'
        ? router!.parseUrl(options.redirectTo)
        : options.redirectTo;
    }

    return allowed;
  };
}
