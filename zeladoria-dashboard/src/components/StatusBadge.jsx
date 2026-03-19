import { STATUS, CRITICIDADE } from '../data/mockData.js'

export function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.ABERTO
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export function CriticidadeBadge({ criticidade }) {
  const cfg = CRITICIDADE[criticidade] || CRITICIDADE.MEDIA
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  )
}
