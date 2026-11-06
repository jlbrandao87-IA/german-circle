# German Circle — Plataforma v0.5 (fundação Next.js + Supabase)

Este projeto dá continuidade ao MVP v0.2, criando **um novo código-base de produção** em Next.js, React, TypeScript e Supabase. Mantém o conceito visual Heritage + Quiet Luxury. Não substitui o protótipo offline — que continua no pacote anterior.

## Estado e limitações

- **Implementado no código:** início de sessão por magic link, Dream Garage e My Garage com CRUD, limite de cinco veículos por garagem, políticas RLS, validações de formulário, design responsivo e esquema inicial de consentimentos.
- **Ainda não verificado em execução:** build e integração real com Supabase, pois não foi possível instalar dependências neste ambiente. Os testes de estrutura foram executados; segurança RLS precisa de testes com duas contas e banco real.
- **Fora do escopo desta entrega:** preços reais, alertas, valuations, fotografias, comunidade, concierge, RGPD operacional completo, pagamentos, e versão pública lançada.

## Executar

1. Crie um projeto Supabase e confirme as suas políticas de segurança.
2. Execute `supabase/migrations/202611060001_initial.sql` pelo SQL Editor ou sistema de migrations.
3. Ative o login por email e configure os URLs de redirecionamento para o seu domínio e localhost.
4. Copie `.env.example` para `.env.local`, preenchendo apenas as variáveis **públicas** (nunca a service role).
5. Execute `npm install`, `npm run check`, depois `npm run dev`.
6. Abra `http://localhost:3000` e teste duas contas separadas.

### Testes obrigatórios antes de exposição pública

- User A não lê, não atualiza nem elimina dados de B, mesmo enviando pedidos de API manualmente.
- A inserção simultânea de dois veículos não permite ultrapassar cinco por tipo de garagem.
- Login, logout, links expirados e tentativas não autenticadas.
- O `member_consents` guarda opt-in explícito, sem consentimento marcado por padrão.
- Exclusão e exportação efetivas de dados, política de privacidade e revisão jurídica RGPD.
- Testes de teclado, leitor de ecrã, foco do modal, acessibilidade e dispositivos móveis.

**Nota:** O modal de cadastro ainda precisa de controlo de foco e fecho acessível para cumprir acessibilidade de produção. Não apresentar como produto pronto para membros reais.

## Próxima implementação

1. Configurar Supabase de desenvolvimento e testes reais de RLS; adicionar CI e testes e2e.
2. Aperfeiçoar o layout mobile, formulário de Dream Garage, galeria privada de fotografias e dados por configuração.
3. Introduzir uma camada de fontes autorizadas de mercado (Alemanha e Portugal) com proveniência e atualização.
4. Iniciar a área German Intelligence, sem preços inventados.

Consulte `docs/DECISIONS.md` para decisões arquiteturais.

## Evolução v0.4 — Dream Preferences

- Prioridade de cada sonho (1–5), ano máximo, quilometragem máxima e tipo de motorização.
- Persistência no PostgreSQL via migração `202611060002_dream_preferences.sql`, aplicada **após** a inicial.
- Ordenação visual por prioridade e melhoria de navegação por teclado no modal.
- Não há preços, fornecedores de dados, fotografias ou notificações reais nesta versão.
- É obrigatório executar `npm run check` e testes com Supabase configurado antes do lançamento.


## Evolução v0.5 — Dream Intelligence (sem fornecedor contratado)

- Catálogo de modelos das **quatro marcas** e sugestões de modelo no formulário.
- `lib/intelligence.ts`: motor de matching com testes de marca, nome do modelo, faixa de anos, motorização, quilometragem máxima e ordenação por afinidade.
- `market_listings` com RLS: apenas **leitura autenticada** de anúncios aprovados, autorizados, verificados há no máximo sete dias e não expirados; escrita restrita a fluxo administrativo separado.
- `components/DreamIntelligence.tsx`: apresenta até três correspondências por veículo da Dream Garage, com fonte, data e preço pedido; na ausência de anúncios, mostra vazio de forma explícita.
- Não há scraping, API de terceiros, feed contratado, dados reais carregados, cálculo de ISV ou inferência de valor de mercado.
- Importante: orçamento do sonho representa teto do **custo posto em Portugal**; portanto, não eliminamos ofertas alemãs só porque o preço anunciado supera ou não supera esse orçamento. Sem um cálculo fiscal confiável, o orçamento só restringe comparáveis portugueses pelo preço anunciado, como aproximação limitada.

### Configuração v0.5

Execute também a migração `supabase/migrations/202611060003_market_intelligence.sql` após as duas anteriores.
Nenhum anúncio de exemplo é semeado em produção. Para ingerir anúncios reais será necessário obter autorização de uso ou feed/licenciamento, confirmar termos de redistribuição, implementar recolha server-side, validação editorial, auditoria e gestão da expiração. Não disponibilize credenciais privilegiadas no browser.

