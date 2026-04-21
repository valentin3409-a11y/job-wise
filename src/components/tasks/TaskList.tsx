'use client'
import { useState } from 'react'
import { Site, Task } from '@/lib/types'
import { COLORS, URGENCY_COLORS } from '@/lib/constants'
import { TEAM } from '@/lib/data'
import Avatar from '@/components/ui/Avatar'

interface Props {
  site: Site
  currentUserId: string
  onToggle: (id: string) => void
  onAdd: (text: string, priority: 'high' | 'med' | 'low', assign: string) => void
}

export default function TaskList({ site, currentUserId, onToggle, onAdd }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [newPriority, setNewPriority] = useState<'high' | 'med' | 'low'>('med')
  const [newAssign, setNewAssign] = useState(currentUserId)
  const [showDone, setShowDone] = useState(false)

  const urgentTasks = site.tasks.filter(t => !t.done && t.priority === 'high')
  const openTasks = site.tasks.filter(t => !t.done)
  const doneTasks = site.tasks.filter(t => t.done)
  const highTasks = site.tasks.filter(t => !t.done && t.priority === 'high')
  const medTasks = site.tasks.filter(t => !t.done && t.priority === 'med')
  const lowTasks = site.tasks.filter(t => !t.done && t.priority === 'low')

  function submitAdd() {
    if (!newText.trim()) return
    onAdd(newText.trim(), newPriority, newAssign)
    setNewText('')
    setNewPriority('med')
    setNewAssign(currentUserId)
    setShowAdd(false)
  }

  return (
    <div style={{ padding: 14, height: '100%', overflowY: 'auto' }}>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div className="stat-box" style={{ flex: 1, borderColor: `${COLORS.red}33` }}>
          <div className="stat-val" style={{ color: COLORS.red }}>{urgentTasks.length}</div>
          <div className="stat-lbl">Urgent</div>
        </div>
        <div className="stat-box" style={{ flex: 1, borderColor: `${COLORS.amber}33` }}>
          <div className="stat-val" style={{ color: COLORS.amber }}>{openTasks.length}</div>
          <div className="stat-lbl">Open</div>
        </div>
        <div className="stat-box" style={{ flex: 1, borderColor: `${COLORS.green}33` }}>
          <div className="stat-val" style={{ color: COLORS.green }}>{doneTasks.length}</div>
          <div className="stat-lbl">Done</div>
        </div>
      </div>

      {/* Add task area */}
      {showAdd ? (
        <div
          className="glass"
          style={{ borderRadius: 14, padding: 14, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <input
            autoFocus
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') submitAdd()
              if (e.key === 'Escape') setShowAdd(false)
            }}
            placeholder="Task description…"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as 'high' | 'med' | 'low')}
              style={{ flex: 1 }}
            >
              <option value="high">🔴 High</option>
              <option value="med">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            <select
              value={newAssign}
              onChange={e => setNewAssign(e.target.value)}
              style={{ flex: 1 }}
            >
              {TEAM.filter(m => site.teamIds.includes(m.id)).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-amber" onClick={submitAdd} style={{ flex: 1 }}>
              + Add Task
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: '100%',
            background: 'none',
            border: '1.5px dashed var(--border2)',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--w40)',
            cursor: 'pointer',
            marginBottom: 16,
            fontFamily: 'var(--font-head)',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--amber)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--amber)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--w40)'
          }}
        >
          + Add Task
        </button>
      )}

      {/* High priority */}
      {highTasks.length > 0 && (
        <TaskSection label="🔴 High Priority" col={COLORS.red}>
          {highTasks.map(t => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} isHigh />
          ))}
        </TaskSection>
      )}

      {/* Med priority */}
      {medTasks.length > 0 && (
        <TaskSection label="🟡 Medium Priority" col={COLORS.amber}>
          {medTasks.map(t => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} />
          ))}
        </TaskSection>
      )}

      {/* Low priority */}
      {lowTasks.length > 0 && (
        <TaskSection label="🟢 Low Priority" col={COLORS.green}>
          {lowTasks.map(t => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} />
          ))}
        </TaskSection>
      )}

      {/* Done section (collapsed) */}
      {doneTasks.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowDone(v => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 0',
              marginBottom: showDone ? 8 : 0,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.green, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ✅ Completed ({doneTasks.length})
            </span>
            <span style={{ fontSize: 12, color: 'var(--w40)' }}>{showDone ? '▲' : '▼'}</span>
          </button>
          {showDone && doneTasks.map(t => (
            <TaskRow key={t.id} task={t} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskSection({
  label, col, children,
}: {
  label: string
  col: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: col,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {label}
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${col}44, transparent)` }} />
      </div>
      {children}
    </div>
  )
}

function TaskRow({ task, onToggle, isHigh }: { task: Task; onToggle: (id: string) => void; isHigh?: boolean }) {
  const col = URGENCY_COLORS[task.priority] ?? COLORS.w60

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderLeft: isHigh && !task.done ? `2px solid ${COLORS.red}55` : '1px solid var(--border)',
        borderRadius: 12,
        marginBottom: 6,
        opacity: task.done ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: `2px solid ${task.done ? COLORS.green : col}`,
          background: task.done ? COLORS.green : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
          transition: 'all 0.15s',
        }}
        aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.done && (
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>
        )}
      </button>

      {/* Priority dot */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: col,
          flexShrink: 0,
          marginTop: 6,
        }}
      />

      {/* Text + due */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: task.done ? 'var(--w40)' : 'var(--w80)',
            textDecoration: task.done ? 'line-through' : 'none',
            lineHeight: 1.4,
            marginBottom: 4,
          }}
        >
          {task.text}
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--w40)' }}>
          📅 {task.due}
        </span>
      </div>

      {/* Assignee avatar */}
      <Avatar uid={task.assign} size={22} />
    </div>
  )
}
