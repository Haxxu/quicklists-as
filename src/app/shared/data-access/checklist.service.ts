import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  AddChecklist,
  Checklist,
  EditChecklist,
} from '../interfaces/checklist';
import {
  catchError,
  concatMap,
  EMPTY,
  merge,
  mergeMap,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StorageService } from './storage.service';
import { ChecklistItemService } from '../../checklist/data-access/checklist-item.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ChecklistsState {
  checklists: Checklist[];
  loaded: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ChecklistService {
  // storageService = inject(StorageService);
  checklistItemService = inject(ChecklistItemService);
  http = inject(HttpClient);

  // state
  private state = signal<ChecklistsState>({
    checklists: [],
    loaded: false,
    error: null,
  });

  // selectors
  checklists = computed(() => this.state().checklists);
  loaded = computed(() => this.state().loaded);

  add$ = new Subject<AddChecklist>();
  remove$ = this.checklistItemService.checklistRemoved$;
  edit$ = new Subject<EditChecklist>();

  checklistAdded$ = this.add$.pipe(
    concatMap((addChecklist) =>
      this.http
        .post(`${environment.API_URL}/checklists`, JSON.stringify(addChecklist))
        .pipe(catchError((err) => this.handleError(err)))
    )
  );

  checklistRemoved$ = this.remove$.pipe(
    mergeMap((id) =>
      this.http
        .delete(`${environment.API_URL}/checklists/${id}`)
        .pipe(catchError((err) => this.handleError(err)))
    )
  );

  checklistEdited$ = this.edit$.pipe(
    mergeMap((update) =>
      this.http
        .patch(
          `${environment.API_URL}/checklists/${update.id}`,
          JSON.stringify(update.data)
        )
        .pipe(catchError((err) => this.handleError(err)))
    )
  );

  constructor() {
    // reducers
    merge(this.checklistAdded$, this.checklistEdited$, this.checklistRemoved$)
      .pipe(
        startWith(null),
        switchMap(() =>
          this.http
            .get<Checklist[]>(`${environment.API_URL}/checklists`)
            .pipe(catchError((err) => this.handleError(err)))
        ),
        takeUntilDestroyed()
      )
      .subscribe((checklists) =>
        this.state.update((state) => ({
          ...state,
          checklists,
          loaded: true,
        }))
      );
  }

  private handleError(err: any) {
    this.state.update((state) => ({ ...state, error: err }));
    return EMPTY;
  }
}
