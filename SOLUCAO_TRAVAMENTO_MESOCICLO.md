# Solução para Travamento na Tela de Criação de Mesociclos

## Problema
Você está travado na tela "Definir Mesociclos" e não consegue sair.

## Solução Imediata (Para sair da tela)

### Opção 1: Botão Cancelar
- O botão "Cancelar" agora está sempre ativo
- Clique em "Cancelar" para sair da tela

### Opção 2: Clicar fora do modal
- Clique em qualquer área fora do modal para fechar

### Opção 3: Atualizar a página
- Pressione F5 ou Ctrl+R para recarregar a página

## Solução Definitiva (Corrigir o banco de dados)

### Passo 1: Executar script de verificação
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute o script: `check_mesociclos_structure.sql`

### Passo 2: Executar script de correção
1. No mesmo SQL Editor
2. Execute o script: `fix_mesociclos_complete.sql`

### Passo 3: Verificar se funcionou
1. Tente criar um mesociclo novamente
2. Se ainda der erro, execute o script de verificação novamente

## O que foi corrigido no código

1. **Botão Cancelar**: Agora sempre ativo (não desabilita durante loading)
2. **Modal**: Permite sair clicando fora
3. **Banco de dados**: Script para adicionar coluna faltante

## Se ainda não funcionar

1. Verifique se os scripts SQL foram executados com sucesso
2. Recarregue a página do aplicativo
3. Tente criar o mesociclo novamente

## Arquivos modificados
- `src/screens/training/DefineMesociclosModal.tsx` - Correções na interface
- `fix_mesociclos_complete.sql` - Script para corrigir banco de dados
