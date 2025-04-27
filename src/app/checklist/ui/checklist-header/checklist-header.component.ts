import { Component, input, output } from '@angular/core';
import {
  Checklist,
  RemoveChecklist,
} from '../../../shared/interfaces/checklist';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-checklist-header',
  imports: [RouterLink],
  template: `
    <header>
      <a routerLink="/home">Back</a>
      <h1>{{ checklist().title }}</h1>
      <div>
        <button (click)="resetChecklist.emit(checklist().id)">
          Reset items
        </button>
        <button (click)="addItem.emit()">Add item</button>
      </div>
    </header>
  `,
  styles: [
    `
      button {
        margin-left: 1rem;
      }
    `,
  ],
})
export class ChecklistHeaderComponent {
  checklist = input.required<Checklist>();

  addItem = output();
  resetChecklist = output<RemoveChecklist>();
}
