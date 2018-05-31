'use strict'

const { test } = require('ava')
const path = require('path')

const primitive = require('.')

const fixtures = path.join(__dirname, `media`)

test(`monalisa.png`, async (t) => {
  await primitive({
    input: path.join(fixtures, 'monalisa.png'),
    output: 'test.png', // TODO
    shapeType: 'rotated-ellipse',
    log: console.log.bind(console)
  })

  t.pass()
})
