import { HttpBackend, HttpClient } from '@angular/common/http';
import { computed, signal, Signal } from '@angular/core';
import { BehaviorSubject, catchError, EMPTY, map, Observable, of } from 'rxjs';
import { FeatoClientConfig, FeatureFlagEvent, FeatureFlagsResponse } from './feato-client.model';

const apiUrl = 'https://hub.feato.io/v1';

export class FeatoClient {
  private readonly _flags$ = new BehaviorSubject<Record<string, boolean>>({});
  private readonly _initialized$ = new BehaviorSubject<boolean>(false);

  private readonly _flags = signal<Record<string, boolean>>({});
  private readonly _initialized = signal<boolean>(false);

  private readonly _http: HttpClient;

  private _eventSource?: EventSource;
  private _reconnectAttempts = 0;
  private _reconnectTimeoutId?: number;
  private _maxReconnectDelay = 30000; // 30 seconds
  private _baseReconnectDelay = 1000; // 1 second

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
      this._handleConnectionError();
    };
  }

  private _proceedEvent(event: FeatureFlagEvent): void {
    const flags = { ...this._flags$.value };

    flags[event.key] = event.value!;

    this._flags$.next(flags);
    this._flags.set(flags);

    // Reset reconnect attempts on successful message
    this._reconnectAttempts = 0;
  }

  private _handleConnectionError(): void {
    this._eventSource?.close();
    this._eventSource = undefined;

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this._baseReconnectDelay * Math.pow(2, this._reconnectAttempts),
      this._maxReconnectDelay
    );

    this._reconnectAttempts++;

    console.log(`FeatoClient: Connection lost. Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts})...`);

    this._reconnectTimeoutId = setTimeout(() => {
      this._connect();
    }, delay);
  }

  disconnect(): void {
    if (this._reconnectTimeoutId) {
      clearTimeout(this._reconnectTimeoutId);
      this._reconnectTimeoutId = undefined;
    }

    this._eventSource?.close();
    this._eventSource = undefined;
    this._reconnectAttempts = 0;
  }

  flag$(key: string): Observable<boolean | undefined> {
    return this.flags$.pipe(map((flags) => flags[key]));
  }

  flag(key: string): Signal<boolean | undefined> {
    return computed(() => this.flags()[key]);
  }
}
