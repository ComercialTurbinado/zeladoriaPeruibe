const path = require('path')
const Ocorrencia = require('../models/Ocorrencia')
const axios = require('axios')

// ─── Helper: disparar webhook n8n para notificar cidadão ─────
async function notificarCidadao(ocorrencia, statusNovo) {
  const webhookUrl = process.env.N8N_WEBHOOK_STATUS_URL
  if (!webhookUrl) return

  try {
    await axios.post(
      webhookUrl,
      {
        protocolo: ocorrencia.protocolo,
        status: statusNovo,
        cidadao_telefone: ocorrencia.cidadao?.telefone,
        cidadao_nome: ocorrencia.cidadao?.nome,
        categoria: ocorrencia.categoria,
        bairro: ocorrencia.bairro,
      },
      {
        headers: { Authorization: `Bearer ${process.env.N8N_WEBHOOK_TOKEN}` },
        timeout: 5000,
      }
    )
    console.log(`📱 WhatsApp notificado: ${ocorrencia.protocolo} → ${statusNovo}`)
  } catch (err) {
    console.warn(`⚠️  Falha ao notificar n8n: ${err.message}`)
  }
}

// ─── Helpers de query ─────────────────────────────────────────
function buildFiltro(query) {
  const filtro = {}
  if (query.status) filtro.status = query.status
  if (query.categoria) filtro.categoria = query.categoria
  if (query.criticidade) filtro.criticidade = query.criticidade
  if (query.bairro) filtro.bairro = { $regex: query.bairro, $options: 'i' }
  if (query.busca) {
    filtro.$or = [
      { protocolo: { $regex: query.busca, $options: 'i' } },
      { descricao: { $regex: query.busca, $options: 'i' } },
      { bairro: { $regex: query.busca, $options: 'i' } },
      { 'cidadao.nome': { $regex: query.busca, $options: 'i' } },
    ]
  }
  if (query.data_inicio || query.data_fim) {
    filtro.created_at = {}
    if (query.data_inicio) filtro.created_at.$gte = new Date(query.data_inicio)
    if (query.data_fim) filtro.created_at.$lte = new Date(query.data_fim)
  }
  return filtro
}

// GET /ocorrencias
async function listar(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(200, parseInt(req.query.limit) || 10)
    const skip = (page - 1) * limit
    const filtro = buildFiltro(req.query)

    const [data, total] = await Promise.all([
      Ocorrencia.find(filtro).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      Ocorrencia.countDocuments(filtro),
    ])

    return res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('Erro listar ocorrências:', err)
    return res.status(500).json({ erro: 'Erro ao buscar ocorrências' })
  }
}

// GET /ocorrencias/export
async function exportar(req, res) {
  try {
    const filtro = buildFiltro(req.query)
    const dados = await Ocorrencia.find(filtro).sort({ created_at: -1 }).lean()

    const headers = [
      'Protocolo', 'Categoria', 'Bairro', 'Rua', 'Status',
      'Criticidade', 'Cidadão', 'Telefone', 'Latitude', 'Longitude', 'Data',
    ]

    const rows = dados.map((o) => [
      o.protocolo,
      o.categoria,
      o.bairro || '',
      o.rua || '',
      o.status,
      o.criticidade,
      o.cidadao?.anonimo ? 'Anônimo' : (o.cidadao?.nome || ''),
      o.cidadao?.anonimo ? '' : (o.cidadao?.telefone || ''),
      o.latitude || '',
      o.longitude || '',
      new Date(o.created_at).toLocaleString('pt-BR'),
    ])

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const filename = `ocorrencias_${new Date().toISOString().slice(0, 10)}.csv`
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.send('\uFEFF' + csv)
  } catch (err) {
    console.error('Erro exportar:', err)
    return res.status(500).json({ erro: 'Erro ao exportar dados' })
  }
}

