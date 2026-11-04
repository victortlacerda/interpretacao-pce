# Roadmap

Legenda: 🟡 proposto · 🟢 aprovado · 🔵 validado com bibliografia · 🔴 reprovado

## Fase 0 — Planejamento e validação técnica *(atual)*
- [x] Levantamento de métodos de interpretação → [docs/metodos.md](docs/metodos.md)
- [x] Catálogo de funcionalidades → [docs/funcionalidades.md](docs/funcionalidades.md)
- [x] Especificação da planilha de entrada + modelo `.xlsx`
- [x] Diretrizes de design (azul/branco)
- [x] Métodos aprovados: Van der Veen, VdV–Aoki, Chin-Kondner, NBR 6122, Davisson, Brinch-Hansen 80 %, Décourt (1999), Mazurkiewicz (1980)
- [x] Stack aprovada: web estático no navegador, GitHub Pages
- [x] Qu por maior R²; L do usuário; E = 20 GPa padrão; tudo editável
- [x] Saídas: memória de cálculo passo a passo, relatório DOCX + PDF, gráficos interativos com PNG e tela cheia
- [x] Métodos complementares aprovados: Terzaghi 10 % D (ressalva 2 % D atrito), Massad, Brinch-Hansen 90 %, Butler-Hoy, Fuller-Hoy, De Beer, recalque-limite
- [x] Regra 20° ± 5°: reta origem → ponto da carga de trabalho estimada, ângulo com o eixo das cargas; Qt pedido ao usuário (sugestão Qmáx/2)
- [x] Leitura inicial e final de cada estágio nos gráficos carga × deslocamento e tempo × deslocamento
- [ ] Aprovar/reprovar demais funcionalidades
- [ ] Validar formulação de cada método com a bibliografia do usuário
- [ ] Confirmar número do item da NBR 16903 da regra 20° ± 5°
- [ ] Reunir 2–3 ensaios reais com resultado conhecido para servir de casos de teste

## Fase 1 — Núcleo de cálculo (MVP técnico)
- [ ] Leitura da planilha-modelo e cálculo da média dos relógios
- [ ] Ruptura convencional NBR 6122
- [ ] Van der Veen / Van der Veen–Aoki
- [ ] Davisson
- [ ] Testes automatizados com exemplos da bibliografia (tolerância numérica definida)

## Fase 2 — Interface e gráficos (MVP utilizável)
- [ ] Fluxo Importar → Conferir → Interpretar → Relatório
- [ ] Gráfico carga × deslocamento (leitura inicial e final por estágio) com **escala automática 20° ± 5°**
- [ ] Gráfico tempo × deslocamento
- [ ] Sobreposição de retas de ruptura e curvas extrapoladas
- [ ] Tabela editável de estágios, alertas de dispersão
- [ ] Publicação no GitHub Pages

## Fase 3 — Métodos complementares
- [ ] Chin-Kondner, Décourt (rigidez), Mazurkiewicz (1972)/Massad, Brinch-Hansen 80 % e 90 %
- [ ] Terzaghi 10 % D, recalque-limite, Butler-Hoy, Fuller-Hoy, De Beer
- [ ] Gráficos auxiliares por método e seleção de pontos no ajuste
- [ ] Indicador de confiabilidade da extrapolação

## Fase 4 — Memória de cálculo e relatório
- [ ] Memória de cálculo passo a passo na tela (KaTeX + tabelas)
- [ ] Relatório DOCX (equações nativas do Word) e PDF, gráficos em escala normativa
- [ ] Exportação PNG de cada gráfico
- [ ] Salvar/abrir projeto (.json)

## Fase 5 — Evoluções
- [ ] Ensaio lento: recalque × tempo e verificação de estabilização
- [ ] Múltiplos ensaios por obra e estatística
- [ ] Comparação com métodos semiempíricos (SPT)
- [ ] Separação atrito/ponta
