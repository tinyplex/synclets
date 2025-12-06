import {getQuery, sql} from 'synclets/database';
import {describe, expect, test} from 'vitest';

describe('simple', () => {
  test('single string', () => {
    const testSql = sql`a`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['a'],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['a', []]);
  });

  test('string with single arg start-of-string', () => {
    const testSql = sql`${1}a`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['', 'a'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['$1a', [1]]);
  });

  test('string with single arg mid-string', () => {
    const testSql = sql`a${1}b`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['a', 'b'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['a$1b', [1]]);
  });

  test('string with single arg end-of-string', () => {
    expect(sql`a${1}`).toEqual({
      __brand: 'Sql',
      strings: ['a', ''],
      args: [1],
    });
  });

  test('string with multiple typed args', () => {
    const testSql = sql`a${1}b${'x'}c${true}d`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['a', 'b', 'c', 'd'],
      args: [1, 'x', true],
    });
    expect(getQuery(testSql)).toEqual(['a$1b$2c$3d', [1, 'x', true]]);
  });
});

describe('nested', () => {
  test('string with nested sql 0', () => {
    const testSql = sql`${sql``}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: [''],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['', []]);
  });

  test('string with nested sql start-of-string 1', () => {
    const testSql = sql`${sql`a`}b`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['ab'],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['ab', []]);
  });

  test('string with nested sql start-of-string 2', () => {
    const testSql = sql`${sql`a${1}`}b`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['a', 'b'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['a$1b', [1]]);
  });

  test('string with nested sql start-of-string 3', () => {
    const testSql = sql`${sql`a${1}b`}c`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['a', 'bc'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['a$1bc', [1]]);
  });

  test('string with nested sql start-of-string 4', () => {
    const testSql = sql`${sql`${1}a`}b`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['', 'ab'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['$1ab', [1]]);
  });

  test('string with nested sql mid-string 1', () => {
    const testSql = sql`a${sql`b`}c`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['abc'],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['abc', []]);
  });

  test('string with nested sql mid-string 2', () => {
    const testSql = sql`a${sql`b${1}`}c`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['ab', 'c'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['ab$1c', [1]]);
  });

  test('string with nested sql mid-string 3', () => {
    const testSql = sql`a${sql`b${1}c`}d`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['ab', 'cd'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['ab$1cd', [1]]);
  });

  test('string with nested sql mid-string 4', () => {
    const testSql = sql`a${sql`${1}b`}c`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['a', 'bc'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['a$1bc', [1]]);
  });

  test('string with nested sql end-of-string 1', () => {
    const testSql = sql`a${sql`b`}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['ab'],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['ab', []]);
  });

  test('string with nested sql end-of-string 2', () => {
    const testSql = sql`a${sql`b${1}`}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['ab', ''],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['ab$1', [1]]);
  });

  test('string with nested sql end-of-string 3', () => {
    const testSql = sql`a${sql`b${1}c`}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['ab', 'c'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['ab$1c', [1]]);
  });

  test('string with nested sql end-of-string 4', () => {
    const testSql = sql`a${sql`${1}b`}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['a', 'b'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['a$1b', [1]]);
  });
});

describe('ops', () => {
  test('$" start-of-string', () => {
    const testSql = sql`$"${'b'}c`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['"b"c'],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['"b"c', []]);
  });

  test('$" start-of-string, alias', () => {
    const testSql = sql`$ID${'b'}c`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['"b"c'],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['"b"c', []]);
  });

  test('$" mid-string', () => {
    const testSql = sql`a$"${'b'}c`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['a"b"c'],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['a"b"c', []]);
  });

  test('$" end-of-string', () => {
    const testSql = sql`a$"${'b'}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['a"b"'],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['a"b"', []]);
  });

  test('$, 0', () => {
    const testSql = sql`$,${[]}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: [''],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['', []]);
  });

  test('$, 0, alias', () => {
    const testSql = sql`$COMMAS${[]}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: [''],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['', []]);
  });

  test('$, 1', () => {
    const testSql = sql`a$,${[sql`b`]}c`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['abc'],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['abc', []]);
  });

  test('$, 2', () => {
    const testSql = sql`a$,${[sql`b`, sql`c`]}d`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['ab, cd'],
      args: [],
    });
    expect(getQuery(testSql)).toEqual(['ab, cd', []]);
  });

  test('$, 2, args 1', () => {
    const testSql = sql`a$,${[sql`b${1}`, sql`c`]}d`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['ab', ', cd'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['ab$1, cd', [1]]);
  });

  test('$, 2, args 2', () => {
    const testSql = sql`a$,${[sql`b${1}c`, sql`d`]}e`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['ab', 'c, de'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['ab$1c, de', [1]]);
  });

  test('$, 2, args 3', () => {
    const testSql = sql`a$,${[sql`${1}b`, sql`c`]}d`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['a', 'b, cd'],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['a$1b, cd', [1]]);
  });

  test('$& 1', () => {
    const testSql = sql`$&${{a: 1}}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['WHERE "a"=', ''],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['WHERE "a"=$1', [1]]);
  });

  test('$& 1, alias', () => {
    const testSql = sql`$WHERE_ALL${{a: 1}}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['WHERE "a"=', ''],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['WHERE "a"=$1', [1]]);
  });

  test('$& 2', () => {
    const testSql = sql`$&${{a: 1, b: 2}}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['WHERE "a"=', ' AND "b"=', ''],
      args: [1, 2],
    });
    expect(getQuery(testSql)).toEqual(['WHERE "a"=$1 AND "b"=$2', [1, 2]]);
  });

  test('$| 1', () => {
    const testSql = sql`$|${{a: 1}}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['WHERE "a"=', ''],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['WHERE "a"=$1', [1]]);
  });

  test('$| 1, alias', () => {
    const testSql = sql`$WHERE_ANY${{a: 1}}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['WHERE "a"=', ''],
      args: [1],
    });
    expect(getQuery(testSql)).toEqual(['WHERE "a"=$1', [1]]);
  });

  test('$| 2', () => {
    const testSql = sql`$|${{a: 1, b: 2}}`;
    expect(testSql).toEqual({
      __brand: 'Sql',
      strings: ['WHERE "a"=', ' OR "b"=', ''],
      args: [1, 2],
    });
    expect(getQuery(testSql)).toEqual(['WHERE "a"=$1 OR "b"=$2', [1, 2]]);
  });
});
