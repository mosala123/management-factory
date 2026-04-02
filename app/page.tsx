// app/page.tsx
// ─── Server Component ─────────────────────────────────────────────────────────
// نقطة دخول التطبيق — يحوّل المستخدم تلقائياً:
//   • لو مسجل دخوله  → /dashboard
//   • لو مش مسجل     → /admin/login

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  redirect('/admin/login')
}