// GET /ocorrencias/consulta?protocolo=ZLD-2024-001&telefone=5511999990001
// Usado pelo N8N Flow 2 para verificação pelo cidadão
async function consultar(req, res) {
  try {
    const { protocolo, telefone } = req.query

    if (!protocolo && !telefone) {
      return res.status(400).json({ erro: 'Informe protocolo ou telefone para consulta' })
    }

    let ocorrencias = []

    if (protocolo) {
      // Busca exata por protocolo
      const oc = await Ocorrencia.findOne({
        protocolo: { $regex: new RegExp(`^${protocolo.trim()}$`, 'i') },
      }).lean()
      if (oc) ocorrencias = [oc]
    } else if (telefone) {
      // Normaliza telefone: remove caracteres não numéricos
      const tel = telefone.replace(/\D/g, '')
      ocorrencias = await Ocorrencia.find({
        'cidadao.telefone': { $regex: tel, $options: 'i' },
      })
        .sort({ created_at: -1 })
        .limit(10)
        .lean()
    }

    if (ocorrencias.length === 0) {
      return res.json({
        encontrado: false,
        mensagem: protocolo
          ? `Protocolo ${protocolo} não encontrado`
          : 'Nenhuma ocorrência registrada para este número',
        ocorrencias: [],
      })
    }

    // Retorna resumo seguro (sem dados sensíveis de outros cidadãos)
    const resumo = ocorrencias.map(o => ({
      protocolo: o.protocolo,
      categoria: o.categoria,
      descricao: o.descricao,
      status: o.status,
      criticidade: o.criticidade,
      bairro: o.bairro,
      rua: o.rua,
      created_at: o.created_at,
      updated_at: o.updated_at,
      ultimo_log: o.logs?.[o.logs.length - 1] || null,
      total_atualizacoes: o.logs?.length || 0,
    }))

    return res.json({
      encontrado: true,
      total: resumo.length,
      ocorrencias: resumo,
    })
  } catch (err) {
    console.error('Erro consultar:', err)
    return res.status(500).json({ erro: 'Erro ao consultar ocorrência' })
  }
}

// GET /ocorrencias/status?protocolo=ZLD-2024-001
// Usado para verificação rápida pelo cidadão (somente status/básicos)
async function consultarStatusBasico(req, res) {
  try {
    const { protocolo } = req.query
    if (!protocolo) {
      return res.status(400).json({ erro: 'Informe protocolo para consulta' })
    }

    const protocoloNorm = String(protocolo).trim().toUpperCase()
    const oc = await Ocorrencia.findOne({ protocolo: protocoloNorm }).lean()

    if (!oc) {
      return res.json({
        encontrado: false,
        mensagem: `Protocolo ${protocoloNorm} não encontrado`,
        ocorrencia: null,
      })
    }

    const ultimo = oc.logs?.[oc.logs.length - 1] || null
    const ultimo_log = ultimo
      ? {
          status_anterior: ultimo.status_anterior,
          status_novo: ultimo.status_novo,
          observacao: ultimo.observacao,
          data: ultimo.data,
        }
      : null

    return res.json({
      encontrado: true,
      ocorrencia: {
        protocolo: oc.protocolo,
        status: oc.status,
        criticidade: oc.criticidade,
        categoria: oc.categoria,
        bairro: oc.bairro,
        rua: oc.rua,
        updated_at: oc.updated_at,
        total_atualizacoes: oc.logs?.length || 0,
        ultimo_log,
      },
    })
  } catch (err) {
    console.error('Erro consultarStatusBasico:', err)
    return res.status(500).json({ erro: 'Erro ao consultar status do protocolo' })
  }
}

// GET /ocorrencias/:id
async function buscarPorId(req, res) {
  try {
    const ocorrencia = await Ocorrencia.findById(req.params.id).lean()
    if (!ocorrencia) {
      return res.status(404).json({ erro: 'Ocorrência não encontrada' })
    }
    return res.json(ocorrencia)
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ erro: 'ID inválido' })
    }
    console.error('Erro buscarPorId:', err)
    return res.status(500).json({ erro: 'Erro ao buscar ocorrência' })
  }
}

