# Métodos de interpretação da curva carga × recalque

## Escopo aprovado

| Método | Status |
|---|---|
| Van der Veen (1953) | 🟢 |
| Van der Veen modificado por Aoki (1976) | 🟢 |
| Chin-Kondner (1970/1971) | 🟢 |
| Ruptura convencional ABNT NBR 6122 | 🟢 |
| Davisson (1972) | 🟢 |
| Brinch-Hansen — critério dos 80 % | 🟢 |
| Décourt — rigidez hiperbólica (1999) | 🟢 |
| Mazurkiewicz (1980) | 🟢 |
| Complementares sugeridos: Massad (1986), Brinch-Hansen 90 %, 10 % D, Butler-Hoy, Fuller-Hoy, De Beer | 🟡 |

## Decisões de parâmetros

- **L**: comprimento da estaca informado pelo usuário.
- **E**: padrão **20 GPa**, editável.
- **Todos os parâmetros editáveis** (D, L, A, E, constantes dos critérios, estágios usados em cada ajuste).
- **Escolha de Qu nos métodos iterativos (Van der Veen, Aoki): maior R².**

As formulações abaixo ainda devem ser **conferidas com a bibliografia de referência do usuário** (🔵 após conferência). Notação comum:

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

### 1.1 NBR 6122:2019 — ruptura convencional 🟢
Reta de ruptura convencional:

```
r = Q·L / (A·E) + D/30
```

A carga de ruptura convencional é a interseção desta reta com a curva carga × recalque (medida ou extrapolada).

L é o comprimento informado pelo usuário e E vale 20 GPa por padrão, ambos editáveis. Se a curva medida não atingir a reta, a interseção é feita com a curva extrapolada (por padrão, Van der Veen–Aoki), indicando de qual curva veio o resultado.

Pontos a validar: item exato na NBR 6122:2019; regra de traçado 20° ± 5° (seção 4).

### 1.2 Davisson (1972) 🟢
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

### 2.1 Van der Veen (1953) 🟢
```
Q = Qu · (1 − e^(−α·r))
```
Linearização: `−ln(1 − Q/Qu) = α·r`. Procedimento: arbitrar valores de Qu ≥ Qmáx e escolher o que torna a relação mais próxima de uma reta (maior R²).

### 2.2 Van der Veen modificado por Aoki (1976) 🟢
```
Q = Qu · (1 − e^(−(α·r + β)))
−ln(1 − Q/Qu) = α·r + β
```
O intercepto β permite que a reta não passe pela origem.

Procedimento adotado: varredura de Qu a partir de Qmáx (passo fino, refinado em torno do ótimo) e **escolha do Qu de maior R²**. A memória de cálculo mostra a tabela Qu × R² e o gráfico R² × Qu. Por padrão entram os estágios de carregamento, e o usuário pode excluir estágios.

Pontos a validar: limite de confiabilidade da extrapolação (ex.: Qmáx/Qu mínimo), exibido apenas como aviso.

### 2.3 Chin-Kondner (Chin, 1970/1971; Kondner, 1963) 🟢
Hipérbole:
```
r/Q = C1·r + C2        →   Qu = 1/C1
```
Ajuste no trecho final linear. Variante Chin (1978): dois trechos (atrito: 1/C1; total: 1/C2). Válido para estágios de carga iguais e tempos iguais.

### 2.4 Décourt — rigidez hiperbólica (1996, 1999, 2008) 🟢
```
K = Q / r ;   K = a + b·Q   (regressão no trecho final)
Qu = −a / b    (carga para K = 0)
```
Gráfico de rigidez × carga; permite discutir ruptura física × convencional e separar domínio de atrito e de ponta (Décourt 2008).

### 2.5 Mazurkiewicz (1972/1980) 🟢 e Massad (1986) 🟡

