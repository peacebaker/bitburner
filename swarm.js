/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 */

import { knock } from './knock.js';

// script file names
const wScript = "dron3Weaken3r.js";
const gScript = "dron3Grow3r.js";
const hScript = "dron3Hack3r.js";
const thisScript = "swarm.js";

// the maximum number of processes to allow on the server
const targetProcs = 512;

/**
 * Control the swarm.
 * 
 * @param {NS} ns - NetScript.
 */
export async function main(ns) {

  // declare possible options
  let cmd;
  let target;
  let procs;

  // if no option was specified, display help text
  if (ns.args.length === 0) {
    help(ns);
  }

  // if there's only one option, it's the command
  if (ns.args.length === 1) {
    cmd = ns.args[0];

    // run single-option commands
    switch (cmd) {
      case "info":
        info(ns);
        return;

      case "help":
      default:
        help(ns);
        return;
    }
  }

  // all remaining subcommands require a queen
  let queen = new Queen(ns);
  
  // if are two options, first will be target and second will be command
  if (ns.args.length === 2) {
    target = ns.args[0];
    cmd = ns.args[1];

    // run the two-option commands
    switch (cmd) {
      case "analyze":
        queen.analyze(target);
        return;
      
      default:
        help(ns);
        return;
    }
  }

  // if there are three options, first will be target, second will be command, and third will be number of processes
  if (ns.args.length >= 3) {
    target = ns.args[0];
    cmd = ns.args[1];
    procs = ns.args[2];

    // make sure we have root access
    if (!ns.hasRootAccess(target)) {
      knock(ns, target);
    }
    if (!ns.hasRootAccess(target)) {
      ns.tprintf(`cannot hack ${target}, no root access`);
      return;
    }

    // adjust the appropriate swarm to the requested number
    let swarm;
    switch (cmd) {
      case "w":
      case "weaken":
      case "weakener":
        swarm = new WeakenerSwarm(ns, target, queen.threads, procs);
        await swarm.swarm(ns);
        return;

      case "g":
      case "grow":
      case "grower":
        swarm = new GrowerSwarm(ns, target, queen.threads, procs);
        await swarm.swarm(ns);
        break;

      case "h":
      case "hack":
      case "hacker":
        swarm = new HackerSwarm(ns, target, queen.threads, procs);
        await swarm.swarm(ns);
        break;

      default:
        help(ns);
        return;
    }
  }
}

/**
 * Displays usage info.
 * 
 * @param {NS} ns - NetScript.
 */
function help(ns) {
  let msg = `swarm.js usage:\n`;
  msg += `  run swarm.js help                     - displays this help text\n`;
  msg += `  run swarm.js info                     - displays info about the swarm\n`;
  msg += `  run swarm.js [target] analyze         - analyzes and calculates attack specs\n`;
  msg += `  run swarm.js [target] weakener [num]  - adjusts the weakener swarm to the requested size\n`;
  msg += `  run swarm.js [target] grower [num]    - adjusts the grower swarm to the requested size\n`;
  msg += `  run swarm.js [target] hacker [num]    - adjusts the hacker swarm to the requested size\n`;
  ns.tprintf(msg);
}

/**
 * Displays info about the swarm.
 * 
 * @param {NS} ns - NetScript.
 */ 
function info(ns) {
  let bees = getBees(ns);
  let msg = `bees:\n`;
  msg += `  weakeners: ${bees.weakeners.length}\n`;
  msg += `  growers: ${bees.growers.length}\n`;
  msg += `  hackers: ${bees.hackers.length}\n`;
  msg += `  target(s): `;
  for (let i = 0; i < bees.targets.length; i++) {
    if (i < bees.targets.length - 1) {
      msg += `${bees.targets[i]}, `;
    } else {
      msg += `${bees.targets[i]}\n`;
    }
  }
  ns.tprintf(msg);
}

/**
 * The Queen controls the swarm.
 * 
 * @class
 */
export class Queen {
  
