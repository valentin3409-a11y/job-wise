'use client'
import { Site } from '@/lib/types'
import { COLORS } from '@/lib/constants'
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
    <div
      style={{
        height: 54,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: COLORS.bg1 + 'E6',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
      }}
    >
      {/* Logo / back */}
      {site ? (
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 0,
          }}
        >
          <span style={{ color: COLORS.w60, fontSize: 18 }}>←</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: site.color,
                boxShadow: `0 0 6px ${site.color}`,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.w80, lineHeight: 1.2 }}>{site.shortName}</div>
              <div style={{ fontSize: 10, color: COLORS.w60 }}>{site.phase}</div>
            </div>
          </div>
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${COLORS.amber}, #E8913A)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 900,
              color: '#000',
              fontFamily: 'var(--font-mono)',
            }}
          >
            F
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.w80, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>FOREMAN</div>
            <div style={{ fontSize: 9, color: COLORS.amber, letterSpacing: '0.15em', fontWeight: 700 }}>SITE HUB</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Team avatars */}
      {site && (
        <div style={{ display: 'flex', alignItems: 'center', gap: -6 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {teamIds.map((uid, i) => (
              <div key={uid} style={{ marginLeft: i > 0 ? -6 : 0 }}>
                <Avatar uid={uid} size={26} />
              </div>
            ))}
          </div>
          {overflow > 0 && (
            <div
              style={{
                marginLeft: -6,
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: COLORS.border2,
                border: `1.5px solid ${COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: COLORS.w60,
                fontWeight: 700,
              }}
            >
              +{overflow}
            </div>
          )}
        </div>
      )}

      {/* Bell */}
      <button
        onClick={onNotifsClick}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: COLORS.red,
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount}
          </div>
        )}
      </button>
    </div>
  )
}
