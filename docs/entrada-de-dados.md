# Especificação da planilha de entrada

Arquivo: `.xlsx` com três abas. Modelo em [`modelos/modelo-entrada-pce.xlsx`](../modelos/modelo-entrada-pce.xlsx).

## Aba `Identificacao`

Pares campo × valor (coluna A = campo, coluna B = valor, coluna C = unidade).

| Campo | Obrigatório | Unidade | Observação |
|---|---|---|---|
| Obra | sim | — | |
| Referência do ensaio | sim | — | ex.: PCE-01 |
| Estaca (identificação) | sim | — | ex.: E-125 |
| Tipo de estaca | sim | — | hélice contínua, raiz, pré-moldada, metálica, escavada, Franki, strauss… |
| Diâmetro D | sim | mm | |
| Comprimento L | sim | m | |
| Cota de arrasamento / execução | não | m | |
| Cota da ponta | não | m | |
| Módulo E | não | GPa | se vazio, usa valor padrão do tipo |
| Carga de trabalho | não | kN | para verificação de desempenho |
| Tipo de carregamento | sim | — | lento / rápido / misto |
| Data | sim | — | |
| Hora de início | sim | hh:mm | |
| Hora de término | sim | hh:mm | |
| Executor / responsável | não | — | |

## Aba `Estagios` (obrigatória)

Uma linha por estágio (leitura final estabilizada de cada estágio).

| Estágio | Fase | Carga (kN) | Relógio 1 (mm) | Relógio 2 (mm) | Relógio 3 (mm) | Relógio 4 (mm) | Hora |
|---|---|---|---|---|---|---|---|

- `Fase`: `C` (carregamento) ou `D` (descarregamento).
- Número de relógios variável (≥ 1); colunas `Relógio n` extras são reconhecidas automaticamente.
- Leituras como recalque acumulado (positivo para baixo). Opção de importar leitura bruta do relógio + leitura zero.

## Aba `Leituras` (opcional, ensaio lento)

Leituras no tempo dentro de cada estágio, para verificar estabilização e plotar recalque × tempo.

| Estágio | Tempo (min) | Relógio 1 | Relógio 2 | Relógio 3 | Relógio 4 |
|---|---|---|---|---|---|
