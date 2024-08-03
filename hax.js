/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 */


/**
 * I'm almost positive that accessing the game's internal properties and methods directly through the dev console is not 
 * possible; however, by setting breakpoints inside of this function, we can access the player's object, which allows us
 * to alter pretty much everything.
 * 
 * Function location:
 *   debug (f12) >> sources >> webpack://src/NetscriptFunctions/Extra.ts >> line 41
 */
/** 
 * @param {NS} ns - Netscript.
 */
export async function main(ns) {
  ns.alterReality();
}