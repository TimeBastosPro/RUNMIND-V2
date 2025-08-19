# Instruções para Corrigir Perfis Duplicados Locais

## Problema Identificado

O problema de perfis duplicados está ocorrendo **localmente no dispositivo**, não no banco de dados. Isso significa que há dados corrompidos no cache local do aplicativo.

## Solução Imediata

### Opção 1: Limpeza Manual (Recomendada)

1. **Abra o aplicativo RunMind**
2. **Vá para a tela de Perfil** (última aba)
3. **Role para baixo** até encontrar o botão:
   ```
   🗑️ Limpar Dados Locais (Corrigir Perfis Duplicados)
   ```
4. **Clique no botão** e confirme a ação
5. **Aguarde** a limpeza dos dados
6. **Faça login novamente** com `aline@gmail.com`
7. **Teste** se o problema foi resolvido

### Opção 2: Logout Completo

Se o botão não aparecer ou não funcionar:

1. **Faça logout** completo do aplicativo
2. **Feche o aplicativo** completamente (force o fechamento)
3. **Reabra o aplicativo**
4. **Faça login** com `aline@gmail.com`
5. **Teste** se os dados são consistentes

## Verificação da Correção

### Teste de Consistência

1. **Faça login** com `aline@gmail.com`
2. **Verifique os dados** na tela inicial:
   - Nome do usuário
   - Dados de treinos
   - Check-ins salvos
3. **Faça refresh** da página (ou feche e reabra o app)
4. **Confirme** que os dados permanecem os mesmos

### O que Deve Acontecer

✅ **Antes da correção:**
- Dados diferentes entre login e refresh
- Perfil "Aline Cabral" vs perfil "aline@gmail.com"
- Informações inconsistentes

✅ **Após a correção:**
- Mesmos dados em todas as sessões
- Perfil consistente
- Informações corretas

## Se o Problema Persistir

### Verificação no Console

1. **Abra o console do desenvolvedor** (F12 no navegador)
2. **Procure por mensagens** como:
   - "🧹 Iniciando limpeza de dados locais..."
   - "✅ Dados locais limpos com sucesso"
   - "⚠️ Sessão corrompida detectada"
3. **Confirme** que não há erros

### Limpeza Forçada

Se ainda houver problemas:

1. **Vá para Configurações do dispositivo**
2. **Encontre o aplicativo RunMind**
3. **Limpe os dados do aplicativo**
4. **Reinstale o aplicativo** se necessário

## Prevenção Futura

### O que Foi Implementado

1. **Verificação automática** de sessão corrompida
2. **Limpeza automática** de dados conflitantes
3. **Carregamento seguro** de perfis
4. **Botão de limpeza manual** na tela de perfil

### Como Evitar Novos Problemas

1. **Não force o fechamento** do aplicativo durante operações
2. **Aguarde** o carregamento completo antes de navegar
3. **Use o botão de logout** em vez de fechar o app
4. **Mantenha o aplicativo atualizado**

## Suporte Técnico

Se o problema persistir após todas as tentativas:

1. **Anote** as mensagens de erro do console
2. **Descreva** exatamente quando o problema ocorre
3. **Informe** qual dispositivo e sistema operacional
4. **Envie** os logs para análise técnica

---

**Nota**: Esta solução resolve o problema local sem afetar os dados do banco de dados do Supabase.
