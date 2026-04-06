#!/usr/bin/env python3
"""Enriquece 04b (prompt DeepSeek) e 04c (merge), adiciona ramo resposta_natural + nós Evolution."""
import json
from pathlib import Path

WF = Path(__file__).resolve().parent.parent / "zeladoria-workflow-v3 2.json"

REDIS_CRED = {"redis": {"id": "vqQF1gn3TFZPV65T", "name": "Redis account"}}
EVO_CRED = {"evolutionApi": {"id": "ycaKSUyEDBrrGGlw", "name": "Evolution account 2"}}

JID = "={{ $('01 - Webhook WhatsApp3').item.json.body.data.key.remoteJid }}"
JID_NUM = "={{ ($('01 - Webhook WhatsApp3').item.json.body.data.key.remoteJid || '').split('@')[0] }}"

DS_PROMPT = r"""=Você é o roteador inteligente do WhatsApp da *Zeladoria Urbana da Prefeitura de Peruíbe*.
Analise a mensagem do cidadão e o contexto abaixo. Seja empático: muitas vezes a pessoa só agradece, cumprimenta ou faz uma pergunta simples depois que já recebeu o status do chamado ou abriu protocolo.

Responda *APENAS* um JSON válido (sem markdown, sem texto fora do JSON).

Schema:
{
  "tipo_mensagem": "<um dos valores abaixo>",
  "confianca": <número de 0 a 1>,
  "protocolo_detectado": "<ZEL-AAAAMMDD-XXXX em maiúsculas ou null>",
  "intencao_principal": "<atalho legado: consultar_status | nova_ocorrencia | menu_opcao | saudacao | ambiguo | outro>",
  "resposta_humana_curta": "<texto completo para enviar no WhatsApp, em pt-BR. Pode ter vários parágrafos; dentro do JSON use \\n para quebras de linha. Mesmo tom caloroso do canal: emojis pontuais (⚠️ 😊 💡), *negrito* estilo WhatsApp, listas com ícones (🏠 📍 📝) quando orientar o cidadão. Se não for caso de responder agora (ex.: vai delegar para outro fluxo), use \"\""
}

Valores permitidos para tipo_mensagem:
- cumprimento (oi, bom dia, e aí)
- agradecimento_ou_despedida (obrigado, valeu, show, tchau)
- pergunta_pos_atendimento (perguntas leves depois de já ter sido atendido: "e agora?", "demora muito?")
- pergunta_geral_institucional (o que é zeladoria?, vocês arrumam X?)
- protocolo_explicito (trouxe o código ZEL-...)
- pedido_consulta_sem_codigo (quero ver status mas sem número)
- nova_ocorrencia_problema_urbano (buraco, lixo, iluminação, calçada, água, mato, etc.)
- midia_sem_texto_relevante (só foto/áudio ou legenda vazia/genérica — descrever problema na imagem/som)
- escolha_menu_numerica (1, 2, opção dois)
- ambiguo_precisa_contexto

Regras:
- Se houver regex de protocolo no texto, use protocolo_explicito e preencha protocolo_detectado.
- Agradecimentos após atendimento: agradecimento_ou_despedida + resposta calorosa (pode ser breve ou com um parágrafo a mais se fizer sentido).
- Texto só com \"obrigado\", \"valeu\", \"brigado\" (sem código ZEL novo): *sempre* tipo_mensagem agradecimento_ou_despedida — *nunca* consultar_status ou protocolo_explicito.
- Não invente dados de protocolo; se não houver código, protocolo_detectado = null.
- Para orientações (o que falta, como proceder), inspire-se no estilo já usado no canal — ex.: \"⚠️ *Recebemos seu relato!*\", resumo do que entendeu, \"Mas precisamos de...\" com lista clara e \"💡 Dica:\" no final. Soe como atendente, não como sistema.
- O envio da mensagem final com *protocolo após denúncia registrada* fica no fluxo de abertura de chamado (backend); aqui você só prepara texto quando a resposta for direta ao cidadão neste roteador.

Contexto (JSON):
{{ JSON.stringify({
  texto_cidadao: $('03j - Enriquecer com Histórico').first().json.texto_cidadao,
  tem_midia: !!( $('03j - Enriquecer com Histórico').first().json.mediaUrl ),
  mediaUrl: $('03j - Enriquecer com Histórico').first().json.mediaUrl || null,
  tipo_midia: $('03j - Enriquecer com Histórico').first().json.tipo || null,
  tem_historico_chamados: $('03j - Enriquecer com Histórico').first().json.tem_historico,
  total_chamados: $('03j - Enriquecer com Histórico').first().json.total_chamados,
  estado_conversa_redis: $('03k - GET Estado Conversa').first().json.value,
  sessao_1min_raw: $('04a - GET Sessão Fluxo 1min').first().json.value
}) }}"""