Mazurkiewicz (procedimento gráfico): traçar recalques igualmente espaçados, ler as cargas correspondentes, levar cada carga Q(k) ao eixo e traçar a 45° até a vertical de Q(k+1); os pontos de interseção alinham-se numa reta cuja interseção com o eixo das cargas dá Qu. Massad formaliza o mesmo procedimento algebricamente:
Recalques igualmente espaçados Δr; plotar Q(k+1) × Q(k), ajustar reta `Q(k+1) = a + b·Q(k)` no trecho final e intersectar com a reta 45°:
```
Qu = a / (1 − b)
```
Massad mostrou equivalência com Van der Veen.

### 2.6 Brinch-Hansen 80 % 🟢 e 90 % 🟡 (1963)
- **90 %**: Qu é a carga cujo recalque é o dobro do recalque sob 0,9·Qu.
- **80 %**: Qu é a carga cujo recalque é 4× o recalque sob 0,8·Qu; ajuste `√r / Q = C1·r + C2`, com
  `Qu = 1 / (2·√(C1·C2))` e `ru = C2 / C1`.

### 2.7 Rigidez/Décourt + Chin — comparação de domínios 🟡
Exibição conjunta para apontar se o ensaio está em domínio de atrito ou já mobilizou ponta.

---

## 3. Resultados derivados

| Item | Descrição | Status |
|---|---|---|
| Carga admissível | **Fora do escopo padrão.** A interpretação entrega Qu; fator de segurança é decisão de projeto. Possível campo opcional, desligado por padrão | 🔴/🟡 |
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

## 5. Memória de cálculo (obrigatória para todo método)

Para cada método o app e o relatório (DOCX/PDF) mostram, passo a passo:
1. Dados de entrada utilizados (estágios incluídos, D, L, A, E).
2. Equação do método, formatada.
3. Tabela de transformação dos dados (ex.: r, Q, −ln(1−Q/Qu); r/Q; Q/r).
4. Regressão: coeficientes, R², número de pontos; para Van der Veen/Aoki, tabela Qu × R².
5. Substituição numérica e resultado final de Qu, com unidade.
6. Gráfico auxiliar do método e a curva extrapolada sobre a curva medida.

## Referências preliminares

- ABNT NBR 6122:2019 — Projeto e execução de fundações.
- ABNT NBR 16903:2020 — Solo — Prova de carga estática em fundação profunda (substitui a NBR 12131).
- Aoki, N. (1976). Considerações sobre a capacidade de carga de estacas isoladas. Universidade Gama Filho.
- Brinch Hansen, J. (1963). Discussion on hyperbolic stress-strain response. ASCE JSMFD.
- Chin, F. K. (1970/1971). Estimation of the ultimate load of piles not carried to failure. SEAGC.
- Cintra, J. C. A.; Aoki, N.; Tsuha, C. H. C.; Giacheti, H. L. (2013). Fundações: ensaios estáticos e dinâmicos. Oficina de Textos.
- Davisson, M. T. (1972). High capacity piles. ASCE.
- Décourt, L. (1999). Behavior of foundations under working load conditions. XI PCSMGE, Foz do Iguaçu.
- Décourt, L. (1996). A ruptura de fundações avaliada com base no conceito de rigidez. SEFE III.
- Décourt, L. (2008). Provas de carga em estacas podem dizer muito mais do que têm dito. SEFE VI.
- Fellenius, B. H. (1980). The analysis of results from routine pile load tests. Ground Engineering. / Basics of Foundation Design.
- Massad, F. (1986). Notes on the interpretation of failure load from routine pile load tests. Solos e Rochas.
- Mazurkiewicz, B. K. (1972). Test loading of piles according to Polish regulations. Swedish Academy of Engineering Sciences. (citado também como 1980 — confirmar edição de referência)
- Van der Veen, C. (1953). The bearing capacity of a pile. 3rd ICSMFE, Zurich.
- Velloso, D. A.; Lopes, F. R. (2010). Fundações — volume completo. Oficina de Textos.
