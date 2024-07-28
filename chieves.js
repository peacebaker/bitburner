/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 */

import { rainbow } from './chieves/rainbow.js';

/**
 * Get me some 'chieves.
 * 
 * @param {NS} ns - NetScript.
 */
export async function main(ns) {
  await rainbow(ns);
}
