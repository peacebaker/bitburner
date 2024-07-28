/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 */

/**
 * This script isn't meant to be copied onto bitburner but instead should be copied and pasted into the debugging 
 * console. What we're doing is hacking the actual game by accessing exposed (but obfuscated) webpack info.  This allows
 * us to take complete control over the game.
 * 
 * This shit is > 9000, and I mean it.
 * It's literally just cheating at this point.
 * I'm mostly doing it to learn how to reverse engineer this kind of thing because it's fun.
 */



/**
 * Bitburner is packaged by WebKit, which is apparently designed to obfuscate the JavaScript running the site by 
 * changing function and variable names to numbers and letters.  I'm guessing some of this is done for the sake
 * of optimization as well, but I haven't double checked that.
 * 
 * I'm also guessing that the seemingly random numbers and letters are going to change if/when the game updates, so
 * we'll define a list of constants here and probably some tips for finding them.  My current process is to look through
 * the "sources" section of the dev tools and find relevant code in there.  I'm looking at the main.bundle.js file in
 * particular, and then just using VSCode/grep to look at the original sources, but the original sources are also 
 * present inside of dev tools as well due to "source maps" being included in the final product.
 * 
 * Personally, I take this as reassurance that I'm allowed to hack the game.
 * 

/**
 * This is the beginning of my attempt to reverse map the webpack bindings, but I'm having issues figuring out how to 
 * load bitburner's functions specifically.
 */

const NetscriptFunctions_Extra_NetscriptExtra = 30180;


// I'm pretty sure these are the nodejs libraries that bitburner uses, but so far, I haven't found any bitburner
// functions, objects, or variables anywhere inside of this thing.
let libs = window.webpackChunkbitburner[0][1];
