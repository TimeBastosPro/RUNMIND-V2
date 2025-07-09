# RUNMIND-V2

## Setup rápido

1. **Instale as dependências:**
   ```sh
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   - Crie um arquivo `.env.local` na raiz do projeto com:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
     SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
     GEMINI_API_KEY=sua_chave_gemini
     ```

3. **Setup do banco Supabase:**
   - Execute o SQL em `docs/supabase-setup.sql` no painel do Supabase.
   - Verifique as tabelas e RLS policies.

4. **Rodando o projeto:**
   ```sh
   npx expo start
   ```

## Observações
- O arquivo `.env.local` **NÃO** deve ser enviado para o GitHub.
- Para rodar scripts automáticos, use:
  ```sh
  chmod +x setup.sh
  ./setup.sh
  ```
