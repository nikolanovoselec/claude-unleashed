import readline from 'readline';
import { RED, YELLOW, CYAN, GREEN, RESET, BOLD } from './colors.js';

export function askForConsent() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`\n${BOLD}${YELLOW}Claude Unleashed - Consent Required${RESET}\n`);
    console.log(`${CYAN}----------------------------------------${RESET}`);
    console.log(`${BOLD}What is Claude Unleashed?${RESET}`);
    console.log(`This package creates a wrapper around the official Claude CLI tool that:`);
    console.log(`  1. ${RED}BYPASSES safety checks${RESET} by automatically adding the --dangerously-skip-permissions flag`);
    console.log(`  2. Automatically updates to the latest Claude CLI version`);
    console.log(`  3. Adds themed loading messages`);
    console.log(`  4. ${GREEN}SUPPORTS SAFE MODE${RESET} with --safe flag\n`);

    console.log(`${BOLD}${RED}⚠️ IMPORTANT SECURITY WARNING ⚠️${RESET}`);
    console.log(`The ${BOLD}--dangerously-skip-permissions${RESET} flag was designed for use in containers`);
    console.log(`and bypasses important safety checks. This includes ignoring file access`);
    console.log(`permissions that protect your system and privacy.\n`);

    console.log(`${BOLD}By using Claude Unleashed in Unleashed mode:${RESET}`);
    console.log(`  • You acknowledge these safety checks are being bypassed`);
    console.log(`  • You understand this may allow Claude CLI to access sensitive files`);
    console.log(`  • You accept full responsibility for any security implications\n`);

    console.log(`${CYAN}----------------------------------------${RESET}\n`);

    rl.question(`${YELLOW}Do you consent to using Claude Unleashed with these modifications? (yes/no): ${RESET}`, (answer) => {
      rl.close();
      const lowerAnswer = answer.toLowerCase().trim();
      if (lowerAnswer === 'yes' || lowerAnswer === 'y') {
        console.log(`\n${YELLOW}Unleashed mode approved${RESET}`);
        resolve(true);
      } else {
        console.log(`\n${CYAN}Aborted. Unleashed mode not activated.${RESET}`);
        console.log(`If you want the official Claude CLI with normal safety features, run:`);
        console.log(`claude`);
        resolve(false);
      }
    });
  });
}
