import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpBackend } from '@angular/common/http';
import { FeatoClient } from './feato-client.service';
import { FeatoClientConfig } from './feato-client.model';

export function provideFeatoClient(config: FeatoClientConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: FeatoClient,
      useFactory: () => {
        const backend = inject(HttpBackend);

        return new FeatoClient(backend, config);
      },
    },
    provideEnvironmentInitializer(() => {
      const platformId = inject(PLATFORM_ID);
      if (isPlatformBrowser(platformId)) {
        inject(FeatoClient);
      }
    }),
  ]);
}
