# Revisão do dataset de espécies (T4)

Este documento registra as correções conservadoras feitas em
`packages/species-data/src/index.ts` e as dúvidas que ainda precisam de
revisão humana do grupo antes de o assistente recomendar as espécies.

Regra aplicada: espécie com `source` vazio **não entra** no prompt do
assistente. O campo `source` é um texto curto com a referência usada.

## Removidas

| Espécie | Nome científico anterior | Motivo |
|---|---|---|
| Castanheira | *Bertholletia excelsa* | Espécie amazônica; não ocorre naturalmente na Mata Atlântica baiana. |
| Mangueira | *Rhizophora mangle* | O nome científico era do mangue-vermelho, não de uma árvore de calçada. *Mangifera indica* é exótica. |
| Coco-da-baía | *Cocos nucifera* | Palmeira introduzida/cultivada, não nativa do Brasil. |

## Corrigida

| Espécie | Antes | Depois | Motivo |
|---|---|---|---|
| Sibipiruna | *Caesalpinia echinata* | *Cenostigma pluviosum* | O nome anterior era o do pau-brasil. A sibipiruna é nativa e usada em arborização urbana. |

## Dúvidas pendentes (fora do prompt até revisão)

| Espécie | Nome científico atual | Dúvida |
|---|---|---|
| Ipê-amarelo | *Handroanthus albus* | Confirmar ocorrência na Bahia e adequação a calçadas; em Salvador é comum usar outras espécies de ipê. |
| Imbaúba | *Cecropia peltata* | Confirmar se a ocorrência na Mata Atlântica baiana não corresponde a *Cecropia pachystachya* ou outra espécie do gênero. |
| Cambuí | *Eugenia uniflora* | O nome popular "cambuí" costuma designar outras mirtáceas; *Eugenia uniflora* é a pitangueira. Confirmar nome popular e espécie. |

## Mantidas com fonte

As demais espécies ficaram com `source: "Flora e Funga do Brasil"` e entram no
prompt. Ainda assim, recomenda-se conferir cada uma na Flora e Funga do Brasil
e na lista do Plano Diretor de Arborização Urbana de Salvador (Lei nº
9.187/2017) antes da publicação do relatório.

## Próximo passo humano

1. Confirmar as três dúvidas acima.
2. Preencher `source` das espécies aprovadas ou removê-las.
3. Se uma espécie for aprovada, preencher `source` com a referência curta
   (por exemplo, "Flora e Funga do Brasil" ou "Lei nº 9.187/2017").
