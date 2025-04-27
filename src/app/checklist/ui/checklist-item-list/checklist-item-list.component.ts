import { Component, input, output } from '@angular/core';
import {
  ChecklistItem,
  EditChecklistItem,
  RemoveChecklistItem,
} from '../../../shared/interfaces/checklist-item';

@Component({
  selector: 'app-checklist-item-list',
  imports: [],
  template: `
    <section>
      <ul>
        @for (item of checklistItems(); track item.id) {
        <li>
          <div>
            @if (item.checked) {
            <span>✅</span>
            }
            {{ item.title }}
          </div>
          <div>
            <button
              (click)="
                item.checked = !item.checked;
                toggle.emit({
                  id: item.id,
                  data: item
                })
              "
            >
              Toggle
            </button>
            <button (click)="edit.emit(item)">Edit</button>
            <button (click)="delete.emit(item.id)">Delete</button>
          </div>
        </li>
        } @empty {
        <div>
          <h2>Add an item</h2>
          <p>Click the add button to add your first item to this quicklist</p>
        </div>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      ul {
        padding: 0;
        margin: 0;
      }
      li {
        font-size: 1.5em;
        display: flex;
        justify-content: space-between;
        background: var(--color-light);
        list-style-type: none;
        margin-bottom: 1rem;
        padding: 1rem;

        button {
          margin-left: 1rem;
        }
      }
    `,
  ],
})
export class ChecklistItemListComponent {
  checklistItems = input.required<ChecklistItem[]>();

  toggle = output<EditChecklistItem>();
  delete = output<RemoveChecklistItem>();
  edit = output<ChecklistItem>();
}
