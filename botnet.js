/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 */


// 
const startRam = 32;

// script names
const weakenerScript = "dron3Weaken3r.js";
const hackerScript = "dron3Hack3r.js";
const growerScript = "dron3Grow3r.js";
const swarmScript = "swarm.js";
const knockScript = "knock.js";
const utilsScript = "utils.js";

/** 
 * @param {NS} ns - NetScript library
 */
export async function main(ns) {

  // determine which command was requested and execute it
  let cmd = ns.args[0];
  let target = ns.args[1];
  switch (cmd) {

    case 'buy':
      await buy(ns);
      break;

    case 'upgrade':
      upgrade(ns);
      break;

    case 'info':
      info(ns);
      break;

    case 'swarm':
      await swarm(ns, target);
      break;

    case 'remove':
      remove(ns, target);
      break;

    case 'kill':
      killServer(ns, target);
      break;

    case 'killall':
      killAll(ns);
      break;

    default:
      help(ns, target);
      break;
  }
}


/**
 * Display help text.
 * 
 * @param {NS} ns        - NetScript library
 * @param {string} topic - display a particular topic's help text
 */
function help(ns, topic) {

  // generate help text
  topic = topic ? topic : 'general';
  let text = `botnet.js: ${topic} usage\n`
  switch (topic) {

    // case 'swarm':
    //   break

    default:
      text += `  run botnet.js help                          - displays this help text\n`
      text += `  run botnet.js info                          - displays info about currently controlled bot\n`;
      text += `  run botnet.js buy                           - buys servers up to the available limit\n`;
      text += `  run botnet.js upgrade                       - upgrades all servers to target ram\n`
      text += `  run botnet.js killall                       - kills all processes across the botnet\n`
      text += `  run botnet.js kill [host]                   - kill all processes on target server\n`;
      text += `  run botnet.js remove [host]                 - removes a server from the botnet\n`;
      text += `  run botnet.js swarm [host] [action] [procs] - send the botswarm to weaken, grow, or hack the target\n`;
      break;
  }

  // print the full help text
  ns.tprintf(text);
}

/** 
 * Buys servers until the current limit. 
 * 
 * @param {NS} ns - NetScript library
  */
async function buy(ns) {

  // preload current servers
  let servers = ns.getPurchasedServers();
  servers.sort();

  // loop until all available servers have been purchased
  const limit = ns.getPurchasedServerLimit();
  const cost = ns.getPurchasedServerCost(startRam);
  ns.tprintf(`purchasing ${limit} servers at ${startRam}G`);
  let i = 1;
  for (let i = 1; i <= limit; i++) {

    // find the next available hostname;
    let hostname = "bot" + i;
    if (servers.includes(hostname)) {
      ns.tprintf(`${hostname} already taken, trying bot${i}`);
      continue;
    }

    // purchace the server once we can afford it
    if (ns.getServerMoneyAvailable("home") > cost) {
      let host = ns.purchaseServer(hostname, startRam);
      ns.tprintf(`purchased ${host}`);
    }
  }
}

/**
 * Displays information about the botnet.
 * 
 * @param {NS} ns - NetScript library
 */
async function info(ns) {

  // display server specific info
  ns.tprintf(`list of servers:`)
  let servers = ns.getPurchasedServers();
  for (const server of servers) {

    // count the beeees
    let weakeners = 0;
    let growers = 0;
    let hackers = 0;
    let target = '';

    // get all processes on every server
    let processes = ns.ps(server);
    for (const process of processes) {
      
      // count the bees and find the target
      target = process.args[0];
      switch (process.filename) {
        case weakenerScript:
          weakeners++;
          break;
        case growerScript:
          growers++;
          break;
        case hackerScript:
          hackers++;
          break;
      }
    }

    // build the server info list
    let servRam = ns.formatRam(ns.getServerMaxRam(server));
    let curRam = ns.formatRam(ns.getServerUsedRam(server));
    let text = `  ${server} :: ${curRam} / ${servRam} `
    if (weakeners) {
      text += `=> ${weakeners} weakeners`;
    } 
    if (growers) {
      text += `, ${growers} growers`;
    }
    if (hackers) {
      text += `, ${hackers} hackers`
    }
    if (target) {
      text += ` @ ${target}`
    }
    ns.tprintf(text);
  }

  // find ram info (needs await or it breaks)
  let rams = await findRam(ns);

  // find general info
  let cost = ns.getPurchasedServerCost(rams.target);
  let limit = ns.getPurchasedServerLimit();
  let maxRam = ns.getPurchasedServerMaxRam();
  let maxBots = ns.getPurchasedServerLimit();
  let curBots = servers.length;
  let left = maxBots - curBots;
  let buyoutCost = left * cost;

  // calculate upgrade cost
  let upgradeCost = 0;
  for (const server of servers) {
    let serverUpgradeCost = ns.getPurchasedServerUpgradeCost(server, rams.target);
    if (serverUpgradeCost > 0) {
      upgradeCost += serverUpgradeCost;
    }
  }

  // display general info
  ns.tprintf('general info:');
  ns.tprintf(`  max servers: ${limit}`);
  ns.tprintf(`  cur servers: ${curBots}`);
  ns.tprintf(`  low ram: ${ns.formatRam(rams.low)}`);
  ns.tprintf(`  high ram: ${ns.formatRam(rams.high)}`);
  ns.tprintf(`  target ram: ${ns.formatRam(rams.target)}`);
  ns.tprintf(`  max ram: ${ns.formatRam(maxRam)}`);
  ns.tprintf(`  server cost: ${ns.formatNumber(cost)}`);
  ns.tprintf(`  buyout cost: ${ns.formatNumber(buyoutCost)}`);
  ns.tprintf(`  upgrade cost: ${ns.formatNumber(upgradeCost)}`);
}

