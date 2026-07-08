import { describe, expect, it } from 'vitest';
import {
  createParticipantSchema,
  updateParticipantSchema,
} from './participant.validator';

describe('createParticipantSchema', () => {
  it('accepts name only', () => {
    const result = createParticipantSchema.parse({ name: 'Ana' });
    expect(result.name).toBe('Ana');
    expect(result.photoUrl).toBeNull();
  });

  it('accepts photoUrl only', () => {
    const result = createParticipantSchema.parse({
      photoUrl: 'https://cdn.example.com/a.jpg',
    });
    expect(result.name).toBeNull();
    expect(result.photoUrl).toBe('https://cdn.example.com/a.jpg');
  });

  it('accepts uploaded photo path', () => {
    const result = createParticipantSchema.parse({
      photoUrl: '/uploads/participants/abc.jpg',
    });
    expect(result.photoUrl).toBe('/uploads/participants/abc.jpg');
  });

  it('rejects when both missing', () => {
    expect(() => createParticipantSchema.parse({})).toThrow();
  });

  it('rejects blank name without photo', () => {
    expect(() => createParticipantSchema.parse({ name: '   ' })).toThrow();
  });
});

describe('updateParticipantSchema', () => {
  it('requires at least one field', () => {
    expect(() => updateParticipantSchema.parse({})).toThrow();
  });

  it('accepts name update', () => {
    const result = updateParticipantSchema.parse({ name: 'Luis' });
    expect(result.name).toBe('Luis');
  });
});
