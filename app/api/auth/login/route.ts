import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Mock authentication for demonstration
    if (email === 'admin@example.com' && password === 'password') {
      return NextResponse.json(
        { 
          success: true,
          user: { 
            id: '1', 
            email, 
            role: 'ADMIN' 
          },
          token: 'mock-jwt-token'
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}