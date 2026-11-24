// A pagina: so desenho e clique. No n = 3 a maquina joga pela busca completa;
// do n = 4 em diante, pela estrategia das duas arvores, que nunca perde
// jogando de vermelho.

import { tabuleiro, ligouConjunto, Jogo, VERMELHO, AZUL } from './bridgit.js'
import { divide, Estrategia } from './arvores.js'

const SVG = 'http://www.w3.org/2000/svg'
const elTab = document.getElementById('tabuleiro')
const elEstado = document.getElementById('estado')
const elTam = document.getElementById('tamanho')
const elLado = document.getElementById('lado')

// as pontes ficam em conjuntos: mascara de bits so tem 32 casas, e o
// tabuleiro 6 tem 61
let n, t, vm, az, vez, humano, fim, est, jogo3

function comeca () {
  n = Number(elTam.value)
  t = tabuleiro(n)
  vm = new Set()
  az = new Set()
  vez = VERMELHO
  fim = null
  est = null
  // so no n = 3 o humano pode ser o vermelho: ali a maquina joga perfeito dos
  // dois lados; nos maiores a maquina e sempre o vermelho
  if (n !== 3) elLado.value = 'azul'
  elLado.disabled = n !== 3
  humano = elLado.value === 'vermelho' ? VERMELHO : AZUL
  if (n === 3 && !jogo3) jogo3 = new Jogo(3)
  desenha()
  maquina()
}

function joga (c) {
  if (vez === VERMELHO) vm.add(c)
  else az.add(c)
  if (ligouConjunto(t, vm, VERMELHO)) fim = 'vermelho'
  else if (ligouConjunto(t, az, AZUL)) fim = 'azul'
  vez = 1 - vez
  desenha()
  maquina()
}

function maquina () {
  if (fim || vez === humano) return
  setTimeout(() => {
    let c
    if (n === 3) {
      c = jogo3.boas(mascara(vm), mascara(az), vez)[0]
    } else if (!est) {
      // abertura no meio do tabuleiro, e as duas arvores para o resto
      c = Math.floor(n / 2) * n + Math.floor(n / 2)
      est = new Estrategia(n, c, divide(n, c).arvores)
    } else {
      const ultima = ultimaDoAzul
      c = est.responde(ultima)
      if (c === null || ocupada(c)) {
        // nao acontece com a divisao completa; se acontecer, qualquer livre
        for (c = 0; c < t.E && ocupada(c); c++);
      }
    }
    joga(c)
  }, 300)
}

let ultimaDoAzul = -1

const ocupada = (c) => vm.has(c) || az.has(c)
const mascara = (s) => { let m = 0; for (const c of s) m |= 1 << c; return m }

function clica (c) {
  if (fim || vez !== humano || ocupada(c)) return
  if (humano === AZUL) ultimaDoAzul = c
  joga(c)
}

function desenha () {
  const L = 2 * n + 1
  const passo = 40
  elTab.innerHTML = ''
  const s = document.createElementNS(SVG, 'svg')
  s.setAttribute('viewBox', `${-passo / 2} ${-passo / 2} ${L * passo} ${L * passo}`)
  s.setAttribute('role', 'img')
  s.setAttribute('aria-label', 'tabuleiro do Bridg-it')
  const ponto = (x, y, cor) => {
    const e = document.createElementNS(SVG, 'circle')
    e.setAttribute('cx', x * passo); e.setAttribute('cy', y * passo); e.setAttribute('r', 7)
    e.setAttribute('class', cor)
    s.appendChild(e)
  }
  t.casas.forEach((c, i) => {
    const dono = vm.has(i) ? 'vermelho' : az.has(i) ? 'azul' : null
    // a ponte vermelha desta casa e horizontal se x e impar
    const horizV = c.x % 2 === 1
    const linha = (horiz, cor) => {
      const e = document.createElementNS(SVG, 'line')
      const d = passo
      e.setAttribute('x1', c.x * passo - (horiz ? d : 0)); e.setAttribute('x2', c.x * passo + (horiz ? d : 0))
      e.setAttribute('y1', c.y * passo - (horiz ? 0 : d)); e.setAttribute('y2', c.y * passo + (horiz ? 0 : d))
      e.setAttribute('class', 'ponte ' + cor)
      s.appendChild(e)
    }
    if (dono === 'vermelho') linha(horizV, 'vermelho')
    if (dono === 'azul') linha(!horizV, 'azul')
    if (!dono) {
      const alvo = document.createElementNS(SVG, 'rect')
      alvo.setAttribute('x', c.x * passo - 14); alvo.setAttribute('y', c.y * passo - 14)
      alvo.setAttribute('width', 28); alvo.setAttribute('height', 28)
      alvo.setAttribute('class', 'alvo')
      alvo.setAttribute('tabindex', '0')
      alvo.addEventListener('click', () => clica(i))
      s.appendChild(alvo)
    }
  })
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      if (x % 2 === 0 && y % 2 === 1) ponto(x, y, 'vermelho')
      if (x % 2 === 1 && y % 2 === 0) ponto(x, y, 'azul')
    }
  }
  elTab.appendChild(s)
  if (fim) {
    const voce = (fim === 'vermelho') === (humano === VERMELHO)
    elEstado.innerHTML = `<span class="${voce ? 'ok' : 'aviso'}">${fim === 'vermelho' ? 'O vermelho atravessou' : 'O azul atravessou'}.</span> ${voce ? 'Você ganhou.' : 'A máquina ganhou.'}`
    return
  }
  elEstado.textContent = vez === humano
    ? `Sua vez: clique entre dois pontos ${humano === VERMELHO ? 'vermelhos' : 'azuis'} para pôr uma ponte.`
    : 'Vez da máquina.'
}

elTam.addEventListener('change', comeca)
elLado.addEventListener('change', comeca)
document.getElementById('reiniciar').addEventListener('click', comeca)

comeca()
