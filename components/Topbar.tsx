'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Topbar() {
  const router = useRouter()

  async function logout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <div className="topbar">
      <Link href="/dashboard" className="topbar-logo">
        Job<span>Wise</span>
      </Link>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link href="/analyze" className="btn btn-gold btn-sm">+ Nouvelle recherche</Link>
        <button onClick={logout} className="btn btn-sm">Déconnexion</button>
      </div>
    </div>
  )
}