  /**
   * Creates a queen using values set at creation.
   * 
   * @param {NS} ns - NetScript
   */
  constructor(ns) {
    this.ns = ns;
    this.me = this.ns.getHostname();
    this.server = this.ns.getServer(this.me);
    this.ramOffset = 0;
    if (this.me === "home") {
      // this.ramOffset = 64;
    }
    this.maxRam = this.server.maxRam;
    this.usedRam = this.server.ramUsed;
    this.availRam = this.maxRam - this.ramOffset;
    this.freeRam = this.availRam - this.usedRam;
    this.ramCost = ns.getScriptRam(wScript);

    // calculate number of threads per process, min 1
    this.threads = Math.floor(this.availRam / (this.ramCost * targetProcs));
    this.threads = !this.threads ? 1 : this.threads;
  }

  /**
   * Analyzes the target server for attack-related information.
   * 
   * @param {string} target - The target of the attack.
   */
  analyze(target) {

    // 
    let times = getTime(this.ns, target);

    // 
    let maxCash = this.ns.getServerMaxMoney(target);
    let curCash = this.ns.getServerMoneyAvailable(target);
    let multiplier = this.ns.hackAnalyze(target);
    let gains = multiplier*curCash*this.threads;
    let minSec = this.ns.getServerMinSecurityLevel(target);
    let curSec = this.ns.getServerSecurityLevel(target);

    let msg = `${this.me} specs:\n`;
    msg += `  max ram: ${this.ns.formatRam(this.maxRam)}\n`;
    msg += `  used ram: ${this.ns.formatRam(this.usedRam)}\n`;
    msg += `  free ram: ${this.ns.formatRam(this.freeRam)}\n`;
    msg += `  threads: ${this.threads.toLocaleString('en-US')}\n`;
    
    msg += `${target} specs\n`;
    msg += `  max cash: ${this.ns.formatNumber(maxCash)}\n`;
    msg += `  cur cash: ${this.ns.formatNumber(curCash)}\n`;
    msg += `  cur hack: ${this.ns.formatNumber(gains)}\n`
    msg += `  min sec: ${minSec}\n`;
    msg += `  cur sec: ${curSec}\n`;

    msg += `timings:\n`;
    msg += `  weaken time: ${times.w.toLocaleString('en-US')}\n`;
    msg += `  grow time ${times.g.toLocaleString('en-US')}\n`;
    msg += `  hack time: ${times.h.toLocaleString('en-US')}\n`;

    info(this.ns);
    this.ns.tprintf(msg);
  }
}

/**
 * The swarm represents all dron3 processes, aka bees.
 * 
 * @class
 */
class Swarm {

  /**
   * Initialize the swarm control object.
   * 
   * @param {NS} ns          - NetScript.
   * @param {string} target  - The swarm's target.
   * @param {number} threads - The number of threads per process.
   * @param {number} num     - The target number of dron3s in the swarm.
   */
  constructor(ns, target, threads, num) {
    this.ns = ns;
    this.me = ns.getHostname();
    this.target = target;
    this.threads = threads;
    this.num = num;
    this.pids = [];
  }

  /**
   * Display information about the swarm.
   */
  info() {
    this.ns.tprintf(`target: ${this.target}`);
    this.ns.tprintf(`number: ${this.num}`);
    this.ns.tprintf(`pids: ${this.pids}`);
    this.ns.tprintf(`threads: ${this.threads}`);
  }

  /**
   * Spawn dron3s until the requested number is met.
   * 
   * @param {number} timeout - The amount of time to wait between spawning more dron3s.
   */
  async swarm(timeout) {
    while (this.pids.length < this.num) {
      this.add();
      await this.ns.sleep(timeout);
    }
  }

  /** 
   * Kill all drones of this type.  
   */
  async killall() {
    for (const pid of this.pids) {
      this.ns.kill(pid);
    }
    this.pids = [];
  }
}

export class WeakenerSwarm extends Swarm {

