# German Circle v1.5 — staging smoke test

O smoke test é **externo ao Supabase**, não publica dados e pode correr assim que o Next.js estiver hospedado. Execute somente contra staging sob seu controle.

```bash
GC_STAGING_URL=https://staging.seudominio.pt npm run smoke:staging
```

Testes: HTML da homepage, bloqueio de ingestão anónima, rejeição de token inválido e cabeçalho `Cache-Control: no-store` nas respostas administrativas.

**Não basta para colocar a aplicação em produção.** Os seguintes testes requerem um projeto Supabase real e contas de teste autorizadas:

1. Confirmar `npm ci`, `npm run typecheck`, `npm test` e `npm run build` com dependências oficiais e lockfile gerado e revisto.
2. Aplicar migrações na ordem e verificar a política RLS com dois utilizadores: cada um deve visualizar somente a própria garagem e watchlist.
3. Testar autenticação por email e redirecionamentos autorizados.
4. Com um utilizador admin criado manualmente, importar um CSV **sintético** e verificar a fila privada e a auditoria.
5. Testar revogação de acesso admin, duplicação de feed, limite de 4 MiB, tratamento de erro no banco e auditoria.
6. Confirmar que nenhum segredo `SUPABASE_SERVICE_ROLE_KEY` foi embutido no cliente e que os dados de demonstração não aparecem como ofertas reais.
7. Só então homologar fontes externas autorizadas; nunca usar dados comerciais reais sem permissão contratual.

## Limites da v1.5

Não foram configuradas contas externas, domínio ou Supabase nesta entrega. O ambiente de execução atual não conseguiu aceder ao registry npm, impedindo instalar dependências e executar build Next.js. O smoke test foi preparado, mas precisa ser executado no staging do proprietário.
