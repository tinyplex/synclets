import {createDataConnector, createMetaConnector} from '@synclets';
import {
  AnyParentAddress,
  Atom,
  AtomAddress,
  AtomsAddress,
  Timestamp,
  TimestampAddress,
  TimestampsAddress,
} from '@synclets/@types';
import type {
  Sqlite3DataConnector,
  Sqlite3MetaConnector,
} from '@synclets/@types/connector/database/sqlite3';
import {jsonString} from '@synclets/utils';
import type {Database} from 'sqlite3';
import {arrayMap, arrayNew, arrayReduce} from '../../../common/array.ts';
import {
  objFromEntries,
  objIsEqual,
  objNotEmpty,
} from '../../../common/object.ts';
import {errorNew, promiseAll, promiseNew, size} from '../../../common/other.ts';

const query = <Row>(
  database: Database,
  sql: string,
  params: any[] = [],
): Promise<Row[]> =>
  promiseNew((resolve, reject) => {
    database.all(sql, params, (error, rows: Row[]) =>
      error ? reject(error) : resolve(rows),
    );
  });

export const createSqlite3Connector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  depth: Depth,
  database: Database,
  {
    table,
    addressColumn,
    leafColumn,
  }: {
    table: string;
    addressColumn: string;
    leafColumn: string;
  },
) => {
  const tableId = `"${table}"`;
  const addressColumnId = `"${addressColumn}"`;
  const addressPartColumns = arrayMap(
    arrayNew(depth),
    (_, i) => `${addressColumn}${i + 1}`,
  );
  const addressPartColumnIds = arrayMap(
    addressPartColumns,
    (column) => `"${column}"`,
  );
  const leafColumnId = `"${leafColumn}"`;

  const safeIdentity = (value: string) => {
    return value.replaceAll('"', '\\"');
  };

  const sql = (
    parts: TemplateStringsArray,
    ...values: any[]
  ): [sql: string, params: any[]] => {
    let string = '';
    const args: any[] = [];
    parts.forEach((part, i) => {
      const value = values[i];
      if (value === undefined) {
        string += part;
      } else if (part.endsWith('$"')) {
        string += part.slice(0, -2) + `"${safeIdentity(value)}"`;
      } else if (part.endsWith('$,')) {
        string += part.slice(0, -2);
        value.forEach(([eachString, eachArgs]: [string, any[]], i: number) => {
          string += (i ? ', ' : '') + eachString;
          args.push(...eachArgs);
        });
      } else if (Array.isArray(value) && value.length == 2) {
        string += part + value[0];
        args.push(...value[1]);
      } else {
        string += part + '?';
        args.push(value);
      }
    });
    return [string, args];
  };

  const connect = async () => {
    const schema = objFromEntries(
      (
        await query<{name: string; type: string}>(
          database,
          ...sql`
          SELECT name 
          FROM pragma_table_info(${table})
          ORDER BY name
        `,
        )
      ).map(({name}) => [name, 'text']),
    );

    const targetSchema = {
      [addressColumn]: 'text',
      [leafColumn]: 'text',
      ...objFromEntries(
        arrayMap(addressPartColumns, (column) => [column, 'text']),
      ),
    };

    if (objNotEmpty(schema)) {
      if (!objIsEqual(schema, targetSchema)) {
        errorNew(`Table "${table}" needs correct schema`);
      }
    } else {
      connector.log(`Creating table "${table}"`);
      await query(database, ...sql`BEGIN`);
      await query(
        database,
        ...sql`
        CREATE TABLE $"${table} (
          $"${addressColumn} TEXT PRIMARY KEY, 
          $"${leafColumn} TEXT, 
          $,${arrayMap(
            addressPartColumns,
            (addressPartColumn) => sql`$"${addressPartColumn} TEXT`,
          )}
        )`,
      );

      let indexColumns = ``;
      await promiseAll(
        arrayMap(addressPartColumnIds, (columnId, c) => {
          indexColumns = `${indexColumns}${c ? `, ` : ``}${columnId}`;
          return query(
            database,
            `
              CREATE INDEX "${table}${c}" ON ${tableId} (${indexColumns})
            `,
          );
        }),
      );

      await query(database, ...sql`COMMIT`);
    }
  };

  const readLeaf = async (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
  ) =>
    (
      await query<{leaf: string}>(
        database,
        ...sql`
        SELECT $"${leafColumn} AS leaf FROM $"${table} 
        WHERE $"${addressColumn}=${jsonString(address)}
      `,
      )
    )[0]?.leaf;

  const writeLeaf = async (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
    leaf: Atom | Timestamp,
  ) => {
    const [columns, values] = arrayReduce(
      address,
      ([columns, values], addressPart, a) => [
        `${columns}, ${addressPartColumnIds[a]}`,
        `${values}, '${addressPart}'`,
      ],
      [
        `${addressColumnId}, ${leafColumnId}`,
        `'${jsonString(address)}', '${leaf}'`,
      ],
    );
    await query(
      database,
      `
      INSERT INTO ${tableId} 
      (${columns}) VALUES (${values})
      ON CONFLICT(${addressColumnId}) 
      DO UPDATE SET ${leafColumnId}=excluded.${leafColumnId}
    `,
    );
  };

  const removeAtom = async (address: AtomAddress<Depth>) => {
    await query(
      database,
      ...sql`
      DELETE FROM $"${table} WHERE $"${addressColumn}=${jsonString(address)}
    `,
    );
  };

  const readChildIds = async (address: AnyParentAddress<Depth>) => {
    const tableWhere = arrayReduce(
      address,
      (where, addressPart, a) =>
        `
          ${where}${a ? `AND` : `WHERE`}
          ${addressPartColumnIds[a]}='${addressPart}'
        `,
      tableId,
    );
    const rows = await query<{id: string}>(
      database,
      `
      SELECT DISTINCT ${addressPartColumnIds[size(address)]} AS id
      FROM ${tableWhere}
    `,
    );
    return arrayMap(rows, ({id}) => id);
  };

  const readLeaves = async (
    address: AtomsAddress<Depth> | TimestampsAddress<Depth>,
  ) => {
    const tableWhere = arrayReduce(
      address,
      (where, addressPart, a) =>
        `
            ${where}${a ? `AND` : `WHERE`}
            ${addressPartColumnIds[a]}='${addressPart}'
          `,
      tableId,
    );
    const rows = await query<{id: string; leaf: string}>(
      database,
      `
      SELECT 
        ${addressPartColumnIds[size(address)]} AS id, 
        ${leafColumnId} AS leaf
      FROM ${tableWhere}
    `,
    );
    return objFromEntries(arrayMap(rows, ({id, leaf}) => [id, leaf]));
  };

  const extraFunctions = {
    getDatabase: () => database,
  };

  const connector = createMeta
    ? createMetaConnector(
        depth,
        {
          connect,
          readTimestamp: readLeaf,
          writeTimestamp: writeLeaf,
          readChildIds,
        },
        {readTimestamps: readLeaves},
        extraFunctions,
      )
    : createDataConnector(
        depth,
        {
          connect,
          readAtom: readLeaf,
          writeAtom: writeLeaf,
          removeAtom,
          readChildIds,
        },
        {readAtoms: readLeaves},
        extraFunctions,
      );

  return connector as CreateMeta extends true
    ? Sqlite3MetaConnector<Depth>
    : Sqlite3DataConnector<Depth>;
};
