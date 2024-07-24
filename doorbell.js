/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').Server} Server
 */

import { knock } from './knock.js';
import { getServers } from './utils.js';
import { WeakenerSwarm } from './swarm.js';

const wScript = "dron3Weaken3r.js";
const targetProcs = 512;

/**
 * Weaken every available server to minimum sercurity.
 * 
 * @param {NS} ns - NetScript.
 */
export async function main(ns) {

  // loop through all servers
  let servers = getServers(ns);
  for (const server of servers) {

    // attempt to gain root access and skip the server if we don't get it
    if (!ns.hasRootAccess(server.hostname)) {
      knock(ns, server.hostname);
    }
    if (!ns.hasRootAccess(server.hostname)) {
      ns.tprint(`skipped ${server.hostname}, no root access`);
      break;
    }

    // calculate thread size 
    let maxRam = ns.getServerMaxRam('home');
    let ramCost = ns.getScriptRam(wScript);
    let threads = Math.floor(maxRam / (ramCost * targetProcs)) + 1;
    threads = !threads ? 1 : threads;

    // check the security level and lower it until it can go no lower
    let curSec = ns.getServerSecurityLevel(server.hostname);
    let minSec = ns.getServerMinSecurityLevel(server.hostname);

    // start a weakener swarm with just one drone
    let wSwarm = new WeakenerSwarm(ns, server.hostname, threads, 0);
    wSwarm.add();

    // wait for the drone to work its magic
    while (curSec > minSec) {
      await ns.sleep(ns.getWeakenTime(server.hostname));
      curSec = ns.getServerSecurityLevel(server.hostname);
      minSec = ns.getServerMinSecurityLevel(server.hostname);
    }

    // print the new security level and kill the drone
    ns.tprintf(`doorbell.js: ${server.hostname} security => ${curSec.toLocaleString('en-US')} / ${minSec}`);
    wSwarm.killall();
  }
}
