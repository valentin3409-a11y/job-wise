'use client'
import { Site } from '@/lib/types'
import { COLORS } from '@/lib/constants'
import Avatar from '@/components/ui/Avatar'
import ProgressBar from '@/components/ui/ProgressBar'
import Chip from '@/components/ui/Chip'

interface Props {
  site: Site
  onClick: () => void
}

const STATUS_LABEL: Record<string, string> = {
  active:   'ACTIVE',
  delayed:  'DELAYED',
  paused:   'PAUSED',
  complete: 'COMPLETE',
}

const STATUS_COL: Record<string, string> = {
  active:   COLORS.green,
  delayed:  COLORS.amber,
  paused:   COLORS.w60,
  complete: COLORS.indigo,
}

export default function SiteCard({ site, onClick }: Props) {
  const unreadEmails = site.emails.filter(e => !e.read).length
  const openTasks = site.tasks.filter(t => !t.done).length
  const statusColor = STATUS_COL[site.status] ?? COLORS.w60

  const budgetPct = Math.round((site.spent / site.budget) * 100)
  const budgetColor = budgetPct >= 80 ? COLORS.red : COLORS.amber
  const budgetOver = budgetPct > 100

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${site.color}`,
        borderRadius: 16,
        padding: 16,
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 12,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border3)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${site.color}22`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLDivElement).style.borderLeftColor = site.color
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Shine accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, ${site.color}33, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Top row: name + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--w90)' }}>{site.name}</span>
        <Chip label={STATUS_LABEL[site.status] ?? site.status} col={statusColor} />
      </div>

      {/* Client + address */}
      <div style={{ fontSize: 12, color: 'var(--w60)', marginBottom: 2 }}>{site.client}</div>
      <div style={{ fontSize: 11, color: 'var(--w40)', marginBottom: 12 }}>{site.address.split(',')[0]}</div>

      {/* Progress bar */}
      <div style={{ marginBottom: 8 }}>
        <ProgressBar val={site.progress} col={site.color} h={3} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: site.color,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {site.progress}%
        </span>
        {unreadEmails > 0 && (
          <span style={{ fontSize: 11, color: COLORS.amber, fontWeight: 600 }}>
            📧 {unreadEmails}
          </span>
        )}
        {openTasks > 0 && (
          <span style={{ fontSize: 11, color: COLORS.blue, fontWeight: 600 }}>
            ✅ {openTasks}
          </span>
        )}
        <span style={{ fontSize: 10, color: 'var(--w40)', marginLeft: 'auto' }}>{site.phase}</span>
      </div>

      {/* Team avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {site.teamIds.slice(0, 4).map((uid, i) => (
            <div key={uid} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: site.teamIds.length - i }}>
              <Avatar uid={uid} size={24} />
            </div>
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--w40)' }}>{site.teamIds.length} members</span>
      </div>

      {/* Budget bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--w40)', textTransform: 'uppercase' }}>
            Budget
          </span>
          <span
            style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: budgetColor,
            }}
          >
            {budgetPct}%{budgetOver ? ' ⚠' : ''}
          </span>
        </div>
        <ProgressBar val={Math.min(budgetPct, 100)} col={budgetColor} h={2} />
      </div>
    </div>
  )
}
