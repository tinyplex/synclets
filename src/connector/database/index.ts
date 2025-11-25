import {Sql} from '@synclets/@types/connector/database';
import {
  arrayForEach,
  arrayJoin,
  arrayMap,
  arrayNew,
  arrayPop,
  arrayShift,
  arraySome,
} from '../../common/array.ts';
import {
  isObject,
  objEntries,
  objKeys,
  objNotEmpty,
} from '../../common/object.ts';
import {isEmpty, size} from '../../common/other.ts';
import {strEndsWith, strReplaceAll, strSub} from '../../common/string.ts';

export const sql = (
  templateStringsArray: TemplateStringsArray | string[],
  ...expressions: any[]
): Sql => {
  const templateStrings = [...templateStringsArray];

  const strings: string[] = [];
  const args: any[] = [];
  let tail = '';

  while (!isEmpty(templateStrings) || tail) {
    let templateString = tail + (arrayShift(templateStrings) ?? '');
    let expression = arrayShift(expressions);
    tail = '';

    arraySome(objKeys(ops), (op) => {
      if (strEndsWith(templateString, op)) {
        templateString = strSub(templateString, 0, -op.length);
        expression = ops[op](expression);
        return 1;
      }
    });

    if (isSql(expression)) {
      const {strings: innerStrings, args: innerParams} = expression;
      templateString += arrayShift(innerStrings) ?? '';
      if (isEmpty(innerStrings)) {
        tail = templateString;
      } else {
        tail = arrayPop(innerStrings)!;
        strings.push(templateString, ...innerStrings);
        args.push(...innerParams);
      }
    } else {
      strings.push(templateString);
      if (expression !== undefined) {
        args.push(expression);
      }
    }
  }

  return asSql(strings, args);
};

export const getQuery = ({strings, args}: Sql): [string, any[]] => [
  arrayJoin(
    arrayMap(strings, (string, s) => (s > 0 ? '$' + s : '') + string),
    '',
  ),
  args,
];

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
  (expressions: Sql[]): Sql =>
    isEmpty(expressions)
      ? sql``
      : sql(
          ['', ...arrayNew(size(expressions) - 1, separator), ''],
          ...expressions,
        );

const ops: {[op: string]: (expression: any) => Sql} = {
  '$"': (expression: string): Sql =>
    asSql([`"${strReplaceAll(expression, '"', '\\"')}"`]),
  '$,': getConcatOp(', '),
  '$&': getWhereOp(' AND '),
  '$|': getWhereOp(' OR '),
};
arrayForEach(
  [
    ['$ID', '$"'],
    ['$COMMAS', '$,'],
    ['$WHERE_ALL', '$&'],
    ['$WHERE_ANY', '$|'],
  ],
  ([alias, op]) => (ops[alias] = ops[op]),
);

const asSql = (strings: string[], args: any[] = []): Sql => ({
  __brand: 'Sql',
  strings,
  args,
});

const isSql = (expression: any): expression is Sql =>
  isObject(expression) && expression.__brand === 'Sql';
