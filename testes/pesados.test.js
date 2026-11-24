// O juiz do desenho em todas as posicoes do n = 3. Uns 50 segundos.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { confronto } from '../js/medidas.js'

test('o juiz do desenho concorda nas 655.984 posicoes do n = 3', { timeout: 900000 }, () => {
  assert.deepEqual(confronto(3), { total: 655984, dif: 0 })
})
