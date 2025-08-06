# Sistema de Treinador - RunMind

## Visão Geral

O sistema de treinador foi implementado para permitir que treinadores gerenciem atletas, criem treinos planejados e acompanhem o progresso de suas equipes. Atletas podem buscar e solicitar vinculação com treinadores.

## Funcionalidades Implementadas

### Para Treinadores

1. **Criação de Conta e Perfil**
   - Cadastro como treinador
   - Configuração de perfil com especialidades e certificações
   - Informações profissionais (experiência, bio, etc.)

2. **Gerenciamento de Equipes**
   - Criação de equipes
   - Edição e exclusão de equipes
   - Visualização de membros da equipe

3. **Gerenciamento de Atletas**
   - Visualização de solicitações de vinculação
   - Aprovação/rejeição de solicitações
   - Acompanhamento de atletas vinculados
   - Acesso aos dados dos atletas

4. **Dashboard Principal**
   - Estatísticas rápidas (número de atletas, equipes)
   - Lista de equipes recentes
   - Lista de atletas recentes
   - Ações rápidas

### Para Atletas

1. **Busca de Treinadores**
   - Lista de treinadores disponíveis
   - Busca por nome ou especialidade
   - Visualização de perfis completos

2. **Solicitação de Vinculação**
   - Envio de solicitação para treinador
   - Mensagem personalizada
   - Acompanhamento do status da solicitação

3. **Status de Relacionamento**
   - Visualização do status atual (pendente, aprovado, rejeitado)
   - Possibilidade de tentar novamente após rejeição

## Estrutura do Banco de Dados

### Tabelas Criadas

1. **coaches**
   - Perfis dos treinadores
   - Informações profissionais
   - Especialidades e certificações

2. **teams**
   - Equipes criadas pelos treinadores
   - Relacionamento com treinador

3. **athlete_coach_relationships**
   - Relacionamentos entre atletas e treinadores
   - Status da vinculação
   - Histórico de aprovações

4. **active_athlete_coach_relationships** (View)
   - View para facilitar consultas de relacionamentos ativos

### Políticas de Segurança (RLS)

- Treinadores só podem acessar seus próprios dados
- Atletas só podem ver seus próprios relacionamentos
- Treinadores só podem gerenciar suas próprias equipes
- Controle de acesso baseado em autenticação

## Arquivos Criados/Modificados

### Banco de Dados
- `create_coach_system.sql` - Script completo de criação do sistema

### Tipos TypeScript
- `src/types/database.ts` - Adicionados tipos para Coach, Team, AthleteCoachRelationship

### Stores
- `src/stores/coach.ts` - Store Zustand para gerenciar estado do sistema de treinador

### Telas
- `src/screens/auth/UserTypeSelectionScreen.tsx` - Seleção de tipo de usuário
- `src/screens/auth/CoachProfileSetupScreen.tsx` - Configuração de perfil de treinador
- `src/screens/coach/CoachMainScreen.tsx` - Dashboard principal do treinador
- `src/screens/athlete/CoachSearchScreen.tsx` - Busca de treinadores para atletas

### Navegação
- `src/navigation/AppNavigator.tsx` - Atualizado para suportar diferentes interfaces

## Fluxo de Uso

### Para Treinadores

1. **Cadastro**
   ```
   Cadastro → Seleção de Tipo (Treinador) → Configuração de Perfil → Dashboard
   ```

2. **Login**
   ```
   Login → Verificação de Perfil de Treinador → Dashboard
   ```

3. **Gerenciamento**
   ```
   Dashboard → Criar Equipes → Gerenciar Atletas → Acompanhar Progresso
   ```

### Para Atletas

1. **Busca de Treinador**
   ```
   App → Buscar Treinador → Ver Perfis → Solicitar Vinculação
   ```

2. **Acompanhamento**
   ```
   App → Ver Status da Solicitação → Aguardar Aprovação
   ```

## Próximos Passos

### Funcionalidades a Implementar

1. **Para Treinadores**
   - Criação de treinos planejados para atletas
   - Visualização de análises e insights dos atletas
   - Sistema de comunicação com atletas
   - Relatórios de progresso da equipe
   - Configurações de notificações

2. **Para Atletas**
   - Visualização de treinos planejados pelo treinador
   - Comunicação com treinador
   - Histórico de treinos com treinador
   - Feedback sobre treinos

3. **Melhorias Gerais**
   - Sistema de notificações push
   - Chat entre treinador e atleta
   - Relatórios avançados
   - Integração com dispositivos wearables
   - Sistema de avaliação e feedback

## Como Executar

1. **Executar Script SQL**
   ```sql
   -- Execute o arquivo create_coach_system.sql no seu banco Supabase
   ```

2. **Verificar Dependências**
   ```bash
   npm install
   ```

3. **Executar o App**
   ```bash
   npm start
   ```

## Configurações

### Variáveis de Ambiente
Certifique-se de que as variáveis do Supabase estão configuradas:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Permissões do Banco
O script SQL já configura as políticas RLS necessárias. Certifique-se de que o usuário do Supabase tem permissões adequadas.

## Troubleshooting

### Problemas Comuns

1. **Erro ao criar perfil de treinador**
   - Verificar se o usuário está autenticado
   - Verificar se as políticas RLS estão ativas

2. **Treinadores não aparecem na busca**
   - Verificar se o campo `is_active` está como `true`
   - Verificar se as políticas de busca estão corretas

3. **Erro de navegação**
   - Verificar se todas as telas estão importadas
   - Verificar se os tipos de navegação estão corretos

## Contribuição

Para adicionar novas funcionalidades:

1. Atualizar os tipos em `src/types/database.ts`
2. Adicionar métodos no store `src/stores/coach.ts`
3. Criar telas necessárias
4. Atualizar navegação
5. Testar fluxo completo

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação do Supabase
- Documentação do React Navigation
- Issues do projeto no GitHub 