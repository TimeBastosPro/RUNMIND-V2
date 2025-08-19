# Solução Completa para Perfis Duplicados

## Problema Identificado

Baseado nas imagens do Supabase, o problema é que existem **múltiplos perfis** para o mesmo email (`aline@gmail.com`), causando:

1. **Login inicial**: Carrega um perfil (com dados salvos)
2. **Após refresh**: Carrega outro perfil (diferente)
3. **Inconsistência**: Dados diferentes entre sessões

## Análise das Imagens

### Tabela `profiles`:
- Email: `aline@gmail.com`
- Nome: `Aline Cabral`
- Experiência: `beginner`
- Objetivo: `health`
- Contexto: `solo`

### Tabela `coaches`:
- Email: `alex@gmail.com`, `aline@gmail.com`, `caju@gmail.com`, `timebastos@gmail.com`
- Múltiplos treinadores registrados

### Consulta SQL:
- Mostra que há usuários com "Tem perfil" e "Sem coach" ou vice-versa
- Indica inconsistência entre as tabelas

## Solução Implementada

### 1. **Scripts SQL Criados**

#### `fix_aline_duplicate_profile.sql`
- Script específico para corrigir o problema da Aline
- Remove perfis duplicados mantendo apenas o mais recente
- Verifica e corrige inconsistências

#### `verify_and_fix_all_duplicates.sql`
- Script completo para verificar e corrigir todos os perfis duplicados
- Limpa duplicatas em ambas as tabelas
- Remove perfis de atleta para usuários que são treinadores

### 2. **Correções no Código**

#### `src/stores/auth.ts`
- ✅ Melhorada função `loadProfile()` para verificar se usuário é treinador
- ✅ Evita carregar perfil de atleta para treinadores

#### `src/navigation/AppNavigator.tsx`
- ✅ Carregamento sequencial de perfis (não paralelo)
- ✅ Verificação de tipo de usuário antes de carregar perfis

## Como Aplicar a Correção

### Passo 1: Executar Script de Diagnóstico
```sql
-- No Supabase SQL Editor, execute:
-- 1. Abra o arquivo verify_and_fix_all_duplicates.sql
-- 2. Execute as consultas de VERIFICAÇÃO INICIAL
-- 3. Analise os resultados para confirmar os problemas
```

### Passo 2: Executar Correção
```sql
-- No mesmo arquivo, execute as seções:
-- 2. CORREÇÃO - Limpar duplicatas
-- 3. CORREÇÃO ESPECÍFICA - Remover perfis de atleta para treinadores
```

### Passo 3: Verificar Resultado
```sql
-- Execute as consultas de VERIFICAÇÃO FINAL
-- Confirme que não há mais duplicatas
```

## Resultados Esperados

### ✅ **Antes da Correção:**
- Múltiplos perfis para `aline@gmail.com`
- Dados inconsistentes entre login e refresh
- Carregamento de perfis incorretos

### ✅ **Após a Correção:**
- Apenas um perfil por email
- Dados consistentes entre sessões
- Carregamento correto do perfil adequado

## Verificação Manual

### 1. **Teste de Login**
1. Faça login com `aline@gmail.com`
2. Verifique os dados na tela inicial
3. Faça refresh da página
4. Confirme que os dados permanecem os mesmos

### 2. **Verificação no Supabase**
1. Acesse a tabela `profiles`
2. Confirme que há apenas um registro para `aline@gmail.com`
3. Acesse a tabela `coaches`
4. Verifique se não há conflitos

## Prevenção Futura

### 1. **Constraints no Banco**
```sql
-- Adicionar constraint única por email
ALTER TABLE profiles ADD CONSTRAINT unique_email UNIQUE(email);
ALTER TABLE coaches ADD CONSTRAINT unique_coach_email UNIQUE(email);
```

### 2. **Validação no Código**
- ✅ Verificar tipo de usuário antes de criar perfis
- ✅ Evitar criação de perfis duplicados
- ✅ Carregamento sequencial de dados

### 3. **Monitoramento**
- Logs detalhados de criação de perfis
- Verificação periódica de duplicatas
- Alertas para inconsistências

## Arquivos Modificados

1. **`src/stores/auth.ts`** - Melhoria na função `loadProfile()`
2. **`src/navigation/AppNavigator.tsx`** - Carregamento sequencial
3. **`fix_aline_duplicate_profile.sql`** - Script específico
4. **`verify_and_fix_all_duplicates.sql`** - Script completo
5. **`SOLUCAO_PERFIS_DUPLICADOS.md`** - Esta documentação

## Próximos Passos

1. **Execute os scripts SQL** no Supabase
2. **Teste o login** com a conta da Aline
3. **Verifique a consistência** dos dados
4. **Monitore** para evitar novos problemas
5. **Implemente constraints** no banco para prevenção

---

**Nota**: Esta solução resolve o problema atual e implementa medidas preventivas para evitar recorrência.
