import { BehaviorSubject } from 'rxjs';
import { LoginGuard } from './login.guard';
import { AuthService } from '../services/auth.service';

describe('LoginGuard', () => {
  it('allows the login page when no user is restored', () => {
    const user$ = new BehaviorSubject<any>(undefined);
    const router = { createUrlTree: jasmine.createSpy('createUrlTree') };
    const guard = new LoginGuard({ user$ } as AuthService, router as any);
    let result: any;

    guard.canActivate().subscribe(value => result = value);
    user$.next(null);

    expect(result).toBeTrue();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects an authenticated user away from login', () => {
    const user$ = new BehaviorSubject<any>(undefined);
    const redirect = {};
    const router = {
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue(redirect)
    };
    const guard = new LoginGuard({ user$ } as AuthService, router as any);
    let result: any;

    guard.canActivate().subscribe(value => result = value);
    user$.next({ uid: 'trainer-1' });

    expect(result).toBe(redirect);
  });
});
