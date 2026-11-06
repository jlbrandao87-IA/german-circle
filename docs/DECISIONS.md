# Decisões arquiteturais — v0.3

- **Produto:** Dream Garage (núcleo); My Garage (complemento); Intelligence e Circle posteriores. Quatro marcas: Porsche, Mercedes-Benz, BMW, Audi.
- **Arquitetura:** Next.js + TS em vez de novo framework; facilita trabalho com Codex, componentes e futura renderização híbrida. A UI atual usa client components; otimização SSR fica para fases futuras.
- **Dados:** Supabase Postgres + Auth; isolados por `owner_id` com políticas explícitas de RLS. Sem service role no browser.
- **Privacidade:** garagens não são públicas, dados de sonhos não equivalem a consentimento de marketing ou a intenção firme de compra. Consentimentos distintos.
- **Limite de cinco:** validado na UI e no banco, com lock para concorrência.
- **Fonte de mercado:** nenhuma integração ativa; no futuro apenas fontes licenciadas/autorizadas, exibindo URL, data, amostra, faixa, limitações. ISV requer revisão fiscal.
- **Design:** Heritage + Quiet Luxury; verde escuro, marfim e latão; bandeira alemã como detalhe e não como logotipo principal. Monograma provisório.
- **Trade-offs:** produto nativo evita manutenção de plataforma comunitária externa; aumenta o desenvolvimento interno de moderação e social no futuro.
- **Não fazer agora:** ativar cobrança, prometer avaliação real, importar anúncios sem permissão, lançar redes sociais internas sem moderação, alegar segurança auditada antes de testes reais.

## v0.6 — Custos de importação

- Em vez de inventar taxas de ISV/IVA, a plataforma oferece uma planilha de apuração assistida de custos exatos por operação.
- Ausência de custo é `null` (desconhecido); zero explícito significa valor previamente apurado como não aplicável ou incluso no preço de outra rubrica.
- Preço português só é referência indicativa, mesmo com URL e data recente; sem garantia de equivalência, valor de venda efetivo ou economia.
- Entradas do simulador ficam apenas em memória da sessão; não guardar dados financeiros sensíveis sem consentimento e modelo de privacidade.

## v0.7 | Comparabilidade verificável
- Comparação apenas DE × PT, marca e modelo normalizados, ano e km próximos, motorização compatível.
- Avaliação de versão desconhecida reduz confiança, não gera diferença financeira.
- Cotações separadas dos anúncios e aprovadas manualmente com validade curta, origem e referência documental.
- Receita, economia ou lucro nunca inferidos de uma diferença entre dois anúncios.
- Sem scraping, sem fontes não licenciadas, sem custos fiscais automáticos e sem dados fictícios em produção.
- `MarketComparison` usa RLS de leitura e o backend futuro terá de criar um fluxo auditável de revisão e publicação.

## 2026-11-06 — v0.8
- Watchlist privada armazena associação ao identificador do anúncio, e não cópia do seu texto ou dados de contato.
- Preços históricos só podem ser introduzidos por fluxo administrativo com origem e autorização auditáveis. Membros não podem criar observações.
- Alertas nesta fase são sinais na interface calculados com mínimo de duas observações, não notificações proativas.
- Não prometer tendência de mercado a partir de um único preço pedido ou de anúncios expirados.


### v0.9 — Painel semanal com fontes rastreáveis
O briefing utiliza apenas anúncios válidos em `market_listings` e históricos autorizados em `market_price_observations`. Uma oportunidade recente é determinada pela data da primeira observação (`observed_at`) e não pelo carimbo de reverificação (`verified_at`). A geração de texto de IA é adiada: nenhuma alegação de economia, previsão ou inventário real sem fontes.

## v1.0 — Alertas sem notificações outbound
- As preferências de frequência controlam apenas a janela temporal do painel, não envios agendados.
- Exportação de texto acontece localmente no browser e é iniciada pelo próprio membro.
- O nível mínimo de queda de preço é definido pelo membro; não há alegações automáticas de economia na importação.
- O número de correspondências não constitui cobertura completa do mercado.
