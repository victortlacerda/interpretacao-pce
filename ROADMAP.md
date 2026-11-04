# Roadmap

Legenda: 🟡 proposto · 🟢 aprovado · 🔵 validado com bibliografia · 🔴 reprovado

## Fase 0 — Planejamento e validação técnica *(atual)*
- [x] Levantamento de métodos de interpretação → [docs/metodos.md](docs/metodos.md)
- [x] Catálogo de funcionalidades → [docs/funcionalidades.md](docs/funcionalidades.md)
- [x] Especificação da planilha de entrada + modelo `.xlsx`
- [x] Diretrizes de design (azul/branco)
- [ ] Aprovar/reprovar funcionalidades
- [ ] Validar formulação de cada método com a bibliografia do usuário
- [ ] Confirmar a regra de traçado 20° ± 5° (reta de referência, eixo, item da norma)
- [ ] Aprovar stack (React+TS web estático × Python/Streamlit)
- [ ] Reunir 2–3 ensaios reais com resultado conhecido para servir de casos de teste

## Fase 1 — Núcleo de cálculo (MVP técnico)
- [ ] Leitura da planilha-modelo e cálculo da média dos relógios
- [ ] Ruptura convencional NBR 6122
- [ ] Van der Veen / Van der Veen–Aoki
- [ ] Davisson
- [ ] Testes automatizados com exemplos da bibliografia (tolerância numérica definida)

## Fase 2 — Interface e gráficos (MVP utilizável)
- [ ] Fluxo Importar → Conferir → Interpretar → Relatório
- [ ] Gráfico carga × recalque com **escala automática 20° ± 5°**
- [ ] Sobreposição de retas de ruptura e curvas extrapoladas
- [ ] Tabela editável de estágios, alertas de dispersão
- [ ] Publicação no GitHub Pages

## Fase 3 — Métodos complementares
- [ ] Chin-Kondner, Décourt (rigidez), Mazurkiewicz/Massad, Brinch-Hansen
- [ ] 10 % D, recalque-limite, Butler-Hoy, Fuller-Hoy, De Beer (conforme aprovação)
- [ ] Gráficos auxiliares por método e seleção de pontos no ajuste
- [ ] Indicador de confiabilidade da extrapolação

## Fase 4 — Relatório
- [ ] Relatório PDF com gráficos em escala normativa
- [ ] Memorial de cálculo
- [ ] Exportação Excel e salvar/abrir projeto

## Fase 5 — Evoluções
- [ ] Ensaio lento: recalque × tempo e verificação de estabilização
- [ ] Múltiplos ensaios por obra e estatística
- [ ] Comparação com métodos semiempíricos (SPT)
- [ ] Separação atrito/ponta
