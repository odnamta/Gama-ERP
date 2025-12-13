import { Sidebar } from '@/components/layout/sidebar'
import { Header, UserInfo } from '@/components/layout/header'
import { Toaster } from '@/components/ui/toaster'
import { createClient } from '@/lib/supabase/server'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userInfo: UserInfo | null = user ? {
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User',
    email: user.email || '',
    avatarUrl: user.user_metadata?.avatar_url || null,
  } : null

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={userInfo} />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
