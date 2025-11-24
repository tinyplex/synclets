import {arrayForEach, arraySome} from '../../common/array.ts';
import {isObject, objKeys} from '../../common/object.ts';
import {isEmpty, size} from '../../common/other.ts';

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

const concatOp =
  (separator: string, where?: 1) =>
  (value: Sql[]): Sql =>
    asSql(
      (where && !isEmpty(value) ? 'WHERE ' : '') +
        value.map(({string}) => string).join(separator),
      value.map(({params}) => params).flat(),
    );

const ops: {[operator: string]: (value: any) => Sql} = {
  // quote identifier
  '$"': (value: string): Sql => asSql(`"${value.replaceAll('"', '\\"')}"`),
  // concatenate Sql objects with comma
  '$,': concatOp(','),
  // WHERE Sql objects with AND
  '$&': concatOp(' AND ', 1),
  // WHERE Sql objects with OR
  '$|': concatOp(' OR ', 1),
  // raw value insertion
  '$!': (value: string): Sql => asSql(value),
};

const asSql = (string: string, params: any[] = []): Sql => ({
  __brand: 'Sql',
  string,
  params,
});

const isSql = (value: any): value is Sql =>
  isObject(value) && value.__brand === 'Sql';
