#!/usr/bin/env python3
"""Insere orquestração DeepSeek + Redis sessão 1min após 03k no zeladoria-workflow-v3 2.json."""
import json
from pathlib import Path

WF = Path(__file__).resolve().parent.parent / "zeladoria-workflow-v3 2.json"

DEEPSEEK_CRED = {"deepSeekApi": {"id": "mIOa9vOi0zVuZw6s", "name": "DeepSeek account 3"}}
REDIS_CRED = {"redis": {"id": "vqQF1gn3TFZPV65T", "name": "Redis account"}}
EVO_CRED = {"evolutionApi": {"id": "ycaKSUyEDBrrGGlw", "name": "Evolution account 2"}}

JID = "={{ $('01 - Webhook WhatsApp3').item.json.body.data.key.remoteJid }}"
JID_NUM = "={{ ($('01 - Webhook WhatsApp3').item.json.body.data.key.remoteJid || '').split('@')[0] }}"

CODE_MERGE = r'''const j = $('03j - Enriquecer com Histórico').first().json;
const texto = (j.texto_cidadao || '').trim();
const estado = String($('03k - GET Estado Conversa').first().json.value || 'idle');
let sessVal = $('04a - GET Sessão Fluxo 1min').first().json.value;
let sess = {};
try { sess = sessVal ? JSON.parse(sessVal) : {}; } catch (e) { sess = {}; }
const sessFresh = !!(sess.ts && (Date.now() - Number(sess.ts) < 60000));

const raw = $input.first().json.message?.content || $input.first().json.output || $input.first().json.text || '';
let ai = {};
try {
  const cleaned = raw.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');
  if (s >= 0 && e > s) ai = JSON.parse(cleaned.slice(s, e + 1));
} catch (err) {
  ai = { intencao_principal: 'ambiguo', protocolo: null, resposta_curta: '' };
}

const zel = texto.match(/ZEL-\d{8}-[A-Z0-9]+/i);
if (zel) {
  return [{ json: { fluxo: 'consulta_protocolo', protocolo_consulta: zel[0].toUpperCase(), limpar_sess: true } }];
}

if (estado === 'aguardando_selecao_protocolo') {
  return [{ json: { fluxo: 'delegar_03l', protocolo_consulta: null } }];
}

if (sessFresh && sess.mode === 'consulta_aguardando') {
  const z2 = texto.match(/ZEL-\d{8}-[A-Z0-9]+/i);
  if (z2) {
    return [{ json: { fluxo: 'consulta_protocolo', protocolo_consulta: z2[0].toUpperCase(), limpar_sess: true } }];
  }
  if (/^\s*\d{1,2}\s*$/.test(texto)) {
    return [{ json: { fluxo: 'delegar_03l' } }];
  }
  const msg =
    (ai.resposta_curta && String(ai.resposta_curta).trim()) ||
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

const intent = String(ai.intencao_principal || 'ambiguo').toLowerCase();
const protoAi = String(ai.protocolo || '').trim().toUpperCase();
const okProto = /^ZEL-\d{8}-[A-Z0-9]{3,}$/.test(protoAi);

if (estado === 'aguardando_menu') {
  if (okProto) {
    return [{ json: { fluxo: 'consulta_protocolo', protocolo_consulta: protoAi, limpar_sess: true } }];
  }
  if (intent.includes('consult') || intent.includes('status') || intent.includes('protocolo') || intent.includes('acompanh')) {
    return [{ json: { fluxo: 'delegar_03l' } }];
  }
  if (intent.includes('nov') || intent.includes('abrir') || intent.includes('den') || intent.includes('recl')) {
    return [{ json: { fluxo: 'nova_denuncia', limpar_sess: true } }];
  }
  return [{ json: { fluxo: 'delegar_03l' } }];
}

if (okProto || intent.includes('consult') || intent.includes('status') || intent.includes('protocolo')) {
  if (okProto) {
    return [{ json: { fluxo: 'consulta_protocolo', protocolo_consulta: protoAi, limpar_sess: true } }];
  }
  const msg =
    (ai.resposta_curta && String(ai.resposta_curta).trim()) ||
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

if (
  intent.includes('nov') ||
  intent.includes('abrir') ||
  intent.includes('buraco') ||
  intent.includes('lixo') ||
  intent.includes('ilum') ||
  intent.includes('vazamento') ||
  intent.includes('problema') ||
  intent.includes('den')
) {
  return [{ json: { fluxo: 'nova_denuncia', limpar_sess: true } }];
}

if (j.tem_historico && texto.length > 0 && texto.length < 50 && !intent.includes('nov') && !intent.includes('consult')) {
  const msg =
    (ai.resposta_curta && String(ai.resposta_curta).trim()) ||
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

DS_PROMPT = (
    "=You are the intent classifier for Zeladoria Urbana (Peruíbe) WhatsApp bot. Output ONLY valid JSON, no markdown.\n\n"
    "Fields:\n"
    "- intencao_principal: one of consultar_status | nova_ocorrencia | menu_opcao | saudacao | ambiguo | outro\n"
    "- protocolo: string or null (format ZEL-AAAAMMDD-XXXX if mentioned)\n"
    "- resposta_curta: one short sentence in Brazilian Portuguese if ambiguous (or empty string)\n\n"
    "Context:\n"
    "{{ JSON.stringify({ texto: $('03j - Enriquecer com Histórico').first().json.texto_cidadao, tem_historico: $('03j - Enriquecer com Histórico').first().json.tem_historico, total_chamados: $('03j - Enriquecer com Histórico').first().json.total_chamados, estado_redis: $('03k - GET Estado Conversa').first().json.value, sessao_1min: $('04a - GET Sessão Fluxo 1min').first().json.value }) }}"
)


def main():
    data = json.loads(WF.read_text(encoding="utf-8"))
    nodes = data["nodes"]
    conn = data["connections"]

    existing = {n["name"] for n in nodes}
    if "04a - GET Sessão Fluxo 1min" in existing:
        print("Workflow já contém nós 04a+; abortando para não duplicar.")
        return

    for n in nodes:
        if n.get("name") == "03l - Router por Estado":
            for rule in n["parameters"]["rules"]["values"]:
                for cond in rule["conditions"]["conditions"]:
                    if cond.get("leftValue") == "={{ $json.value }}":
                        cond["leftValue"] = "={{ $('03k - GET Estado Conversa').item.json.value }}"

    new_nodes = [
        {
            "parameters": {"operation": "get", "key": f"=conv_sess:{JID}", "options": {}},
            "id": "zel-04a-get-sess-1min",
            "name": "04a - GET Sessão Fluxo 1min",
            "type": "n8n-nodes-base.redis",
            "typeVersion": 1,
            "position": [3120, 5100],
            "credentials": REDIS_CRED,
            "onError": "continueRegularOutput",
        },
        {
            "parameters": {
                "model": "deepseek-chat",
                "prompt": {"messages": [{"role": "assistant", "content": DS_PROMPT}]},
                "options": {},
                "requestOptions": {},
            },
            "type": "n8n-nodes-deepseek.deepSeek",
            "typeVersion": 1,
            "position": [3340, 5100],
            "id": "zel-04b-deepseek-classificar",
            "name": "04b - DeepSeek Classificar Intenção",
            "credentials": DEEPSEEK_CRED,
        },
        {
            "parameters": {"jsCode": CODE_MERGE},
            "id": "zel-04c-merge-intencao",
            "name": "04c - Merge DeepSeek + Regras + Sessão 1min",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [3560, 5100],
        },
        {
            "parameters": {
                "rules": {
                    "values": [
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
                                        "id": "fl-delegar",
                                        "leftValue": "={{ $json.fluxo }}",
                                        "rightValue": "delegar_03l",
                                        "operator": {"type": "string", "operation": "equals"},
                                    }
                                ],
                                "combinator": "and",
                            },
                            "renameOutput": True,
                            "outputKey": "delegar_03l",
                        },
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
                                        "id": "fl-consulta",
                                        "leftValue": "={{ $json.fluxo }}",
                                        "rightValue": "consulta_protocolo",
                                        "operator": {"type": "string", "operation": "equals"},
                                    }
                                ],
                                "combinator": "and",
                            },
                            "renameOutput": True,
                            "outputKey": "consulta_protocolo",
                        },
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
                                        "id": "fl-pergunta",
                                        "leftValue": "={{ $json.fluxo }}",
                                        "rightValue": "pergunta_contexto",
                                        "operator": {"type": "string", "operation": "equals"},
                                    }
                                ],
                                "combinator": "and",
                            },
                            "renameOutput": True,
                            "outputKey": "pergunta_contexto",
                        },
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
                                        "id": "fl-nova",
                                        "leftValue": "={{ $json.fluxo }}",
                                        "rightValue": "nova_denuncia",
                                        "operator": {"type": "string", "operation": "equals"},
                                    }
                                ],
                                "combinator": "and",
                            },
                            "renameOutput": True,
                            "outputKey": "nova_denuncia",
                        },
                    ]
                },
                "options": {"fallbackOutput": "extra"},
            },
            "id": "zel-04d-switch-fluxo",
            "name": "04d - Switch Fluxo (DeepSeek + sessão)",
            "type": "n8n-nodes-base.switch",
            "typeVersion": 3.2,
            "position": [3780, 5100],
        },
        {
            "parameters": {
                "operation": "delete",
                "key": f"=conv_sess:{JID}",
            },
            "id": "zel-04j-redis-del-antes-consulta",
            "name": "04j - Redis DEL conv_sess (antes consulta)",
            "type": "n8n-nodes-base.redis",
            "typeVersion": 1,
            "position": [3880, 4920],
            "credentials": REDIS_CRED,
            "onError": "continueRegularOutput",
        },
        {
            "parameters": {
                "assignments": {
                    "assignments": [
                        {
                            "id": "as1",
                            "name": "protocolo_consulta",
                            "value": "={{ $json.protocolo_consulta }}",
                            "type": "string",
                        }
                    ]
                },
                "options": {},
            },
            "id": "zel-04e-set-protocolo",
            "name": "04e - SET protocolo_consulta",
            "type": "n8n-nodes-base.set",
            "typeVersion": 3.4,
            "position": [4000, 4920],
        },
        {
            "parameters": {
                "operation": "set",
                "key": f"=conv_sess:{JID}",
                "value": "={{ $json.redis_sess_payload }}",
                "expire": True,
                "ttl": 60,
            },
            "id": "zel-04f-redis-set-sess",
            "name": "04f - SET Sessão 1min (conv_sess)",
            "type": "n8n-nodes-base.redis",
            "typeVersion": 1,
            "position": [4000, 5280],
            "credentials": REDIS_CRED,
        },
        {
            "parameters": {
                "resource": "messages-api",
                "instanceName": "teste1",
                "remoteJid": JID_NUM,
                "messageText": "={{ $('04c - Merge DeepSeek + Regras + Sessão 1min').item.json.mensagem_whatsapp }}",
                "options_message": {"delay": 1200},
            },
            "type": "n8n-nodes-evolution-api.evolutionApi",
            "typeVersion": 1,
            "position": [4220, 5280],
            "id": "zel-04g-evo-contexto",
            "name": "04g - WhatsApp: Pergunta contexto (sessão)",
            "credentials": EVO_CRED,
        },
        {
            "parameters": {"operation": "delete", "key": f"=conv_sess:{JID}"},
            "id": "zel-04h-redis-del-consulta",
            "name": "04h - Redis DEL conv_sess (pós consulta)",
            "type": "n8n-nodes-base.redis",
            "typeVersion": 1,
            "position": [6180, 5550],
            "credentials": REDIS_CRED,
            "onError": "continueRegularOutput",
        },
        {
            "parameters": {"operation": "delete", "key": f"=conv_sess:{JID}"},
            "id": "zel-04i-redis-del-antes-nova",
            "name": "04i - Redis DEL conv_sess (antes nova denúncia)",
            "type": "n8n-nodes-base.redis",
            "typeVersion": 1,
            "position": [3880, 5360],
            "credentials": REDIS_CRED,
            "onError": "continueRegularOutput",
        },
        {
            "parameters": {"operation": "delete", "key": f"=conv_sess:{JID}"},
            "id": "zel-04k-redis-del-pos-denuncia",
            "name": "04k - Redis DEL conv_sess (pós denúncia enviada)",
            "type": "n8n-nodes-base.redis",
            "typeVersion": 1,
            "position": [6180, 5000],
            "credentials": REDIS_CRED,
            "onError": "continueRegularOutput",
        },
    ]

    nodes.extend(new_nodes)

    conn["03k - GET Estado Conversa"] = {"main": [[{"node": "04a - GET Sessão Fluxo 1min", "type": "main", "index": 0}]]}
    conn["04a - GET Sessão Fluxo 1min"] = {"main": [[{"node": "04b - DeepSeek Classificar Intenção", "type": "main", "index": 0}]]}
    conn["04b - DeepSeek Classificar Intenção"] = {"main": [[{"node": "04c - Merge DeepSeek + Regras + Sessão 1min", "type": "main", "index": 0}]]}
    conn["04c - Merge DeepSeek + Regras + Sessão 1min"] = {"main": [[{"node": "04d - Switch Fluxo (DeepSeek + sessão)", "type": "main", "index": 0}]]}
    conn["04d - Switch Fluxo (DeepSeek + sessão)"] = {
        "main": [
            [{"node": "03l - Router por Estado", "type": "main", "index": 0}],
            [{"node": "04j - Redis DEL conv_sess (antes consulta)", "type": "main", "index": 0}],
            [{"node": "04f - SET Sessão 1min (conv_sess)", "type": "main", "index": 0}],
            [{"node": "04i - Redis DEL conv_sess (antes nova denúncia)", "type": "main", "index": 0}],
        ]
    }
    conn["04j - Redis DEL conv_sess (antes consulta)"] = {
        "main": [[{"node": "04e - SET protocolo_consulta", "type": "main", "index": 0}]]
    }
    conn["04e - SET protocolo_consulta"] = {"main": [[{"node": "03v - Validar Formato Protocolo", "type": "main", "index": 0}]]}
    conn["04f - SET Sessão 1min (conv_sess)"] = {"main": [[{"node": "04g - WhatsApp: Pergunta contexto (sessão)", "type": "main", "index": 0}]]}
    conn["04i - Redis DEL conv_sess (antes nova denúncia)"] = {
        "main": [[{"node": "03n_nova - SET idle (nova denuncia)", "type": "main", "index": 0}]]
    }

    conn["Evolution API14"] = {"main": [[{"node": "04h - Redis DEL conv_sess (pós consulta)", "type": "main", "index": 0}]]}
    conn["04h - Redis DEL conv_sess (pós consulta)"] = {
        "main": [[{"node": "03s2 - SET idle pós Consulta", "type": "main", "index": 0}]]
    }

    conn["Evolution API12"] = {"main": [[{"node": "04k - Redis DEL conv_sess (pós denúncia enviada)", "type": "main", "index": 0}]]}
    conn["04k - Redis DEL conv_sess (pós denúncia enviada)"] = {
        "main": [[{"node": "03s1 - SET idle pós Denúncia", "type": "main", "index": 0}]]
    }

    WF.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print("OK:", WF)


if __name__ == "__main__":
    main()