CODE_MERGE = r'''const j = $('03j - Enriquecer com Histórico').first().json;
const texto = (j.texto_cidadao || '').trim();
const estadoRaw = $('03k - GET Estado Conversa').first().json.value;
const estado = String(estadoRaw != null && estadoRaw !== '' ? estadoRaw : 'idle')
  .trim()
  .toLowerCase();
const temZelNoTexto = /ZEL-\d{8}-[A-Z0-9]+/i.test(texto);
const temMidia = !!(j.mediaUrl && String(j.mediaUrl).trim());
let sessVal = $('04a - GET Sessão Fluxo 1min').first().json.value;
let sess = {};
try { sess = sessVal ? JSON.parse(sessVal) : {}; } catch (e) { sess = {}; }
const sessOk1min = !!(sess.ts && (Date.now() - Number(sess.ts) < 60000));

const raw = $input.first().json.message?.content || $input.first().json.output || $input.first().json.text || '';
let ai = {};
try {
  const cleaned = raw.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');
  if (s >= 0 && e > s) ai = JSON.parse(cleaned.slice(s, e + 1));
} catch (err) {
  ai = { tipo_mensagem: 'ambiguo_precisa_contexto', confianca: 0, protocolo_detectado: null, intencao_principal: 'ambiguo', resposta_humana_curta: '' };
}

const tipo = String(ai.tipo_mensagem || '').toLowerCase();
const conf = Number(ai.confianca);
const respostaHumana = String(ai.resposta_humana_curta || ai.resposta_curta || '').trim();
const intent = String(ai.intencao_principal || 'ambiguo').toLowerCase();
const protoAi = String(ai.protocolo_detectado || ai.protocolo || '').trim().toUpperCase();
const okProto = /^ZEL-\d{8}-[A-Z0-9]{3,}$/.test(protoAi);

function stripAcc(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const tn = stripAcc(texto);
const textoCurtoSemMidia = !temMidia && tn.length > 0 && tn.length <= 120;

function pareceAgradecimentoOuFechamento(t) {
  if (temZelNoTexto) return false;
  const x = String(t || '').trim();
  if (/^[12]\s*$/.test(x)) return false;
  if (/^(um|dois|opcao|opção)\b/.test(x)) return false;
  return (
    /\b(obrigad[oa]|muito obrigad[oa]|valeu|vlw|agradeco|brigad[oa]|tmj|thanks|thank you|thx|ty)\b/.test(x) ||
    /^(show|iss[oa] mesmo|perfeito)\b/.test(x) ||
    /^[\s🙏👍❤]+\s*$/u.test(texto.trim())
  );
}

const estadoPermiteRespostaCurtaHumana = ['idle', '', 'null', 'aguardando_menu'].includes(estado);

const zel = texto.match(/ZEL-\d{8}-[A-Z0-9]+/i);
if (zel) {
  return [{ json: { fluxo: 'consulta_protocolo', protocolo_consulta: zel[0].toUpperCase(), limpar_sess: true } }];
}

if (estado === 'aguardando_selecao_protocolo') {
  return [{ json: { fluxo: 'delegar_03l', protocolo_consulta: null } }];
}

if (sessOk1min && sess.mode === 'consulta_aguardando') {
  if (textoCurtoSemMidia && pareceAgradecimentoOuFechamento(tn)) {
    const msg =
      respostaHumana ||
      'Por nada! 😊 Quando precisar, é só chamar. Se quiser *consultar outro protocolo* ou *abrir um chamado*, manda mensagem aqui.';
    return [{ json: { fluxo: 'resposta_natural', mensagem_whatsapp: msg, limpar_sess: true } }];
  }
  const z2 = texto.match(/ZEL-\d{8}-[A-Z0-9]+/i);
  if (z2) {
    return [{ json: { fluxo: 'consulta_protocolo', protocolo_consulta: z2[0].toUpperCase(), limpar_sess: true } }];
  }
  if (/^\s*\d{1,2}\s*$/.test(texto)) {
    return [{ json: { fluxo: 'delegar_03l' } }];
  }
  const msg =
    respostaHumana ||
    'Para consultar, preciso do *protocolo completo* (ex.: ZEL-20260327-XXXX) ou o *número* do item na lista que te enviei. Pode mandar?';
  return [
    {
      json: {
        fluxo: 'pergunta_contexto',
        mensagem_whatsapp: msg,
        redis_sess_payload: JSON.stringify({ mode: 'consulta_aguardando', ts: Date.now(), ultima_pergunta: msg }),
      },
    },
  ];
}

if (temMidia && (!texto || texto.length < 3)) {
  return [{ json: { fluxo: 'delegar_03l' } }];
}

if (estadoPermiteRespostaCurtaHumana && textoCurtoSemMidia && pareceAgradecimentoOuFechamento(tn)) {
  const msg =
    respostaHumana ||
    'Por nada! 😊 Fico feliz em ajudar. Se precisar de novo — *novo relato* ou *consultar protocolo* — é só mandar mensagem aqui.';
  return [{ json: { fluxo: 'resposta_natural', mensagem_whatsapp: msg, limpar_sess: true } }];
}

// IA costuma repetir protocolo_detectado do contexto: "obrigado" não pode virar nova consulta HTTP
if (okProto && textoCurtoSemMidia && pareceAgradecimentoOuFechamento(tn) && !temZelNoTexto) {
  const msg =
    respostaHumana ||
    'Por nada! 😊 Fico feliz em ajudar. Qualquer coisa, é só chamar por aqui.';
  return [{ json: { fluxo: 'resposta_natural', mensagem_whatsapp: msg, limpar_sess: true } }];
}

const naturalTipos = [
  'cumprimento',
  'agradecimento_ou_despedida',
  'pergunta_pos_atendimento',
  'pergunta_geral_institucional',
];
const confOk = !Number.isNaN(conf) ? conf >= 0.45 : true;
const estadoIdleLike = ['idle', '', 'null'].includes(estado);
const podeConversaNatural =
  estadoIdleLike || (estado === 'aguardando_menu' && tipo === 'agradecimento_ou_despedida');

if (podeConversaNatural) {
  if (naturalTipos.includes(tipo) && confOk && respostaHumana) {
    return [{ json: { fluxo: 'resposta_natural', mensagem_whatsapp: respostaHumana, limpar_sess: true } }];
  }
  if (naturalTipos.includes(tipo) && confOk && !respostaHumana) {
    const fallbacks = {
      cumprimento: 'Olá! 👋 Sou o canal da Zeladoria de Peruíbe. Posso ajudar com um *novo relato* (buraco, lixo, iluminação etc.) ou *consultar* um protocolo. O que você precisa?',
      agradecimento_ou_despedida: 'Por nada! Fico feliz em ajudar. Qualquer coisa, é só chamar por aqui. Um ótimo dia! 😊',
      pergunta_pos_atendimento: 'Seu chamado segue com a equipe da Prefeitura. Se pintar outra dúvida ou um novo problema no bairro, manda mensagem aqui que a gente vê.',
      pergunta_geral_institucional: 'Aqui é o canal de *Zeladoria Urbana* de Peruíbe: atendemos problemas como buracos, lixo, iluminação pública, calçadas e similares. Quer *abrir um chamado* ou *consultar* um protocolo?',
    };
    return [{ json: { fluxo: 'resposta_natural', mensagem_whatsapp: fallbacks[tipo] || fallbacks.pergunta_geral_institucional, limpar_sess: true } }];
  }
}

if (estado === 'aguardando_menu') {
  if (okProto) {
    return [{ json: { fluxo: 'consulta_protocolo', protocolo_consulta: protoAi, limpar_sess: true } }];
  }
  if (tipo === 'nova_ocorrencia_problema_urbano' || intent.includes('nov')) {
    return [{ json: { fluxo: 'nova_denuncia', limpar_sess: true } }];
  }
  if (tipo === 'protocolo_explicito' || tipo === 'pedido_consulta_sem_codigo' || intent.includes('consult')) {
    return [{ json: { fluxo: 'delegar_03l' } }];
  }
  return [{ json: { fluxo: 'delegar_03l' } }];
}

if (okProto || tipo === 'protocolo_explicito') {
  return [{ json: { fluxo: 'consulta_protocolo', protocolo_consulta: protoAi, limpar_sess: true } }];
}

if (tipo === 'pedido_consulta_sem_codigo' || intent.includes('consult') || intent.includes('status') || intent.includes('protocolo')) {
  const msg =
    respostaHumana ||
    'Beleza! Me envia o *protocolo completo* no formato ZEL-AAAAMMDD-XXXX que eu consulto pra você.';
  return [
    {
      json: {
        fluxo: 'pergunta_contexto',
        mensagem_whatsapp: msg,
        redis_sess_payload: JSON.stringify({ mode: 'consulta_aguardando', ts: Date.now(), ultima_pergunta: msg }),
      },
    },
  ];
}

if (tipo === 'nova_ocorrencia_problema_urbano' || intent.includes('nov') || intent.includes('buraco') || intent.includes('lixo')) {
  return [{ json: { fluxo: 'nova_denuncia', limpar_sess: true } }];
}

if (j.tem_historico && texto.length > 0 && texto.length < 50 && tipo === 'ambiguo_precisa_contexto') {
  const msg =
    respostaHumana ||
    'Olá! Vi que você já tem chamado(s) aqui. Prefere *abrir um novo relato* ou *consultar* um protocolo? Se for consultar, pode mandar o código ZEL-...';
  return [
    {
      json: {
        fluxo: 'pergunta_contexto',
        mensagem_whatsapp: msg,
        redis_sess_payload: JSON.stringify({ mode: 'menu_implicito', ts: Date.now() }),
      },
    },
  ];
}

return [{ json: { fluxo: 'delegar_03l' } }];
'''

