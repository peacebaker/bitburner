/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
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
  const hackNet = new HackNetServers(ns);
  switch (cmd) {

    // case "buy":
    //   hackNet.buy();
    //   return;

    case "info":
      hackNet.info();
      return;

    // case "upgrade":
    //   hackNet.upgrade();
    //   return;

    default:
      hackNet.help();
      return;
  } 
}


/**
 * Represents all of my hacknet nodes.  Offers interfaces for buying and upgrading.
 */
class HackNetNodes {

  /**
   * Creates a HackNetNode object, offering easy control of hacknet nodes.
   * 
   * @param {NS} ns - NetScript.
   */
  constructor(ns) {
    this.ns = ns;
    this.maxNodes = ns.hacknet.maxNumNodes();
    this.curNodes = ns.hacknet.numNodes();
  }

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
class HackNetServers {

  /**
   * Creates a HackNetServer object, offering easy control of hacknet nodes.
   * 
   * @param {NS} ns - NetScript.
   */
  constructor(ns) {
    this.ns = ns;

    // get overall hacknet stats
    this.maxNodes = ns.hacknet.maxNumNodes();
    this.curNodes = ns.hacknet.numNodes();
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
   * 
   * @param {NS} ns - NetScript.
   */
  help() {
    let msg = `net.js usage:\n`;
    msg += `  run net.js help    - Display this help text.\n`;
    msg += `  run net.js info    - Display information about all hacknet servers.\n`
    msg += `  run net.js upgrade - Upgrade the network by either purchasing or upgrading a server.\n`
    // msg += `  run net.js buy     - Buy a hacknet node.\n`
    this.ns.tprintf(msg);
  }

  info() {
    
    // start with server specific info
    let msg = 'hacknet:\n';
    for (const server of this.servers) {
      msg += `  ${server.name} => {`
      msg += `prod: ${server.production.toLocaleString('en-US')}, `;
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
}