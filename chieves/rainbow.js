/**
 * Import type definitions from bitburner source.
 * @ts-check
 * @typedef {import('./bitburner-src/src/ScriptEditor/NetscriptDefinitions').NS} NS
 */

/**
 * Rainbow table?
 */
export async function rainbow(ns) {

  // definal all guessable characters
  let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let numbers = '0123456789';
  let symbols = '\',./;[]-=!@#$%^&*()_+{}:"<>?';

  // combine all guessable characters into one string
  let guessables = letters + numbers + symbols;
  let answers = [];

  // guess all single characters
  for (const guess of guessables) {
    answers.push(guess);

    ns.tprintf(`trying ${guess}`)
    if (ns.rainbow(guess)) {
      ns.tprintf(`the answer was ${guess}`);
      return;
    }
    await ns.sleep(20);
  }

  // start with single character answers and limit guesses to 8 characters
  for (let c = 1; c < 4; c++) {

    // loop through all current answers of the current size
    for (const prev of answers) {
      if (prev.length === c) {

        // add each guessable character to the answer, and add each answer to the array
        for (const guess of guessables) {
          let answer = prev + guess;
          answers.push(answer);

          ns.tprintf(`trying ${answer}`)
          if (ns.rainbow(answer)) {
            ns.tprintf(`the answer was ${answer}`);
            return;
          }
          await ns.sleep(20);
        }
      }
    }
  }
}