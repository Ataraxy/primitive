'use strict'

const ow = require('ow')

const context = require('./lib/browser-context')
const primitive = require('./lib/primitive')

/**
 * @name primitive
 * @function
 *
 * Reproduces the given input image using geometric primitives.
 *
 * Optionally draws the results to an HTML canvas.
 *
 * Returns a Promise for the generated model.
 *
 * Available shape types:
 * - triangle
 * - ellipse
 * - rotated-ellipse
 * - rectangle
 * - rotated-rectangle
 * - random (will use all the shape types)
 *
 * @param {Object} opts - Configuration options
 * @param {string|Image|ImageData} opts.input - URL, Image, or ImageData of input image to process
 * @param {string|HTMLCanvasElement} [opts.output] - Selector or DOM Element of HTMLCanvas to draw results
 * @param {number} [opts.numSteps=200] - Number of steps to process [1, 1000]
 * @param {number} [opts.minEnergy] - Minimum energy to stop processing early [0, 1]
 * @param {number} [opts.shapeAlpha=128] - Alpha opacity of shapes [0, 255]
 * @param {string} [opts.shapeType=traingle] - Type of shapes to use
 * @param {number} [opts.numCandidates=1] - Number of top-level candidates per step [1, 32]
 * @param {number} [opts.numCandidateShapes=50] - Number of random candidate shapes per step [10, 1000]
 * @param {number} [opts.numCandidateMutations=100] - Number of candidate mutations per step [10, 500]
 * @param {number} [opts.numCandidateExtras=0] - Number of extra candidate shapes per step [0, 16]
 * @param {function} [opts.onStep] - Optional async function taking in the model and step index
 * @param {function} [opts.log=noop] - Optional logging function (console.log to enable logging)
 *
 * @return {Promise}
 */
module.exports = async (opts) => {
  const {
    input,
    output,
    ...rest
  } = opts

  ow(opts, ow.object.label('opts'))
  ow(input, ow.any(
    ow.string.nonEmpty,
    ow.object.instanceOf(global.ImageData),
    ow.object.instanceOf(global.Image)
  ).label('input'))

  const target = await context.loadImage(input)
  const { canvas } = context.loadCanvas(output, 'output')
  const ctx = output.getContext('2d')
  const scratch = canvas && document.createElement('canvas')
  if (ctx) context.enableContextAntialiasing(ctx)

  const model = await primitive({
    ...rest,
    context,
    target,
    onStep: async (model, step) => {
      if (opts.step) await opts.step(model, step)

      if (ctx) {
        const { width, height } = model.current

        if (canvas.width === width && canvas.height === height) {
          // output canvas is the same size as current working buffer,
          // so just copy data over (efficient)
          ctx.putImageData(model.current)
        } else {
          // output canvas is different size than current working buffer,
          // so resize into temp canvas before drawing (less efficient)
          scratch.width = width
          scratch.height = height
          const ctx2 = scratch.getContext('2d')
          ctx2.putImageData(model.current)
          ctx.drawImage(scratch, 0, 0, canvas.width, canvas.height)
        }
      }
    }
  })

  return model
}
