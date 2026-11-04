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
| Mazurkiewicz (1972) | 🟢 |
| Terzaghi (1942) — 10 % D | 🟢 |
| Massad (1986) | 🟢 |
| Brinch-Hansen — critério dos 90 % | 🟢 |
| Butler & Hoy (1977) | 🟢 |
| Fuller & Hoy (1970) | 🟢 |
| De Beer (1967) | 🟢 |
| Recalque-limite definido pelo usuário | 🟢 |

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

### 1.3 Terzaghi (1942) — 10 % D 🟢
Critério de ruptura convencional que define, arbitrariamente, a carga de ruptura como a correspondente a um recalque igual a **10 % do diâmetro da ponta** da estaca:
```
r_u = 0,10 · D_ponta     →   Qu = Q(r_u)   (interpolada na curva medida ou extrapolada)
```
O diâmetro da ponta é editável (padrão = D do fuste; diferente para estacas com base alargada, ex.: Franki).

> **Ressalva de experiência prática** (exibida no app e no relatório): o recalque de ruptura convencional é da ordem de **10 % D**, enquanto o recalque necessário para mobilizar o **atrito lateral** é da ordem de **2 % D**. O app marca as duas linhas de referência (0,02·D e 0,10·D) no gráfico carga × recalque.

### 1.4 Recalque-limite definido pelo usuário 🟢
Qu = carga para um recalque informado (ex.: 25 mm).

### 1.5 Fuller & Hoy (1970) e Butler & Hoy (1977) 🟢
- Fuller & Hoy: carga em que a tangente à curva atinge inclinação de 0,05 in/ton (≈ 0,14 mm/kN).
- Butler & Hoy: interseção da tangente inicial com a reta de inclinação 1 in / 20 ton (≈ 0,13 mm/kN) tangente ao trecho final.

### 1.6 De Beer (1967) 🟢
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

### 2.5 Mazurkiewicz (1972) 🟢 e Massad (1986) 🟢

Mazurkiewicz (procedimento gráfico): traçar recalques igualmente espaçados, ler as cargas correspondentes, levar cada carga Q(k) ao eixo e traçar a 45° até a vertical de Q(k+1); os pontos de interseção alinham-se numa reta cuja interseção com o eixo das cargas dá Qu. Massad formaliza o mesmo procedimento algebricamente:
Recalques igualmente espaçados Δr; plotar Q(k+1) × Q(k), ajustar reta `Q(k+1) = a + b·Q(k)` no trecho final e intersectar com a reta 45°:
```
Qu = a / (1 − b)
```
Massad mostrou equivalência com Van der Veen.

### 2.6 Brinch-Hansen 80 % 🟢 e 90 % 🟢 (1963)
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

## 4. Regra de traçado dos gráficos — 20° ± 5° 🟢 (obrigatória)

Texto normativo (NBR 16903:2020, apresentação dos resultados — **confirmar o item**):

> Curvas carga × deslocamento e tempo × deslocamento, demonstrando a carga e o deslocamento da leitura inicial e final de cada estágio, adotando-se uma escala em que a reta ligando a origem e o ponto da curva correspondente à **carga estimada de trabalho** resulte em uma inclinação de **20° ± 5° com o eixo das cargas**.

### 4.1 Carga de trabalho estimada (Qt)
O app **pede diretamente a carga de trabalho estimada** (campo da aba `Identificacao`). Se o campo vier vazio, sugere **Qt = Qmáx / 2** (ensaio levado a pelo menos 2× a carga de trabalho), destacado como valor sugerido e editável. Não há fator de segurança envolvido: Qt serve só para definir a escala.

### 4.2 Cálculo da escala
Eixo das cargas horizontal (Q, para a direita) e eixo dos deslocamentos vertical (r, para baixo).
1. Obter r_t = recalque da curva na carga Qt (interpolação linear entre estágios de carregamento).
2. Ângulo no papel com o eixo das cargas: `tan θ = (r_t / s_r) / (Qt / s_Q)`, onde s_Q = kN por cm de papel e s_r = mm por cm de papel.
3. Fixar θ = 20° (alvo) e a largura útil do gráfico; determinar s_Q pelo maior Q plotado e calcular `s_r = r_t · s_Q / (Qt · tan 20°)`, arredondando para escalas "redondas" (1, 2, 2,5, 5 × 10ⁿ) desde que θ final ∈ [15°, 25°].
4. A altura do gráfico resulta da faixa de recalques e de s_r; na tela e na exportação (PNG, DOCX, PDF) a proporção física é mantida.
5. O app mostra a reta auxiliar origem–(Qt, r_t), o ângulo θ obtido e um selo verde (15°–25°) ou alerta.

### 4.3 Representação dos estágios
- **Carga × deslocamento**: em cada estágio, plotar o ponto da **leitura inicial** e o da **leitura final** (curva em "degraus": trecho vertical = deslocamento durante o estágio à carga constante).
- **Tempo × deslocamento**: deslocamento ao longo do tempo do ensaio, marcando início e fim de cada estágio e a carga correspondente.
- Os métodos de interpretação usam, por padrão, a **leitura final** (estabilizada) de cada estágio.

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
- Décourt, L. (1999). Behavior of foundations under working load conditions. XI PCSMGE, Foz do Iguaçu. ✔ confirmado pelo usuário
- Décourt, L. (1996). A ruptura de fundações avaliada com base no conceito de rigidez. SEFE III.
- Décourt, L. (2008). Provas de carga em estacas podem dizer muito mais do que têm dito. SEFE VI.
- Terzaghi, K. (1942). Discussion on the progress report of the committee on the bearing value of pile foundations. Proc. ASCE, 68. — confirmar referência
- Fellenius, B. H. (1980). The analysis of results from routine pile load tests. Ground Engineering. / Basics of Foundation Design.
- Massad, F. (1986). Notes on the interpretation of failure load from routine pile load tests. Solos e Rochas.
- Mazurkiewicz, B. K. (1972). Test loading of piles according to Polish regulations. Royal Swedish Academy of Engineering Sciences (IVA), Commission on Pile Research, Report nº 35, Stockholm.
- Van der Veen, C. (1953). The bearing capacity of a pile. 3rd ICSMFE, Zurich.
- Velloso, D. A.; Lopes, F. R. (2010). Fundações — volume completo. Oficina de Textos.
