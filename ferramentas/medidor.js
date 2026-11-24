#!/usr/bin/env node
// O medidor. Roda as tabelas e cospe os numeros que vao para o README.
//
//   node ferramentas/medidor.js              as tabelas rapidas
//   node ferramentas/medidor.js solucao      quem ganha e o que vale cada abertura, n = 1 a 3
//   node ferramentas/medidor.js arvores      as duas arvores depois de cada abertura, n = 2 a 5
//   node ferramentas/medidor.js estrategia   a estrategia contra todas as respostas e contra o acaso
//   node ferramentas/medidor.js cheios       todos os tabuleiros cheios: nunca empate
//   node ferramentas/medidor.js juiz         o desenho contra o nucleo no 3x3 (uns 50 s)

import { solucao, divisoes, quantasDivisoes, estrategiaInteira, estrategiaSorteada, confronto, cheios } from '../js/medidas.js'

const n = (x) => x.toLocaleString('pt-BR')

function tSolucao () {
  console.log('\n== a busca completa ==')
  for (const k of [1, 2, 3]) {
    const s = solucao(k)
    console.log(`  n=${k}: ${s.E} casas; o vermelho comecando ganha em ${s.vermelhoComecaGanhaEm} meio-lances, o azul comecando tambem (${s.azulComecaGanhaEm})`)
    console.log(`        primeiras pontes que ganham: ${s.primeirasQueGanham} de ${s.E}; a partida dura de ${s.maisRapida} a ${s.maisLenta} meio-lances conforme a abertura (${s.rapidas} aberturas na mais rapida)`)
  }
}

function tArvores () {
  console.log('\n== depois da primeira ponte: duas arvores geradoras disjuntas? ==')
  for (const k of [2, 3, 4, 5]) {
    const d = divisoes(k)
    console.log(`  n=${k}: ${d.V} vertices, ${d.E} arestas; depois da abertura ${d.sobraV} vertices e ${d.sobraE} arestas (= 2 x ${d.sobraV - 1}); com divisao: ${d.com} de ${d.E} aberturas (${n(d.nos)} nos)`)
  }
  for (const k of [2, 3]) console.log(`  n=${k}, divisoes por abertura: ${quantasDivisoes(k).join(' ')}`)
}

function tEstrategia () {
  console.log('\n== a estrategia das duas arvores ==')
  for (const k of [2, 3]) {
    const e = estrategiaInteira(k)
    console.log(`  n=${k}, todas as respostas do azul a todas as aberturas: ${n(e.partidas)} partidas, o vermelho ganha ${n(e.ganhas)}; a mais longa tem ${e.maiorPartida} meio-lances`)
  }
  for (const k of [4, 5, 6]) {
    const e = estrategiaSorteada(k, 2000, 7)
    console.log(`  n=${k}, azul ao acaso: ${n(e.partidas)} partidas, o vermelho ganha ${n(e.ganhas)}`)
  }
}

function tCheios () {
  console.log('\n== todos os tabuleiros cheios ==')
  for (const k of [2, 3]) {
    const c = cheios(k)
    console.log(`  n=${k}: ${n(c.total)} tabuleiros; so o vermelho ligado ${n(c.vermelho)}, so o azul ${n(c.azul)}, os dois ${c.dois}, nenhum ${c.nenhum}`)
  }
}

function tJuiz () {
  console.log('\n== o desenho (inundacao) contra o nucleo (uniao e busca) ==')
  for (const k of [2, 3]) {
    const c = confronto(k)
    console.log(`  n=${k}: ${n(c.total)} posicoes, ${c.dif} divergencias`)
  }
}

const tabelas = { solucao: tSolucao, arvores: tArvores, estrategia: tEstrategia, cheios: tCheios, juiz: tJuiz }
const pedidas = process.argv.slice(2)
for (const k of pedidas.length ? pedidas : ['solucao', 'arvores', 'estrategia', 'cheios']) {
  if (!tabelas[k]) { console.error('tabela desconhecida: ' + k); process.exit(1) }
  tabelas[k]()
}
