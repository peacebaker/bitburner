/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').Server} Server
 */

 
/** 
 * The utils script functions as a library and interface for a few commonly used commands.
 * 
 * @param {NS} ns - NetScript. 
 */
export async function main(ns) {

  // execute requested command
  let cmd = ns.args[0];
  switch (cmd) {

    case "scan":
      scan(ns);
      return;
      
    case "lit":
      getLit(ns);
      return;

    case "cct":
      getCct(ns);
      return;

    case "me":
    case "player":
      playerInfo(ns);
      return;

    default:
      help(ns);
      return;
  }
}

/**
 * Display the script's help text.
 * 
 * @param {NS} ns 
 */
function help(ns) {

  let subcmd = ns.args[1];
  let msg = "";

  switch (subcmd) {
    case "scan":
      msg += `utils.js scan options:\n`;
      msg += `  run utils.js scan -c - sort by max cash\n`
      msg += `  run utils.js scan -h - sort by required hacking level\n`
      msg += `  run utils.js scan -s - sort by minimum security level\n`
      break;
    default:
      msg += `utils.js usage:\n`;
      msg += `  run utils.js help - display this help message\n`;
      msg += `  run utils.js scan * display information about all available servers on the net\n`;
      msg += `  run utils.js lit  - find and download all .lit files on across all available servers\n`;
      msg += `  run utils.js cct  - find .cct files on across all available servers\n`;
      msg += `  run utils.js me   - display player information\n`;
  }
  
  ns.tprintf(msg);
}

/**
 * Scan all servers on the network for interesting info.
 * 
 * @param {NS} ns - NetScript.
 */
export function scan(ns) {

  // set target and loop through all available servers
  let target = ns.args[1];
  let servers = getServers(ns);

  // check string lengths to pad the text into columns
  let hostPad = 0;
  let hackPad = 0;
  let secPad = 0;
  let maxCashPad = 0;
  for (const server of servers) {
    if (server.hostname.length > hostPad) {
      hostPad = server.hostname.length;
    }
    if (server.requiredHackingSkill.toString().length > hackPad) {
      hackPad = server.requiredHackingSkill.toString().length;
    }
    if (ns.formatNumber(server.moneyMax).length > maxCashPad) {
      maxCashPad = ns.formatNumber(server.moneyMax).length;
    }
    if (server.minDifficulty.toString().length > secPad) {
      secPad = server.minDifficulty.toString().length;
    }
  }

  // sort the server by requested option
  let order = ns.args[1];
  if (order) {
    switch (order) {

      // sort by max money available
      case '-c':
        servers.sort((a, b) => a.moneyMax - b.moneyMax);
        break;
  
      // sort by required hacking level
      case '-h':
        servers.sort((a, b) => a.requiredHackingSkill - b.requiredHackingSkill);
        break;

      // sort by minimum security level
      case '-s':
        servers.sort((a, b) => a.minDifficulty - b.minDifficulty);
    }
  }
  

  // print a list of all servers with some interesting information
  for (const server of servers) {

    // print the hostname, required hacking level, max cash, port count, and root access for each server
    let msg = `host: ${server.hostname.padEnd(hostPad)} | `;
    msg += `hack: ${server.requiredHackingSkill.toString().padEnd(hackPad)} | `;
    msg += `max cash: ${ns.formatNumber(server.moneyMax).padEnd(maxCashPad)} | `;
    msg += `min sec: ${server.minDifficulty.toString().padEnd(secPad)} | `;
    msg += `ports: ${server.openPortCount} open / ${server.numOpenPortsRequired} req | `;
    msg += `root: ${server.hasAdminRights}`;
    ns.tprintf(msg);
  }
}

/** 
 * Get an array of all servers on the network.
 * 
 * @param {NS} ns - NetScript.
 * @returns {Server[]}
 */
