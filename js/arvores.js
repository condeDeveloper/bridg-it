// A estrategia das duas arvores. ESM puro, sem DOM.
//
// Do ponto de vista do vermelho, o Bridg-it e um jogo num grafo: os vertices
// sao os pontos vermelhos de dentro mais dois terminais (a coluna da esquerda
// inteira e a da direita inteira), e as arestas sao as pontes possiveis. O
// vermelho pega arestas; o azul, ao pegar a ponte que cruza, APAGA a aresta
// vermelha dali.
//
// Uma conta que nao e acaso: o tabuleiro de tamanho n tem n(n-1) + 2 vertices
// e n^2 + (n-1)^2 arestas. Depois do primeiro lance do vermelho (que junta
// dois vertices num so), sobram V vertices e exatamente 2(V - 1) arestas: o
// numero certo para DUAS arvores geradoras, nem uma a mais.
//
// Se as arestas que sobram se dividem em duas arvores geradoras disjuntas, o
// vermelho tem uma estrategia que nunca falha: quando o azul apaga uma aresta
// de uma das arvores, ela se parte em dois pedacos; a outra arvore, por ser
// geradora, tem uma aresta ligando os dois pedacos; o vermelho pega essa
// aresta. As duas continuam sendo arvores geradoras (do grafo com a aresta
// nova contraida), e quando nao sobra nada para apagar, os terminais estao
// ligados.

import { tabuleiro } from './bridgit.js'

// O grafo do vermelho: arestas como pares de ids de vertice, com os dois
// terminais 'E' e 'D'.
export function grafo (n) {
  const t = tabuleiro(n)
  const ids = new Map()
  const id = (x) => { if (!ids.has(x)) ids.set(x, ids.size); return ids.get(x) }
  id('E'); id('D')
  const arestas = t.casas.map((c) => [id(c.v[0]), id(c.v[1])])
  return { t, arestas, V: ids.size }
}

// Uniao e busca com desfazer (sem compressao de caminho, para poder voltar).
class Uniao {
  constructor (n) { this.pai = Array.from({ length: n }, (_, i) => i); this.rank = new Array(n).fill(0); this.hist = [] }
  acha (x) { while (this.pai[x] !== x) x = this.pai[x]; return x }
  une (a, b) {
    let ra = this.acha(a)
    let rb = this.acha(b)
    if (ra === rb) return false
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra]
    this.pai[rb] = ra
    const subiu = this.rank[ra] === this.rank[rb]
    if (subiu) this.rank[ra]++
    this.hist.push([rb, ra, subiu])
    return true
  }
  desfaz () {
    const [rb, ra, subiu] = this.hist.pop()
    this.pai[rb] = rb
    if (subiu) this.rank[ra]--
  }
}

// Divide as arestas (menos a do primeiro lance, que e contraida) em duas
// arvores geradoras disjuntas. Devolve [T1, T2] como listas de indices de
// aresta, ou null. Com contar = true, conta todas as divisoes em vez de parar
// na primeira (cada divisao conta duas vezes, T1 <-> T2).
export function divide (n, primeira, { contar = false } = {}) {
  const { arestas, V } = grafo(n)
  const resto = arestas.map((_, i) => i).filter((i) => i !== primeira)
  const [a0, b0] = arestas[primeira]
  const u1 = new Uniao(V)
  const u2 = new Uniao(V)
  u1.une(a0, b0)
  u2.une(a0, b0)
  const lado = []
  const precisa = V - 2 // arestas de cada arvore no grafo contraido
  let n1 = 0
  let n2 = 0
  let achou = null
  let total = 0
  let nos = 0
  function vai (k) {
    nos++
    if (k === resto.length) {
      if (n1 === precisa && n2 === precisa) {
        total++
        if (!achou) achou = [resto.filter((_, i) => lado[i] === 1), resto.filter((_, i) => lado[i] === 2)]
        return !contar
      }
      return false
    }
    const [a, b] = arestas[resto[k]]
    for (const s of [1, 2]) {
      const u = s === 1 ? u1 : u2
      if ((s === 1 ? n1 : n2) === precisa) continue
      if (!u.une(a, b)) continue
      lado[k] = s
      if (s === 1) n1++; else n2++
      const fim = vai(k + 1)
      if (s === 1) n1--; else n2--
      u.desfaz()
      if (fim) return true
    }
    return false
  }
  vai(0)
  return { arvores: achou, total, nos }
}

// A estrategia em jogo. Guarda as duas arvores como conjuntos de indices de
// aresta; arestas ja pegas pelo vermelho ficam nas duas (contraidas).
export class Estrategia {
  constructor (n, primeira, arvores) {
    const g = grafo(n)
    this.arestas = g.arestas
    this.V = g.V
    this.pegas = new Set([primeira])
    this.T = [new Set(arvores[0]), new Set(arvores[1])]
  }

  // O azul apagou a aresta e. Devolve a aresta que o vermelho pega, ou null
  // se e nao estava em nenhuma arvore (nao acontece com a divisao completa).
  responde (e) {
    const qual = this.T[0].has(e) ? 0 : this.T[1].has(e) ? 1 : -1
    if (qual < 0) return null
    this.T[qual].delete(e)
    // os dois pedacos da arvore partida, contando as pegas como contraidas
    const pai = Array.from({ length: this.V }, (_, i) => i)
    const acha = (x) => { while (pai[x] !== x) { pai[x] = pai[pai[x]]; x = pai[x] } return x }
    for (const i of this.T[qual]) { const [a, b] = this.arestas[i]; pai[acha(a)] = acha(b) }
    for (const i of this.pegas) { const [a, b] = this.arestas[i]; pai[acha(a)] = acha(b) }
    // uma aresta da outra arvore, ainda livre, que ligue os dois pedacos
    const outra = 1 - qual
    for (const i of this.T[outra]) {
      if (this.pegas.has(i)) continue
      const [a, b] = this.arestas[i]
      if (acha(a) !== acha(b)) {
        this.pegas.add(i)
        this.T[qual].add(i)
        return i
      }
    }
    return null
  }
}
