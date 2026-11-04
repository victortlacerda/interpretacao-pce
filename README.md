# Interpretação PCE

Aplicativo para **interpretação de provas de carga estática (PCE) em estacas**: importa a planilha do ensaio, calcula a curva carga × recalque a partir das leituras dos relógios, plota os gráficos e determina a carga de ruptura por métodos de extrapolação e critérios de ruptura convencional (NBR 6122, Van der Veen/Aoki, Davisson, Décourt, Chin etc.).

> **Status:** fase de planejamento. Ideias, funcionalidades e métodos estão sendo propostos e validados antes da implementação.

## Documentos

| Documento | Conteúdo |
|---|---|
| [ROADMAP.md](ROADMAP.md) | Fases, entregas e status de aprovação de cada item |
| [docs/funcionalidades.md](docs/funcionalidades.md) | Catálogo de funcionalidades propostas (aprovar / reprovar) |
| [docs/metodos.md](docs/metodos.md) | Formulação de cada método de interpretação, com referências (a validar) |
| [docs/entrada-de-dados.md](docs/entrada-de-dados.md) | Especificação da planilha de entrada |
| [docs/design.md](docs/design.md) | Diretrizes de UX e identidade visual (azul / branco) |
| [modelos/modelo-entrada-pce.xlsx](modelos/modelo-entrada-pce.xlsx) | Planilha-modelo de entrada com exemplo preenchido |

## Convenção de validação

Cada método e funcionalidade tem um status:

- 🟡 **Proposto** — aguardando avaliação
- 🟢 **Aprovado** — entra no escopo
- 🔵 **Validado** — formulação conferida com a bibliografia de referência
- 🔴 **Reprovado** — fora do escopo (mantido no histórico)

## Stack 🟢 aprovada

Aplicação web estática: roda 100% no navegador, sem instalar nada, publicada no **GitHub Pages**; os dados não saem do computador do usuário.

- **React + TypeScript + Vite**
- **SheetJS** — leitura de `.xlsx` / `.csv`
- **Plotly.js** — gráficos interativos (valores ao passar o mouse, zoom, tela cheia, exportar PNG) com escala controlada (regra dos 20°)
- **KaTeX** — equações formatadas na memória de cálculo
- **docx** (docx.js) — relatório Word com equações nativas (OMML) e tabelas
- **pdfmake** / impressão — relatório PDF
- Núcleo de cálculo em TypeScript puro, isolado da interface, com testes (**Vitest**) contra casos da bibliografia
