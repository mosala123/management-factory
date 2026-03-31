// lib/auth-utils.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/types/api';
import { ROLE_PERMISSIONS } from '@/lib/auth-role';

export async function checkAuth() {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            authorized: false,
            user: null,
            role: null,
        };
    }

    // Get user role
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    return {
        authorized: true,
        user,
        role: userData?.role,
    };
}

export function unauthorizedResponse(message: string = 'Not authenticated') {
    return NextResponse.json(
        {
            success: false,
            error: { code: 'UNAUTHORIZED', message },
        } as ApiResponse,
        { status: 401 }
    );
}

export function forbiddenResponse(message: string = 'Insufficient permissions') {
    return NextResponse.json(
        {
            success: false,
            error: { code: 'FORBIDDEN', message },
        } as ApiResponse,
        { status: 403 }
    );
}

export function validationErrorResponse(details: any) {
    return NextResponse.json(
        {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details,
            },
        } as ApiResponse,
        { status: 400 }
    );
}

export function checkPermission(role: string, permission: keyof typeof ROLE_PERMISSIONS.admin): boolean {
    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    return permissions ? permissions[permission] : false;
}

export async function requireAuth(minRole?: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return { authorized: false, error: unauthorizedResponse() };
    }

    if (minRole) {
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const allowedRoles = ['admin', 'inventory_supervisor', 'product_supervisor'];
        if (!userData?.role || !allowedRoles.includes(userData.role)) {
            return { authorized: false, error: forbiddenResponse('Only admins and supervisors can perform this action') };
        }
    }

    return { authorized: true };
}
