// Os numeros do README presos. Se o codigo mudar e um numero mudar, quebra.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { solucao, divisoes, quantasDivisoes, estrategiaInteira, estrategiaSorteada, confronto, cheios } from '../js/medidas.js'

test('n = 3: quem comeca ganha em 9 meio-lances, e todas as 13 aberturas ganham', () => {
  const s = solucao(3)
  assert.equal(s.vermelhoComecaGanhaEm, 9)
  assert.equal(s.azulComecaGanhaEm, 9)
  assert.equal(s.primeirasQueGanham, 13)
  assert.equal(s.maisRapida, 9)
  assert.equal(s.maisLenta, 11)
  assert.equal(s.rapidas, 3)
})

test('n = 2: todas as 5 aberturas ganham em 5 meio-lances', () => {
  const s = solucao(2)
  assert.equal(s.primeirasQueGanham, 5)
  assert.equal(s.maisRapida, 5)
  assert.equal(s.maisLenta, 5)
})

test('toda abertura de n = 2 a 5 deixa duas arvores geradoras disjuntas', () => {
  for (const [n, E] of [[2, 5], [3, 13], [4, 25], [5, 41]]) {
    const d = divisoes(n)
    assert.equal(d.E, E)
    assert.equal(d.com, E)
  }
})

test('as divisoes por abertura no n = 3 vao de 56 a 78', () => {
  assert.deepEqual(quantasDivisoes(3), [56, 78, 56, 56, 62, 56, 56, 78, 56, 56, 56, 56, 56])
  assert.deepEqual(quantasDivisoes(2), [2, 2, 2, 2, 2])
})

test('a estrategia ganha as 362.034 partidas possiveis do n = 3', () => {
  assert.deepEqual(estrategiaInteira(3), { partidas: 362034, ganhas: 362034, maiorPartida: 13 })
  assert.deepEqual(estrategiaInteira(2), { partidas: 32, ganhas: 32, maiorPartida: 5 })
})

test('e as 2.000 sorteadas de n = 4, 5 e 6', () => {
  for (const n of [4, 5, 6]) assert.deepEqual(estrategiaSorteada(n, 2000, 7), { partidas: 2000, ganhas: 2000 })
})

test('nenhum tabuleiro cheio empata, e metade e de cada cor', () => {
  assert.deepEqual(cheios(3), { total: 8192, vermelho: 4096, azul: 4096, dois: 0, nenhum: 0 })
  assert.deepEqual(cheios(2), { total: 32, vermelho: 16, azul: 16, dois: 0, nenhum: 0 })
})

test('o juiz do desenho concorda no n = 2', () => {
  assert.deepEqual(confronto(2), { total: 136, dif: 0 })
})
