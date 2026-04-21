'use client'
import { Site } from '@/lib/types'
import Avatar from '@/components/ui/Avatar'

interface Props {
  site: Site | null
  onBack: () => void
  onNotifsClick: () => void
  unreadCount: number
}

export default function TopBar({ site, onBack, onNotifsClick, unreadCount }: Props) {
  const teamIds = site?.teamIds.slice(0, 3) ?? []
  const overflow = site ? Math.max(0, site.teamIds.length - 3) : 0

  return (
    <div className="topbar">
      {/* Left side */}
      {site ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Back button */}
          <button
            onClick={onBack}
            className="btn btn-ghost btn-icon"
            style={{ width: 34, height: 34, fontSize: 16 }}
            aria-label="Go back"
          >
            ←
          </button>
          {/* Colored dot */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: site.color,
              boxShadow: `0 0 8px ${site.color}`,
              flexShrink: 0,
            }}
          />
          {/* Site name */}
          <span
            className="truncate"
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--w90)', maxWidth: 140 }}
          >
            {site.name}
          </span>
          {/* Separator */}
          <span style={{ color: 'var(--border3)', fontSize: 12, flexShrink: 0 }}>|</span>
          {/* Phase */}
          <span style={{ fontSize: 10, color: 'var(--w40)', flexShrink: 0 }}>{site.phase}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* F Logo */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(125deg, var(--amber), var(--amber2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 900,
              color: '#000',
              fontFamily: 'var(--font-mono)',
              flexShrink: 0,
            }}
          >
            F
          </div>
          {/* FOREMAN wordmark */}
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--w90)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
            }}
          >
            FOREMAN
          </span>
          {/* Separator */}
          <span style={{ color: 'var(--border3)', fontSize: 12 }}>|</span>
          {/* Tagline */}
          <span
            style={{
              fontSize: 9,
              color: 'var(--amber)',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}
          >
            SITE HUB
          </span>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side: team avatars (only when site active) */}
      {site && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {teamIds.map((uid, i) => (
            <div key={uid} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: teamIds.length - i }}>
              <Avatar uid={uid} size={26} />
            </div>
          ))}
          {overflow > 0 && (
            <div
              style={{
                marginLeft: -6,
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--bg4)',
                border: '1.5px solid var(--border2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--w60)',
                fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}
            >
              +{overflow}
            </div>
          )}
        </div>
      )}

      {/* Bell button */}
      <button
        onClick={onNotifsClick}
        className="btn btn-ghost btn-icon"
        style={{ position: 'relative', fontSize: 18 }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            className="badge"
            style={{
              position: 'absolute',
              top: 2,
              right: 1,
              minWidth: 15,
              height: 15,
              fontSize: 8,
              padding: '0 3px',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
