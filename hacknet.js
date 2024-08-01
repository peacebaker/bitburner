/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NodeStats} NodeStats
 */


/**
 * Hacknet control script.
 * 
 * @param {NS} ns - NetScript.
 */
export async function main(ns) {

  // check the command and execute the appropriate methods.
  let cmd = ns.args[0];

  // pick between nodes or servers

  // const hackNet = new HackNetNodes(ns);
  // switch (cmd) {

  //   case "buy":
  //     hackNet.buy();
  //     return;

  //   case "info":
  //     hackNet.info();
  //     return;

  //   case "upgrade":
  //     hackNet.upgrade();
  //     return;

  //   default:
  //     hackNet.help();
  //     return;
  // } 

  const hackNet = new HackNetServers(ns);
  switch (cmd) {
    case "info":
      hackNet.info();
      return;

    case "upgrade":
      hackNet.upgrade();
      return;

    default:
      hackNet.help();
      return;
  }
}

class HackNet {

  /**
   * Creates a HackNetNode object, offering easy control of hacknet nodes.
   * 
   * @param {NS} ns - NetScript.
   */
  constructor(ns) {
    this.ns = ns;
    this.mult = ns.getHacknetMultipliers().production;
    this.maxNodes = ns.hacknet.maxNumNodes();
    this.curNodes = ns.hacknet.numNodes();
  }

  /**
   * Calculate and display the cost of current hacknet nodes as well as the amount of time required to break even.
   */
  payOff() {

    // get info on hacknet costs and profits
    let moneySources = this.ns.getMoneySources().sinceInstall;
    let cost = Math.abs(moneySources.hacknet_expenses);
    let gains = moneySources.hacknet;
    let left = cost - gains;

    // calculate persecond production and time until paid off
    let perSec = 0;
    for (let i = 0; i < this.curNodes; i++) {
      perSec += this.ns.hacknet.getNodeStats(i).production;
    }
    let timeLeft = left / perSec;

    // display a message detailing this info.
    let msg = `spent $${this.ns.formatNumber(cost)} => `;
    msg += `$${this.ns.formatNumber(gains)} made @ `;
    msg += `$${this.ns.formatNumber(perSec)} per sec = `;
    msg += `$${this.ns.formatNumber(left)} left :: `;
    msg += `${this.ns.formatNumber(timeLeft)} seconds left til paid off`;
    this.ns.tprintf(msg);
  }
}


/**
 * Represents all of my hacknet nodes.  Offers interfaces for buying and upgrading.
 */
class HackNetNodes extends HackNet {

  /**
   * Prints a help message to the terminal.
   * 
   * @param {NS} ns - NetScript.
   */
  help() {
    let msg = `net.js usage:\n`;
    msg += `  run net.js help    - Display this help text.\n`;
    msg += `  run net.js info    - Display information about all current hacknet nodes\n`
    msg += `  run net.js buy     - Buy a hacknet node.\n`
    msg += `  run net.js upgrade - Upgrade all hacknet nodes to max.\n`
    this.ns.tprintf(msg);
  }

  /**
   * Display detailed information about each hacknet node.
   */ 
  info() {

    // loop through every hacknet node
    for (let i = 0; i < this.curNodes; i++) {
      let stats = this.ns.hacknet.getNodeStats(i);
      this.ns.tprintf(`${stats.name} => {level: ${stats.level}, ram: ${stats.ram}, cores: ${stats.cores}}`);
    }
    this.payOff();
  }

  /**
   * Buy a single hacknet node.
   */
  buy() {
    let node = this.ns.hacknet.purchaseNode();
    if (node) {
      this.ns.tprintf(`purchased hacknet-node-${node}`);
    }
    else {
      this.ns.tprintf(`not enough money`);
    }
    this.payOff();
  }

