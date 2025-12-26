import { TestBed } from '@angular/core/testing';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { featoGuard } from './feato-client.guard';
import { FeatoClient } from './feato-client.service';

function resolveGuardResult<T>(value: unknown): Promise<T> {
  return isObservable(value) ? firstValueFrom(value as any) : Promise.resolve(value as T);
}

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('featoGuard', () => {
  it('allows when flag is true', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FeatoClient, useValue: { flag$: () => of(true) } },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => resolveGuardResult(featoGuard('a')(route, state)));
    expect(result).toBe(true);
  });

  it('denies when flag is false', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FeatoClient, useValue: { flag$: () => of(false) } },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => resolveGuardResult(featoGuard('a')(route, state)));
    expect(result).toBe(false);
  });

  it('uses fallback when flag is undefined', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FeatoClient, useValue: { flag$: () => of(undefined) } },
      ],
    });

    const result = await TestBed.runInInjectionContext(() =>
      resolveGuardResult(featoGuard('a', { fallback: true })(route, state))
    );
    expect(result).toBe(true);
  });

  it('returns UrlTree when redirectTo is provided', async () => {
    const urlTree = {} as UrlTree;

    TestBed.configureTestingModule({
      providers: [
        { provide: FeatoClient, useValue: { flag$: () => of(false) } },
        { provide: Router, useValue: { parseUrl: () => urlTree } },
      ],
    });

    const result = await TestBed.runInInjectionContext(() =>
      resolveGuardResult<UrlTree>(featoGuard('a', { redirectTo: '/no-access' })(route, state))
    );

    expect(result).toBe(urlTree);
  });
});
