import { createUser, getUserByEmail } from '@/lib/auth-d1';
import { z } from 'zod';

export const runtime = 'edge';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organization: z.string().optional(),
  phone: z.string().optional(),
  region: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, name, organization, phone, region } = validationResult.data;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return Response.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser({
      email,
      password,
      name,
      organization,
      phone,
      region,
      role: 'citizen', // Default role
    });

    // Return safe user data (without password hash)
    return Response.json({
      success: true,
      message: 'Account created successfully',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
        phone: user.phone,
        region: user.region,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