// PATCH /ocorrencias/:id/status
async function atualizarStatus(req, res) {
  try {
    const { status, observacao } = req.body
    const STATUS_VALIDOS = ['ABERTO', 'TRIAGEM', 'ANALISE', 'EXECUCAO', 'CONCLUIDO', 'CANCELADO']

    if (!status || !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ erro: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` })
    }

    const ocorrencia = await Ocorrencia.findById(req.params.id)
    if (!ocorrencia) {
      return res.status(404).json({ erro: 'Ocorrência não encontrada' })
    }

    const statusAnterior = ocorrencia.status

    ocorrencia.logs.push({
      status_anterior: statusAnterior,
      status_novo: status,
      observacao: observacao || '',
      admin: req.admin?.nome || 'Admin',
      data: new Date(),
    })

    ocorrencia.status = status
    await ocorrencia.save()

    if (!ocorrencia.cidadao?.anonimo && ocorrencia.cidadao?.telefone) {
      notificarCidadao(ocorrencia, status)
    }

    return res.json(ocorrencia.toObject())
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ erro: 'ID inválido' })
    }
    console.error('Erro atualizarStatus:', err)
    return res.status(500).json({ erro: 'Erro ao atualizar status' })
  }
}

// POST /ocorrencias  — chamado pelo n8n quando chega mensagem no WhatsApp
async function criar(req, res) {
  try {
    const {
      protocolo, cidadao, categoria, descricao,
      criticidade, bairro, rua, latitude, longitude, midias,
    } = req.body

    if (!protocolo || !categoria) {
      return res.status(400).json({ erro: 'protocolo e categoria são obrigatórios' })
    }

    // Valida categoria
    const CATEGORIAS_VALIDAS = ['BURACO', 'ILUMINACAO', 'LIXO', 'ARVORE', 'CALCADA', 'AGUA', 'OUTRO']
    const categoriaUpper = categoria?.toUpperCase()
    if (!CATEGORIAS_VALIDAS.includes(categoriaUpper)) {
      return res.status(400).json({ erro: `Categoria inválida. Use: ${CATEGORIAS_VALIDAS.join(', ')}` })
    }

    const ocorrencia = await Ocorrencia.create({
      protocolo: protocolo.toUpperCase(),
      cidadao,
      categoria: categoriaUpper,
      descricao,
      criticidade: criticidade || 'MEDIA',
      bairro,
      rua,
      latitude: parseFloat(latitude) || null,
      longitude: parseFloat(longitude) || null,
      midias: midias || [],
      status: 'ABERTO',
      logs: [{
        status_anterior: null,
        status_novo: 'ABERTO',
        admin: 'Sistema WhatsApp',
        data: new Date(),
      }],
    })

    return res.status(201).json(ocorrencia)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ erro: 'Protocolo já existe' })
    }
    console.error('Erro criar:', err)
    return res.status(500).json({ erro: 'Erro ao criar ocorrência' })
  }
}

// POST /ocorrencias/:id/midias — upload de foto/vídeo
async function uploadMidia(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' })
    }

    const ocorrencia = await Ocorrencia.findById(req.params.id)
    if (!ocorrencia) {
      return res.status(404).json({ erro: 'Ocorrência não encontrada' })
    }

    const tipo = req.file.mimetype.startsWith('video') ? 'VIDEO' : 'FOTO'
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`
    const url = `${baseUrl}/uploads/${req.file.filename}`

    ocorrencia.midias.push({ url, tipo })
    await ocorrencia.save()

    return res.json(ocorrencia.toObject())
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ erro: 'ID inválido' })
    }
    console.error('Erro uploadMidia:', err)
    return res.status(500).json({ erro: 'Erro ao salvar mídia' })
  }
}

module.exports = { listar, exportar, consultar, consultarStatusBasico, buscarPorId, atualizarStatus, criar, uploadMidia }
