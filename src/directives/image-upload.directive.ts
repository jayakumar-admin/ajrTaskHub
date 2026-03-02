import { Directive, HostBinding, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appImageUpload]',
  standalone: true
})
export class ImageUploadDirective {
  @Output() fileDropped = new EventEmitter<File>();
  @HostBinding('class.file-over') fileOver: boolean = false;

  // Dragover listener
  @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = true;
  }

  // Dragleave listener
  @HostListener('dragleave', ['$event']) onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
  }

  // Drop listener
  @HostListener('drop', ['$event']) ondrop(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
    const files = evt.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fileDropped.emit(files[0]);
    }
  }

  // Paste listener
  @HostListener('paste', ['$event']) onPaste(evt: ClipboardEvent) {
    const items = evt.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            this.fileDropped.emit(blob);
            evt.preventDefault(); // Prevent default paste behavior if we handled an image
          }
        }
      }
    }
  }
}
