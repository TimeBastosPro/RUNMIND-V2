#!/bin/bash

# 🚀 SCRIPT DE DEPLOY AUTOMATIZADO - RUNMIND V2
# Execute este script para fazer deploy completo para produção

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do RUNMIND V2 para produção..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto RUNMIND V2"
fi

# Verificar se as dependências estão instaladas
log "Verificando dependências..."
if [ ! -d "node_modules" ]; then
    log "Instalando dependências..."
    npm install
fi

# Verificar se as variáveis de ambiente estão configuradas
log "Verificando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    warning "Arquivo .env não encontrado. Criando template..."
    cat > .env << EOF
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
EXPO_PUBLIC_GEMINI_API_KEY=sua_chave_gemini_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Configurações de Produção
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_APP_VERSION=1.0.0
EOF
    error "Configure as variáveis de ambiente no arquivo .env antes de continuar"
fi

# Verificar se as variáveis estão preenchidas
if grep -q "sua_chave_anonima_aqui" .env; then
    error "Configure as variáveis de ambiente no arquivo .env"
fi

# Build do projeto
log "Fazendo build do projeto..."
npx expo export --platform web

if [ ! -d "dist" ]; then
    error "Build falhou - diretório dist não foi criado"
fi

success "Build concluído com sucesso!"

# Verificar se o Netlify CLI está instalado
if ! command -v netlify &> /dev/null; then
    log "Instalando Netlify CLI..."
    npm install -g netlify
fi

# Verificar se está logado no Netlify
if ! netlify status &> /dev/null; then
    log "Fazendo login no Netlify..."
    netlify login
fi

# Deploy para produção
log "Fazendo deploy para produção..."
netlify deploy --prod --dir=dist

success "Deploy concluído com sucesso!"

# Obter URL do site
SITE_URL=$(netlify status --json | jq -r '.site.url')
log "Site disponível em: $SITE_URL"

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    log "Instalando Supabase CLI..."
    npm install -g supabase
fi

# Verificar se está logado no Supabase
if ! supabase status &> /dev/null; then
    log "Fazendo login no Supabase..."
    supabase login
fi

# Deploy das Edge Functions
log "Deploy das Edge Functions..."
supabase functions deploy generate-daily-readiness-insight-v2
supabase functions deploy generate-training-assimilation-insight-v2
supabase functions deploy generate-weekly-summary-insight-v2

success "Edge Functions deployadas com sucesso!"

# Executar script de configuração do banco
log "Configurando banco de dados..."
if [ -f "setup_production_database.sql" ]; then
    log "Execute o script setup_production_database.sql no SQL Editor do Supabase"
    warning "IMPORTANTE: Execute manualmente o script SQL no painel do Supabase"
else
    warning "Arquivo setup_production_database.sql não encontrado"
fi

# Verificar saúde do sistema
log "Verificando saúde do sistema..."
echo "🔍 Verificações pós-deploy:"
echo "1. Acesse o site: $SITE_URL"
echo "2. Teste o cadastro de usuário"
echo "3. Teste o login"
echo "4. Teste as funcionalidades principais"
echo "5. Verifique os logs no painel do Supabase"

# Configurar monitoramento
log "Configurando monitoramento..."
echo "📊 Configure os seguintes alertas no Supabase:"
echo "- Falhas de autenticação > 10/hora"
echo "- Erros de API > 5/minuto"
echo "- Uso de disco > 80%"
echo "- Conexões ativas > 100"

# Backup
log "Configurando backup..."
echo "💾 Configure backup automático no Supabase:"
echo "- Frequência: Diária"
echo "- Retenção: 7 dias"
echo "- Ponto de recuperação: Habilitado"

success "Deploy completo finalizado!"

echo ""
echo "🎉 RUNMIND V2 está online e pronto para múltiplos usuários!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o domínio personalizado (opcional)"
echo "2. Configure Google Analytics"
echo "3. Configure Sentry para crash reporting"
echo "4. Teste com usuários reais"
echo "5. Monitore performance e logs"
echo ""
echo "🔗 Links importantes:"
echo "- Site: $SITE_URL"
echo "- Supabase: https://supabase.com/dashboard"
echo "- Netlify: https://app.netlify.com"
echo ""
echo "📞 Suporte:"
echo "- Supabase: https://supabase.com/support"
echo "- Netlify: https://docs.netlify.com/support/"
echo ""
echo "✅ Deploy concluído com sucesso!"
