import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FatalError, RecoverableError, handleError } from '../lib/errors.js';

describe('errors', () => {
  describe('FatalError', () => {
    it('has correct name and message', () => {
      const err = new FatalError('test');
      expect(err.name).toBe('FatalError');
      expect(err.message).toBe('test');
    });

    it('stores guidance', () => {
      const err = new FatalError('test', { guidance: 'try this' });
      expect(err.guidance).toBe('try this');
    });
  });

  describe('RecoverableError', () => {
    it('has correct name and message', () => {
      const err = new RecoverableError('test');
      expect(err.name).toBe('RecoverableError');
      expect(err.message).toBe('test');
    });
  });

  describe('handleError', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(process, 'exit').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
      delete process.env.DEBUG;
    });

    it('calls process.exit(1) for FatalError', () => {
      handleError(new FatalError('fatal'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('logs guidance for FatalError with guidance', () => {
      handleError(new FatalError('fatal', { guidance: 'help' }));
      expect(console.error).toHaveBeenCalledWith('help');
    });

    it('debug-logs RecoverableError when DEBUG is set', () => {
      process.env.DEBUG = '1';
      handleError(new RecoverableError('recoverable'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('recoverable'));
    });
  });
});
