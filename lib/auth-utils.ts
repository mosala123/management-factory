import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/types/api';
import { ROLE_PERMISSIONS, resolveUserRole } from '@/lib/auth-role';

// تعريف هرمية الأدوار (كلما زاد الرقم، زادت الصلاحية)
const ROLE_HIERARCHY: Record<string, number> = {
    'user': 0,
    'product_supervisor': 1,
    'inventory_supervisor': 1,
    'admin': 2,
};

async function getResolvedAuthRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, email?: string | null) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

    const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', userId)
        .maybeSingle();

    return {
        role: resolveUserRole(email, userRoleData?.role || profile?.role),
        isActive: userRoleData?.is_active ?? true,
    };
}

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

    const resolvedAuth = await getResolvedAuthRole(supabase, user.id, user.email);

    return {
        authorized: true,
        user,
        role: resolvedAuth.role,
    };
}

export function unauthorizedResponse(message: string = 'غير مصرح به') {
    return NextResponse.json(
        {
            success: false,
            error: { code: 'UNAUTHORIZED', message },
        } as ApiResponse,
        { status: 401 }
    );
}

export function forbiddenResponse(message: string = 'لا تملك الصلاحية الكافية') {
    return NextResponse.json(
        {
            success: false,
            error: { code: 'FORBIDDEN', message },
        } as ApiResponse,
        { status: 403 }
    );
}

export function validationErrorResponse(details: unknown) {
    return NextResponse.json(
        {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'فشل التحقق من صحة البيانات',
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

/**
 * التحقق من الصلاحيات بناءً على الحد الأدنى المطلوب
 * @param minRole - الحد الأدنى من الصلاحية المطلوبة (admin, supervisor, user)
 * @param exactRole - إذا كان true، يجب أن يكون الدور مطابقاً تماماً
 */
export async function requireAuth(minRole?: string, exactRole: boolean = false) {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return { authorized: false, error: unauthorizedResponse() };
    }

    // إذا لم يكن هناك حد أدنى مطلوب، فقط تحقق من وجود مستخدم
    if (!minRole) {
        return { authorized: true, user };
    }

    // جلب دور المستخدم
    const resolvedAuth = await getResolvedAuthRole(supabase, user.id, user.email);

    // التحقق من أن الحساب نشط
    if (!resolvedAuth.isActive) {
        return { authorized: false, error: forbiddenResponse('الحساب غير نشط') };
    }

    // التحقق من وجود دور
    if (!resolvedAuth.role) {
        return { authorized: false, error: forbiddenResponse('لا يوجد دور محدد للمستخدم') };
    }

    // إذا كان المطلوب دوراً محدداً بالضبط
    if (exactRole) {
        if (resolvedAuth.role !== minRole) {
            return { 
                authorized: false, 
                error: forbiddenResponse(`هذه العملية تتطلب دور ${minRole}`) 
            };
        }
        return { authorized: true, user, role: resolvedAuth.role };
    }

    // التحقق من هرمية الأدوار
    const userRoleLevel = ROLE_HIERARCHY[resolvedAuth.role] ?? -1;
    const requiredRoleLevel = ROLE_HIERARCHY[minRole] ?? -1;

    if (userRoleLevel < requiredRoleLevel) {
        return { 
            authorized: false, 
            error: forbiddenResponse(`هذه العملية تتطلب صلاحيات أعلى (مطلوب: ${minRole})`) 
        };
    }

    return { authorized: true, user, role: resolvedAuth.role };
}

/**
 * دالة مساعدة للتحقق من أدوار متعددة (مرنة أكثر)
 * @param allowedRoles - قائمة الأدوار المسموح بها
 */
export async function requireAnyRole(allowedRoles: string[]) {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return { authorized: false, error: unauthorizedResponse() };
    }

    const resolvedAuth = await getResolvedAuthRole(supabase, user.id, user.email);

    if (!resolvedAuth.isActive) {
        return { authorized: false, error: forbiddenResponse('الحساب غير نشط') };
    }

    if (!resolvedAuth.role) {
        return { authorized: false, error: forbiddenResponse('لا يوجد دور محدد للمستخدم') };
    }

    if (!allowedRoles.includes(resolvedAuth.role)) {
        return { 
            authorized: false, 
            error: forbiddenResponse(`هذه العملية تتطلب أحد الأدوار: ${allowedRoles.join('، ')}`) 
        };
    }

    return { authorized: true, user, role: resolvedAuth.role };
}