  /**
   * Upgrade all the hacknode's stats to max.
   */
  upgrade() {

    // loop through every hacknet node
    for (let i = 0; i < this.curNodes; i++) {

      // upgrade the node's level to max
      while (
        this.ns.hacknet.getLevelUpgradeCost(i) < Infinity
        && this.ns.hacknet.getLevelUpgradeCost(i) < this.ns.getServerMoneyAvailable('home')
      ) {
        if (this.ns.hacknet.upgradeLevel(i)) {
          this.ns.tprintf(`Upgraded hacknet-node-${i} to level ${this.ns.hacknet.getNodeStats(i).level}.`);
        }
      }

      // upgrade the node's ram to max
      while (
        this.ns.hacknet.getRamUpgradeCost(i) < Infinity
        && this.ns.hacknet.getRamUpgradeCost(i) < this.ns.getServerMoneyAvailable('home')
      ) {
        if (this.ns.hacknet.upgradeRam(i)) {
          this.ns.tprintf(`Upgraded hacknet-node-${i}'s ram to ${this.ns.hacknet.getNodeStats(i).ram}.`);
        }
      }

      // upgrade the node's cores to max
      while (
        this.ns.hacknet.getCoreUpgradeCost(i) < Infinity 
        && this.ns.hacknet.getCoreUpgradeCost(i) < this.ns.getServerMoneyAvailable('home')
      ) {
        if (this.ns.hacknet.upgradeCore(i)) {
          this.ns.tprintf(`Upgraded hacknet-node-${i} to ${this.ns.hacknet.getNodeStats(i).cores} cores.`);
        }
      }
    }

    // display time til paid off
    this.payOff();
  }
}

/**
 * Represents all of my hacknet nodes.  Offers interfaces for buying and upgrading.
 */
class HackNetServers extends HackNet {

  /**
   * Creates a HackNetServer object, offering easy control of hacknet nodes.
   * 
   * @param {NS} ns - NetScript.
   */
  constructor(ns) {
    super(ns);
    this.maxHash = ns.hacknet.hashCapacity();
    this.curHash = ns.hacknet.numHashes();

    // get individual node stats
    this.servers = []
    for (let i = 0; i < this.curNodes; i++) {
      this.servers.push(ns.hacknet.getNodeStats(i));
    }
  }

  /**
   * Prints a help message to the terminal.
   */
  help() {
    let msg = `net.js usage:\n`;
    msg += `  run net.js help    - Display this help text.\n`;
    msg += `  run net.js info    - Display information about all hacknet servers.\n`
    msg += `  run net.js upgrade - Upgrade the network by either purchasing or upgrading a server.\n`
    // msg += `  run net.js buy     - Buy a hacknet node.\n`
    this.ns.tprintf(msg);
  }

  /**
   * Display detailed information about all owned hacknet servers.
   */
  info() {
    
    // start with server specific info
    let msg = 'hacknet:\n';
    for (const server of this.servers) {
      msg += `  ${server.name} => {`
      msg += `prod: ${server.production}, `;
      msg += `cap: ${server.hashCapacity}, `;
      msg += `level: ${server.level}, `;
      msg += `ram: ${server.ramUsed} / ${server.ram}, `;
      msg += `cores: ${server.cores}, `;
      msg += `cache: ${server.cache}}\n`;
    }

    // add general info
    msg += `servers: ${this.curNodes} / ${this.maxNodes}\n`;
    msg += `hashes: ${this.curHash} / ${this.maxHash}\n`;

    // print to terminal
    this.ns.tprintf(msg);
  }



  /**
   * Upgrades the hacknet by determining the cheapest upgrade that provides the most production.
   */
  upgrade() {

    // determine the new server cost, hash rate, rate gains, and value
    let newServerCost = this.ns.hacknet.getPurchaseNodeCost();
    let newServerRate = this.ns.formulas.hacknetServers.hashGainRate(1, 0, 1, 1, this.mult);

    // loop through each server and determine which upgrade is most valuable
    let bestUpgrade;
    for (let i = 0; i < this.curNodes; i++) {
      let server = this.servers[i];
      let upgrade = this.findIdealUpgrade(server);

      // 
      if (!bestUpgrade || upgrade.value > bestUpgrade.value) {
        bestUpgrade = upgrade;
        bestUpgrade.index = i;
      }
    }

    // if a new server is cheaper than the best upgrade cost, buy it
    if (newServerCost < bestUpgrade.cost) {
      this.ns.tprintf(`best upgrade cost: ${bestUpgrade.cost}, new server cost ${newServerCost}`);
      let index = this.ns.hacknet.purchaseNode()
      if (index) {
        this.ns.tprintf(`bought hacknet-server-${index}`);
      }
      return;
    }

    // 
    let i = bestUpgrade.index;
    switch (bestUpgrade.name) {

      // 
      case "cache":
        let cache = this.servers[i].cache;
        if (this.ns.hacknet.upgradeCache(i)) {
          this.ns.tprintf(`upgraded hacknet-server-${i}'s cache to from ${cache} to ${cache + 1}`);
        }
        return;

      // 
      case "level":
        let level = this.servers[i].level;
        if (this.ns.hacknet.upgradeLevel(i)) {
          this.ns.tprintf(`upgrade hacknet-server-${i}'s cache from ${level} to ${level + 1}`);
        }
        return;

      //
      case "ram":
        let ram = this.servers[i].ram;
        if (this.ns.hacknet.upgradeRam(i)) {
          this.ns.tprintf(`upgraded hacknet-server-${i}'s ram from ${ram} to ${ram * 2}`);
        }
        return;

      //
      case "core":
        let cores = this.servers[i].cores;
        if (this.ns.hacknet.upgradeCore(i)) {
          this.ns.tprintf(`upgraded hacknet-server-${i}'s cores from ${cores} to ${cores + 1}`);
        }
        return;
    }
  }

