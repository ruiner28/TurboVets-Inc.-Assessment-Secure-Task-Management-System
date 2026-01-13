import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock window.alert
    Object.defineProperty(window, 'alert', {
      value: jest.fn(),
      writable: true,
    });

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, ReactiveFormsModule],
      providers: [
        {
          provide: Router,
          useValue: { navigate: jest.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize form', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')).toBeDefined();
    expect(component.loginForm.get('password')).toBeDefined();
  });

  it('should login successfully', () => {
    const loginData = { email: 'test@example.com', password: 'password' };
    component.loginForm.setValue(loginData);

    jest.spyOn(localStorage, 'setItem');

    component.onSubmit();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ access_token: 'token' });

    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'token');
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('should handle login failure', () => {
    const loginData = { email: 'test@example.com', password: 'wrong' };
    component.loginForm.setValue(loginData);

    jest.spyOn(window, 'alert').mockImplementation(() => {});

    component.onSubmit();

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(window.alert).toHaveBeenCalledWith('Login failed');
  });

  it('should not submit if form invalid', () => {
    component.loginForm.setValue({ email: '', password: '' });

    component.onSubmit();

    httpMock.expectNone('/api/auth/login');
  });
});