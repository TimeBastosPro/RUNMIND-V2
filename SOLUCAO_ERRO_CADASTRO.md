# Solução: Erro "User already registered" ao Criar Conta de Atleta

## Problema Identificado

Ao tentar criar uma nova conta de atleta, o sistema retorna o erro:
- **"User already registered"**
- **"Este email já está cadastrado. Tente fazer login."**

## Causa do Problema

O email `aline@gmail.com` já está cadastrado no sistema, provavelmente criado durante os testes anteriores quando havia o bug de criação dupla de perfis.

## Solução

### 1. **Execute o Script de Limpeza**

Execute o arquivo `limpar_usuario_aline.sql` no **Supabase SQL Editor**:

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Cole o conteúdo do arquivo `limpar_usuario_aline.sql`
4. Clique em **Run**

### 2. **O que o Script Faz**

O script irá:
1. **Verificar** quantos registros existem para `aline@gmail.com`
2. **Mostrar detalhes** dos registros existentes
3. **Remover** todos os registros relacionados ao email
4. **Confirmar** que a limpeza foi bem-sucedida

### 3. **Alternativas**

Se não quiser usar o email `aline@gmail.com`, você pode:

#### **Opção A: Usar outro email**
- Use um email diferente para o teste
- Exemplo: `teste@gmail.com`, `usuario@teste.com`

#### **Opção B: Limpar apenas o usuário específico**
- Execute apenas as queries de DELETE do script
- Mantenha outros usuários intactos

## Teste Após a Limpeza

1. **Execute o script de limpeza**
2. **Tente criar uma nova conta** com `aline@gmail.com`
3. **Verifique se o cadastro funciona** sem erros
4. **Teste o login** com a nova conta

## Verificação

Após executar o script, você deve ver:
```
✅ Usuário aline@gmail.com removido com sucesso!
Agora você pode criar uma nova conta com este email.
```

## Arquivos Criados

- `limpar_usuario_aline.sql` - Script de limpeza específico
- `verificar_usuario_aline.sql` - Script de verificação (diagnóstico)
- `SOLUCAO_ERRO_CADASTRO.md` - Este documento

## Próximos Passos

1. **Execute o script de limpeza**
2. **Teste o cadastro** de nova conta de atleta
3. **Teste o cadastro** de nova conta de treinador
4. **Verifique se ambos funcionam** corretamente

## Importante

- O script remove **todos os dados** relacionados ao email `aline@gmail.com`
- Se houver dados importantes, faça backup antes
- Este é um script de limpeza para ambiente de desenvolvimento/teste
