import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tabuleiro, ligou, Jogo, VERMELHO, AZUL } from '../js/bridgit.js'
import { grafo, divide, Estrategia } from '../js/arvores.js'
import { casasDoDesenho, ligouNoDesenho } from '../js/juiz.js'

test('o tabuleiro de tamanho n tem n^2 + (n-1)^2 casas', () => {
  for (let n = 1; n <= 7; n++) assert.equal(tabuleiro(n).E, n * n + (n - 1) * (n - 1))
})

test('o desenho do juiz tem as mesmas casas, nas mesmas coordenadas', () => {
  for (let n = 1; n <= 6; n++) {
    const a = tabuleiro(n).casas.map((c) => c.x + ',' + c.y).sort()
    const b = casasDoDesenho(n).map(([x, y]) => x + ',' + y).sort()
    assert.deepEqual(a, b)
  }
})

test('cada casa liga dois pontos vermelhos e dois azuis, e nunca o mesmo terminal com ele mesmo', () => {
  for (const c of tabuleiro(4).casas) {
    assert.notEqual(c.v[0], c.v[1])
    assert.notEqual(c.a[0], c.a[1])
  }
})

test('uma fileira inteira de pontes vermelhas liga a esquerda a direita', () => {
  const t = tabuleiro(3)
  let m = 0
  t.casas.forEach((c, i) => { if (c.y === 3 && c.x % 2 === 1) m |= 1 << i })
  assert.equal(ligou(t, m, VERMELHO), true)
  assert.equal(ligou(t, m, AZUL), false)
})

test('o grafo do vermelho tem n(n-1) + 2 vertices, e depois da abertura sobram 2(V-1) arestas', () => {
  for (let n = 2; n <= 7; n++) {
    const g = grafo(n)
    assert.equal(g.V, n * (n - 1) + 2)
    assert.equal(g.arestas.length - 1, 2 * ((g.V - 1) - 1))
  }
})

test('a divisao devolve duas arvores geradoras de verdade', () => {
  const g = grafo(4)
  const { arvores } = divide(4, 0)
  const [a0, b0] = g.arestas[0]
  for (const T of arvores) {
    assert.equal(T.length, g.V - 2)
    const pai = Array.from({ length: g.V }, (_, i) => i)
    const acha = (x) => { while (pai[x] !== x) x = pai[x]; return x }
    pai[acha(a0)] = acha(b0)
    for (const i of T) {
      const [a, b] = g.arestas[i]
      assert.notEqual(acha(a), acha(b), 'ciclo na arvore')
      pai[acha(a)] = acha(b)
    }
  }
  assert.equal(new Set([...arvores[0], ...arvores[1]]).size, 2 * (g.V - 2))
})

test('a estrategia responde dentro da outra arvore e nunca pega aresta apagada', () => {
  const { arvores } = divide(3, 4)
  const est = new Estrategia(3, 4, arvores)
  const e = arvores[0][0]
  const r = est.responde(e)
  assert.ok(arvores[1].includes(r))
  assert.notEqual(r, e)
})

test('valor sem -0 e estavel ao perguntar duas vezes', () => {
  const j = new Jogo(2)
  const a = j.valor(0, 0, VERMELHO)
  assert.equal(j.valor(0, 0, VERMELHO), a)
  assert.ok(!Object.is(a, -0))
})

test('o desenho e a uniao e busca concordam em quem ligou, em todo tabuleiro cheio do 3x3', () => {
  const t = tabuleiro(3)
  const pos = t.casas.map((c) => c.x + ',' + c.y)
  for (let m = 0; m < 2 ** t.E; m += 7) {
    const grade = new Map(pos.map((p, i) => [p, (m >> i) & 1 ? 'R' : 'B']))
    assert.equal(ligou(t, m, VERMELHO), ligouNoDesenho(3, grade, 'R'))
  }
})

test('ligouConjunto concorda com ligou onde a mascara cabe, e funciona onde ela nao cabe', async () => {
  const { ligouConjunto } = await import('../js/bridgit.js')
  const t3 = tabuleiro(3)
  for (let m = 0; m < 2 ** t3.E; m += 5) {
    const s = new Set()
    for (let i = 0; i < t3.E; i++) if (m & (1 << i)) s.add(i)
    assert.equal(ligouConjunto(t3, s, VERMELHO), ligou(t3, m, VERMELHO))
  }
  // no 6, a ultima fileira inteira liga, e as casas dela passam da 32
  const t6 = tabuleiro(6)
  const fileira = new Set()
  t6.casas.forEach((c, i) => { if (c.y === 11 && c.x % 2 === 1) fileira.add(i) })
  assert.ok([...fileira].some((i) => i >= 32))
  assert.equal(ligouConjunto(t6, fileira, VERMELHO), true)
})
