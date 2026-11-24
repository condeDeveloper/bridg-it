// O juiz. Nao importa nada do nucleo.
//
// Aqui o tabuleiro e o desenho mesmo: uma grade de (2n+1) x (2n+1) em que os
// pontos vermelhos ficam em (x par, y impar), os azuis em (x impar, y par), e
// as casas jogaveis sao os (x, y) de dentro com x + y par. Uma casa vermelha
// liga os dois pontos vermelhos vizinhos dela, e uma azul os dois azuis. Quem
// ligou e decidido por inundacao a partir da borda, casa a casa, sem uniao e
// busca e sem lista de arestas.

export function casasDoDesenho (n) {
  const cs = []
  for (let y = 1; y <= 2 * n - 1; y++) for (let x = 1; x <= 2 * n - 1; x++) if ((x + y) % 2 === 0) cs.push([x, y])
  return cs
}

// cor: 'R' ou 'B'. grade: Map 'x,y' -> 'R' | 'B'.
export function ligouNoDesenho (n, grade, cor) {
  const L = 2 * n + 1
  const ponto = cor === 'R' ? (x, y) => x % 2 === 0 && y % 2 === 1 : (x, y) => x % 2 === 1 && y % 2 === 0
  const visto = new Set()
  const fila = []
  for (let k = 0; k < L; k++) {
    const [x, y] = cor === 'R' ? [0, k] : [k, 0]
    if (x < L && y < L && ponto(x, y)) { visto.add(x + ',' + y); fila.push([x, y]) }
  }
  while (fila.length) {
    const [x, y] = fila.pop()
    if (cor === 'R' ? x === 2 * n : y === 2 * n) return true
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      // a casa do lado tem de ser da cor, e o ponto do outro lado dela e o vizinho
      if (grade.get((x + dx) + ',' + (y + dy)) !== cor) continue
      const nx = x + 2 * dx
      const ny = y + 2 * dy
      if (nx < 0 || ny < 0 || nx >= L || ny >= L) continue
      const k = nx + ',' + ny
      if (!visto.has(k)) { visto.add(k); fila.push([nx, ny]) }
    }
  }
  return false
}

// Negamax com memoria num Map de textos. Mesmo formato de valor do nucleo:
// +d ganha quem joga em d - 1 meio-lances, -d perde resistindo d - 1.
export function juiz (n) {
  const cs = casasDoDesenho(n)
  const memo = new Map()
  const grade = new Map()
  const chave = (vez) => cs.map(([x, y]) => grade.get(x + ',' + y) || '.').join('') + vez
  function valor (vez) {
    const k = chave(vez)
    if (memo.has(k)) return memo.get(k)
    let ganha = Infinity
    let perde = -1
    for (const [x, y] of cs) {
      const p = x + ',' + y
      if (grade.has(p)) continue
      grade.set(p, vez)
      const f = ligouNoDesenho(n, grade, vez) ? -1 : valor(vez === 'R' ? 'B' : 'R')
      grade.delete(p)
      if (f < 0) ganha = Math.min(ganha, 1 - f)
      else perde = Math.max(perde, f + 1)
    }
    if (perde < 0 && ganha === Infinity) throw new Error('tabuleiro cheio sem vencedor')
    const r = ganha < Infinity ? ganha : -perde
    memo.set(k, r)
    return r
  }
  return { casas: cs, valor, memo }
}

// Todos os tabuleiros cheios: quantos tem o vermelho ligado, o azul ligado,
// os dois, ou nenhum.
export function cheios (n) {
  const cs = casasDoDesenho(n)
  const grade = new Map()
  const r = { total: 0, vermelho: 0, azul: 0, dois: 0, nenhum: 0 }
  for (let m = 0; m < 2 ** cs.length; m++) {
    cs.forEach(([x, y], i) => grade.set(x + ',' + y, (m >> i) & 1 ? 'R' : 'B'))
    const a = ligouNoDesenho(n, grade, 'R')
    const b = ligouNoDesenho(n, grade, 'B')
    r.total++
    if (a && b) r.dois++
    else if (a) r.vermelho++
    else if (b) r.azul++
    else r.nenhum++
  }
  return r
}
