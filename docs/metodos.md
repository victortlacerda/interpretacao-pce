# Métodos de interpretação da curva carga × recalque

Todas as formulações abaixo estão **pendentes de validação** contra a bibliografia de referência do usuário. Notação comum:

| Símbolo | Significado | Unidade sugerida |
|---|---|---|
| Q | carga aplicada no topo | kN |
| r (ou ρ) | recalque do topo (média dos relógios) | mm |
| Qu | carga de ruptura (física ou extrapolada) | kN |
| L | comprimento da estaca (cota de arrasamento até a ponta) | m |
| A | área da seção transversal | m² |
| E | módulo de elasticidade do material da estaca | GPa |
| D | diâmetro (ou diâmetro do círculo circunscrito) | mm |

---

## 1. Critérios de ruptura convencional (não extrapolam; interceptam a curva)

### 1.1 NBR 6122:2019 — ruptura convencional 🟡
Reta de ruptura convencional:

```
r = Q·L / (A·E) + D/30
```

A carga de ruptura convencional é a interseção desta reta com a curva carga × recalque (medida ou extrapolada).

Pontos a validar:
- Item/numeração exata na NBR 6122:2019 e redação para "curva não atinge a reta" (uso obrigatório de extrapolação?).
- Comprimento L a adotar (comprimento total × comprimento até o centro de resistência).
- Valores de E por tipo de estaca adotados no app (concreto moldado in loco, pré-moldado, metálica, hélice contínua, raiz…).
- **Regra de traçado do gráfico (20° ± 5°)** — ver seção 4.

### 1.2 Davisson (1972) 🟡
```
r = Q·L / (A·E) + 3,8 mm + D/120        (D em mm)
```
(original em polegadas: 0,15 in + D/120). Algumas referências brasileiras arredondam 3,8 mm para 4 mm — parametrizável.

### 1.3 Critérios de recalque fixo 🟡
- **10 % de D** (Terzaghi; ISSMFE/ISO; Eurocode 7 "10 % D"): Qu = carga para r = 0,10·D.
- **Recalque-limite definido pelo usuário** (ex.: 25 mm), útil para verificação de desempenho.

### 1.4 Fuller & Hoy (1970) e Butler & Hoy (1977) 🟡
- Fuller & Hoy: carga em que a tangente à curva atinge inclinação de 0,05 in/ton (≈ 0,14 mm/kN).
- Butler & Hoy: interseção da tangente inicial com a reta de inclinação 1 in / 20 ton (≈ 0,13 mm/kN) tangente ao trecho final.

### 1.5 De Beer (1967) 🟡
Curva em escala log-log; a ruptura é o ponto de quebra entre os dois trechos retos.

---

## 2. Métodos de extrapolação (ajuste matemático da curva)

### 2.1 Van der Veen (1953) 🟡
```
Q = Qu · (1 − e^(−α·r))
```
Linearização: `−ln(1 − Q/Qu) = α·r`. Procedimento: arbitrar valores de Qu ≥ Qmáx e escolher o que torna a relação mais próxima de uma reta (maior R²).

### 2.2 Van der Veen modificado por Aoki (1976) 🟡
```
Q = Qu · (1 − e^(−(α·r + β)))
−ln(1 − Q/Qu) = α·r + β
```
O intercepto β permite que a reta não passe pela origem. Pontos a validar:
- Critério de escolha de Qu (máx. R²; ou varredura com incremento de ~0,5 % de Qmáx até a reta ficar retilínea).
- Quais estágios entram no ajuste (todos, apenas carregamento, descartando primeiros estágios).
- Limite de confiabilidade: recomendações de que a extrapolação só é confiável se o ensaio atingir parcela relevante de Qu (ex.: Velloso & Lopes citam ≥ 2/3 Qu) e/ou recalque mínimo — **regra a ser definida pela bibliografia**.

### 2.3 Chin-Kondner (Chin, 1970/1971; Kondner, 1963) 🟡
Hipérbole:
```
r/Q = C1·r + C2        →   Qu = 1/C1
```
Ajuste no trecho final linear. Variante Chin (1978): dois trechos (atrito: 1/C1; total: 1/C2). Válido para estágios de carga iguais e tempos iguais.

### 2.4 Décourt (1996, 2008) — rigidez 🟡
```
K = Q / r ;   K = a + b·Q   (regressão no trecho final)
Qu = −a / b    (carga para K = 0)
```
Gráfico de rigidez × carga; permite discutir ruptura física × convencional e separar domínio de atrito e de ponta (Décourt 2008).

