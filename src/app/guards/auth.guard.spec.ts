import { BehaviorSubject } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  it('waits for Firebase auth restoration before deciding', () => {
    const user$ = new BehaviorSubject<any>(undefined);
    const redirect = {};
    const router = {
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue(redirect)
    };
    const guard = new AuthGuard({ user$ } as AuthService, router as any);
    let result: any;

    guard.canActivate().subscribe(value => result = value);

    expect(result).toBeUndefined();
    user$.next(null);
    expect(result).toBe(redirect);
  });

  it('allows an authenticated user after restoration', () => {
    const user$ = new BehaviorSubject<any>(undefined);
    const router = { createUrlTree: jasmine.createSpy('createUrlTree') };
    const guard = new AuthGuard({ user$ } as AuthService, router as any);
    let result: any;

    guard.canActivate().subscribe(value => result = value);
    user$.next({ uid: 'trainer-1' });

    expect(result).toBeTrue();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });
});
