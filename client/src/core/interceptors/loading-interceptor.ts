import { HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BusyService } from '../services/busy-service';
import { delay, finalize, identity, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

type CacheEntry = {
  response: HttpEvent<unknown>;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

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
      const isExpired = (Date.now() - cachedResponse.timestamp) > CACHE_DURATION_MS;
      if (!isExpired) {
        return of(cachedResponse.response);
      } else {
        cache.delete(req.urlWithParams);
      }
    }
  }

  busyService.busy();
  
  return next(req).pipe(
    (environment.production ? identity : delay(500)),
    tap(response => {
      cache.set(req.urlWithParams, 
        { response, timestamp: Date.now() }
      );
    }),
    finalize(() => {
      busyService.idle()
    })
  );
};
