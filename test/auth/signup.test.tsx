import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUpPage from '@/app/(auth)/signup/page';
import * as authActions from '@/app/actions/auth';

vi.mock('@/app/actions/auth');

describe('SignUp Page', () => {
  it('renders signup form with email and password fields', () => {
    render(<SignUpPage />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('calls signUp action with form data on submit', async () => {
    const mockSignUp = vi.mocked(authActions.signUp);
    mockSignUp.mockResolvedValue({ success: true, data: { user: { id: '123', app_metadata: {}, user_metadata: {}, aud: '', created_at: new Date().toISOString() }, session: null } });

    render(<SignUpPage />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });
  });

  it('displays error message on signup failure', async () => {
    const mockSignUp = vi.mocked(authActions.signUp);
    mockSignUp.mockResolvedValue({ 
      success: false, 
      error: 'Email already exists' 
    });

    render(<SignUpPage />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });
});
