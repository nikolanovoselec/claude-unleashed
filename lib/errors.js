export class FatalError extends Error {
  constructor(message, { guidance } = {}) {
    super(message);
    this.name = 'FatalError';
    this.guidance = guidance;
  }
}

export class RecoverableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RecoverableError';
  }
}

export function handleError(error) {
  if (error instanceof FatalError) {
    console.error(`Error: ${error.message}`);
    if (error.guidance) {
      console.error(error.guidance);
    }
    process.exit(1);
  }
  // RecoverableError or unknown — log and continue
  if (process.env.DEBUG) {
    console.log(`[recoverable] ${error.message}`);
    if (error.stack) console.log(error.stack);
  }
}
