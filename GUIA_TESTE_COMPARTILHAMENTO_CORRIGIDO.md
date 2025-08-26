# Guia: Teste do Compartilhamento de Macrociclos (CORRIGIDO)

## Problema Encontrado
O script anterior apresentou erro: `column "user_id" does not exist`. Isso indica que a estrutura das tabelas pode ser diferente do esperado.

## Script Corrigido
Use o arquivo: `testar_relacionamento_treinador_atleta_corrigido.sql`

## Como Executar

### **Passo 1: Execute o Script Corrigido**
1. Abra o Supabase SQL Editor
2. Cole o conteúdo do arquivo `testar_relacionamento_treinador_atleta_corrigido.sql`
3. Execute o script completo

### **Passo 2: Analise os Resultados**

#### **Consulta 1: Estrutura das Tabelas**
- Verifica se as tabelas `profiles`, `athlete_coach_relationships` e `macrociclos` existem
- Mostra as colunas disponíveis em cada tabela

#### **Consulta 2: Usuários Autenticados**
- Lista os usuários mais recentes
- Anote os IDs dos usuários treinador e atleta

#### **Consulta 3: Verificação da Tabela Profiles**
- Confirma se a tabela `profiles` existe
- Se retornar 0, a tabela não existe

#### **Consulta 4: Dados dos Perfis**
- Só execute se a consulta 3 retornar 1
- Mostra os perfis de usuários com nomes e tipos

#### **Consulta 5: Relacionamentos**
- Lista todos os relacionamentos treinador-atleta
- Verifica se há relacionamentos ativos

#### **Consulta 6: Macrociclos Existentes**
- Lista todos os macrociclos no banco
- Verifica se há macrociclos criados

#### **Consulta 7: Consulta Simples**
- Testa acesso básico à tabela macrociclos
- Sem JOINs complexos

#### **Consulta 8: Políticas RLS**
- Verifica as políticas de segurança
- Confirma se treinadores podem ver macrociclos de atletas

#### **Consulta 9: Status dos Relacionamentos**
- Mostra quantos relacionamentos existem por status
- Confirma se há relacionamentos 'active' ou 'approved'

#### **Consulta 10: Relacionamentos com Perfis**
- Testa JOIN entre relacionamentos e perfis
- Mostra nomes dos treinadores e atletas

## Interpretação dos Resultados

### **Se a Tabela Profiles Não Existir:**
- O sistema pode estar usando outra estrutura
- Os perfis podem estar em `auth.users` ou outra tabela
- Precisamos adaptar o código

### **Se Não Há Relacionamentos Ativos:**
- O problema pode ser que não há vínculo entre treinador e atleta
- Verifique se o relacionamento foi aprovado

### **Se Não Há Macrociclos:**
- O problema pode ser que nenhum macrociclo foi criado
- Teste criar um macrociclo primeiro

### **Se as Políticas RLS Estão Incorretas:**
- As políticas podem não permitir o compartilhamento
- Precisamos corrigir as políticas

## Próximos Passos

### **1. Execute o Script e Reporte:**
- Quais consultas funcionaram
- Quais deram erro
- Quantos registros cada consulta retornou

### **2. Se Houver Erros:**
- Copie a mensagem de erro exata
- Indique qual consulta falhou

### **3. Se Não Há Dados:**
- Crie um relacionamento treinador-atleta primeiro
- Crie um macrociclo de teste
- Execute o script novamente

## Exemplo de Resultado Esperado

### **Consulta 1 (Estrutura):**
```
table_name | column_name | data_type
profiles   | id          | uuid
profiles   | user_id     | uuid
profiles   | full_name   | text
```

### **Consulta 5 (Relacionamentos):**
```
id | coach_id | athlete_id | status
1  | uuid1    | uuid2      | active
```

### **Consulta 6 (Macrociclos):**
```
id | user_id | name | start_date | end_date
1  | uuid2   | Teste| 2024-01-01 | 2024-12-31
```

## Status

- ✅ **SCRIPT CORRIGIDO** - Verifica estrutura antes de consultar
- ✅ **CONSULTAS SEGURAS** - Não assume estrutura específica
- ⏳ **PENDENTE** - Execução e análise dos resultados
- ⏳ **PENDENTE** - Ajustes baseados nos resultados