  /**
   * All the weakener drones on the current server.
   * 
   * @param {NS} ns          - NetScript.
   * @param {string} target  - The targer server's name.
   * @param {number} threads - The number of threads per each drone.
   * @param {number} num     - The number of drones to spawn.
   */
  constructor(ns, target, threads, num) {
    super(ns, target, threads, num);
    this.pids = getBees(ns).weakeners;
  }

  async swarm() {
    super.killall();
    this.pids = getBees(this.ns).weakeners;
    let weakenTime = this.ns.getWeakenTime(this.target);
    let timeout = weakenTime / this.num;
    await super.swarm(timeout);
    this.ns.tprintf(`${thisScript}@${this.me}: sent ${this.num} weakeners => ${this.target}`);
  }

  async add() {
    let process = this.ns.exec(wScript, this.me, this.threads, this.target);
    this.pids.push(process);
  }
}

  /**
   * All the grower drones on the current server.
   * 
   * @param {NS} ns          - NetScript.
   * @param {string} target  - The targer server's name.
   * @param {number} threads - The number of threads per each drone.
   * @param {number} num     - The number of drones to spawn.
   */
export class GrowerSwarm extends Swarm {

  constructor(ns, target, threads, num) {
    super(ns, target, threads, num);
    this.pids = getBees(ns).growers;
  }

  async swarm() {
    super.killall();
    this.pids = getBees(this.ns).growers;
    let growTime = this.ns.getGrowTime(this.target);
    let timeout = growTime / this.num;
    await super.swarm(timeout);
    this.ns.tprintf(`${thisScript}@${this.me}: sent ${this.num} growers => ${this.target}`);
  }

  async add() {
    let process = this.ns.exec(gScript, this.me, this.threads, this.target);
    this.pids.push(process);
  }
}

  /**
   * All the hacker drones on the current server.
   * 
   * @param {NS} ns          - NetScript.
   * @param {string} target  - The targer server's name.
   * @param {number} threads - The number of threads per each drone.
   * @param {number} num     - The number of drones to spawn.
   */
export class HackerSwarm extends Swarm {

  constructor(ns, target, threads, num) {
    super(ns, target, threads, num);
    this.pids = getBees(ns).hackers;
    this.flag = ns.args[3];
  }

  async swarm() {
    super.killall();
    this.pids = getBees(this.ns).hackers;
    let hackTime = this.ns.getHackTime(this.target);
    let timeout = hackTime / this.num;
    await super.swarm(timeout);
    this.ns.tprintf(`${thisScript}@${this.me}: sent ${this.num} hackers => ${this.target}`);
  }

  // deploy hacker drones at regular intervals
  async add() {
    let process;
    if (this.flag === "-v") {
      process = this.ns.exec(hScript, this.me, this.threads, this.target, this.flag);
    } else {
      process = this.ns.exec(hScript, this.me, this.threads, this.target);
    }
    this.pids.push(process);
  }
}

/**
 * Calculate how much time each weaken, grow, and hack cycle will take.
 * 
 * @param {NS} ns         - NetScript.
 * @param {string} target - the target's hostname.
 * @returns 
 */
export function getTime(ns, target) {
  let w = ns.getWeakenTime(target) / 1000;
  let g = ns.getGrowTime(target) / 1000;
  let h = ns.getHackTime(target) / 1000;
  return {w, g, h}
}


/**
 * Get the pids of all drones, sorted by type.
 * 
 * @param {NS} ns  - NetScript.
 * @returns 
 */
function getBees(ns) {
  
  let allTheBees = ns.ps();
  let weakeners = [];
  let growers = [];
  let hackers = [];
  let targets = [];

  // grab the bee's pids
  for (const bee of allTheBees) {
    switch (bee.filename) {
      case wScript:
        weakeners.push(bee.pid);
        break;
      case gScript:
        growers.push(bee.pid);
        break;
      case hScript:
        hackers.push(bee.pid);
        break;
    }

    // find the target(s)
    if (bee.args[0]) {
      if (!targets.includes(bee.args[0])) {
        targets.push(bee.args[0])
      }
    }
  }

  return { weakeners, growers, hackers, targets };
}
