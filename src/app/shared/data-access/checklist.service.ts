import {
  computed,
  effect,
  inject,
  Injectable,
  linkedSignal,
  ResourceStatus,
  signal,
} from '@angular/core';
import {
  AddChecklist,
  Checklist,
  EditChecklist,
} from '../interfaces/checklist';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StorageService } from './storage.service';
import { ChecklistItemService } from '../../checklist/data-access/checklist-item.service';

export interface ChecklistsState {
  checklists: Checklist[];
  loaded: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ChecklistService {
  storageService = inject(StorageService);
  checklistItemService = inject(ChecklistItemService);

  // state
  private state = signal<ChecklistsState>({
    checklists: [],
    loaded: false,
    error: null,
  });

  // selectors
  loaded = computed(() => this.state().loaded);

  // sources
  loadedChecklists = this.storageService.loadChecklists();
  add$ = new Subject<AddChecklist>();
  edit$ = new Subject<EditChecklist>();
  remove$ = this.checklistItemService.checklistRemoved$;

  // state
  checklists = linkedSignal({
    source: this.loadedChecklists.value,
    computation: (checklists) => checklists ?? [],
  });

  constructor() {
    // reducers
    this.add$
      .pipe(takeUntilDestroyed())
      .subscribe((checklist) =>
        this.checklists.update((checklists) => [
          ...checklists,
          this.addIdToChecklist(checklist),
        ])
      );

    this.remove$
      .pipe(takeUntilDestroyed())
      .subscribe((id) =>
        this.checklists.update((checklists) =>
          checklists.filter((checklist) => checklist.id !== id)
        )
      );

    this.edit$
      .pipe(takeUntilDestroyed())
      .subscribe((update) =>
        this.checklists.update((checklists) =>
          checklists.map((checklist) =>
            checklist.id === update.id
              ? { ...checklist, title: update.data.title }
              : checklist
          )
        )
      );

    // effects
    effect(() => {
      const checklists = this.checklists();
      if (this.loadedChecklists.status() === ResourceStatus.Resolved) {
        this.storageService.saveChecklists(checklists);
      }
    });
  }

  private addIdToChecklist(checklist: AddChecklist) {
    return {
      ...checklist,
      id: this.generateSlug(checklist.title),
    };
  }

  private generateSlug(title: string) {
    let slug = title.toLowerCase().replace(/\s+/g, '-');

    const matchingSlugs = this.checklists().find(
      (checklist) => checklist.id === slug
    );

    if (matchingSlugs) {
      slug = slug + Date.now().toString();
    }

    return slug;
  }
}
