import {arrayForEach, arrayMap, arraySome} from '../../common/array.ts';
import {
  isObject,
  objEntries,
  objKeys,
  objNotEmpty,
} from '../../common/object.ts';
import {size} from '../../common/other.ts';

export type Sql = {__brand: 'Sql'; string: string; params: any[]};

export const sql = (parts: TemplateStringsArray, ...values: any[]): Sql => {
  let string = '';
  const params: any[] = [];

  arrayForEach(parts, (part, i) => {
    const value = values[i];
    if (value === undefined) {
      string += part;
    } else if (
      !arraySome(objKeys(ops), (op) => {
        if (part.endsWith(op)) {
          const {string: newString, params: newParams} = ops[op](value);
          string += part.slice(0, -size(op)) + newString;
          params.push(...newParams);
          return 1;
        }
      })
    ) {
      if (isSql(value)) {
        string += part + value.string;
        params.push(...value.params);
      } else {
        string += part + '?';
        params.push(value);
      }
    }
  });

  return asSql(string, params);
};

const getWhereOp = (separator: string) => {
  const concatOp = getConcatOp(separator);
  return (values: {[key: string]: any}): Sql =>
    objNotEmpty(values)
      ? sql`WHERE ${concatOp(
          arrayMap(
            objEntries(values),
            ([key, value]) => sql`$"${key}=${value}`,
          ),
        )}`
      : sql``;
};

const getConcatOp =
  (separator: string) =>
  (value: Sql[]): Sql =>
    asSql(
      value.map(({string}) => string).join(separator),
      value.map(({params}) => params).flat(),
    );

const ops: {[operator: string]: (value: any) => Sql} = {
  // quote identifier
  '$"': (value: string): Sql => asSql(`"${value.replaceAll('"', '\\"')}"`),
  // concatenate Sql objects with comma
  '$,': getConcatOp(', '),
  // raw value insertion
  '$!': (value: string): Sql => asSql(value),
  // WHERE object fields with AND
  '?&': getWhereOp(' AND '),
  // WHERE object fields with OR
  '?|': getWhereOp(' OR '),
};

const asSql = (string: string, params: any[] = []): Sql => ({
  __brand: 'Sql',
  string,
  params,
});

const isSql = (value: any): value is Sql =>
  isObject(value) && value.__brand === 'Sql';
