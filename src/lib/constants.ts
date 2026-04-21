export const COLORS = {
  bg0: '#03030A',
  bg1: '#07070F',
  bg2: '#0C0C18',
  bg3: '#111120',
  bg4: '#161628',
  border:  '#1E1E35',
  border2: '#2A2A45',
  border3: '#3A3A60',
  w100: '#FFFFFF',
  w90:  '#E8E8F4',
  w80:  '#C0C0D8',
  w60:  '#8080A0',
  w40:  '#505068',
  w20:  '#282840',
  amber:   '#F59E0B',
  amber2:  '#FCD34D',
  red:     '#EF4444',
  red2:    '#F87171',
  green:   '#10B981',
  green2:  '#34D399',
  blue:    '#3B82F6',
  blue2:   '#60A5FA',
  indigo:  '#6366F1',
  indigo2: '#818CF8',
  purple:  '#8B5CF6',
  purple2: '#A78BFA',
  // legacy dim aliases
  redDim:   'rgba(239,68,68,0.1)',
  amberDim: 'rgba(245,158,11,0.08)',
  greenDim: 'rgba(16,185,129,0.1)',
  blueDim:  'rgba(59,130,246,0.1)',
}

export const ROLES = {
  pm:  { label: 'Project Manager', color: COLORS.amber,  color2: COLORS.amber2  },
  ss:  { label: 'Site Supervisor', color: COLORS.blue,   color2: COLORS.blue2   },
  tl:  { label: 'Team Leader',     color: COLORS.green,  color2: COLORS.green2  },
  sub: { label: 'Subcontractor',   color: COLORS.purple, color2: COLORS.purple2 },
}

export const TYPE_COL: Record<string, string> = {
  invoice:    COLORS.amber,
  compliance: COLORS.red,
  drawings:   COLORS.blue,
  safety:     COLORS.red,
  report:     COLORS.green,
  general:    COLORS.w60,
}

export const TYPE_ICO: Record<string, string> = {
  invoice:    '💳',
  compliance: '⚠️',
  drawings:   '📐',
  safety:     '🦺',
  report:     '📊',
  general:    '📧',
  message:    '💬',
  urgent:     '🚨',
  email:      '📧',
  plan:       '📐',
  takeoff:    '🔢',
}

export const URGENCY_COLORS: Record<string, string> = {
  high: COLORS.red,
  med:  COLORS.amber,
  low:  COLORS.green,
}

export const DISCIPLINE_EMO: Record<string, string> = {
  architectural: '🏛️',
  structural:    '🏗️',
  mechanical:    '🔧',
  electrical:    '⚡',
  plumbing:      '💧',
  civil:         '🛣️',
  landscape:     '🌿',
  site:          '📍',
  routing:       '🛣️',
  other:         '📋',
}

export const PLAN_CATEGORY_COLOR: Record<string, string> = {
  architectural: COLORS.amber,
  structural:    COLORS.blue,
  mechanical:    COLORS.green,
  electrical:    COLORS.amber2,
  plumbing:      COLORS.blue2,
  civil:         COLORS.purple,
  landscape:     COLORS.green2,
  site:          COLORS.indigo,
  routing:       COLORS.purple2,
  other:         COLORS.w60,
}
