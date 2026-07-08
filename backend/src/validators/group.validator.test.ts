import { describe, expect, it } from 'vitest';
import { createGroupSchema, updateGroupSchema } from './group.validator';

describe('createGroupSchema', () => {
  it('accepts valid name', () => {
    const result = createGroupSchema.parse({ name: 'Amigos' });
    expect(result.name).toBe('Amigos');
  });

  it('rejects empty name', () => {
    expect(() => createGroupSchema.parse({ name: '' })).toThrow();
  });

  it('rejects name longer than 100', () => {
    expect(() => createGroupSchema.parse({ name: 'a'.repeat(101) })).toThrow();
  });

  it('trims name', () => {
    const result = createGroupSchema.parse({ name: '  Casa  ' });
    expect(result.name).toBe('Casa');
  });

  it('accepts optional participantIds', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const result = createGroupSchema.parse({ name: 'Amigos', participantIds: [id] });
    expect(result.participantIds).toEqual([id]);
  });

  it('defaults participantIds to empty array', () => {
    const result = createGroupSchema.parse({ name: 'Amigos' });
    expect(result.participantIds).toEqual([]);
  });
});

describe('updateGroupSchema', () => {
  it('requires at least one field', () => {
    expect(() => updateGroupSchema.parse({})).toThrow();
  });

  it('accepts name only', () => {
    const result = updateGroupSchema.parse({ name: 'Nuevo' });
    expect(result.name).toBe('Nuevo');
  });

  it('accepts participantIds only', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const result = updateGroupSchema.parse({ participantIds: [id] });
    expect(result.participantIds).toEqual([id]);
  });
});
