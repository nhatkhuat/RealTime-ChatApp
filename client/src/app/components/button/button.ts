import { Component, EventEmitter, Output, input } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  isDisabled = input<boolean>(false);
  isLoading = input<boolean>(false);
  buttonText = input.required<string>();
  @Output() buttonClick = new EventEmitter<MouseEvent>();

  onButtonClick(event: MouseEvent) {
    this.buttonClick.emit(event);
  }
}
