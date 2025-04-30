import { Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { connect } from 'ngxtension/connect';
import { map, merge, Subject } from 'rxjs';

export type LoginStatus = 'pending' | 'authenticating' | 'success' | 'error';

interface LoginState {
  status: LoginStatus;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  // state
  private state = signal<LoginState>({
    status: 'pending',
  });

  // sources
  error$ = new Subject<any>();
  // Credentials
  login$ = new Subject<any>();
  userAuthenticated$ = new Subject<any>();

  constructor() {
    // reducers

    // 1
    this.userAuthenticated$.pipe(takeUntilDestroyed()).subscribe(() =>
      this.state.update((state) => ({
        ...state,
        status: 'success',
      }))
    );

    this.login$.pipe(takeUntilDestroyed()).subscribe(() =>
      this.state.update((state) => ({
        ...state,
        status: 'authenticating',
      }))
    );

    this.error$.pipe(takeUntilDestroyed()).subscribe(() =>
      this.state.update((state) => ({
        ...state,
        status: 'error',
      }))
    );

    // 2
    const nextState$ = merge(
      this.userAuthenticated$.pipe(map(() => ({ status: 'success' as const }))),
      this.login$.pipe(map(() => ({ status: 'authenticating' as const }))),
      this.error$.pipe(map(() => ({ status: 'error' as const })))
    );

    connect(this.state).with(nextState$);

    //3
    connect(this.state).with(
      this.userAuthenticated$.pipe(map(() => ({ status: 'success' as const })))
    );
    connect(this.state).with(
      this.login$.pipe(map(() => ({ status: 'authenticating' as const })))
    );
    connect(this.state).with(
      this.error$.pipe(map(() => ({ status: 'error' as const })))
    );
  }
}
