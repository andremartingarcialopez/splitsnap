import { describe, expect, it } from 'vitest';
import { cleanOcrText } from './textPreprocessor';
import { AppError } from '../../utils/AppError';

describe('cleanOcrText', () => {
  it('normalizes whitespace', () => {
    expect(cleanOcrText('  A\n\n\nB  ')).toBe('A\n\nB');
  });

  it('throws on empty', () => {
    expect(() => cleanOcrText('   ')).toThrow(AppError);
  });
});
