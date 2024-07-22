/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 */

/**
 * Get me some 'chieves.
 * 
 * @param {NS} ns - NetScript.
 */
export async function main(ns) {
  // youllNeedUpgrade(ns);
  // folders(ns);
  // killFolders(ns);
}

/**
 * Gets the achievement "Thank you folders!" by creating 30 empty scripts.
 *
 * @param {NS} ns - NetSCript.
 */
function folders(ns) {
  for (let i = 1; i <= 30; i++) {
    ns.write(`fakes/fake${i}.js`);
  }
}

/**
 * Removes the files created by the folders function.
 * 
 * @param {NS} ns 
 */
function killFolders(ns) {
  for (let i = 1; i <= 30; i++) {
    ns.rm(`fakes/fake${i}.js`);
  }
}


/**
 * Gets the achievement "You'll need upgrade for this one." by loading every NetSCript available.
 * 
 * @param {NS} ns
 */
function youllNeedUpgrade(ns) {

  // get the list
    for (const key in ns) {
    ns.tprintf(`ns.${key};`);
  }

  // load all the things
  ns.singularity;
  ns.gang;
  ns.go;
  ns.bladeburner;
  ns.codingcontract;
  ns.sleeve;
  ns.corporation;
  ns.stanek;
  ns.infiltration;
  ns.ui;
  ns.formulas;
  ns.stock;
  ns.grafting;
  ns.hacknet;
  ns.sprintf;
  ns.vsprintf;
  ns.scan;
  ns.hasTorRouter;
  ns.hack;
  ns.hackAnalyzeThreads;
  ns.hackAnalyze;
  ns.hackAnalyzeSecurity;
  ns.hackAnalyzeChance;
  ns.sleep;
  ns.asleep;
  ns.grow;
  ns.growthAnalyze;
  ns.growthAnalyzeSecurity;
  ns.weaken;
  ns.weakenAnalyze;
  ns.share;
  ns.getSharePower;
  ns.print;
  ns.printf;
  ns.tprint;
  ns.tprintf;
  ns.clearLog;
  ns.disableLog;
  ns.enableLog;
  ns.isLogEnabled;
  ns.getScriptLogs;
  ns.tail;
  ns.moveTail;
  ns.resizeTail;
  ns.closeTail;
  ns.setTitle;
  ns.nuke;
  ns.brutessh;
  ns.ftpcrack;
  ns.relaysmtp;
  ns.httpworm;
  ns.sqlinject;
  ns.run;
  ns.exec;
  ns.spawn;
  ns.kill;
  ns.killall;
  ns.exit;
  ns.scp;
  ns.ls;
  ns.getRecentScripts;
  ns.ps;
  ns.hasRootAccess;
  ns.getHostname;
  ns.getHackingLevel;
  ns.getHackingMultipliers;
  ns.getHacknetMultipliers;
  ns.getBitNodeMultipliers;
  ns.getServer;
  ns.getServerMoneyAvailable;
  ns.getServerSecurityLevel;
  ns.getServerBaseSecurityLevel;
  ns.getServerMinSecurityLevel;
  ns.getServerRequiredHackingLevel;
  ns.getServerMaxMoney;
  ns.getServerGrowth;
  ns.getServerNumPortsRequired;
  ns.getServerMaxRam;
  ns.getServerUsedRam;
  ns.serverExists;
  ns.fileExists;
  ns.isRunning;
  ns.getPurchasedServerLimit;
  ns.getPurchasedServerMaxRam;
  ns.getPurchasedServerCost;
  ns.purchaseServer;
  ns.getPurchasedServerUpgradeCost;
  ns.upgradePurchasedServer;
  ns.renamePurchasedServer;
  ns.deleteServer;
  ns.getPurchasedServers;
  ns.writePort;
  ns.write;
  ns.tryWritePort;
  ns.nextPortWrite;
  ns.readPort;
  ns.read;
  ns.peek;
  ns.clear;
  ns.clearPort;
  ns.getPortHandle;
  ns.rm;
  ns.scriptRunning;
  ns.scriptKill;
  ns.getScriptName;
  ns.getScriptRam;
  ns.getRunningScript;
  ns.ramOverride;
  ns.getHackTime;
  ns.getGrowTime;
  ns.getWeakenTime;
  ns.getTotalScriptIncome;
  ns.getScriptIncome;
  ns.getTotalScriptExpGain;
  ns.getScriptExpGain;
  ns.formatNumber;
  ns.formatRam;
  ns.formatPercent;
  ns.nFormat;
  ns.tFormat;
  ns.getTimeSinceLastAug;
  ns.alert;
  ns.toast;
  ns.prompt;
  ns.wget;
  ns.getFavorToDonate;
  ns.getPlayer;
  ns.getMoneySources;
  ns.atExit;
  ns.mv;
  ns.getResetInfo;
  ns.getFunctionRamCost;
  ns.tprintRaw;
  ns.printRaw;
  ns.flags;
  ns.heart;
  ns.openDevMenu;
  ns.exploit;
  ns.bypass;
  ns.alterReality;
  ns.rainbow;
  ns.args;
  ns.pid;
  ns.enums;
}