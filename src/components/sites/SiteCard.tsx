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

const STATUS_COL: Record<string, string> = {
  active:   COLORS.green,
  delayed:  COLORS.red,
  paused:   COLORS.w60,
  complete: COLORS.blue,
}

export default function SiteCard({ site, onClick }: Props) {
  const unreadEmails = site.emails.filter(e => !e.read).length
  const openTasks = site.tasks.filter(t => !t.done).length
  const statusColor = STATUS_COL[site.status] ?? COLORS.w60

  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.bg2,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${site.color}`,
        borderRadius: 12,
        padding: '16px',
        cursor: 'pointer',
        transition: 'background 0.15s',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.w80, marginBottom: 2 }}>{site.name}</div>
          <div style={{ fontSize: 12, color: COLORS.w60 }}>{site.client}</div>
          <div style={{ fontSize: 11, color: COLORS.w40, marginTop: 1 }}>{site.address.split(',')[0]}</div>
        </div>
        <Chip label={site.status.toUpperCase()} col={statusColor} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <ProgressBar val={site.progress} col={site.color} h={5} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: site.color }}>{site.progress}%</span>
        {unreadEmails > 0 && (
          <span style={{ fontSize: 11, color: COLORS.amber, fontWeight: 600 }}>📧 {unreadEmails} unread</span>
        )}
        {openTasks > 0 && (
          <span style={{ fontSize: 11, color: COLORS.blue, fontWeight: 600 }}>✅ {openTasks} open</span>
        )}
        <span style={{ fontSize: 11, color: COLORS.w40 }}>{site.phase}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {site.teamIds.slice(0, 4).map((uid, i) => (
            <div key={uid} style={{ marginLeft: i > 0 ? -6 : 0 }}>
              <Avatar uid={uid} size={24} />
            </div>
          ))}
        </div>
        <span style={{ fontSize: 11, color: COLORS.w40 }}>{site.teamIds.length} members</span>
      </div>
    </div>
  )
}
