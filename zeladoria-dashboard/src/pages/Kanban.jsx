import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext, closestCorners, DragOverlay,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MapPin, Eye, Filter, Calendar, MoreHorizontal, Zap, Share2, Download } from 'lucide-react'
import { ocorrenciasAPI } from '../api/zeladoria.js'
import { CATEGORIAS, STATUS } from '../data/mockData.js'
import Header from '../components/Header.jsx'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLUNAS = [
  { id: 'ABERTO',    label: 'Triagem',      dot: 'bg-slate-400',  colBg: 'bg-slate-50' },
  { id: 'TRIAGEM',   label: 'Em Triagem',   dot: 'bg-yellow-400', colBg: 'bg-yellow-50/30' },
  { id: 'ANALISE',   label: 'Em Análise',   dot: 'bg-blue-400',   colBg: 'bg-blue-50/30' },
  { id: 'EXECUCAO',  label: 'Equipe na Rua', dot: 'bg-green-500',  colBg: 'bg-green-50/30', dashed: true },
  { id: 'CONCLUIDO', label: 'Finalizado',   dot: 'bg-slate-300',  colBg: 'bg-slate-50', muted: true },
]

const CRITICIDADE_COLORS = {
  ALTA:  { badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  MEDIA: { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  BAIXA: { badge: 'bg-slate-50 text-slate-400',  dot: 'bg-slate-300' },
}

function KanbanCard({ oc, isDragging }) {
  const cat = CATEGORIAS[oc.categoria]
  const crit = CRITICIDADE_COLORS[oc.criticidade] || CRITICIDADE_COLORS.MEDIA
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-xl rotate-2 opacity-90' : ''} ${oc.status === 'EXECUCAO' ? 'border-l-4 border-green-500' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold text-slate-400">{oc.protocolo}</span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${crit.dot}`} />
      </div>
      <h4 className="text-sm font-bold text-blue-900 mb-1 line-clamp-2">{oc.descricao}</h4>
      <p className="text-xs text-on-surface-variant mb-4 flex items-center gap-1">
        <MapPin className="w-3 h-3 flex-shrink-0" />
        {oc.bairro}
      </p>
      <div className="flex items-center justify-between">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold">
          {oc.cidadao?.anonimo ? 'A' : oc.cidadao?.nome?.charAt(0) || '?'}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${crit.badge}`}>
            {oc.criticidade === 'ALTA' ? 'High Priority' : oc.criticidade === 'MEDIA' ? 'Medium' : 'Low'}
          </span>
          <Link to={`/ocorrencias/${oc.id}`} onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-primary p-0.5 rounded transition">
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function SortableCard({ oc }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: oc.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }} {...attributes} {...listeners}>
      <KanbanCard oc={oc} />
    </div>
  )
}

function Coluna({ col, cards }) {
  return (
    <div className="flex-shrink-0 w-80 flex flex-col">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${col.dot}`} />
          <h3 className="font-bold text-on-surface-variant uppercase tracking-wider text-xs">{col.label}</h3>
          <span className="bg-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold text-slate-600">
            {String(cards.length).padStart(2, '0')}
          </span>
        </div>
        <button className="text-slate-400 hover:text-primary transition-colors p-1 rounded">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <div className={`flex-1 ${col.colBg} rounded-2xl p-3 space-y-4 min-h-48 ${col.dashed ? 'border-2 border-dashed border-green-200' : ''} ${col.muted ? 'opacity-70' : ''}`}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(oc => <SortableCard key={oc.id} oc={oc} />)}
        </SortableContext>
        {cards.length === 0 && (
          <div className="h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
            <p className="text-xs text-slate-300">Solte aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Kanban() {
  const [columns, setColumns] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  async function carregar() {
    setLoading(true)
    try {
      const res = await ocorrenciasAPI.listar({})
      const grouped = {}
      COLUNAS.forEach(c => { grouped[c.id] = [] })
      res.data.forEach(oc => {
        if (grouped[oc.status]) grouped[oc.status].push(oc)
        else grouped['ABERTO'].push(oc)
      })
      setColumns(grouped)
    } catch {
      toast.error('Erro ao carregar kanban')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function findColuna(id) {
    for (const [col, items] of Object.entries(columns)) {
      if (items.find(i => i.id === id)) return col
    }
    return null
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return
    const fromCol = findColuna(active.id)
    const toCol = COLUNAS.find(c => c.id === over.id)?.id || findColuna(over.id)
    if (!fromCol || !toCol) return
    if (fromCol !== toCol) {
      setColumns(prev => {
        const fromItems = prev[fromCol].filter(i => i.id !== active.id)
        const movedItem = prev[fromCol].find(i => i.id === active.id)
        if (!movedItem) return prev
        return { ...prev, [fromCol]: fromItems, [toCol]: [...prev[toCol], { ...movedItem, status: toCol }] }
      })
      try {
        await ocorrenciasAPI.atualizarStatus(active.id, toCol, 'Movido via Kanban')
        toast.success(`Movido para "${STATUS[toCol]?.label}"`)
      } catch {
        toast.error('Erro ao atualizar')
        carregar()
      }
    } else {
      setColumns(prev => {
        const items = prev[fromCol]
        const oldIdx = items.findIndex(i => i.id === active.id)
        const newIdx = items.findIndex(i => i.id === over.id)
        return { ...prev, [fromCol]: arrayMove(items, oldIdx, newIdx) }
      })
    }
  }

  const activeItem = activeId ? Object.values(columns).flat().find(i => i.id === activeId) : null

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header title="Kanban Board" subtitle="Gerencie e despache equipes de resposta" onRefresh={carregar} loading={loading} />

      <div className="p-8 flex-1 overflow-x-auto">
        {/* Page title + actions */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight">Status Management</h2>
            <p className="text-on-surface-variant font-medium text-sm mt-1">Gerencie e despache equipes de resposta municipal</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-surface-container-highest transition-colors border border-slate-200">
              <Filter className="w-4 h-4" />
              Filtrar
            </button>
            <button className="px-4 py-2 bg-surface-container-high rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-surface-container-highest transition-colors border border-slate-200">
              <Calendar className="w-4 h-4" />
              Hoje
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={({ active }) => setActiveId(active.id)} onDragEnd={handleDragEnd}>
            <div className="flex gap-6 w-max min-w-full min-h-[calc(100vh-280px)]">
              {COLUNAS.map(col => <Coluna key={col.id} col={col} cards={columns[col.id] || []} />)}
            </div>
            <DragOverlay>
              {activeItem && <div className="w-80 rotate-3 shadow-2xl"><KanbanCard oc={activeItem} isDragging /></div>}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Floating panel */}
      <div className="fixed bottom-8 right-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 flex items-center gap-6 border border-slate-200">
        <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface">System Efficiency</p>
            <p className="text-[10px] text-secondary font-bold">94% Response Rate</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
            <Share2 className="w-4 h-4 text-slate-500" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
            <Download className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  )
}
