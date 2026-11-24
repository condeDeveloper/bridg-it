// As tabelas do README, uma funcao por tabela. O medidor imprime, os testes
// prendem.

import { Jogo, VERMELHO, AZUL } from './bridgit.js'
import { divide, grafo, Estrategia } from './arvores.js'
import { juiz, cheios } from './juiz.js'

const jogos = new Map()
function jogo (n) {
  if (!jogos.has(n)) jogos.set(n, new Jogo(n))
  return jogos.get(n)
}

// Quem ganha do comeco, e o que cada primeira ponte do vermelho vale.
export function solucao (n) {
  const j = jogo(n)
  const vermelho = j.valor(0, 0, VERMELHO) - 1
  const azul = j.valor(0, 0, AZUL) - 1
  // meio-lances ate o fim depois de cada primeira ponte, contando ela
  const primeiras = []
  for (let c = 0; c < j.t.E; c++) {
    const f = j.depois(0, 0, VERMELHO, c)
    primeiras.push(f < 0 ? { ganha: true, lances: -f } : { ganha: false, lances: f })
  }
  return {
    E: j.t.E,
    vermelhoComecaGanhaEm: vermelho,
    azulComecaGanhaEm: azul,
    primeirasQueGanham: primeiras.filter((p) => p.ganha).length,
    maisRapida: Math.min(...primeiras.map((p) => p.lances)),
    maisLenta: Math.max(...primeiras.map((p) => p.lances)),
    rapidas: primeiras.filter((p) => p.lances === Math.min(...primeiras.map((q) => q.lances))).length
  }
}

// Para cada primeira ponte, as arestas que sobram se dividem em duas arvores
// geradoras disjuntas?
export function divisoes (n) {
  const g = grafo(n)
  let com = 0
  let nos = 0
  for (let e = 0; e < g.arestas.length; e++) {
    const r = divide(n, e)
    if (r.arvores) com++
    nos += r.nos
  }
  return { V: g.V, E: g.arestas.length, com, nos, sobraV: g.V - 1, sobraE: g.arestas.length - 1 }
}

// De quantos jeitos as duas arvores se dividem, para cada primeira ponte.
export function quantasDivisoes (n) {
  const g = grafo(n)
  return g.arestas.map((_, e) => divide(n, e, { contar: true }).total / 2)
}

// Todas as respostas do azul contra a estrategia, a partir de cada primeira
// ponte. Conta as partidas e confere que o vermelho ganha todas.
export function estrategiaInteira (n) {
  const g = grafo(n)
  let partidas = 0
  let ganhas = 0
  let maiorPartida = 0
  for (let e = 0; e < g.arestas.length; e++) {
    const arv = divide(n, e).arvores
    const est = new Estrategia(n, e, arv)
    const apagadas = new Set()
    const vai = (lances) => {
      const livres = []
      for (let i = 0; i < g.arestas.length; i++) if (!est.pegas.has(i) && !apagadas.has(i)) livres.push(i)
      if (ligouPegas(g, est.pegas)) { partidas++; ganhas++; maiorPartida = Math.max(maiorPartida, lances); return }
      if (livres.length === 0) { partidas++; return }
      for (const f of livres) {
        // copia o estado da estrategia, para voltar depois
        const T0 = new Set(est.T[0])
        const T1 = new Set(est.T[1])
        const P = new Set(est.pegas)
        apagadas.add(f)
        const resp = est.responde(f)
        if (resp === null) { partidas++ } else vai(lances + 2)
        apagadas.delete(f)
        est.T[0] = T0; est.T[1] = T1; est.pegas = P
      }
    }
    vai(1)
  }
  return { partidas, ganhas, maiorPartida }
}

function ligouPegas (g, pegas) {
  const pai = Array.from({ length: g.V }, (_, i) => i)
  const acha = (x) => { while (pai[x] !== x) { pai[x] = pai[pai[x]]; x = pai[x] } return x }
  for (const i of pegas) { const [a, b] = g.arestas[i]; pai[acha(a)] = acha(b) }
  return acha(0) === acha(1) // 0 e 'E', 1 e 'D' (os primeiros ids do grafo)
}

// Partidas com o azul jogando ao acaso, para os tamanhos em que a arvore de
// respostas nao cabe. Um sorteador com semente, para o teste repetir.
export function estrategiaSorteada (n, partidas, semente = 1) {
  let s = semente >>> 0
  const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296 }
  const g = grafo(n)
  const central = Math.floor(n / 2) * n + Math.floor(n / 2) // uma ponte horizontal do meio
  const arv = divide(n, central).arvores
  let ganhas = 0
  for (let p = 0; p < partidas; p++) {
    const est = new Estrategia(n, central, arv)
    const apagadas = new Set()
    for (;;) {
      if (ligouPegas(g, est.pegas)) { ganhas++; break }
      const livres = []
      for (let i = 0; i < g.arestas.length; i++) if (!est.pegas.has(i) && !apagadas.has(i)) livres.push(i)
      if (!livres.length) break
      const f = livres[Math.floor(rnd() * livres.length)]
      apagadas.add(f)
      if (est.responde(f) === null) break
    }
  }
  return { partidas, ganhas }
}

// O juiz do desenho contra o nucleo, em todas as posicoes que o juiz visitou.
export function confronto (n) {
  const J = juiz(n)
  J.valor('R')
  J.valor('B')
  const g = jogo(n)
  const pos = new Map(g.t.casas.map((c, i) => [c.x + ',' + c.y, i]))
  let dif = 0
  let total = 0
  for (const [k, v] of J.memo) {
    let vm = 0
    let az = 0
    J.casas.forEach(([x, y], i) => {
      const c = pos.get(x + ',' + y)
      if (k[i] === 'R') vm |= 1 << c
      else if (k[i] === 'B') az |= 1 << c
    })
    total++
    if (g.valor(vm, az, k[k.length - 1] === 'R' ? VERMELHO : AZUL) !== v) dif++
  }
  return { total, dif }
}

export { cheios }
