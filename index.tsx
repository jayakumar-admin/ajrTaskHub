

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { AppComponent } from './src/app.component';
import { routes } from './src/app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode, provideZonelessChangeDetection } from '@angular/core';


// Shim process for libraries that expect it (like supabase-js) to prevent loading errors
(window as any).process = (window as any).process || { env: {} };

// CRITICAL ENVIRONMENT VARIABLE CHECK:
// Ensure Supabase credentials are set before bootstrapping the application.
// This provides an early warning if environment variables are missing.

 const supabaseUrl = 'https://kmukweenyvpjosutimpi.supabase.co';
    const supabaseAnonKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdWt3ZWVueXZwam9zdXRpbXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjU5NjksImV4cCI6MjA4MDEwMTk2OX0._ZMsPjG8HVnPdRNvZoyrKDXktCoTQKUW63TY573b0Fo';



if (!supabaseUrl || !supabaseAnonKey) {
  console.error('--------------------------------------------------------------------------');
  console.error('CRITICAL ERROR: Supabase environment variables are missing!');
  console.error('Please ensure process.env.SUPABASE_URL and process.env.SUPABASE_ANON_KEY are correctly set.');
  console.error('Without these, the application cannot connect to Supabase and will not start.');
  console.error('--------------------------------------------------------------------------');
  // Display a message on the body to the user
  document.body.innerHTML = `
    <div style="font-family: sans-serif; padding: 20px; text-align: center; background: #fee2e2; border: 1px solid #ef4444; color: #ef4444; margin: 20px; border-radius: 8px;">
      <h2>Application Initialization Failed</h2>
      <p>Supabase connection details are missing. Please configure <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> in your environment settings.</p>
      <p>Check the browser console for more details.</p>
    </div>
  `;
  // Prevent Angular from bootstrapping if critical env vars are missing
  throw new Error('Supabase environment variables missing. Application cannot start.');
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
],
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.