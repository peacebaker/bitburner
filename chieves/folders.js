/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 */

/**
 * Gets the achievement "Thank you folders!" by creating 30 empty scripts.
 *
 * @param {NS} ns - NetSCript.
 */
export function folders(ns) {
  for (let i = 1; i <= 30; i++) {
    ns.write(`fakes/fake${i}.js`);
  }
}

/**
 * Removes the files created by the folders function.
 * 
 * @param {NS} ns 
 */
export function killFolders(ns) {
  for (let i = 1; i <= 30; i++) {
    ns.rm(`fakes/fake${i}.js`);
  }
}