/**
 * Tell the botnet to swarm the specified server.
 * 
 * @param {NS} ns         - NetScript library
 * @param {string} target - the server to send the botnet after
 */
async function swarm(ns, target) {

  // find target and chance or display help
  let action = ns.args[2];
  let procs = ns.args[3];
  if (!target || !action) {
    help(ns, 'swarm');
    return false;
  }

  // just pass on the analyze command to the swarm script
  if (action === "analyze") {
    ns.exec(swarmScript, 'home', 1, target, action);
    return true;
  }

  // if no procs were provided, show help text
  if (procs === undefined) {
    help(ns, 'swarm');
    return false;
  }

  // tell all servers to swarm the target
  let servers = ns.getPurchasedServers();
  for (const server of servers) {
    
    // copy the swarm to the server
    ns.scp(knockScript, server);
    ns.scp(swarmScript, server);
    ns.scp(weakenerScript, server);
    ns.scp(growerScript, server);
    ns.scp(hackerScript, server);
    ns.scp(utilsScript, server);

    // start the swarm directed at target
    if (ns.exec(swarmScript, server, 1, target, action, procs) != 0) {
      ns.tprintf(`${server}'s queen has ordered ${procs} ${action} bees to attack ${target}`);
    }
  }
}

/**
 * Remove a server.
 * 
 * @param {NS} ns         - NetScript library
 * @param {string} target - the server to remove from the botnet
 */
async function remove(ns, target) {

  // find target or display help
  if (!target) {
    help(ns, 'remove');
  }

  // delete the target server
  if (ns.deleteServer(target)) {
    ns.tprintf(`${target} deleted successfully.`)
  }
}

/**
 * Kill all processes on the target server.
 * 
 * @param {NS} ns         - NetScript library
 * @param {string} target - the server to kill all processes on
 */
async function killServer(ns, target) {
  ns.killall(target);
}

/**
 * Kill all processes on the entire botnet.
 * 
 * @param {NS} ns - NetScript library
 */
async function killAll(ns) {
  let servers = ns.getPurchasedServers();
  for (const server of servers) {
    ns.killall(server);
  }
}

/**
 * Upgrade all servers to the target ram.
 * 
 * @param {NS} ns - NetScript library
 */
async function upgrade(ns) {

  // find ram info (needs await or breaks)
  let rams = await findRam(ns);

  // upgrade every server to target ram
  let servers = ns.getPurchasedServers();
  for (const server of servers) {
    if (ns.upgradePurchasedServer(server, rams.target)) {
      ns.tprintf(`${server} upgraded to ${ns.formatRam(rams.target)} ram`)
    };
  }
}

/**
 * Find low, high, and target ram.
 * For some reason, we need to await this function.
 * 
 * @return {string, string, string} - low, high, target
 */
async function findRam(ns) {

  // there should only be two values for ram across the whole botnet at any times
  let ram, low, high, target;
  let servers = ns.getPurchasedServers();

  // if we don't have all servers, set all values to startRam
  if (servers.length < ns.getPurchasedServerLimit()) {
    return { low: startRam, high: startRam, target: startRam };
  }

  // find each server's current ram
  for (const server of servers) {
    ram = ns.getServerMaxRam(server);

    // if high isn't set, set it
    if (!high) {
      high = ram;
    }

    // if the ram is lower than high, set low
    if (ram < high) {
      low = ram;
    }
  }

  // if low is set, target ram should be equal to high
  if (low) {
    target = high;

  // if every server has the same amount of ram, set target to double
  } else {
    target = high * 2;
  }

  // if low is still unset, it's the same as high
  if (!low) {
    low = high;
  }

  // don't allow targetRam to reach above maxRam
  let maxRam = ns.getPurchasedServerMaxRam();
  if (target > maxRam) {
    target = maxRam;
  }

  // don't go over max
  if (target > 1048576) {
    target = 1048576;
  }
  
  // return these values
  return { low, high, target };
}
