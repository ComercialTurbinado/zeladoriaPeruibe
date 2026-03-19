# Zeladoria — Painel Administrativo

Dashboard React para gestão de ocorrências enviadas via WhatsApp, integrado com n8n + Evolution API.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Roteamento**: React Router v6
- **Gráficos**: Recharts
- **Mapas**: React Leaflet (OpenStreetMap)
- **Kanban**: @dnd-kit (drag & drop)
- **Notificações**: react-hot-toast
- **HTTP**: Axios

## Início rápido

```bash
cd zeladoria-dashboard
npm install
cp .env.example .env   # edite as variáveis
npm run dev            # http://localhost:3000
```

**Credenciais demo:** `admin@zeladoria.gov.br` / `admin123`

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_USE_MOCK_API` | `false` para usar API real (padrão: `true`) |
| `VITE_API_BASE_URL` | URL base dos webhooks n8n |
| `VITE_N8N_AUTH_TOKEN` | Token de auth dos webhooks n8n |
| `VITE_EVOLUTION_API_URL` | URL da Evolution API |
| `VITE_STORAGE_URL` | URL pública do MinIO/S3 |

## Integração n8n

### Endpoints esperados (webhooks)

```
POST /webhook/admin/login
GET  /webhook/ocorrencias
GET  /webhook/ocorrencias/:id
PATCH /webhook/ocorrencias/:id/status
GET  /webhook/ocorrencias/export
GET  /webhook/dashboard/stats
GET  /webhook/dashboard/categorias
GET  /webhook/dashboard/tendencia
GET  /webhook/dashboard/mapa-calor
```

### Fluxo WhatsApp → n8n → Dashboard

```
Evolution API (WhatsApp)
  └─► n8n Webhook (recebe mensagem)
        ├─► Identifica cidadão (CPF ou anônimo)
        ├─► Baixa mídia → MinIO/S3
        ├─► Salva ocorrência no PostgreSQL
        └─► Retorna protocolo via WhatsApp

Dashboard Admin (este projeto)
  └─► PATCH /ocorrencias/:id/status
        └─► n8n Workflow
              └─► Evolution API → WhatsApp notifica cidadão
```

### Modelo de banco sugerido (PostgreSQL)

```sql
CREATE TABLE cidadaos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200),
  cpf VARCHAR(14),
  telefone VARCHAR(20) NOT NULL,
  anonimo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ocorrencias (
  id SERIAL PRIMARY KEY,
  protocolo VARCHAR(20) UNIQUE NOT NULL,
  cidadao_id INTEGER REFERENCES cidadaos(id),
  categoria VARCHAR(50) NOT NULL,
  descricao TEXT,
  status VARCHAR(20) DEFAULT 'ABERTO',
  criticidade VARCHAR(20) DEFAULT 'MEDIA',
  bairro VARCHAR(100),
  rua VARCHAR(200),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE midias (
  id SERIAL PRIMARY KEY,
  ocorrencia_id INTEGER REFERENCES ocorrencias(id),
  url TEXT NOT NULL,
  tipo VARCHAR(10) CHECK (tipo IN ('FOTO', 'VIDEO')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE logs_status (
  id SERIAL PRIMARY KEY,
  ocorrencia_id INTEGER REFERENCES ocorrencias(id),
  status_anterior VARCHAR(20),
  status_novo VARCHAR(20) NOT NULL,
  observacao TEXT,
  admin VARCHAR(200),
  data TIMESTAMP DEFAULT NOW()
);
```

## Estrutura do projeto

```
src/
├── api/
│   └── zeladoria.js      # Camada de API (mock ↔ real)
├── context/
│   └── AuthContext.jsx   # Autenticação JWT
├── data/
│   └── mockData.js       # Dados mock para desenvolvimento
├── components/
│   ├── Layout.jsx         # Layout com sidebar
│   ├── Sidebar.jsx        # Navegação lateral
│   ├── Header.jsx         # Cabeçalho das páginas
│   └── StatusBadge.jsx    # Badges de status e criticidade
└── pages/
    ├── Login.jsx          # Tela de login
    ├── Dashboard.jsx      # Overview + gráficos + mapa
    ├── Ocorrencias.jsx    # Listagem com filtros + export CSV
    ├── OcorrenciaDetalhe.jsx  # Detalhe + alterar status
    ├── Kanban.jsx         # Drag-and-drop entre etapas
    └── Mapa.jsx           # Mapa de calor completo
```

## Deploy

```bash
npm run build   # gera /dist
# sirva /dist com nginx, Vercel, ou qualquer servidor estático
```

Para Docker, crie um `Dockerfile` baseado em `nginx:alpine` servindo `/dist`.
