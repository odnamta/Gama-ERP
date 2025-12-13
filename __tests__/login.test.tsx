import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginPage from '@/app/login/page'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign-in button', () => {
    render(<LoginPage searchParams={{}} />)
    
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('displays Gama ERP branding', () => {
    render(<LoginPage searchParams={{}} />)
    
    expect(screen.getByText('Gama ERP')).toBeInTheDocument()
    expect(screen.getByText('Logistics Management System')).toBeInTheDocument()
  })

  it('displays error message when error param is present', () => {
    render(<LoginPage searchParams={{ error: 'Authentication failed' }} />)
    
    expect(screen.getByText('Authentication failed')).toBeInTheDocument()
  })

  it('displays info message when message param is present', () => {
    render(<LoginPage searchParams={{ message: 'Please sign in to continue' }} />)
    
    expect(screen.getByText('Please sign in to continue')).toBeInTheDocument()
  })

  it('shows loading state when sign-in button is clicked', async () => {
    render(<LoginPage searchParams={{}} />)
    
    const button = screen.getByRole('button', { name: /sign in with google/i })
    fireEvent.click(button)
    
    expect(await screen.findByText(/signing in/i)).toBeInTheDocument()
  })

  it('disables button during loading state', async () => {
    render(<LoginPage searchParams={{}} />)
    
    const button = screen.getByRole('button', { name: /sign in with google/i })
    fireEvent.click(button)
    
    expect(button).toBeDisabled()
  })
})
