# Correções do Sistema de Relacionamentos

## Problemas Identificados

### 1. **Erro PGRST116**
- **Problema**: "JSON object requested, multiple (or no) rows returned"
- **Causa**: Uso de `.single()` quando a consulta pode retornar 0 ou múltiplas linhas
- **Solução**: Substituído por `.maybeSingle()` com verificação adicional

### 2. **Informações do Usuário Não Aparecem**
- **Problema**: "Nome não informado" e "Email não informado"
- **Causa**: A consulta não estava incluindo dados do atleta via JOIN
- **Solução**: Criada view com JOIN correto para incluir dados do atleta

### 3. **Erro de RLS na View**
- **Problema**: "ALTER action ENABLE ROW SECURITY cannot be performed on relation"
- **Causa**: Tentativa de habilitar RLS em uma view
- **Solução**: Removida tentativa de habilitar RLS na view

## Correções Implementadas

### 1. **Script SQL (`fix_coach_relationships_final.sql`)**
- ✅ Recriada view `active_athlete_coach_relationships` com JOIN correto
- ✅ Criada view `pending_athlete_coach_relationships` para relacionamentos pendentes
- ✅ Adicionado `COALESCE` para tratar valores nulos
- ✅ Verificação e criação de perfis para usuários sem perfil

### 2. **Código do Store (`src/stores/coach.ts`)**
- ✅ Atualizada função `loadCoachRelationships` para usar a view correta
- ✅ Corrigida função `approveRelationship` para usar `.maybeSingle()`
- ✅ Corrigida função `rejectRelationship` para usar `.maybeSingle()`
- ✅ Adicionada verificação de dados nulos após atualização

### 3. **Views Criadas**
```sql
-- View para relacionamentos ativos
CREATE VIEW active_athlete_coach_relationships AS
SELECT
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.requested_at,
  acr.approved_at,
  acr.notes,
  acr.created_at,
  acr.updated_at,
  COALESCE(p.full_name, 'Nome não informado') as athlete_name,
  COALESCE(p.email, 'Email não informado') as athlete_email,
  COALESCE(c.full_name, 'Nome não informado') as coach_name,
  COALESCE(c.email, 'Email não informado') as coach_email,
  t.name as team_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status IN ('pending', 'approved', 'active');
```

## Como Testar

### 1. **Execute o Script SQL**
```sql
-- Execute o arquivo fix_coach_relationships_final.sql no Supabase SQL Editor
```

### 2. **Teste o Fluxo**
1. Faça login como atleta
2. Busque treinadores
3. Solicite vínculo com um treinador
4. Faça login como treinador
5. Verifique se a solicitação aparece com dados corretos
6. Aprove ou rejeite a solicitação

### 3. **Verifique os Logs**
- Abra o console do navegador
- Verifique se não há mais erros PGRST116
- Confirme que os dados do atleta aparecem corretamente

## Resultado Esperado

✅ **Solicitações aparecem com dados completos do atleta**
✅ **Aprovação/rejeição funcionam sem erros**
✅ **Não há mais erros PGRST116 no console**
✅ **Sistema de relacionamentos totalmente funcional**

## Arquivos Modificados

1. `fix_coach_relationships_final.sql` - Script SQL de correção
2. `src/stores/coach.ts` - Código do store corrigido
3. `test_relationship_flow_final.sql` - Script de teste
4. `CORRECOES_RELACIONAMENTOS.md` - Este documento

## Status

- [x] Script SQL criado
- [x] Código do store corrigido
- [x] Views recriadas
- [x] Testes implementados
- [ ] **Aguardando execução do script SQL**
- [ ] **Aguardando teste do fluxo completo** 