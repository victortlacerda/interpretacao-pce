# Diretrizes de design e UX

## Princípios
1. **Prático**: do arquivo ao resultado em menos de 1 minuto. Fluxo linear em 4 passos com barra de progresso.
2. **Transparente**: todo número mostrado tem o "porquê" a um clique (pontos usados, equação, R²).
3. **Técnico sem ruído**: terminologia da NBR, unidades sempre visíveis, nada de jargão de software.

## Paleta (tons claros de azul e branco)

| Token | Cor | Uso |
|---|---|---|
| `--bg` | `#F7FAFD` | fundo da página |
| `--surface` | `#FFFFFF` | cartões, tabelas |
| `--primary-900` | `#0B3A66` | títulos, texto forte |
| `--primary-600` | `#1E6FD9` | botões, curva medida |
| `--primary-300` | `#8CB8F0` | bordas ativas, curvas extrapoladas |
| `--primary-100` | `#E3EEFB` | fundos de destaque, linhas alternadas |
| `--text` | `#1F2A37` | texto corpo |
| `--muted` | `#6B7A8C` | legendas, unidades |
| `--ok` | `#1A9E6E` | dentro do critério (ex.: ângulo 15–25°) |
| `--warn` | `#D98A1E` | alertas (dispersão de relógios) |
| `--error` | `#C93B3B` | erros de importação |

Cores das curvas por método: tons distintos de azul/teal com traços diferentes (contínuo, tracejado, pontilhado) para não depender só de cor.

## Tipografia
- Interface: **Inter**; números tabulares para tabelas de leitura.
- Gráficos: mesma fonte, eixos com unidade entre parênteses.

## Layout das telas
1. **Importar** — área de arrastar arquivo, botão "baixar modelo", botão "abrir exemplo".
2. **Conferir dados** — cartão da estaca (tipo, D, L, E) + tabela editável dos estágios com média calculada e alertas de dispersão; gráfico prévio.
3. **Interpretar** — gráfico principal à esquerda (escala 20°), painel de métodos à direita com liga/desliga, Qu de cada um e tabela comparativa abaixo.
4. **Relatório** — prévia do PDF, campos de responsável/logo, exportar.

Responsivo: em telas estreitas o painel de métodos vai para baixo do gráfico; o gráfico normativo mantém proporção fixa.
