# German Circle — Staging / implantação v1.4

## Objetivo
Verificar a plataforma em ambiente real de desenvolvimento **antes de criar contas de membros**. A importação de dados é administrativa e nada recebido é publicado automaticamente.

## Pré-requisitos
- Node.js >= 20.9, npm e conexão com o registo oficial de pacotes.
- Um projeto **Supabase de staging** e outro separado para produção futura.
- Credenciais próprias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente de servidor.
- Acordo documentado com fornecedor de dados antes de importar anúncios reais. Nenhum acesso de mercado está incluído.

## Passos operacionais
1. Instalar com `npm install` num projeto de teste e gerar/confirmar `package-lock.json` revisado. Em seguida usar `npm ci` em CI com lockfile versionado.
2. Colocar as variáveis de ambiente de staging no gerenciador de segredos do host. Jamais enviar `.env.local` para repositórios nem expor a `SUPABASE_SERVICE_ROLE_KEY` no browser.
3. Aplicar migrações SQL de `supabase/migrations` **em ordem crescente**, num Supabase de teste, fazendo snapshot antes de cada alteração.
4. Configurar autenticação por email e URLs de redirecionamento no Supabase. Criar **duas contas de teste distintas** para validar isolamento de dados.
5. Conceder acesso administrativo à ingestão somente a um utilizador autorizado, via SQL executado por operador privilegiado:
   `insert into public.ingestion_admins(user_id,enabled) values ('<UUID_DO_UTILIZADOR>',true);`
6. Registar um fornecedor fictício de testes com `enabled=true`, `allows_display=false` e uma `permission_reference` de staging; usar apenas `example.org` e dados sintéticos. Não tratar isso como licença comercial.
7. Executar `npm run preflight`, `npm test`, `npm run typecheck`, `npm run build`.
8. Testar autenticação negada, usuário sem papel de admin, payload inválido, payload maior que 4 MiB e CSV duplicado na rota `POST /api/admin/feed-import`.
9. Confirmar que os registros entram só em `market_import_review_queue` como `pending` e que são registrados em `market_import_audit`.
10. Confirmar que outro utilizador autenticado não lê nem altera os dados de garagem privada, watchlist ou revisão administrativa.
11. Verificar o fluxo Dream Garage → correspondências somente com dados aprovados e não expirados.

## Critérios de aceite
- Build Next.js e typecheck sem erros.
- Testes executados em ambiente com dependências instaladas.
- Migrações SQL aplicadas e RLS testada em ambiente Supabase de staging.
- Segredos confinados ao servidor; nenhum valor de `service_role` em bundle cliente.
- Ingestão sem bypass do limite do corpo e sem publicação automática.
- Auditoria administrativa, isolamento por conta e retenção/exclusão de dados verificados.

## Limitações declaradas
Este pacote não contém URL, credenciais ou infraestrutura Supabase reais, nem fontes de anúncios licenciadas. Não há coleta ativa, custos fiscais homologados ou alertas externos configurados. O pré-voo verifica presença de configuração, não autentica remotamente nem testa as políticas de banco; essas exigem staging real.
