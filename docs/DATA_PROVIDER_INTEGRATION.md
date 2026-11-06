# German Circle — integração de fornecedores (v1.1)

## Estado

Implementado **em código local**: validador de lotes, revisão preliminar, registro SQL de fornecedores e fila administrativa privada. **Não existe fornecedor licenciado contratado, API real configurada ou anúncios reais importados.** Nenhuma integração está implantada.

## Procedimento para o primeiro fornecedor

1. Obter contrato escrito que autorize expressamente acesso, armazenamento, exibição pública dentro da área de membros, histórico de preços e frequência de atualização; verificar política de imagens, retenção, países, sublicenciamento e revogação.
2. Verificar os domínios autorizados e configurar uma entrada privada `market_suppliers` (com `enabled=false` até homologação).
3. Receber lote pelo mecanismo autorizado do parceiro (API, feed ou exportação); **não criar scraper sem permissão**. Não copiar credenciais para o navegador.
4. Mapear os campos para `RawSupplierListing`, normalizando marca, versão, motorização, preços em EUR e timestamps com timezone.
5. Gerar prévia local: `node --experimental-strip-types scripts/preview-market-feed.mjs supplier.json records.json preview.json` (o arquivo de saída deve ainda não existir).
6. Revisar rejeições e registros aceitos. Guardar comprovante de autorização e trilha da origem; confirmar que preços e anúncios são atuais.
7. Só depois de implementar o **serviço administrativo de gravação e aprovação auditada** usar a fila SQL. Esta versão não executa o carregamento nem publica nada automaticamente.
8. Configurar medição de cobertura por marca/modelo/região, validade dos dados, política de retirada de anúncios e revisão de conformidade.

## Restrições atuais

- O `permission_reference` é uma declaração passada como dado; o algoritmo **não consegue comprovar a existência jurídica da licença**. Um administrador tem de conferir o contrato.
- No importador de prévia, URLs são permitidas apenas em `https` e em domínios explicitamente autorizados; a lista de domínios também exige revisão administrativa.
- O lote não faz download, armazenamento, escrita no Supabase, homologação nem publicação.
- Nenhuma comparação pode afirmar poupança sem cotação completa, versão comparável e data de verificação.
- Não publicar imagens de terceiros sem licença específica. Links não implicam direito de copiar conteúdos.
- Testes atuais não substituem `npm run build`, teste de autenticação com Supabase real, teste das migrações e revisão de segurança.

## Próxima entrega técnica

Serviço de servidor autenticado para importação assinada + trilha auditável + ação de aprovação humana. Depois, primeiro adaptador para um fornecedor contratado e dados reais. Não priorizar feed social até esta etapa estar funcional.
