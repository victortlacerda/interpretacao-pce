# Catálogo de funcionalidades

Marque cada item como 🟢 aprovado ou 🔴 reprovado. IDs servem para referência nas issues.

## A. Entrada de dados

| ID | Funcionalidade | Status |
|---|---|---|
| A1 | Importar planilha `.xlsx` / `.csv` no modelo padrão (cabeçalho + leituras por estágio) | 🟢 |
| A2 | Planilha-modelo para download, com validação de células e exemplo | 🟢 |
| A3 | Média automática dos 4 relógios (configurável 2–4+), com descarte manual de relógio defeituoso | 🟢 |
| A4 | Alerta de dispersão entre relógios (rotação/excentricidade do bloco) — desvio > X % da média | 🟡 |
| A5 | Leituras tempo × recalque dentro de cada estágio (ensaio lento) e verificação do critério de estabilização | 🟡 |
| A6 | Edição dos dados em tabela no próprio app (corrigir leitura sem reabrir o Excel) | 🟡 |
| A7 | Mapeamento de colunas flexível para planilhas fora do padrão (de empresas de ensaio diferentes) | 🟡 |
| A8 | Propriedades da estaca informadas pelo usuário: tipo, D, L, cotas; E = 20 GPa por padrão; todos os parâmetros editáveis | 🟢 |
| A9 | Conversão de unidades (tf ↔ kN, mm ↔ cm) | 🟡 |
| A10 | Importar múltiplos ensaios de uma obra de uma vez | 🟡 |

## B. Gráficos

| ID | Funcionalidade | Status |
|---|---|---|
| B1 | Curva carga × recalque (carregamento e descarregamento), recalque positivo para baixo | 🟢 |
| B2 | **Escala automática para reta a 20° ± 5° (regra normativa)**, com indicador do ângulo e exportação na mesma escala | 🟢 |
| B3 | Sobreposição das retas de ruptura convencional (NBR 6122, Davisson) e do encurtamento elástico PL/AE | 🟢 |
| B4 | Curvas extrapoladas de cada método sobrepostas, com legenda e liga/desliga | 🟢 |
| B5 | Gráficos auxiliares por método: −ln(1−Q/Qu) × r (Van der Veen), r/Q × r (Chin), Q/r × Q (Décourt), Q(k+1) × Q(k) (Mazurkiewicz/Massad) | 🟢 |
| B6 | Recalque × tempo por estágio e recalque × log(tempo) | 🟡 |
| B7 | Gráfico de leituras individuais dos relógios | 🟡 |
| B9 | **Gráficos interativos**: valores ao passar o mouse, zoom/pan, ampliar em tela cheia | 🟢 |
| B8 | Comparação de vários ensaios da mesma obra num só gráfico | 🟡 |

## C. Cálculos

| ID | Funcionalidade | Status |
|---|---|---|
| C1 | Ruptura convencional NBR 6122 (interseção com a curva medida ou extrapolada) | 🟢 |
| C2 | Van der Veen (1953) e Van der Veen modificado por Aoki (1976) — Qu por maior R² | 🟢 |
| C3 | Davisson (1972) | 🟢 |
| C4 | Chin-Kondner | 🟢 |
| C5 | Décourt — rigidez hiperbólica (1999) | 🟢 |
| C6 | Mazurkiewicz (1980) / Massad | 🟢 |
| C7 | Brinch-Hansen 80 % (90 % como complementar) | 🟢 |
| C8 | 10 % D e recalque-limite definido pelo usuário | 🟡 |
| C9 | Butler-Hoy, Fuller-Hoy, De Beer | 🟡 |
| C10 | Seleção de pontos usados em cada ajuste (incluir/excluir estágios clicando no gráfico) | 🟡 |
| C11 | Indicador de confiabilidade da extrapolação (Qmáx/Qu, R², recalque máximo atingido) | 🟡 |
| C12 | Tabela-resumo comparativa de Qu entre métodos + carga admissível | 🟢 |
| C13 | Recalque residual / elástico no descarregamento | 🟡 |
| C14 | Verificação de desempenho (opcional, desligada por padrão — ver nota em métodos §3) | 🟡 |
| C15 | Separação atrito/ponta (Massad, Décourt 2008) | 🟡 |

## D. Relatório e saída

| ID | Funcionalidade | Status |
|---|---|---|
| D1 | Relatório **DOCX e PDF** com identificação da obra, dados da estaca, tabela de leituras, gráficos e resultados | 🟢 |
| D2 | Logo e dados da empresa no cabeçalho do relatório | 🟡 |
| D3 | Exportar resultados para Excel | 🟡 |
| D4 | Exportar cada gráfico em PNG (escala normativa) | 🟢 |
| D5 | **Memória de cálculo passo a passo** no app e no relatório: equações formatadas, tabelas intermediárias, parâmetros e R² de cada ajuste | 🟢 |
| D6 | Salvar/abrir projeto (`.json`) com ajustes e escolhas do usuário | 🟡 |

## E. Experiência de uso

| ID | Funcionalidade | Status |
|---|---|---|
| E1 | Fluxo em 4 passos: Importar → Conferir dados → Interpretar → Relatório | 🟢 |
| E2 | Roda no navegador via GitHub Pages, sem instalar nada, sem cadastro, dados não saem do computador | 🟢 |
| E3 | Interface em português, termos técnicos da NBR | 🟢 |
| E4 | Dicas contextuais explicando cada método e suas limitações | 🟡 |
| E5 | Modo escuro opcional | 🟡 |
| E6 | Ensaio de exemplo pré-carregado para demonstração | 🟡 |

## F. Ideias futuras

| ID | Funcionalidade | Status |
|---|---|---|
| F1 | Banco de ensaios por obra com estatística (média, dispersão de Qu, nº de ensaios conforme NBR 6122) | 🟡 |
| F2 | Comparação com capacidade de carga prevista por métodos semiempíricos (Aoki-Velloso, Décourt-Quaresma) a partir do SPT | 🟡 |
| F3 | Leitura de PDF/relatórios de empresas de ensaio | 🟡 |
| F4 | Ensaios de tração e carga horizontal | 🟡 |
| F5 | Instrumentação em profundidade (strain gauges) — transferência de carga | 🟡 |
