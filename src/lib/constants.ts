export const COLORS = {
  bg0: '#08080B',
  bg1: '#0E0E12',
  bg2: '#14141A',
  bg3: '#1C1C24',
  border: '#2A2A36',
  border2: '#3A3A4A',
  w100: '#FFFFFF',
  w80: '#C8C8D8',
  w60: '#8888A0',
  w40: '#55556A',
  w20: '#2A2A36',
  amber: '#F5A623',
  amberDim: '#3D2E0A',
  red: '#FF4444',
  redDim: '#3D0A0A',
  green: '#4CAF50',
  greenDim: '#0A2E0A',
  blue: '#4DA6FF',
  blueDim: '#0A1E3D',
  purple: '#9B59B6',
  purpleDim: '#1E0A2E',
}

export const ROLES = {
  pm:  { label: 'Project Manager', color: COLORS.amber },
  ss:  { label: 'Site Supervisor', color: COLORS.blue },
  tl:  { label: 'Team Leader',     color: COLORS.green },
  sub: { label: 'Subcontractor',   color: COLORS.purple },
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
}

export const URGENCY_COLORS: Record<string, string> = {
  high: COLORS.red,
  med:  COLORS.amber,
  low:  COLORS.green,
}
