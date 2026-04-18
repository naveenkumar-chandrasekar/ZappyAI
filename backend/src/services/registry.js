import { processMessage as defaultProcessMessage } from '../ai/index.js'
import { buildDailySummary as defaultBuildDailySummary } from './daily-summary.js'

let processMessageImpl = defaultProcessMessage
let buildDailySummaryImpl = defaultBuildDailySummary

export function setProcessMessage(fn) {
  processMessageImpl = fn
}

export function setBuildDailySummary(fn) {
  buildDailySummaryImpl = fn
}

export function resetRegistry() {
  processMessageImpl = defaultProcessMessage
  buildDailySummaryImpl = defaultBuildDailySummary
}

export async function processMessage(...args) {
  return processMessageImpl(...args)
}

export async function buildDailySummary(...args) {
  return buildDailySummaryImpl(...args)
}
