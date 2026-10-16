import { describe, expect, it } from 'vitest';
import { toCsv } from './export';

describe('toCsv', () => {
  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('');
  });
  it('escapes commas and double quotes safely', () => {
    expect(toCsv([{ title: 'Read, "slowly"', done: true }])).toBe('"title","done"\r\n"Read, ""slowly""","true"');
  });
  it('keeps columns from all records', () => {
    expect(toCsv([{ a: 1 }, { b: 2 }])).toBe('"a","b"\r\n"1",""\r\n"","2"');
  });
});
