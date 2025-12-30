import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { featoGuard } from './feato-client.guard';
import { FeatoClient } from './feato-client.service';
import { signal } from '@angular/core';

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('featoGuard', () => {
  it('allows when flag is true', () => {
    const flagSignal = signal(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: FeatoClient, useValue: { flag: () => flagSignal.asReadonly() } },
      ],
    });

    const result = TestBed.runInInjectionContext(() => featoGuard('a')(route, state));
    expect(result).toBe(true);
  });

  it('denies when flag is false', () => {
    const flagSignal = signal(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: FeatoClient, useValue: { flag: () => flagSignal.asReadonly() } },
      ],
    });

    const result = TestBed.runInInjectionContext(() => featoGuard('a')(route, state));
    expect(result).toBe(false);
  });

  it('uses fallback when flag is undefined', () => {
    const flagSignal = signal(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: FeatoClient, useValue: { flag: () => flagSignal.asReadonly() } },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      featoGuard('a', { fallback: true })(route, state)
    );
    expect(result).toBe(true);
  });

  it('returns UrlTree when redirectTo is provided', () => {
    const urlTree = {} as UrlTree;
    const flagSignal = signal(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: FeatoClient, useValue: { flag: () => flagSignal.asReadonly() } },
        { provide: Router, useValue: { parseUrl: () => urlTree } },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      featoGuard('a', { redirectTo: '/no-access' })(route, state)
    );

    expect(result).toBe(urlTree);
  });
});