export function getServers(ns) {

  // keep lists of visited servers and servers to visit
  let visited = [];
  let toVisit = ['home'];

  // loop through all the servers to visit, and keep track of those we visit
  for (const hostname of toVisit) {
    visited.push(hostname);

    // check what servers are connected to this one
    let connections = ns.scan(hostname);
    for (const connection of connections) {

      // add the server to the toVisit list if it's not already on said list
      if (!visited.includes(connection)) {
        toVisit.push(connection);
      }
    }
  }

  // get server objects for each hostname found
  let servers = [];
  for (const hostname of visited) {
    let server = ns.getServer(hostname);

    // return all servers except mine
    if (server.purchasedByPlayer || server.hostname === "home") {
      continue;
    }
    servers.push(server);
  }
  return servers;
}

/**
 * Download all .lit files on the network.
 * 
 * @param {NS} ns - NetScript.
 */
export function getLit(ns) {

  // keep track of downloaded files
  let got = [];

  // search every server for .lit files
  let servers = getServers(ns);
  for (const server of servers) {
    let files = ns.ls(server.hostname, ".lit");

    // pull every file to home
    for (const file of files) {
      if (!got.includes(files)) {
        ns.tprintf(`downloading ${file} from ${server.hostname}`);
        ns.scp([file], 'home', server.hostname);
        got.push(file);
      }
    }
  }
}

/**
 * Download all .lit files on the network.
 * 
 * @param {NS} ns - NetScript.
 */
export function getCct(ns) {

  // keep track of downloaded files
  let got = [];

  // search every server for .lit files
  let servers = getServers(ns);
  for (const server of servers) {
    let files = ns.ls(server.hostname, ".cct");

    // pull every file to home
    for (const file of files) {
      if (!got.includes(files)) {
        ns.tprintf(`found ${file} on ${server.hostname}`);
        got.push(file);
      }
    }
  }
}

/**
 * @param {NS} ns - NetScript.
 */
export function playerInfo(ns) {

  // get player info
  let player = ns.getPlayer();

  // hidden info
  ns.tprintf(`city: ${player.city}\n`);
  ns.tprintf(`entropy: ${player.entropy}\n`);
  ns.tprintf(`killed: ${player.numPeopleKilled}\n`);
  ns.tprintf(`karma: ${player.karma}\n`);
  
  // // factions
  // ns.tprintf(`factions: ${player.factions}\n`);
  // let msg = 'factions: ';
  // for (const faction of player.factions) {
  //   msg += `${faction}, `;
  // }
  // ns.tprintf(msg);
  
  // // player stats
  // ns.tprintf('skills:\n');
  // ns.tprintf(`  hp: ${player.hp.current} / ${player.hp.max}\n`);
  // ns.tprintf(`  agility: ${player.exp.agility}\n`);
  // ns.tprintf(`  charisma: ${player.exp.charisma}\n`);
  // ns.tprintf(`  defense: ${player.exp.defense}\n`);
  // ns.tprintf(`  dexterity: ${player.exp.dexterity}\n`);
  // ns.tprintf(`  hacking: ${player.exp.hacking}\n`);
  // ns.tprintf(`  intelligence: ${player.exp.intelligence}\n`);
  // ns.tprintf(`  strength: ${player.exp.strength}\n`);
}

/**
 * Take a number of seconds and format it into a readable string.
 * 
 * @param {number} seconds 
 * @returns 
 */
export function formatTime(seconds) {
  let days = 0;
  let hours = 0;
  let mins = 0;
  let msg = '';

  // extract the total number of days
  const oneDay = 60 * 60 * 24;
  if (seconds > oneDay) {
    days = Math.floor(seconds / oneDay);
    seconds %= oneDay;
    msg += `${days}d `;
  }

  // extract the total number of hours
  const oneHour = 60 * 60;
  if (seconds > oneHour) {
    hours = Math.floor(seconds / oneHour);
    seconds %= oneHour;
    msg += `${hours}h `;
  }

  // extract the total number of minutes
  const oneMin = 60;
  if (seconds > oneMin) {
    mins = Math.floor(seconds / oneMin);
    seconds %= oneMin;
    msg += `${mins}m `
  }

  // extract the total number of seconds
  msg += `${Math.floor(seconds)}s`

  // return total as a string
  return msg;
}