### 2.5 Mazurkiewicz (1972) e Massad (1986) 🟡
Recalques igualmente espaçados Δr; plotar Q(k+1) × Q(k), ajustar reta `Q(k+1) = a + b·Q(k)` no trecho final e intersectar com a reta 45°:
```
Qu = a / (1 − b)
```
Massad mostrou equivalência com Van der Veen.

### 2.6 Brinch-Hansen 80 % e 90 % (1963) 🟡
- **90 %**: Qu é a carga cujo recalque é o dobro do recalque sob 0,9·Qu.
- **80 %**: Qu é a carga cujo recalque é 4× o recalque sob 0,8·Qu; ajuste `√r / Q = C1·r + C2`, com
  `Qu = 1 / (2·√(C1·C2))` e `ru = C2 / C1`.

### 2.7 Rigidez/Décourt + Chin — comparação de domínios 🟡
Exibição conjunta para apontar se o ensaio está em domínio de atrito ou já mobilizou ponta.

---

## 3. Resultados derivados

| Item | Descrição | Status |
|---|---|---|
| Carga admissível | Qadm = Qu / FS (FS = 2,0 conforme NBR 6122 quando há prova de carga — **validar**), limitada por critério de recalque | 🟡 |
| Recalque elástico × permanente | A partir do descarregamento (recalque residual) | 🟡 |
| Encurtamento elástico teórico | Reta PL/AE no gráfico | 🟡 |
| Verificação de desempenho | Prova de carga atingiu ≥ 1,6 × carga de trabalho? (NBR 6122 — **validar**) | 🟡 |
| Separação atrito/ponta | Massad (1992, "relações de Cambefort"), Décourt (2008), Chin 2 trechos | 🟡 |
| Tabela comparativa | Qu de cada método, média, desvio, relação Qu/Qmáx | 🟡 |

---

## 4. Regra de traçado do gráfico — 20° ± 5° 🟢 (funcionalidade obrigatória)

A norma estabelece que a curva carga × recalque seja traçada em escala tal que a reta de referência fique com inclinação de **20° ± 5°**. O app deve calcular automaticamente as escalas dos eixos (mm de recalque por unidade de comprimento do gráfico × kN por unidade de comprimento) para atender a esta condição, com:

- ajuste automático da razão de aspecto do gráfico (proporção física fixada, independente da tela);
- exportação (PNG/PDF) mantendo a mesma escala física;
- indicador visual do ângulo resultante e alerta se fora de 15°–25°;
- possibilidade de ajuste manual dentro da faixa admissível.

**A validar com a norma:** (a) qual reta é a referência — a reta de ruptura convencional `PL/AE + D/30`, a reta do encurtamento elástico `PL/AE`, ou a secante da origem ao ponto de carga máxima; (b) contra qual eixo o ângulo é medido (eixo das cargas ou dos recalques); (c) item exato da NBR 6122:2019 / NBR 16903:2020.

---

## Referências preliminares

- ABNT NBR 6122:2019 — Projeto e execução de fundações.
- ABNT NBR 16903:2020 — Solo — Prova de carga estática em fundação profunda (substitui a NBR 12131).
- Aoki, N. (1976). Considerações sobre a capacidade de carga de estacas isoladas. Universidade Gama Filho.
- Brinch Hansen, J. (1963). Discussion on hyperbolic stress-strain response. ASCE JSMFD.
- Chin, F. K. (1970/1971). Estimation of the ultimate load of piles not carried to failure. SEAGC.
- Cintra, J. C. A.; Aoki, N.; Tsuha, C. H. C.; Giacheti, H. L. (2013). Fundações: ensaios estáticos e dinâmicos. Oficina de Textos.
- Davisson, M. T. (1972). High capacity piles. ASCE.
- Décourt, L. (1996). A ruptura de fundações avaliada com base no conceito de rigidez. SEFE III.
- Décourt, L. (2008). Provas de carga em estacas podem dizer muito mais do que têm dito. SEFE VI.
- Fellenius, B. H. (1980). The analysis of results from routine pile load tests. Ground Engineering. / Basics of Foundation Design.
- Massad, F. (1986). Notes on the interpretation of failure load from routine pile load tests. Solos e Rochas.
- Mazurkiewicz, B. K. (1972). Test loading of piles according to Polish regulations.
- Van der Veen, C. (1953). The bearing capacity of a pile. 3rd ICSMFE, Zurich.
- Velloso, D. A.; Lopes, F. R. (2010). Fundações — volume completo. Oficina de Textos.
