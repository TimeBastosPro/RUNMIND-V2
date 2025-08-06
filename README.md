# RUNMIND-V2

## 🚀 Setup rápido

1. **Instale as dependências:**
   ```sh
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   - Crie um arquivo `.env` na raiz do projeto
   - Veja o arquivo `SECURITY.md` para instruções detalhadas
   - **IMPORTANTE**: Nunca commite o arquivo `.env` no repositório

3. **Setup do banco Supabase:**
   - Execute os scripts SQL na pasta raiz no painel do Supabase
   - Verifique as tabelas e RLS policies

4. **Rodando o projeto:**
   ```sh
   npm start
   ```

## 🔒 Segurança

**⚠️ CRÍTICO**: Este projeto utiliza variáveis de ambiente para proteger chaves de API sensíveis.

### Configuração de Segurança:
- ✅ Chaves movidas para arquivo `.env`
- ✅ Arquivo `.env` protegido no `.gitignore`
- ✅ Validação automática de configuração
- ✅ Documentação completa em `SECURITY.md`

### Variáveis Necessárias:
```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
EXPO_PUBLIC_GEMINI_API_KEY=sua_chave_gemini
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

## 📚 Documentação

- **Segurança**: Veja `SECURITY.md` para configuração detalhada
- **API Keys**: Instruções para obter chaves do Supabase e Gemini
- **Desenvolvimento**: Guia para novos desenvolvedores

## 🛠️ Desenvolvimento

### Scripts disponíveis:
```sh
npm start          # Inicia o servidor de desenvolvimento
npm run android    # Executa no Android
npm run ios        # Executa no iOS
npm run web        # Executa no navegador
```

### Estrutura do projeto:
```
src/
├── components/     # Componentes reutilizáveis
├── screens/        # Telas da aplicação
├── services/       # Serviços (Supabase, Gemini)
├── stores/         # Gerenciamento de estado (Zustand)
├── types/          # Definições TypeScript
└── utils/          # Utilitários
```

## ⚠️ Observações Importantes

- O arquivo `.env` **NÃO** deve ser enviado para o GitHub
- Use chaves diferentes para desenvolvimento e produção
- Revogue chaves comprometidas imediatamente
- Monitore logs para detectar uso anômalo

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o arquivo `.env` está configurado
2. Confirme se todas as variáveis estão definidas
3. Reinicie o servidor após alterações
4. Consulte `SECURITY.md` para mais detalhes

---

**Lembre-se**: A segurança é responsabilidade de todos! 🔐
