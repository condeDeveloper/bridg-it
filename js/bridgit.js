// O nucleo do Bridg-it (o jogo de Gale). ESM puro, sem DOM.
//
// Tabuleiro de tamanho n: pontos vermelhos em n linhas e n+1 colunas, pontos
// azuis em n+1 linhas e n colunas, intercalados. Na sua vez o vermelho liga
// dois pontos vermelhos vizinhos com uma ponte, e o azul liga dois azuis. O
// vermelho quer atravessar da coluna da esquerda a da direita; o azul, da
// linha de cima a de baixo.
//
// Cada ponte vermelha cruza exatamente uma ponte azul, entao o tabuleiro e uma
// lista de CASAS (o ponto onde as duas se cruzariam), e jogar numa casa e
// pegar a ponte daquela cor ali e proibir a outra. Ha n^2 + (n-1)^2 casas.
//
// Coordenadas: ponto vermelho (i, j) fica em (x=2j, y=2i+1); azul (i, j) em
// (x=2j+1, y=2i). Uma casa e o ponto medio das duas pontes que se cruzam.

export const VERMELHO = 0
export const AZUL = 1

export function tabuleiro (n) {
  const casas = []
  // ids dos pontos: vermelhos de dentro (colunas 1..n-1) e dois terminais
  const vid = (i, j) => (j === 0 ? 'E' : j === n ? 'D' : i * (n + 1) + j)
  const aid = (i, j) => (i === 0 ? 'C' : i === n ? 'B' : 1000 + i * n + j)
  // ponte vermelha horizontal (i,j)-(i,j+1), cruza a azul vertical (i,j)-(i+1,j)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      casas.push({ x: 2 * j + 1, y: 2 * i + 1, v: [vid(i, j), vid(i, j + 1)], a: [aid(i, j), aid(i + 1, j)] })
    }
  }
  // ponte vermelha vertical (i,j)-(i+1,j), j de 1 a n-1, cruza a azul
  // horizontal (i+1, j-1)-(i+1, j)
  for (let i = 0; i < n - 1; i++) {
    for (let j = 1; j < n; j++) {
      casas.push({ x: 2 * j, y: 2 * i + 2, v: [vid(i, j), vid(i + 1, j)], a: [aid(i + 1, j - 1), aid(i + 1, j)] })
    }
  }
  return { n, casas, E: casas.length }
}

// As pontes de uma cor ligam os dois terminais dela? Uniao e busca pelos ids.
export function ligou (t, mascara, cor) {
  const pai = new Map()
  const acha = (x) => {
    if (!pai.has(x)) pai.set(x, x)
    while (pai.get(x) !== x) { pai.set(x, pai.get(pai.get(x))); x = pai.get(x) }
    return x
  }
  for (let k = 0; k < t.E; k++) {
    if (!(mascara & (1 << k))) continue
    const [a, b] = cor === VERMELHO ? t.casas[k].v : t.casas[k].a
    pai.set(acha(a), acha(b))
  }
  return cor === VERMELHO ? acha('E') === acha('D') : acha('C') === acha('B')
}

// A busca completa. Estado: as casas do vermelho e as do azul (duas mascaras)
// e de quem e a vez. O indice no vetor de memoria e a posicao em base 3 (0
// livre, 1 vermelho, 2 azul) vezes 2 mais a vez: 3^13 x 2 = 3,2 milhoes de
// bytes no n = 3, o que cabe ate no navegador.
//
// Valor do ponto de vista de quem joga: +d ganha e a partida acaba em d - 1
// meio-lances; -d perde resistindo d - 1. O zero do vetor e "nao calculado".
export class Jogo {
  constructor (n) {
    this.t = tabuleiro(n)
    if (this.t.E > 13) throw new Error('a busca completa vai ate n = 3')
    this.pot = Array.from({ length: this.t.E }, (_, i) => 3 ** i)
    this.memo = new Int8Array(3 ** this.t.E * 2)
    this.visitas = 0
  }

  indice (vm, az) {
    let k = 0
    for (let c = 0; c < this.t.E; c++) {
      if (vm & (1 << c)) k += this.pot[c]
      else if (az & (1 << c)) k += 2 * this.pot[c]
    }
    return k
  }

  valor (vm, az, vez) { return this._valor(vm, az, vez, this.indice(vm, az)) }

  _valor (vm, az, vez, k3) {
    const E = this.t.E
    const k = k3 * 2 + vez
    const m = this.memo[k]
    if (m !== 0) return m
    this.visitas++
    const livres = ((1 << E) - 1) & ~vm & ~az
    let melhorGanha = 999
    let piorPerde = 0
    let alguma = false
    for (let c = 0; c < E; c++) {
      if (!(livres & (1 << c))) continue
      alguma = true
      let f
      if (vez === VERMELHO) {
        const v2 = vm | (1 << c)
        f = ligou(this.t, v2, VERMELHO) ? -1 : this._valor(v2, az, AZUL, k3 + this.pot[c])
      } else {
        const a2 = az | (1 << c)
        f = ligou(this.t, a2, AZUL) ? -1 : this._valor(vm, a2, VERMELHO, k3 + 2 * this.pot[c])
      }
      if (f < 0) { if (1 - f < melhorGanha) melhorGanha = 1 - f } else if (f + 1 > piorPerde) piorPerde = f + 1
    }
    // tabuleiro cheio sem ninguem ligado nao acontece (o teste confere com
    // todos os tabuleiros cheios); se acontecesse, aqui estouraria
    if (!alguma) throw new Error('tabuleiro cheio sem vencedor')
    const r = melhorGanha < 999 ? melhorGanha : -piorPerde
    this.memo[k] = r
    return r
  }

  // O valor depois de jogar na casa c, do ponto de vista de quem joga depois.
  depois (vm, az, vez, c) {
    if (vez === VERMELHO) {
      const v2 = vm | (1 << c)
      return ligou(this.t, v2, VERMELHO) ? -1 : this.valor(v2, az, AZUL)
    }
    const a2 = az | (1 << c)
    return ligou(this.t, a2, AZUL) ? -1 : this.valor(vm, a2, VERMELHO)
  }

  // As casas que ganham (ou, perdendo, as que mais demoram).
  boas (vm, az, vez) {
    const v = this.valor(vm, az, vez)
    const r = []
    for (let c = 0; c < this.t.E; c++) {
      if ((vm | az) & (1 << c)) continue
      const f = this.depois(vm, az, vez, c)
      if (v > 0 ? (f < 0 && 1 - f === v) : (f > 0 && f + 1 === -v)) r.push(c)
    }
    return r
  }
}

// O mesmo que ligou, com as casas num conjunto em vez de mascara. A mascara
// de bits do JavaScript tem 32 casas: o tabuleiro 5 tem 41 e o 6 tem 61, e
// 1 << 40 da 256, sem aviso. A busca completa so vai ate o 3 (13 casas), mas a
// pagina joga ate o 6.
export function ligouConjunto (t, casas, cor) {
  const pai = new Map()
  const acha = (x) => {
    if (!pai.has(x)) pai.set(x, x)
    while (pai.get(x) !== x) { pai.set(x, pai.get(pai.get(x))); x = pai.get(x) }
    return x
  }
  for (const k of casas) {
    const [a, b] = cor === VERMELHO ? t.casas[k].v : t.casas[k].a
    pai.set(acha(a), acha(b))
  }
  return cor === VERMELHO ? acha('E') === acha('D') : acha('C') === acha('B')
}