  /**
   * Determine which attribute should be upgraded by analyzing the value of each upgrade.
   * Value determined by extra hash rate / upgrade cost.
   * 
   * @param {NodeStats} server - The 
   */
  findIdealUpgrade(server) {

    // find index number and current hash rate
    let index = Number(server.name.replace("hacknet-server-", ""));
    let curRate = this.ns.formulas.hacknetServers.hashGainRate(server.level, server.ramUsed, server.ram, server.cores, this.mult);

    // calculate the next level cost, hash rate, rate gains, and value
    let levelCost = this.ns.hacknet.getLevelUpgradeCost(index);
    let levelRate = this.ns.formulas.hacknetServers.hashGainRate(server.level+1, server.ramUsed, server.ram, server.cores, this.mult);
    let levelGains = levelRate - curRate;
    let levelValue = levelGains / levelCost;
    // this.ns.tprintf(`server: ${index}, target level: ${server.level + 1} => cost: ${levelCost}, rate: ${levelRate}, gains: ${levelGains}, value: ${levelValue}`);

    // calculate the next ram cost, hash rate, rate gains, and value
    let ramCost = this.ns.hacknet.getRamUpgradeCost(index);
    let ramRate = this.ns.formulas.hacknetServers.hashGainRate(server.level, server.ramUsed, server.ram+1, server.cores, this.mult);
    let ramGains = ramRate - curRate;
    let ramValue = ramGains / ramCost;
    // this.ns.tprintf(`server: ${index}, target ram: ${server.ram * 2} => cost: ${ramCost}, rate: ${ramRate}, gains: ${ramGains}, value: ${ramValue}`);

    // calculate the next core's cost, hash rate, rate gains, and value
    let coreCost = this.ns.hacknet.getCoreUpgradeCost(index);
    let coreRate = this.ns.formulas.hacknetServers.hashGainRate(server.level, server.ramUsed, server.ram, server.cores+1, this.mult);
    let coreGains = coreRate - curRate;
    let coreValue = coreGains / coreCost;
    // this.ns.tprintf(`server: ${index}, target cores: ${server.ram * 2} => cost: ${coreCost}, rate: ${coreRate}, gains: ${coreGains}, value: ${coreValue}`);

    // always upgrade the cache if it's the cheapest to upgrade
    let cacheCost = this.ns.hacknet.getCacheUpgradeCost(index);
    if (cacheCost < levelCost || cacheCost < ramCost || cacheCost < coreCost) {
      return {
        name: "cache",
        cost: cacheCost,
        value: 0,
        production: curRate
      }
    }

    // upgrade level if it has the highest value
    if (levelValue >= ramValue && levelValue >= coreValue) {
      return {
        name: "level",
        cost: levelCost,
        value: levelValue,
        production: levelRate
      }
    }

    // upgrade ram if it has the highest value
    if (ramValue >= levelValue && ramValue >= coreValue) {
      return {
        name: "ram",
        cost: ramCost,
        value: ramValue,
        production: ramRate
      }
    }

    // upgrade cores if it has the highest value
    if (coreValue >= levelValue && coreValue >= ramValue) {
      return {
        name: "core",
        cost: coreCost,
        value: coreValue,
        production: coreRate
      }
    }

    // show error if we get this far
    this.ns.tprintf(`ERROR: something went wrong calculating ideal upgrade for ${server.name}.`);
  }
}