**Verificações nesta entrega:** 12 testes automatizados locais. Sem dependências instaladas, o build Next.js, RLS num Supabase real e testes E2E continuam pendentes.

## Evolução v0.6 — Comparador responsável Alemanha × Portugal

- `lib/import-cost.ts`: motor determinístico de soma de custos **informados pelo utilizador**, com campos obrigatórios: preço de compra, ISV, IVA adicional, transporte/seguro, inspeção/homologação, matrícula/documentação, serviços/preparação e outros gastos. O valor 0 precisa ser explicitamente informado quando validado; nenhum custo desconhecido é preenchido automaticamente.
- `components/ImportCostWorksheet.tsx`: interface em português de Portugal, responsiva e integrada à Dream Garage. O estado é local e **não persiste preços ou cotações**.
- Comparação com preço pedido português só é liberada com URL HTTPS, data de verificação de no máximo 7 dias e total completo; similaridade de equipamentos, estado e quilometragem continua exigindo revisão humana e não é confirmada pelo algoritmo.
- **Não calcula ISV, IVA, legalização ou impostos por taxa.** Também não confirma matrícula, homologação ou situação fiscal. Obter estes valores de fontes oficiais e parceiros profissionais para o veículo e estrutura comercial específica antes de qualquer proposta vinculativa.
- Nenhum preço de anúncio ou imposto foi inventado. A diferença calculada entre custo e preço anunciado **não significa lucro nem economia garantida**.
- `tests/import-cost.test.mjs`: sete testes adicionais de entradas incompletas, 0 confirmado, valores inválidos, origem de comparáveis e dados expirados.
- Total nesta versão: **19 testes automatizados locais passaram** (Node v22). `npm run typecheck` não foi validado porque as dependências Next/React/Supabase ainda não estão instaladas neste ambiente; os erros reportados são de módulos ausentes. Build, Supabase e testes end-to-end permanecem pendentes.

### Próxima etapa

Um provedor de dados licenciado, revisão jurídica e fiscal do motor de impostos e um modelo de comparação entre veículos equivalentes com inspeção e variação de equipamento. Não lançar anúncios de alegada poupança sem estas validações.

## v0.7 — Comparação de mercado DE × PT (2026-11-06)

Esta versão acrescenta `lib/market-comparison.ts`, `components/MarketComparison.tsx` e a migração `202611060004_comparison_quotes.sql`.

**Produto:** para cada anúncio alemão autorizado e atual, procura um comparável português da mesma marca e modelo. Avalia ano, quilometragem, combustível e versão, explicando porque a comparação é alta, média ou baixa. A interface mostra fontes e datas de verificação. Só calcula a diferença entre preços pedidos com correspondência **alta** e uma cotação completa de custo colocado em Portugal.

**Sem simulações disfarçadas de dados:** nenhuma integração de fornecedor comercial foi configurada. A aplicação não vem com anúncios reais nem cotações geradas. Quando o banco está vazio, há um estado vazio explícito. A título de desenvolvimento, os testes usam anúncios fictícios `example.org`; nunca devem ser importados para produção.

**Ingestão futura:** uma integração com fornecedor autorizado ou um painel administrativo autenticado deverá armazenar anúncios e cotações documentadas por meio de backend com auditoria. A RLS não permite escrita aos utilizadores da aplicação. Verificar permissões sobre fotografia, texto e redistribuição antes de publicar qualquer dado. A aprovação deverá exigir origem rastreável, validade, cálculo tributário validado para o veículo e revisão humana. Nenhuma chave privilegiada pode ser enviada ao browser.

**Valor mostrado:** `Preço Alemanha` = preço anunciado (não custo de importação); `Custo total` = cotação completa incluindo IVA (ou 0 validado quando não aplicável), ISV, transporte, inspeção, matrícula, serviços e outros; `Preço Portugal` = anúncio de veículo comparável; `Diferença` = referência PT menos custo total. São **preços pedidos** e não comprovativos de economia realizada nem oferta vinculativa. O algoritmo não comprova equipamento opcional, estado mecânico, garantias, acidentes, ou histórico legal de um veículo — essas informações dependem de inspeção e documentação externas.

**Para executar:** aplicar as migrações SQL em ordem, preencher `.env.local` com valores públicos de projeto Supabase, instalar dependências e executar `npm run check`. O `.env.example` não contém credenciais. Requer configurar um fornecedor e registos aprovados para mostrar resultados reais.

