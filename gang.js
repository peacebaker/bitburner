/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 */


// 
const FACTION = 'Slum Snakes';

const MEMBERS = [
  "marco",
  "marci",
  "dani",
  "lexi",
  "tina",
  "roxi",
  "moxi",
  "dat",
  "parsec",
  "tiz",
  "brick",
  "sledge"
]


/** @param {NS} ns */
export async function main(ns) {

  ns.gang.canRecruitMember
  ns.gang.inGang()


}


class Gang {

  /**
   * @param {NS} ns - NetScript.
   */
  constructor(ns) {
    this.ns = ns;
  }


  create() {


    this.ns.gang.createGang(FACTION);


  }
}