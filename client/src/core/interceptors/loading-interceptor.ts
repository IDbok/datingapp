import { HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BusyService } from '../services/busy-service';
import { delay, finalize, identity, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const cache = new Map<string, HttpEvent<unknown>>();

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const busyService = inject(BusyService);

  const invalidateCache = (urlPattern: string) => {
    for (const key of cache.keys()) {
      if (key.includes(urlPattern)) {
        cache.delete(key);
      }
    }
  };

  if (req.method.includes('POST') && req.url.includes('/likes')) {
    invalidateCache('/likes');
  }
  
  if ((req.method.includes('POST') || req.method.includes('DELETE')) 
      && req.url.includes('/messages')) {
    invalidateCache('/messages');
  }

  if (req.method === 'GET') {
    const cachedResponse = cache.get(req.urlWithParams);
    if (cachedResponse) {
      return of(cachedResponse);
    }
  }

  busyService.busy();
  
  return next(req).pipe(
    (environment.production ? identity : delay(500)),
    tap(response => {
      cache.set(req.urlWithParams, response);
    }),
    finalize(() => {
      busyService.idle()
    })
  );
};
