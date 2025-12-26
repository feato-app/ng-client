import { HttpBackend, HttpClient } from '@angular/common/http';
import { computed, signal, Signal } from '@angular/core';
import { BehaviorSubject, catchError, EMPTY, map, Observable, of } from 'rxjs';
import { FeatoClientConfig, FeatureFlagEvent, FeatureFlagsResponse } from './feato-client.model';

const apiUrl = 'https://feato-hub-service-229218510057.us-central1.run.app/v1';

export class FeatoClient {
  private readonly _flags$ = new BehaviorSubject<Record<string, boolean>>({});
  private readonly _initialized$ = new BehaviorSubject<boolean>(false);

  private readonly _flags = signal<Record<string, boolean>>({});
  private readonly _initialized = signal<boolean>(false);

  private readonly _http: HttpClient;

  private _eventSource?: EventSource;

  readonly flags$ = this._flags$.asObservable();
  readonly initialized$ = this._initialized$.asObservable();

  readonly flags = computed<Record<string, boolean>>(() => this._flags());
  readonly initialized = computed<boolean>(() => this._initialized());

  constructor(private _backend: HttpBackend, private _config: FeatoClientConfig) {
    this._http = new HttpClient(this._backend);

    this._init();
  }

  private _init(): Observable<void> {
    const params = { secret: this._config.projectKey, environment: this._config.environment };
    const request = this._http.get<FeatureFlagsResponse>(`${apiUrl}/feature-flag`, { params });

    request
      .pipe(
        catchError((error) => {
          console.error('FeatoClient initialization error:', error);

          return EMPTY;
        })
      )
      .subscribe((response) => {
        this._flags$.next(response.flags);
        this._initialized$.next(true);

        this._flags.set(response.flags);
        this._initialized.set(true);

        this._connect();
      });

    return of(void 0);
  }

  private _connect(): void {
    if (this._eventSource) {
      return;
    }

    if (typeof EventSource === 'undefined') {
      return;
    }

    const url = `${apiUrl}/hub?secret=${this._config.projectKey}&environment=${this._config.environment}&version=1`;

    this._eventSource = new EventSource(url);

    this._eventSource.onmessage = (event) => {
      const raw = JSON.parse(event.data) as Omit<FeatureFlagEvent, 'updatedAt'> & {
        updatedAt?: string | Date;
      };

      const payload: FeatureFlagEvent = {
        ...raw,
        updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(0),
      };

      this._proceedEvent(payload);
    };

    this._eventSource.onerror = () => {
      this.disconnect();
    };
  }

  private _proceedEvent(event: FeatureFlagEvent): void {
    const flags = { ...this._flags$.value };

    flags[event.key] = event.value!;

    this._flags$.next(flags);
    this._flags.set(flags);
  }

  disconnect(): void {
    this._eventSource?.close();
    this._eventSource = undefined;
  }

  flag$(key: string): Observable<boolean | undefined> {
    return this.flags$.pipe(map((flags) => flags[key]));
  }

  flag(key: string): Signal<boolean | undefined> {
    return computed(() => this.flags()[key]);
  }
}
