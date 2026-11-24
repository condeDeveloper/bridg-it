# Bridg-it

O Bridg-it (o jogo de Gale) resolvido por busca completa até o tamanho 3, e a estratégia das duas árvores conferida contra todas as respostas possíveis. JavaScript puro, sem dependência nenhuma.

Pontos vermelhos e azuis intercalados. Na sua vez você liga dois pontos vizinhos da sua cor com uma ponte, e as pontes não se cruzam. O vermelho quer atravessar da esquerda à direita; o azul, de cima a baixo. O vermelho começa.

**Página jogável:** <https://condedeveloper.github.io/bridg-it/>

---

## Os quatro achados

**1. Qualquer primeira ponte ganha.** No tamanho 3 (13 casas), a busca completa diz que quem começa ganha em **9 meio-lances**, e que **as 13 aberturas ganham**: as três pontes do meio fecham em 9, as outras dez em 11. No tamanho 2, as 5 aberturas ganham em 5. Um juiz que lê o desenho por inundação, sem nada do núcleo, concorda nas **655.984** posições do tamanho 3.

**2. Depois da primeira ponte sobram exatamente as arestas de duas árvores.** Do ponto de vista do vermelho o tabuleiro é um grafo, e a ponte azul apaga a aresta vermelha que cruza. O tamanho n tem n(n−1) + 2 vértices e n² + (n−1)² arestas; depois da abertura sobram V vértices e **exatamente 2(V − 1) arestas**, o número de duas árvores geradoras, em todo tamanho de 2 a 7. E em **todas as aberturas** dos tamanhos 2 a 5 (5, 13, 25 e 41 aberturas) as arestas que sobram se dividem mesmo em duas árvores disjuntas.

**3. A estratégia das duas árvores ganha todas as 362.034 partidas possíveis do tamanho 3.** Quando o azul apaga uma aresta de uma árvore, ela se parte em dois pedaços; a outra árvore tem uma aresta ligando os dois, e o vermelho pega essa. Contra todas as respostas do azul a todas as 13 aberturas, são **362.034 partidas, e o vermelho ganha todas**. Nos tamanhos 4, 5 e 6, ganha as 2.000 partidas sorteadas de cada um.

**4. Nunca há empate, e o tabuleiro cheio é meio a meio.** Nos **8.192** tabuleiros cheios do tamanho 3, exatamente um lado atravessa: 4.096 o vermelho, 4.096 o azul, nenhum com os dois e nenhum sem nenhum.

---

## As tabelas

Todos os números abaixo saem de `node ferramentas/medidor.js` e estão presos em `testes/`. Nenhum foi digitado à mão.

### A busca completa

| tamanho | casas | quem começa ganha em | aberturas que ganham | duração conforme a abertura |
| --- | --- | --- | --- | --- |
| 1 | 1 | 1 | 1 de 1 | 1 |
| 2 | 5 | 5 | 5 de 5 | 5 |
| 3 | 13 | 9 | **13 de 13** | 9 (3 aberturas) a 11 |

Com o azul começando, o resultado é o mesmo, pela simetria do tabuleiro.

### As duas árvores

| tamanho | vértices | arestas | depois da abertura | aberturas com divisão | nós da busca |
| --- | --- | --- | --- | --- | --- |
| 2 | 4 | 5 | 3 vértices, 4 arestas | 5 de 5 | 27 |
| 3 | 8 | 13 | 7 vértices, 12 arestas | 13 de 13 | 320 |
| 4 | 14 | 25 | 13 vértices, 24 arestas | 25 de 25 | 9.714 |
| 5 | 22 | 41 | 21 vértices, 40 arestas | 41 de 41 | 2.661.587 |
| 6 | 32 | 61 | 31 vértices, 60 arestas | **não terminou** | |

No tamanho 6 a busca da divisão, que tenta as arestas em ordem fixa, não terminou em dez minutos para todas as aberturas. Para a abertura do meio ela acha a divisão na hora, e é com ela que a página e o teste sorteado jogam. A tabela diz o que foi medido.

De quantos jeitos as duas árvores se dividem, por abertura: no tamanho 2, **2** em todas; no tamanho 3, de **56 a 78** (`56 78 56 56 62 56 56 78 56 56 56 56 56`).

### A estratégia

| tamanho | partidas | o vermelho ganha | como |
| --- | --- | --- | --- |
| 2 | 32 | 32 | todas as respostas a todas as aberturas |
| 3 | 362.034 | 362.034 | todas as respostas a todas as aberturas |
| 4 | 2.000 | 2.000 | azul ao acaso |
| 5 | 2.000 | 2.000 | azul ao acaso |
| 6 | 2.000 | 2.000 | azul ao acaso |

### Os tabuleiros cheios e o juiz

| tamanho | tabuleiros cheios | só vermelho | só azul | os dois | nenhum |
| --- | --- | --- | --- | --- | --- |
| 2 | 32 | 16 | 16 | 0 | 0 |
| 3 | 8.192 | 4.096 | 4.096 | 0 | 0 |

O juiz do desenho concorda com o núcleo nas 136 posições do tamanho 2 e nas 655.984 do tamanho 3.

---

## Como funciona

**O núcleo** (`js/bridgit.js`) vê o tabuleiro como uma lista de casas (o ponto onde uma ponte vermelha e uma azul se cruzariam) e resolve por busca com memória. O índice da memória é a posição em base 3 vezes 2 mais a vez: 3,2 milhões de bytes no tamanho 3, que cabem até no navegador. Quem ligou sai de união e busca sobre os ids dos pontos.

**O juiz** (`js/juiz.js`) não importa nada do núcleo. O tabuleiro é o desenho: uma grade em que os pontos vermelhos ficam em (x par, y ímpar) e os azuis em (x ímpar, y par). Quem ligou sai de inundação a partir da borda, casa a casa, e a busca guarda as posições num `Map` de textos.

**As duas árvores** (`js/arvores.js`) saem de uma busca por ramos com união e busca que desfaz, e a estratégia guarda as duas árvores como conjuntos de arestas, com as já pegas contraídas.

---

## O que as medidas me corrigiram

- **A página usava máscara de bits, e a máscara do JavaScript tem 32 casas.** O tamanho 5 tem 41 casas e o 6 tem 61; `1 << 40` dá 256, sem aviso. O teste de navegador, clicando ao acaso com o azul, ganhou da "estratégia que nunca perde" no tamanho 6. A estratégia estava certa (o teste sorteado em Node usa conjuntos e ganhou as 2.000); quem errava era a página, que marcava pontes nas casas erradas. Agora a página guarda as pontes em conjuntos, e um teste confere a ligação numa fileira com casas acima da 32.
- **O primeiro teste dessa correção mirou a fileira errada.** Escrevi que a fileira do meio do tamanho 6 tinha casas acima da 32; as do meio vão de 18 a 23. A última fileira é que passa.
- **A busca da divisão não termina no tamanho 6.** Rodei as 61 aberturas esperando segundos, e em dez minutos ela não tinha saído. A tabela diz isso em vez de esconder a linha.

---

## Como rodar

Precisa de Node 20 ou mais novo. Sem dependência nenhuma.

```bash
npm test                               # a suíte inteira
npm run medir                          # as tabelas rápidas
node ferramentas/medidor.js arvores    # uma tabela só
node ferramentas/medidor.js juiz       # o desenho contra o núcleo (uns 50 s)
```

## Licença

MIT
