'use client'
import { useState } from 'react'
import { Site, Task } from '@/lib/types'
import { COLORS, URGENCY_COLORS } from '@/lib/constants'
import Avatar from '@/components/ui/Avatar'

interface Props {
  site: Site
  currentUserId: string
  onToggle: (taskId: string) => void
  onAdd: (text: string) => void
}

export default function TaskList({ site, currentUserId, onToggle, onAdd }: Props) {
  const [addingTask, setAddingTask] = useState(false)
  const [newText, setNewText] = useState('')

  const urgent = site.tasks.filter(t => !t.done && t.priority === 'high')
  const open = site.tasks.filter(t => !t.done)
  const done = site.tasks.filter(t => t.done)
  const highTasks = site.tasks.filter(t => !t.done && t.priority === 'high')
  const medTasks = site.tasks.filter(t => !t.done && t.priority === 'med')

  function submitAdd() {
    if (!newText.trim()) return
    onAdd(newText.trim())
    setNewText('')
    setAddingTask(false)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px' }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            flex: 1,
            background: COLORS.redDim,
            border: `1px solid ${COLORS.red}44`,
            borderRadius: 10,
            padding: '10px 12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.red }}>{urgent.length}</div>
          <div style={{ fontSize: 10, color: COLORS.red, fontWeight: 600 }}>URGENT</div>
        </div>
        <div
          style={{
            flex: 1,
            background: COLORS.amberDim,
            border: `1px solid ${COLORS.amber}44`,
            borderRadius: 10,
            padding: '10px 12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.amber }}>{open.length}</div>
          <div style={{ fontSize: 10, color: COLORS.amber, fontWeight: 600 }}>OPEN</div>
        </div>
        <div
          style={{
            flex: 1,
            background: COLORS.greenDim,
            border: `1px solid ${COLORS.green}44`,
            borderRadius: 10,
            padding: '10px 12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.green }}>{done.length}</div>
          <div style={{ fontSize: 10, color: COLORS.green, fontWeight: 600 }}>DONE</div>
        </div>
      </div>

      {/* Add task input */}
      {addingTask && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            autoFocus
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitAdd(); if (e.key === 'Escape') setAddingTask(false) }}
            placeholder="New task description…"
            style={{
              flex: 1,
              background: COLORS.bg3,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '8px 12px',
              color: COLORS.w80,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={submitAdd}
            style={{
              background: site.color,
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 700,
              color: '#000',
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setAddingTask(true)}
        style={{
          width: '100%',
          background: 'none',
          border: `1.5px dashed ${COLORS.border2}`,
          borderRadius: 10,
          padding: '10px',
          fontSize: 12,
          color: COLORS.w40,
          cursor: 'pointer',
          marginBottom: 16,
          fontWeight: 600,
        }}
      >
        + ADD TASK
      </button>

      {/* HIGH priority */}
      {highTasks.length > 0 && (
        <Section label="🔴 HIGH PRIORITY" col={COLORS.red}>
          {highTasks.map(t => <TaskRow key={t.id} task={t} onToggle={onToggle} />)}
        </Section>
      )}

      {/* MED priority */}
      {medTasks.length > 0 && (
        <Section label="🟡 MEDIUM PRIORITY" col={COLORS.amber}>
          {medTasks.map(t => <TaskRow key={t.id} task={t} onToggle={onToggle} />)}
        </Section>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <Section label="✅ COMPLETED" col={COLORS.green}>
          {done.map(t => <TaskRow key={t.id} task={t} onToggle={onToggle} />)}
        </Section>
      )}
    </div>
  )
}

function Section({ label, col, children }: { label: string; col: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: col, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  )
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const col = URGENCY_COLORS[task.priority] ?? COLORS.w60
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        background: COLORS.bg2,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        marginBottom: 6,
        opacity: task.done ? 0.5 : 1,
      }}
    >
      <button
        onClick={() => onToggle(task.id)}
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `2px solid ${task.done ? COLORS.green : col}`,
          background: task.done ? COLORS.green : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {task.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: COLORS.w80,
            textDecoration: task.done ? 'line-through' : 'none',
            lineHeight: 1.4,
          }}
        >
          {task.text}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: COLORS.w40 }}>📅 {task.due}</span>
        </div>
      </div>
      <Avatar uid={task.assign} size={22} />
    </div>
  )
}