SWITCH_RULES = [
    ("consulta_protocolo", "consulta_protocolo"),
    ("pergunta_contexto", "pergunta_contexto"),
    ("nova_denuncia", "nova_denuncia"),
    ("resposta_natural", "resposta_natural"),
    ("delegar_03l", "delegar_03l"),
]


def build_switch_parameters():
    values = []
    for _id, key in SWITCH_RULES:
        values.append(
            {
                "conditions": {
                    "options": {
                        "caseSensitive": True,
                        "leftValue": "",
                        "typeValidation": "strict",
                        "version": 2,
                    },
                    "conditions": [
                        {
                            "id": f"fl-{key}",
                            "leftValue": "={{ $json.fluxo }}",
                            "rightValue": key,
                            "operator": {"type": "string", "operation": "equals"},
                        }
                    ],
                    "combinator": "and",
                },
                "renameOutput": True,
                "outputKey": key,
            }
        )
    return {"rules": {"values": values}, "options": {"fallbackOutput": "extra"}}


def main():
    data = json.loads(WF.read_text(encoding="utf-8"))
    nodes = data["nodes"]
    conn = data["connections"]

    for n in nodes:
        name = n.get("name") or ""
        if name == "04b - DeepSeek Classificar Intenção":
            n["name"] = "04b - DeepSeek Roteador Inteligente (inicial)"
            name = n["name"]
        if name == "04b - DeepSeek Roteador Inteligente (inicial)":
            n["parameters"]["prompt"]["messages"][0]["content"] = DS_PROMPT
            n.setdefault("continueOnFail", True)
        if name == "04c - Merge DeepSeek + Regras + Sessão 1min":
            n["parameters"]["jsCode"] = CODE_MERGE

    # Remove old 04d if exists and patch
    for n in nodes:
        if n.get("name") == "04d - Switch Fluxo (DeepSeek + sessão)":
            n["parameters"] = build_switch_parameters()
            break

    existing = {x["name"] for x in nodes}
    if "04m - Redis DEL conv_sess (resposta natural)" not in existing:
        nodes.append(
            {
                "parameters": {"operation": "delete", "key": f"=conv_sess:{JID}"},
                "id": "zel-04m-redis-del-resp-natural",
                "name": "04m - Redis DEL conv_sess (resposta natural)",
                "type": "n8n-nodes-base.redis",
                "typeVersion": 1,
                "position": [4000, 5620],
                "credentials": REDIS_CRED,
                "onError": "continueRegularOutput",
            }
        )
    if "04n - WhatsApp: Resposta natural (DeepSeek)" not in existing:
        nodes.append(
            {
                "parameters": {
                    "resource": "messages-api",
                    "instanceName": "teste1",
                    "remoteJid": JID_NUM,
                    "messageText": "={{ $('04c - Merge DeepSeek + Regras + Sessão 1min').item.json.mensagem_whatsapp }}",
                    "options_message": {"delay": 800},
                },
                "type": "n8n-nodes-evolution-api.evolutionApi",
                "typeVersion": 1,
                "position": [4220, 5620],
                "id": "zel-04n-evo-resp-natural",
                "name": "04n - WhatsApp: Resposta natural (DeepSeek)",
                "credentials": EVO_CRED,
            }
        )

    old_b = "04b - DeepSeek Classificar Intenção"
    new_b = "04b - DeepSeek Roteador Inteligente (inicial)"
    for v in conn.values():
        if not v or "main" not in v:
            continue
        for branch in v["main"]:
            for link in branch:
                if link.get("node") == old_b:
                    link["node"] = new_b
    if old_b in conn and new_b not in conn:
        conn[new_b] = conn.pop(old_b)

    # 04d main: consulta, pergunta, nova, resposta_natural, delegar, extra
    conn["04d - Switch Fluxo (DeepSeek + sessão)"] = {
        "main": [
            [{"node": "04j - Redis DEL conv_sess (antes consulta)", "type": "main", "index": 0}],
            [{"node": "04f - SET Sessão 1min (conv_sess)", "type": "main", "index": 0}],
            [{"node": "04i - Redis DEL conv_sess (antes nova denúncia)", "type": "main", "index": 0}],
            [{"node": "04m - Redis DEL conv_sess (resposta natural)", "type": "main", "index": 0}],
            [{"node": "03l - Router por Estado", "type": "main", "index": 0}],
            [{"node": "03l - Router por Estado", "type": "main", "index": 0}],
        ]
    }

    conn["04m - Redis DEL conv_sess (resposta natural)"] = {
        "main": [[{"node": "04n - WhatsApp: Resposta natural (DeepSeek)", "type": "main", "index": 0}]]
    }

    WF.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print("OK:", WF)


if __name__ == "__main__":
    main()
