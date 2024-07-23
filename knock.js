/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 */

import { getServers } from './utils.js';

/** 
 * Knock on the door with a large battering ram.
 * 
 * @param {NS} ns - NetScript.
 */
export async function main(ns) {
  const target = ns.args[0];
  knock(ns, target);

  // if no target is given, just hack them all
  let servers = getServers(ns);
  for (const server of servers) {
    if (server.hostname) {
      knock(ns, server.hostname);
    }
  }
}

/** 
 * Attempt to open the server's ports and gain root access.
 * 
 * @param {NS} ns         - NetScript.
 * @param {string} target - the server's name.
 */
export async function knock(ns, target) {

  // get the server's hostname and info
  let server = ns.getServer(target)
  if (target === undefined) {
    ns.tprintf(`couldn't hack ${target}, undefined`);
    return;
  }

  // wrench open all available ports
  if (ns.fileExists("BruteSSH.exe", "home")) {
    ns.brutessh(target);
  }
  if (ns.fileExists("FTPCrack.exe", "home")) {
    ns.ftpcrack(target);
  }
  if (ns.fileExists("RelaySMTP.exe", "home")) {
    ns.relaysmtp(target);
  }
  if (ns.fileExists("HTTPWorm.exe", "home")) {
    ns.httpworm(target);
  }
  if (ns.fileExists("SQLInject.exe", "home")) {
    ns.sqlinject(target);
  }
  
  // check for the prerequisite number of ports
  server = ns.getServer(target);
  let reqPorts = server.numOpenPortsRequired;
  let curPorts = server.openPortCount;
  if (reqPorts > curPorts) {
    ns.tprintf(`open ports: ${curPorts} / ${reqPorts} => unable to hack ${target}`);
    return;
  }

  // get root access
  ns.nuke(target);
  if (ns.hasRootAccess(target)) {
    ns.tprintf(`open ports: ${curPorts} / ${reqPorts} => ${target} successfully rooted`);
  }
}