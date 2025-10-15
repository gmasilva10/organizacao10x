# Configuração do Cache Redis

## 📋 Visão Geral

O sistema implementa um cache Redis robusto para melhorar a performance das APIs e reduzir a carga no banco de dados.

## 🚀 Instalação

### 1. Instalar Redis Localmente

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# macOS
brew install redis

# Windows
# Baixar do site oficial: https://redis.io/download
```

### 2. Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env.local`:

```env
# Configuração do Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Configuração de cache
CACHE_DEFAULT_TTL=300
CACHE_METRICS_TTL=60
CACHE_LISTINGS_TTL=300
CACHE_DETAILS_TTL=900
```

### 3. Iniciar Redis

```bash
# Iniciar servidor Redis
redis-server

# Testar conexão
redis-cli ping
```

## 🔧 Uso

### 1. Cache em APIs

```typescript
import { withCache, CacheConfigs } from '@/lib/cache/middleware'

// Aplicar cache automático
export const GET = withCache(handler, CacheConfigs.METRICS)
```

### 2. Cache Manual

```typescript
import { getCache, setCache, deleteCache } from '@/lib/cache/redis'

// Obter dados do cache
const data = await getCache('key', { ttl: 300 })

// Armazenar no cache
await setCache('key', data, { ttl: 300 })

// Deletar do cache
await deleteCache('key')
```

### 3. Hook no Frontend

```typescript
import { useCache } from '@/hooks/useCache'

function MyComponent() {
  const { data, isLoading, error, revalidate } = useCache('/api/data', {
    ttl: 300,
    staleWhileRevalidate: true
  })

  return (
    <div>
      {isLoading && <p>Carregando...</p>}
      {error && <p>Erro: {error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
```

## 📊 Monitoramento

### 1. Estatísticas do Cache

```typescript
import { getCacheStats } from '@/lib/cache/redis'

const stats = getCacheStats()
console.log('Cache Stats:', stats)
// { hits: 150, misses: 25, sets: 175, deletes: 10, errors: 0 }
```

### 2. API de Monitoramento

```bash
# Obter estatísticas
GET /api/cache?action=stats

# Obter informações do Redis
GET /api/cache?action=info

# Verificar saúde
GET /api/cache?action=health
```

### 3. Gerenciar Cache

```bash
# Limpar todo o cache
POST /api/cache
{ "action": "clear" }

# Invalidar por padrão
POST /api/cache
{ "action": "invalidate", "pattern": "dashboard:*" }

# Resetar estatísticas
POST /api/cache
{ "action": "reset-stats" }
```

## ⚙️ Configurações

### 1. TTL (Time To Live)

- **Métricas**: 60 segundos
- **Listagens**: 300 segundos (5 minutos)
- **Detalhes**: 900 segundos (15 minutos)
- **Configurações**: 1800 segundos (30 minutos)
- **Dados estáticos**: 3600 segundos (1 hora)

### 2. Estratégias de Cache

- **Cache-First**: Dados do cache primeiro, fallback para API
- **Stale-While-Revalidate**: Retorna dados antigos enquanto revalida
- **Cache-Then-Network**: Cache + rede em paralelo

### 3. Invalidação

- **Automática**: Por TTL
- **Manual**: Por padrão ou chave específica
- **Event-driven**: Baseada em eventos do sistema

## 🔍 Debugging

### 1. Logs

```bash
# Verificar logs do Redis
redis-cli monitor

# Verificar chaves no cache
redis-cli keys "*"
```

### 2. Headers de Cache

```http
X-Cache: HIT|MISS
X-Cache-Key: development:dashboard:metrics:org123
X-Query-Time: 45ms
```

### 3. Estatísticas em Tempo Real

```typescript
// No console do navegador
const stats = await fetch('/api/cache?action=stats').then(r => r.json())
console.log('Cache Stats:', stats)
```

## 🚨 Troubleshooting

### 1. Redis não conecta

```bash
# Verificar se Redis está rodando
redis-cli ping

# Verificar porta
netstat -tulpn | grep 6379
```

### 2. Cache não funciona

```typescript
// Verificar configuração
console.log('Redis URL:', process.env.REDIS_URL)

// Testar conexão
const client = await getRedisClient()
console.log('Redis Connected:', client?.isReady)
```

### 3. Performance issues

```bash
# Verificar uso de memória
redis-cli info memory

# Verificar comandos lentos
redis-cli slowlog get 10
```

## 📈 Benefícios

- **Performance**: Redução de 70-90% no tempo de resposta
- **Escalabilidade**: Menor carga no banco de dados
- **Experiência**: Dados instantâneos para usuários
- **Eficiência**: Menos recursos computacionais
- **Confiabilidade**: Fallback automático em caso de falha

## 🔐 Segurança

- **Isolamento**: Cache por organização (org_id)
- **Autenticação**: Verificação de contexto de usuário
- **Limpeza**: Limpeza automática de dados expirados
- **Monitoramento**: Logs de todas as operações
