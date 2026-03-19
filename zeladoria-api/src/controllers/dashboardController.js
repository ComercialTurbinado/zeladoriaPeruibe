const Ocorrencia = require('../models/Ocorrencia')

// GET /dashboard/stats
async function getStats(req, res) {
  try {
    const [total, abertas, em_andamento, concluidas, tempoMedio] = await Promise.all([
      Ocorrencia.countDocuments(),
      Ocorrencia.countDocuments({ status: 'ABERTO' }),
      Ocorrencia.countDocuments({ status: { $in: ['TRIAGEM', 'ANALISE', 'EXECUCAO'] } }),
      Ocorrencia.countDocuments({ status: 'CONCLUIDO' }),

      // Média de tempo de resolução em horas (apenas concluídas)
      Ocorrencia.aggregate([
        { $match: { status: 'CONCLUIDO' } },
        {
          $project: {
            duracao_h: {
              $divide: [
                { $subtract: ['$updated_at', '$created_at'] },
                3600000, // ms → horas
              ],
            },
          },
        },
        { $group: { _id: null, media: { $avg: '$duracao_h' } } },
      ]),
    ])

    return res.json({
      total,
      abertas,
      em_andamento,
      concluidas,
      media_resolucao_horas: tempoMedio[0]
        ? parseFloat(tempoMedio[0].media.toFixed(1))
        : 0,
      nps_satisfacao: 87, // Futuramente: calcular via respostas dos cidadãos
    })
  } catch (err) {
    console.error('Erro stats:', err)
    return res.status(500).json({ erro: 'Erro ao buscar estatísticas' })
  }
}

// GET /dashboard/categorias — para gráfico de pizza
async function getCategorias(req, res) {
  try {
    const COR_CATEGORIA = {
      ILUMINACAO: '#f59e0b',
      BURACO:     '#ef4444',
      LIXO:       '#22c55e',
      CALCADA:    '#8b5cf6',
      ARVORE:     '#10b981',
      AGUA:       '#3b82f6',
      OUTRO:      '#6b7280',
    }
    const LABEL_CATEGORIA = {
      ILUMINACAO: 'Iluminação',
      BURACO:     'Buracos',
      LIXO:       'Lixo',
      CALCADA:    'Calçada',
      ARVORE:     'Árvore',
      AGUA:       'Água',
      OUTRO:      'Outros',
    }

    const result = await Ocorrencia.aggregate([
      { $group: { _id: '$categoria', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ])

    const data = result.map((r) => ({
      name: LABEL_CATEGORIA[r._id] || r._id,
      value: r.value,
      fill: COR_CATEGORIA[r._id] || '#6b7280',
    }))

    return res.json(data)
  } catch (err) {
    console.error('Erro categorias:', err)
    return res.status(500).json({ erro: 'Erro ao buscar categorias' })
  }
}

// GET /dashboard/tendencia?periodo=7d — barras semanal
async function getTendencia(req, res) {
  try {
    const dias = req.query.periodo === '30d' ? 30 : 7
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - dias)

    const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

    const [abertas, concluidas] = await Promise.all([
      Ocorrencia.aggregate([
        { $match: { created_at: { $gte: dataInicio } } },
        {
          $group: {
            _id: { $dayOfWeek: '$created_at' },
            count: { $sum: 1 },
          },
        },
      ]),
      Ocorrencia.aggregate([
        { $match: { status: 'CONCLUIDO', updated_at: { $gte: dataInicio } } },
        {
          $group: {
            _id: { $dayOfWeek: '$updated_at' },
            count: { $sum: 1 },
          },
        },
      ]),
    ])

    const abertasMap = Object.fromEntries(abertas.map((r) => [r._id, r.count]))
    const concluodasMap = Object.fromEntries(concluidas.map((r) => [r._id, r.count]))

    // MongoDB: $dayOfWeek retorna 1=Dom ... 7=Sab
    const resultado = [2, 3, 4, 5, 6, 7, 1].map((dow) => ({
      dia: DIAS_PT[dow === 1 ? 0 : dow - 1],
      abertas: abertasMap[dow] || 0,
      concluidas: concluodasMap[dow] || 0,
    }))

    return res.json(resultado)
  } catch (err) {
    console.error('Erro tendência:', err)
    return res.status(500).json({ erro: 'Erro ao buscar tendência' })
  }
}

// GET /dashboard/mapa-calor
async function getMapaCalor(req, res) {
  try {
    const pontos = await Ocorrencia.find(
      { latitude: { $ne: null }, longitude: { $ne: null } },
      {
        _id: 1,
        protocolo: 1,
        categoria: 1,
        status: 1,
        criticidade: 1,
        bairro: 1,
        latitude: 1,
        longitude: 1,
      }
    )
      .sort({ created_at: -1 })
      .limit(500)
      .lean()

    const data = pontos.map((o) => ({
      id: o._id,
      lat: o.latitude,
      lng: o.longitude,
      protocolo: o.protocolo,
      categoria: o.categoria,
      status: o.status,
      criticidade: o.criticidade,
      bairro: o.bairro,
      intensidade:
        o.criticidade === 'CRITICA' ? 4
        : o.criticidade === 'ALTA' ? 3
        : o.criticidade === 'MEDIA' ? 2
        : 1,
    }))

    return res.json(data)
  } catch (err) {
    console.error('Erro mapa-calor:', err)
    return res.status(500).json({ erro: 'Erro ao buscar dados do mapa' })
  }
}

module.exports = { getStats, getCategorias, getTendencia, getMapaCalor }
