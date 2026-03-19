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
import { GripVertical, MapPin, User, Eye, RefreshCw } from 'lucide-react'
import { ocorrenciasAPI } from '../api/zeladoria.js'
import { CATEGORIAS, STATUS } from '../data/mockData.js'
import { CriticidadeBadge } from '../components/StatusBadge.jsx'
import Header from '../components/Header.jsx'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLUNAS = [
  { id: 'ABERTO',    label: 'Aberto',       color: 'border-red-400',    bg: 'bg-red-50',    dot: 'bg-red-400' },
  { id: 'TRIAGEM',   label: 'Em Triagem',   color: 'border-yellow-400', bg: 'bg-yellow-50', dot: 'bg-yellow-400' },
  { id: 'ANALISE',   label: 'Em Análise',   color: 'border-blue-400',   bg: 'bg-blue-50',   dot: 'bg-blue-400' },
  { id: 'EXECUCAO',  label: 'Em Execução',  color: 'border-purple-400', bg: 'bg-purple-50', dot: 'bg-purple-400' },
  { id: 'CONCLUIDO', label: 'Concluído',    color: 'border-green-400',  bg: 'bg-green-50',  dot: 'bg-green-400' },
]

function KanbanCard({ oc, isDragging }) {
  const cat = CATEGORIAS[oc.categoria]
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 space-y-2.5 transition
      ${isDragging ? 'shadow-xl rotate-2 opacity-90' : 'hover:shadow-md hover:-translate-y-0.5'}
    `}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-lg leading-none">{cat?.icon}</span>
          <span className="text-xs font-mono text-gray-400">{oc.protocolo}</span>
        </div>
        <CriticidadeBadge criticidade={oc.criticidade} />
      </div>

      <p className="text-sm text-gray-700 leading-snug line-clamp-2">{oc.descricao}</p>

      <div className="flex items-center gap-1 text-xs text-gray-400">
        <MapPin className="w-3 h-3" />
        <span>{oc.bairro}</span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <User className="w-3 h-3" />
          <span className="truncate max-w-20">
            {oc.cidadao.anonimo ? 'Anônimo' : oc.cidadao.nome.split(' ')[0]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300">
            {formatDistanceToNow(new Date(oc.created_at), { locale: ptBR, addSuffix: true })}
          </span>
          <Link
            to={`/ocorrencias/${oc.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function SortableCard({ oc }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: oc.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-3.5 p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition z-10"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <KanbanCard oc={oc} />
    </div>
  )
}

function Coluna({ col, cards }) {
  const { id, label, color, bg, dot } = col
  return (
    <div className={`flex flex-col min-w-72 w-72 rounded-2xl border-t-4 bg-gray-50 ${color}`}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bg} text-gray-600`}>
          {cards.length}
        </span>
      </div>

      <div className="flex-1 px-3 pb-3 space-y-2 min-h-48">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((oc) => (
            <SortableCard key={oc.id} oc={oc} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
            <p className="text-xs text-gray-300">Solte aqui</p>
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  async function carregar() {
    setLoading(true)
    try {
      const res = await ocorrenciasAPI.listar({})
      const grouped = {}
      COLUNAS.forEach((c) => { grouped[c.id] = [] })
      res.data.forEach((oc) => {
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
      if (items.find((i) => i.id === id)) return col
    }
    return null
  }

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return

    const fromCol = findColuna(active.id)
    const toCol = COLUNAS.find((c) => c.id === over.id)?.id || findColuna(over.id)

    if (!fromCol || !toCol) return
    if (fromCol === toCol && active.id === over.id) return

    if (fromCol !== toCol) {
      // Mover entre colunas — atualiza status
      setColumns((prev) => {
        const fromItems = prev[fromCol].filter((i) => i.id !== active.id)
        const movedItem = prev[fromCol].find((i) => i.id === active.id)
        if (!movedItem) return prev
        const toItems = [...prev[toCol], { ...movedItem, status: toCol }]
        return { ...prev, [fromCol]: fromItems, [toCol]: toItems }
      })

      try {
        await ocorrenciasAPI.atualizarStatus(active.id, toCol, 'Movido via Kanban')
        toast.success(`Movido para "${STATUS[toCol]?.label}"`)
      } catch {
        toast.error('Erro ao atualizar — recarregue o Kanban')
        carregar()
      }
    } else {
      // Reordenar na mesma coluna
      setColumns((prev) => {
        const items = prev[fromCol]
        const oldIdx = items.findIndex((i) => i.id === active.id)
        const newIdx = items.findIndex((i) => i.id === over.id)
        return { ...prev, [fromCol]: arrayMove(items, oldIdx, newIdx) }
      })
    }
  }

  const activeItem = activeId ? Object.values(columns).flat().find((i) => i.id === activeId) : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        title="Kanban"
        subtitle="Arraste os cards para mover entre as etapas do atendimento"
        onRefresh={carregar}
        loading={loading}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Carregando kanban...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 w-max min-w-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {COLUNAS.map((col) => (
                <Coluna key={col.id} col={col} cards={columns[col.id] || []} />
              ))}
              <DragOverlay>
                {activeItem && (
                  <div className="w-72 rotate-3 shadow-2xl">
                    <KanbanCard oc={activeItem} isDragging />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      )}
    </div>
  )
}
