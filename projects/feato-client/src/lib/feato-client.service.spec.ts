import { HttpBackend, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { FeatoClient } from './feato-client.service';
import { FeatoClientConfig } from './feato-client.model';

class MockHttpBackend implements HttpBackend {
  constructor(private readonly handler: (req: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>) {}

  handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    return this.handler(req);
  }
}

class MockEventSource {
  static instances: MockEventSource[] = [];

  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  readonly url: string;
  closeCalls = 0;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close(): void {
    this.closeCalls += 1;
  }
}

describe('FeatoClient', () => {
  const config: FeatoClientConfig = {
    projectKey: 'project-key-123',
    environment: 'dev',
  };

  const originalEventSource = globalThis.EventSource;

  beforeEach(() => {
    MockEventSource.instances = [];
    // Vitest runs in a Node-like environment; EventSource might be missing.
    globalThis.EventSource = MockEventSource as unknown as typeof EventSource;
  });

  afterEach(() => {
    globalThis.EventSource = originalEventSource;
  });

  it('loads feature flags on init and connects to hub', () => {
    const backend = new MockHttpBackend((req) => {
      expect(req.method).toBe('GET');

      const url = new URL(req.urlWithParams);
      expect(url.pathname).toBe('/v1/feature-flag');
      expect(url.searchParams.get('secret')).toBe(config.projectKey);
      expect(url.searchParams.get('environment')).toBe(config.environment);

      return of(
        new HttpResponse({
          status: 200,
          body: {
            environment: config.environment,
            flags: { featureA: true, featureB: false },
          },
        })
      );
    });

    const service = new FeatoClient(backend, config);

    expect(service.flag('featureA' as any) as any).toBe(true);
    expect(service.flag('featureB' as any) as any).toBe(false);

    expect(MockEventSource.instances.length).toBe(1);
    const es = MockEventSource.instances[0];
    expect(es.url).toBe(
      `https://feato-hub-service-229218510057.us-central1.run.app/v1/hub?secret=${config.projectKey}&environment=${config.environment}&version=1`
    );
    expect(es.onmessage).toBeTypeOf('function');
    expect(es.onerror).toBeTypeOf('function');
  });

  it('updates flags when receiving an SSE message', () => {
    const backend = new MockHttpBackend(() =>
      of(
        new HttpResponse({
          status: 200,
          body: {
            environment: config.environment,
            flags: { featureA: true },
          },
        })
      )
    );

    const service = new FeatoClient(backend, config);
    const es = MockEventSource.instances[0];

    es.onmessage?.({ data: JSON.stringify({ key: 'featureA', value: false, updatedAt: new Date() }) } as any);
    expect(service.flag('featureA' as any) as any).toBe(false);
    es.onmessage?.({ data: JSON.stringify({ key: 'newFlag', value: true, updatedAt: new Date() }) } as any);
    expect(service.flag('newFlag' as any) as any).toBe(true);
  });

  it('disconnects (closes EventSource) on SSE error', () => {
    const backend = new MockHttpBackend(() =>
      of(
        new HttpResponse({
          status: 200,
          body: {
            environment: config.environment,
            flags: {},
          },
        })
      )
    );

    const service = new FeatoClient(backend, config);
    const es = MockEventSource.instances[0];

    es.onerror?.(new Event('error'));
    expect(es.closeCalls).toBe(1);

    // Calling disconnect again should be safe.
    service.disconnect();
    expect(es.closeCalls).toBe(1);
  });

  it('does not connect when init request fails (logs error)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const backend = new MockHttpBackend(() => throwError(() => new Error('boom')));
    const service = new FeatoClient(backend, config);

    expect(errorSpy).toHaveBeenCalled();
    expect(MockEventSource.instances.length).toBe(0);
    expect(service.flag('featureA' as any) as any).toBeUndefined();
    errorSpy.mockRestore();
  });
});
