import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  /**
   * A global signal to hold the search term used across the application.
   */
  searchTerm = signal('');
}
