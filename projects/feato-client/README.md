# @feato/ng-client

Feato client for Angular applications.

`@feato/ng-client` connects your Angular app to Feato and provides
real-time feature flag updates via Server-Sent Events (SSE).

---

## Features

- 🚀 Real-time feature flag updates
- 🔌 Automatic reconnect & heartbeat
- 🌱 Environment-scoped flags
- 🧩 Angular-first API (DI-friendly)
- ⚡ Lightweight, no framework internals
- 🛡️ Graceful handling of blocked projects

---

## Installation

```bash
npm install @feato/ng-client
```

---

## Requirements

- Angular **current or previous major**
- RxJS `^7.5.0`

> Older Angular versions are not supported.

---

## Basic Usage

### 1. Provide Feato client

```ts
import { provideFeatoClient } from '@feato/ng-client';

bootstrapApplication(AppComponent, {
  providers: [
    provideFeatoClient({
      projectKey: 'YOUR_PROJECT_KEY',
      environment: 'prod',
    }),
  ],
});
```

---

### 2. Client initialization

The Feato client initializes automatically when it is provided via `provideFeatoClient`.

You do not need to call `init()` manually in application code.

Initialization happens once during application bootstrap and includes:

* initial fetch of all feature flags
* preparation of the real-time (SSE) connection

The initialization process is asynchronous so the client exposes a public initialization state:

```ts
initialized$: Observable<boolean>
```

---

## Browser-only

This SDK uses Server-Sent Events (`EventSource`) for real-time updates.

- It auto-initializes only in the browser.
- In SSR/server environments it will not start the SSE connection.

---

### 3. Use in components or services

```ts
import { FeatoClient } from '@feato/ng-client';

@Component({ ... })
export class ExampleComponent {
  constructor(private feato: FeatoClient) {}

  isEnabled$ = this.feato.flag$('new-dashboard');
}
```

---

## Route Guard

Use `featoGuard` to protect routes based on a Feato feature flag.

The second argument (`options`) is optional — you can call it with just the flag key.

```ts
import { Routes } from '@angular/router';
import { featoGuard } from '@feato/ng-client';

export const routes: Routes = [
  {
    path: 'new-dashboard',
    loadComponent: () => import('./new-dashboard.component').then((m) => m.NewDashboardComponent),
    canActivate: [
      featoGuard('new-dashboard', {
        fallback: false,
        redirectTo: '/not-found',
      }),
    ],
  },
];
```

Minimal usage (no options):

```ts
canActivate: [featoGuard('new-dashboard')]
```

Options:

- `fallback` — value used when the flag is missing/not loaded (default: `false`)
- `redirectTo` — optional redirect target when access is denied

---

## Environments

Feature flags are isolated per environment.

```ts
environment: 'prod' | 'dev' | 'stage' | 'qa' | 'preview';
```

Environment is required and must match the project configuration in Feato.

---

## Real-time Updates

The client maintains a persistent SSE connection to receive updates when:

- feature flags are toggled
- values change
- configuration is updated

No polling. No manual refresh.

---

## Blocked Projects

If a project is blocked due to plan limits:

- the client will stop receiving updates
- all flags resolve to `false`
- no errors are thrown in runtime

This guarantees safe behavior in production.

---

## Error Handling

The client is designed to fail **silently and safely**.

- Network errors → automatic reconnect
- Server errors → retry with backoff
- Blocked project → flags disabled

---

## API Reference

> Full API reference will be added.

Main exports:

```ts
FeatoClient;
provideFeatoClient;
FeatoClientConfig;
Environment;
featoGuard;
FeatoGuardOptions;
```

Flag accessors:

```ts
flag(key: string): Signal<boolean | undefined>;
flag$(key: string): Observable<boolean | undefined>;
```

---

## Versioning

- Package versions follow **semantic versioning**
- Angular compatibility is defined via `peerDependencies`
- Backend contract changes are versioned independently

---

## License

MIT © Feato
