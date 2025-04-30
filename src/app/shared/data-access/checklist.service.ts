import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  AddChecklist,
  Checklist,
  EditChecklist,
} from '../interfaces/checklist';
import { map, merge, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StorageService } from './storage.service';
import { ChecklistItemService } from '../../checklist/data-access/checklist-item.service';
import { reducer } from '../utils/reducer';
import { connect } from 'ngxtension/connect';

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
  checklists = computed(() => this.state().checklists);
  loaded = computed(() => this.state().loaded);

  // sources
  private checklistsLoaded$ = this.storageService.loadChecklists();
  add$ = new Subject<AddChecklist>();
  remove$ = this.checklistItemService.checklistRemoved$;
  edit$ = new Subject<EditChecklist>();
  private error$ = new Subject<string>();

  constructor() {
    // reducers

    // reducer(this.add$, (checklist) =>
    //   this.state.update((state) => ({
    //     ...state,
    //     checklists: [...state.checklists, this.addIdToChecklist(checklist)],
    //   }))
    // );
    connect(this.state).with(this.add$, (state, checklist) => ({
      checklists: [...state.checklists, this.addIdToChecklist(checklist)],
    }));

    // reducer(
    //   this.checklistsLoaded$,
    //   (checklists) =>
    //     this.state.update((state) => ({
    //       ...state,
    //       checklists,
    //       loaded: true,
    //     })),
    //   (err) => this.state.update((state) => ({ ...state, error: err }))
    // );
    connect(this.state).with(this.checklistsLoaded$, (state, checklists) => ({
      checklists,
      loaded: true,
    }));

    // reducer(this.remove$, (id) =>
    //   this.state.update((state) => ({
    //     ...state,
    //     checklists: state.checklists.filter((checklist) => checklist.id !== id),
    //   }))
    // );
    connect(this.state).with(this.remove$, (state, id) => ({
      checklists: state.checklists.filter((checklist) => checklist.id !== id),
    }));

    // reducer(this.edit$, (update) =>
    //   this.state.update((state) => ({
    //     ...state,
    //     checklists: state.checklists.map((checklist) =>
    //       checklist.id === update.id
    //         ? { ...checklist, title: update.data.title }
    //         : checklist
    //     ),
    //   }))
    // );
    connect(this.state).with(this.edit$, (state, update) => ({
      checklists: state.checklists.map((checklist) =>
        checklist.id === update.id
          ? { ...checklist, title: update.data.title }
          : checklist
      ),
    }));

    // Second way

    // handle error
    // const nextState$ = merge(
    //   this.checklistsLoaded$.pipe(
    //     map((checklists) => ({ checklists, loaded: true }))
    //   ),
    //   this.error$.pipe(map((error) => ({ error })))
    // );

    // connect(this.state)
    //   .with(nextState$)
    //   .with(this.add$, (state, checklist) => ({
    //     checklists: [...state.checklists, this.addIdToChecklist(checklist)],
    //   }))
    //   .with(this.remove$, (state, id) => ({
    //     checklists: state.checklists.filter((checklist) => checklist.id !== id),
    //   }))
    //   .with(this.edit$, (state, update) => ({
    //     checklists: state.checklists.map((checklist) =>
    //       checklist.id === update.id
    //         ? { ...checklist, title: update.data.title }
    //         : checklist
    //     ),
    //   }));

    // effects
    effect(() => {
      if (this.loaded()) {
        this.storageService.saveChecklists(this.checklists());
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
