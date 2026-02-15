
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { AppComponent } from './src/app.component';
import { routes } from './src/app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { authInterceptor } from "./src/interceptors/auth.interceptor";


// Shim process for libraries that expect it (like supabase-js) to prevent loading errors
(window as any).process = (window as any).process || { env: {} };

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
],
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