**Verificações executadas aqui:** `npm test` — 30 testes aprovados. Não há `node_modules` neste ambiente, portanto o typecheck e o build Next.js **não** foram validados. A migração ainda não foi aplicada num banco Supabase real. Antes do lançamento: configurar ambiente de staging, executar `npm ci` e `npm run check`, verificar RLS com utilizadores reais e testar cotação de IVA/ISV com especialista fiscal português.

## v0.8 — Private Watchlist & histórico de preços (2026-11-06)

- A Dream Intelligence agora permite guardar/desguardar anúncios autorizados na watchlist do membro autenticado.
- `MemberWatchlist` mostra anúncios ativos guardados e diferenças entre observações de preço reais. As alterações só originam destaque na página quando há pelo menos duas observações e variação absoluta de pelo menos 3%; não é enviado email ou push.
- `lib/watchlist.ts` contém cálculos puros para tendência, variações e elegibilidade de anúncios atuais. Não extrapola preços nem cria séries sintéticas.
- Executar `supabase/migrations/202611060005_member_watchlists.sql` após todas as migrações anteriores. A tabela de watchlists tem políticas por `auth.uid()`; a série histórica só permite SELECT autenticado de observações revistas associadas a anúncios aprovados e ativos.
- A ingestão real de observações de preço exige autorização contratual, fonte identificável e backend administrativo auditável. **Nenhuma fonte externa está conectada e nenhum histórico de preço fictício foi semeado.**
- Atenção: as queries do cliente usam limites para conter volume, não constituem paginação de produção. Exige evoluir para paginação por ids e egress mínimo antes de escalar.
- Testes locais: 36 testes Node passaram. `npm run typecheck`, build Next.js, migrações e RLS no Supabase real continuam por validar; não anunciar como produção pronta.


## v0.9 — Resumo semanal da Dream Garage

- `components/WeeklyDreamBrief.tsx`: painel personalizado para até cinco sonhos com anúncios compatíveis, novas observações nos últimos sete dias e alterações de preço documentadas de pelo menos 3%.
- `lib/weekly-brief.ts`: cálculo determinístico, reutilizável, com data de referência e separação entre dados disponíveis e cobertura inexistente.
- Observações de preço sem histórico não geram variações. A origem, o link e a data permanecem associados a cada anúncio; não há cálculo de economia de importação neste painel.
- Consulta limitada aos 250 anúncios aprovados mais recentemente e 1.000 observações de preço, com aviso explícito de possível cobertura parcial.
- Não há resumo escrito por modelo de linguagem, notificações agendadas ou envio por email nesta versão. Dados reais exigem fornecedor/licença e ingestão revisada.
- Execução local dos testes: `npm test`. É necessário instalar dependências para validar `npm run typecheck` e `npm run build`; essa validação não foi efetuada neste ambiente.

## v1.0 — Dream Alerts: preferências privadas e pré-visualização

- `components/DreamAlerts.tsx`: área de alertas por membro, com frequência desativada/diária/semanal, limiar configurável de descida de preços e seleção dos tipos de aviso. Permite exportar um relatório textual localmente no browser; **não envia emails nem agenda tarefas**.
- `lib/dream-alerts.ts`: gera notificações de correspondências e quedas de preço a partir de fontes previamente aprovadas e observações reais. Rejeita anúncios inválidos/desatualizados. Permite auditoria dos cálculos e não cria poupanças ou custos fiscais fictícios.
- `supabase/migrations/202611060006_dream_alert_preferences.sql`: guarda preferências por membro com RLS `auth.uid()`. Executar após as cinco migrações anteriores.
- Interface: `app/page.tsx` integra os alertas ao fluxo da Dream Garage; `app/globals.css` adiciona estilos desktop/mobile.
- **Limite conhecido:** consultas dos 250 anúncios e 1.000 observações mais recentes podem omitir correspondências. Há aviso de cobertura parcial quando o limite é atingido, mas sem dados suficientes não podemos afirmar cobertura nacional. A próxima fase deve migrar para paginação no backend e consultas direcionadas por sonho.
- **Sem conectores comerciais:** não existe acesso contratado às fontes alemãs ou portuguesas, dados reais semeados ou valores fiscais automáticos. Os alertas apenas pré-visualizam resultados quando já existem registos autorizados no banco.
- **Não homologado para produção:** executar `npm ci`, `npm run check`, migração no Supabase de staging e testes RLS/autenticação com contas distintas antes de disponibilizar a membros. Aqui, `npm test` passou com 55 testes; o build e a integração real ainda não foram executados devido à ausência das dependências.

### Próximas dependências reais

1. Contratar uma fonte de dados com termos que permitam ingestão, armazenamento e redistribuição, identificando licenças e limites.
2. Construir um serviço de ingestão autenticado no backend, com revisão humana, auditoria e desativação de anúncios expirados.
3. Validar o motor de ISV/IVA com especialistas portugueses e tabelas oficiais versionadas antes de apresentar preços finais.
4. Somente depois configurar serviço de entrega de emails com consentimento, opt-out, supressão de duplicados e registos de envio.

