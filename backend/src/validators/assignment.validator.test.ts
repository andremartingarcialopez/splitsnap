import { describe, expect, it } from 'vitest';
import { assignOneSchema, assignSharedSchema } from './assignment.validator';

const uuid = '11111111-1111-1111-1111-111111111111';
const uuid2 = '22222222-2222-2222-2222-222222222222';

describe('assignOneSchema', () => {
  it('defaults shareRatio to 1', () => {
    const result = assignOneSchema.parse({
      productId: uuid,
      participantId: uuid2,
    });
    expect(result.shareRatio).toBe(1);
  });

  it('rejects non-positive shareRatio', () => {
    expect(() =>
      assignOneSchema.parse({
        productId: uuid,
        participantId: uuid2,
        shareRatio: 0,
      }),
    ).toThrow();
  });
});

describe('assignSharedSchema', () => {
  it('requires at least 2 participants', () => {
    expect(() =>
      assignSharedSchema.parse({
        productId: uuid,
        participantIds: [uuid2],
      }),
    ).toThrow();
  });

  it('accepts two participants', () => {
    const result = assignSharedSchema.parse({
      productId: uuid,
      participantIds: [uuid, uuid2],
    });
    expect(result.participantIds).toHaveLength(2);
  });
});
