# German Circle — fornecedores de anúncios: shortlist preliminar (06/11/2026)

Nenhuma fonte abaixo está integrada ou contratada. Uma página de API não autoriza redistribuição, exibição em área privada, histórico de preços, uso de imagens ou scraping.

## 1. Alemanha — mobile.de (primeira prioridade de negociação)
Documentação oficial: https://services.mobile.de/manual/index.html e https://services.mobile.de/docs/search-api.html
- Search API/Ad Integration permite procurar anúncios, condicionada à ativação de conta API e credenciais/condições comerciais.
- Seller API destina-se a gerir anúncios do próprio vendedor: não equivale a licença de busca ampla.
- Ad-Stream para eventos de anúncios; licença específica exigida.
**Ação:** pedir termos de uso de Search API com cobertura Alemanha e permissão explícita para exibir dados aos membros em Portugal e manter histórico de preços.

## 2. Alemanha — AutoScout24 (segunda negociação)
Documentação: https://m.listing-creation.api.autoscout24.com/docs
- A API pública documentada é Listing Creation, isto é, principalmente publicação e gestão dos anúncios dos vendedores.
- NÃO presumir acesso à pesquisa geral dos anúncios. Perguntar sobre feed/contrato comercial específico para consumo de dados.

## 3. Portugal — Standvirtual e integradores
Terceiro não oficial: https://docs.carapis.com/platforms/western-europe/standvirtual
- O agregador descreve uma extração de dados do Standvirtual, não uma licença oficial da plataforma.
- Serviços similares (ReefAPI, api.sh) vendem acesso técnico, mas é necessário verificar cadeia de direitos, origem, termos de uso, retenção, imagens e possibilidade de exibição aos membros.
**Ação:** preferência por acordo direto ou integrador que comprove licença adequada. Não ligar automaticamente scrapers a produção.

## 4. ISV/IVA
Fonte oficial: https://info.portaldasfinancas.gov.pt/pt/apoio_ao_contribuinte/Cidadaos/Veiculos/Compra/Paginas/default.aspx
- O ISV depende de cilindrada, CO2 e outros fatores; IVA depende da natureza fiscal da operação.
- A conexão de anúncios não autoriza estimar ISV por preço de compra. Manter campo `unknown` até cotação válida, versionada e revista.

## Critérios de homologação
- Contrato com prazo e finalidade especificados; países DE/PT; exibição em área de membros; retenção e histórico de preços; direitos de texto e fotografia; atribuição; revogação e exclusão.
- Datas de observação e de licenciamento separadas.
- Identificador estável por anúncio; atualização e retirada de anúncios expirados.
- Formato de dados, limites de API, SLA, preço e termos RGPD.
- Auditoria humana e staging antes de produção.