## v1.1 — Fornecedores e revisão (6 nov 2026)

- `lib/market-ingestion.ts`: validador puro para lotes fornecidos por parceiro, com controlo de domínio, autorização declarada, idade da observação, moedas em EUR e duplicação.
- `supabase/migrations/202611060007_supplier_review_pipeline.sql`: catálogo privado de fornecedores e fila de revisão sem acesso de membros.
- `scripts/preview-market-feed.mjs`: pré-visualização local sem acesso à rede ou gravação no banco.
- `docs/DATA_PROVIDER_INTEGRATION.md`: fluxo de homologação e limitações.

**Não há dados reais ou fornecedor conectado nesta entrega.** A licença declarada precisa ser conferida por pessoa autorizada; o processo não publica anúncios automaticamente.

## v1.2 — Adaptador CSV de parceiros (06/11/2026)

- `lib/partner-feed.ts`: interpretador CSV offline, com mapeamento de colunas configurável, aliases de marca/país/combustível, validação de formato e limites de tamanho.
- `scripts/preview-partner-csv.mjs`: conversão de exportação de fornecedor em prévia de revisão usando o validador da v1.1; **não autentica, não baixa anúncios, não grava no banco, não publica**.
- `examples/partner-feed/`: especificação de colunas e exemplo estritamente fictício.
- `docs/PROVIDER_SHORTLIST_2026-11-06.md`: triagem preliminar de mobile.de, AutoScout24 e soluções portuguesas; acordos comerciais não confirmados.

Execução com exportação autorizada, após conferir o contrato (e substituir os arquivos de exemplo):

```sh
node --experimental-strip-types scripts/preview-partner-csv.mjs supplier.json mapping.json export.csv report.json
```

**Limitações:** a autorização no JSON é uma declaração, não comprovação de licença; nenhum contrato foi celebrado; o arquivo `demo.csv` é fictício e antigo quando testado no futuro. É necessária API autenticada pelo backend, fila administrativa com auditoria, manutenção/remoção de registros, configuração do Supabase em staging e testes completos de build/RLS antes de uso real.

**Testes locais desta versão:** 67 testes aprovados. Não foram executados build Next.js nem testes em Supabase real neste ambiente.

### v1.3 — Ingestão administrativa segura (código-base)

- `POST /api/admin/feed-import`: recebe CSV de fornecedor autorizado, autentica administrador via Supabase Auth, consulta contrato **no servidor**, normaliza e encaminha para fila privada de revisão.
- `lib/ingestion-batch.ts`: checksum de idempotência, lote para fila pendente, resumo de auditoria.
- `lib/reviewed-feed.ts`: ponte de candidatos aprovados (nunca pendentes) para `matchDream`.
- Migração `202611060008_secure_ingestion.sql`: lista restrita de administradores e log de auditoria.
- Testes unitários de deduplicação e fluxo determinístico preview→revisão→matching.
- [Instruções, limitações e configuração](docs/SECURE_INGESTION_V13.md).

**Sem contrato e credenciais de fornecedor não existe feed de mercado real.** A rota ainda não foi testada numa aplicação implantada com Supabase configurado; o fluxo ponta a ponta comprovado localmente é o núcleo determinístico de validação e correspondência, não a conexão remota.

## v1.4 — Preparação verificável para staging (06/11/2026)

- `lib/server/bounded-json.ts`: leitura segura do corpo com limite efetivo de **4 MiB**, mesmo quando `Content-Length` está ausente ou incorreto. A rota administrativa agora devolve `413` para um envio excessivo.
- `tests/bounded-json.test.mjs`: cinco testes adicionais (incluindo stream fragmentado e UTF-8); **79 testes locais** aprovados.
- `npm run preflight`: verifica requisitos locais, instalação e presença de configuração, sem imprimir segredos. Falha enquanto faltar infraestrutura.
- `docs/STAGING_DEPLOYMENT_v14.md`: passos de instalação, Supabase de staging, migrações, testes de duas contas, ingestão e critérios de aceite.
- **Não foram implantados** Supabase, credenciais nem fornecedores. Não foi possível instalar pacotes via registry (erro de rede); build e typecheck com dependências permanecem por verificar.

## v1.5 — Homologação externa

Adicionado `npm run smoke:staging`, um verificador não destrutivo da homepage e do perímetro de autenticação do endpoint de ingestão. Consulte [`docs/STAGING_SMOKE_v15.md`](docs/STAGING_SMOKE_v15.md). Não equivale a deploy nem valida migrações/RLS. A execução exige `GC_STAGING_URL` apontando para infraestrutura sob controlo do proprietário.
