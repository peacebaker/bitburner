/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions.js').NS} NS
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions.js').NodeStats} NodeStats
 */


import { formatTime } from './utils.js';



/**
 * HackServer maximums:
 *  max ram: 8.19TB
 *  max cache: 15
 * 
 * 
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

  let hackNet = new HackNetServers(ns);
  switch (cmd) {
    case "info":
      hackNet.info();
      return;

    case "upgrade":
      let amount = ns.args[1] ? ns.args[1] : 1;
      for (let i = 0; i < amount; i++) {
        hackNet = new HackNetServers(ns);
        hackNet.upgrade();
      }
      hackNet = new HackNetServers(ns);
      let nextUpgrade = hackNet.findBestUpgrade();
      hackNet.print(`next upgrade: hacknet-server-${nextUpgrade.index}'s ${nextUpgrade.name} for ${ns.formatNumber(nextUpgrade.cost)}`);
      return;

    case "spend":
      hackNet.spend();
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
    let msg = `hacknet.js usage:\n`;
    msg += `  run hacknet.js help    - display this help text\n`;
    msg += `  run hacknet.js info    - display information about all current hacknet nodes\n`
    msg += `  run hacknet.js buy     - buy a hacknet node\n`
    msg += `  run hacknet.js upgrade - upgrade all hacknet nodes to max\n`
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
   * Prints to the terminal, unless the -q flag is supplied.
   * 
   * @param {*} msg - The message to print.  Don't use %'s.
   */
  print(msg) {

    // use -q or --quiet to set quiet mode
    let quiet = false;
    for (const arg of this.ns.args) {
      if (arg === "-q" || arg === "--quiet") {
        quiet = true;
      }
    }

    // print whatever to the screen
    if (!quiet) {
      this.ns.tprintf(`${msg}`);
    }
  }

  /**
   * Prints a help message to the terminal.
   */
  help(topic) {

    // generate help text
    topic = topic ? topic : 'general';
    let msg = `hacknet.js: ${topic} usage\n`

    switch (topic) {

      case "spend":
        msg += `  run hacknet.js spend cash [num?]   - trade hashes for cash\n`;
        msg += `  run hacknet.js min [target] [num?] - lower the target server's minimum security level\n`;
        msg += `  run hacknet.js max [target] [num?] - raise the target server's max money available\n`;
        break;

      default:
        msg += `  run hacknet.js help            - display this help text\n`;
        msg += `  run hacknet.js info            - display information about all hacknet servers\n`
        msg += `  run hacknet.js upgrade         - upgrade the network by either purchasing or upgrading a server\n`
        msg += `  run hacknet.js spend [upgrade] * spend hashes on various upgrades\n`

        break;
    }

    this.print(msg);
  }

  /**
   * Display detailed information about all owned hacknet servers.
   */
  info() {

    // 
    
    // start with server specific info
    let msg = 'hacknet:\n';
    let prod = 0;
    for (const server of this.servers) {
      msg += `  ${server.name} => {`
      msg += `prod: ${this.ns.formatNumber(server.production)}, `;
      msg += `cap: ${this.ns.formatNumber(server.hashCapacity)}, `;
      msg += `level: ${server.level}, `;
      msg += `ram: ${this.ns.formatRam(server.ramUsed)} / ${this.ns.formatRam(server.ram)}, `;
      msg += `cores: ${server.cores}, `;
      msg += `cache: ${server.cache}}\n`;

      prod += server.production;
    }

    // add general info
    let left = this.maxHash - this.curHash;
    let timeLeft = left / prod;
    msg += `servers: ${this.curNodes} / ${this.maxNodes}\n`;
    msg += `hashes: ${this.ns.formatNumber(this.curHash)} / ${this.ns.formatNumber(this.maxHash)}\n`;
    msg += `hashes per sec: ${this.ns.formatNumber(prod)}\n`;
    msg += `time 'til full: ${formatTime(timeLeft)}`

    // print to terminal
    this.print(msg);
  }

  /**
   * Upgrades the hacknet by determining the cheapest upgrade that provides the most production.
   */
  upgrade() {

    // if there are no servers available, buy one
    if (this.servers.length === 0) {
    let index = this.ns.hacknet.purchaseNode();
      if (index === 0) {
        this.print(`bought hacknet-server-${index}`);
      }
      return;
    }

    // determine the best upgrade available
    let bestUpgrade = this.findBestUpgrade();

    // determine the new server cost, hash rate, rate gains, and value
    let newServerCost = this.ns.hacknet.getPurchaseNodeCost();
    let newServerRate = this.ns.formulas.hacknetServers.hashGainRate(1, 0, 1, 1, this.mult);
    let newServerValue = newServerRate / newServerCost;

    // always prefer buying a new server if it's cheaper
    if (newServerCost < bestUpgrade.cost) {
      let index = this.ns.hacknet.purchaseNode();
      if (index !== -1) {
        this.print(`bought hacknet-server-${index}`);
      }
      return;
    }

    // determine which server to upgrade and how to upgrade it
    let i = bestUpgrade.index;
    switch (bestUpgrade.name) {

      // upgrade the server's cache
      case "cache":
        let cache = this.servers[i].cache;
        if (this.ns.hacknet.upgradeCache(i)) {
          this.print(`upgraded hacknet-server-${i}'s cache to from ${cache} to ${cache + 1}`);
        }
        return;

      // upgrade the server's level
      case "level":
        let level = this.servers[i].level;
        if (this.ns.hacknet.upgradeLevel(i)) {
          this.print(`upgraded hacknet-server-${i}'s level from ${level} to ${level + 1}`);
        }
        return;

      // upgrade the server's ram
      case "ram":
        let ram = this.servers[i].ram;
        if (this.ns.hacknet.upgradeRam(i)) {
          this.print(`upgraded hacknet-server-${i}'s ram from ${ram} to ${ram * 2}`);
        }
        return;

      // upgrade the total number of cores
      case "core":
        let cores = this.servers[i].cores;
        if (this.ns.hacknet.upgradeCore(i)) {
          this.print(`upgraded hacknet-server-${i}'s cores from ${cores} to ${cores + 1}`);
        }
        return;
    }
  }

  /**
   * TODO: 
   * 
   * @returns 
   */
  findBestUpgrade() {

    // loop through each server and determine which upgrade is most valuable
    let upgrades = [];
    let bestUpgrade;
    for (let i = 0; i < this.curNodes; i++) {
      let server = this.servers[i];
      let upgrade = this.#findIdealUpgrade(server);
      upgrades.push(upgrade);

      // 
      if (!bestUpgrade || upgrade.value > bestUpgrade.value) {
        bestUpgrade = upgrade;
      }
    }

    // ensure caches are bought first
    for (let i = 0; i < this.curNodes; i++) {
      if (upgrades[i].name === "cache") {
        bestUpgrade = upgrades[i];
      }
    }

    // // if a new server is cheaper than the best upgrade cost, buy it
    // if (bestUpgrade.name !== "cache" && newServerValue > bestUpgrade.value) {

    // 
    return bestUpgrade;
  }

  /**
   * Determine which attribute should be upgraded by analyzing the value of each upgrade.
   * Value determined by extra hash rate / upgrade cost.
   * 
   * @param {NodeStats} server - The server to be analyzed.
   */
  #findIdealUpgrade(server) {

    // find index number and current hash rate
    let index = Number(server.name.replace("hacknet-server-", ""));
    let curRate = this.ns.formulas.hacknetServers.hashGainRate(server.level, server.ramUsed, server.ram, server.cores, this.mult);

    // calculate the next level cost, hash rate, rate gains, and value
    let levelCost = this.ns.hacknet.getLevelUpgradeCost(index);
    let levelRate = this.ns.formulas.hacknetServers.hashGainRate(server.level+1, server.ramUsed, server.ram, server.cores, this.mult);
    let levelGains = levelRate - curRate;
    let levelValue = levelGains / levelCost;
    // this.print(`server: ${index}, target level: ${server.level + 1} => cost: ${levelCost}, rate: ${levelRate}, gains: ${levelGains}, value: ${levelValue}`);

    // calculate the next ram cost, hash rate, rate gains, and value
    let ramCost = this.ns.hacknet.getRamUpgradeCost(index);
    let ramRate = this.ns.formulas.hacknetServers.hashGainRate(server.level, server.ramUsed, server.ram*2, server.cores, this.mult);
    let ramGains = ramRate - curRate;
    let ramValue = ramGains / ramCost;
    // this.print(`server: ${index}, target ram: ${server.ram * 2} => cost: ${ramCost}, rate: ${ramRate}, gains: ${ramGains}, value: ${ramValue}`);

    // calculate the next core's cost, hash rate, rate gains, and value
    let coreCost = this.ns.hacknet.getCoreUpgradeCost(index);
    let coreRate = this.ns.formulas.hacknetServers.hashGainRate(server.level, server.ramUsed, server.ram, server.cores+1, this.mult);
    let coreGains = coreRate - curRate;
    let coreValue = coreGains / coreCost;
    // this.print(`server: ${index}, target cores: ${server.cores + 1} => cost: ${coreCost}, rate: ${coreRate}, gains: ${coreGains}, value: ${coreValue}`);

    // get the cost of a cache upgrade
    let cacheCost = this.ns.hacknet.getCacheUpgradeCost(index);

    // upgrade the cache if it isn't the most expensive upgrade available
    // if (cacheCost < levelCost || cacheCost < ramCost || cacheCost < coreCost) {

    // upgrade cache if it's the cheapest upgrade available
    if (cacheCost < levelCost && cacheCost < ramCost && cacheCost < coreCost) {
      return {
        name: "cache",
        index: index,
        cost: cacheCost,
        value: 0,
        production: curRate
      }
    }

    // upgrade level if it has the highest value
    if (levelValue >= ramValue && levelValue >= coreValue) {
      return {
        name: "level",
        index: index,
        cost: levelCost,
        value: levelValue,
        production: levelRate
      }
    }

    // upgrade ram if it has the highest value
    if (ramValue >= levelValue && ramValue >= coreValue) {
      return {
        name: "ram",
        index: index,
        cost: ramCost,
        value: ramValue,
        production: ramRate
      }
    }

    // upgrade cores if it has the highest value
    if (coreValue >= levelValue && coreValue >= ramValue) {
      return {
        name: "core",
        index: index,
        cost: coreCost,
        value: coreValue,
        production: coreRate
      }
    }

    // show error if we get this far
    this.print(`ERROR: something went wrong calculating ideal upgrade for ${server.name}.`);
  }

  /**
   * Spends hacknet hashes.
   */
  spend() {

    // keep track of expenses
    let spent = 0;
    
    // determine the upgrade type and set default number of upgrades to purchase
    let upgrade = this.ns.args[1] ? this.ns.args[1] : "";
    switch (upgrade) {

      // trade hash for cash!
      case "cash": {
        spent = this.#spendCash();
        break;
      }
        
      // trade hashes to lower a server's minimum security level
      case "min":  {
        spent = this.#spendMin();
        break;
      }
        
      // trade hashes to raise a server's max money
      case "max": {
        spent = this.#spendMax();
        break;
      }

      // trade hashes to increase the amount of experience you get from studying at a university
      case "study": {

        let num = this.ns.args[2] ? this.ns.args[2] : 1;
        for (let i = 0; i < num; i++) {
          let cost = this.ns.hacknet.hashCost("Improve Studying");
          if (this.ns.hacknet.spendHashes("Improve Studying")) {
            spent += cost;
          }
        }
        let studyLevel = this.ns.hacknet.getHashUpgradeLevel("Improve Studying");
        let studyMult = (studyLevel * .2) + 1;
        this.print(`spent ${this.ns.formatNumber(spent)} hashes, study multiplier improved to ${this.ns.formatNumber(studyMult)}`);
        break;

      }
        
      default:
        this.help("spend");
        break;
    }

    // print remaining hashes
    this.print(`hashes: ${this.ns.formatNumber(this.curHash - spent)} / ${this.ns.formatNumber(this.maxHash)}`);
  }

  #spendCash() {

    // keep track of expenses and profits
    let spent = 0;
    let total = 0;

    // make the requested number of transactions, defaulting to 1
    let num = this.ns.args[2] ? this.ns.args[2] : 1;
    for (let i = 0; i < num; i++) {
      let cost = this.ns.hacknet.hashCost("Sell for Money");
      if (this.ns.hacknet.spendHashes("Sell for Money")) {
        total += 1000000;
        spent += cost;
      }
    }

    // tell the user what happened
    this.print(`spent ${this.ns.formatNumber(spent)} hashes for a total of $${this.ns.formatNumber(total)}`);
    
    // return the number of hashes spent
    return spent
  }

  #spendMin() {

    // check the target server
    let target = this.ns.args[2];
    if (!target) {
      this.help("spend");
      return;
    }

    // keep track of expenses and security level
    let spent = 0
    let prevSec = this.ns.getServerMinSecurityLevel(target);

    // spend hashes to reduce the minimum security the specified number of times
    let num = this.ns.args[3] ? this.ns.args[3] : 1;
    for (let i = 0; i < num; i++) {
      let cost = this.ns.hacknet.hashCost("Reduce Minimum Security");
      if (this.ns.hacknet.spendHashes("Reduce Minimum Security", target)) {
        spent += cost;
      }
    }

    // calculate and display total reduced security
    let newSec = this.ns.getServerMinSecurityLevel(target);
    let diff = prevSec - newSec;
    let next = this.ns.hacknet.hashCost("Reduce Minimum Security");
    let msg = `spent ${this.ns.formatNumber(spent)} hashes to lower ${target}'s security by `
    msg += `${this.ns.formatNumber(diff)}, now at ${this.ns.formatNumber(newSec)}, `;
    msg += `next increase at ${this.ns.formatNumber(next)} hashes\n`;
    this.print(msg);

    // return expenses
    return spent;
  }

  #spendMax() {

    // check the target server
    let target = this.ns.args[2];
    if (!target) {
      this.help("spend");
      return;
    }

    // get previous security
    let spent = 0;
    let prevMax = this.ns.getServerMaxMoney(target);

    // spend hashes to reduce the minimum security the specified number of times
    let num = this.ns.args[3] ? this.ns.args[3] : 1;
    for (let i = 0; i < num; i++) {
      let cost = this.ns.hacknet.hashCost("Increase Maximum Money");
      if (this.ns.hacknet.spendHashes("Increase Maximum Money", target)) {
        spent += cost;
      }
    }

    // calculate and display the server's new max money and the cost of next upgrade
    let newMax = this.ns.getServerMaxMoney(target);
    let diff = newMax - prevMax;
    let next = this.ns.hacknet.hashCost("Increase Maximum Money");
    let msg = `spent ${this.ns.formatNumber(spent)} hashes to raise ${target}'s max money by `
    msg += `${this.ns.formatNumber(diff)}, now at ${this.ns.formatNumber(newMax)}, `
    msg += `next increase at ${this.ns.formatNumber(next)} hashes\n`;
    this.print(msg);

    // return expenses
    return spent;
  }
}