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
import type {Sql} from '@synclets/@types/connector/database';
import type {
  Sqlite3DataConnector,
  Sqlite3MetaConnector,
} from '@synclets/@types/connector/database/sqlite3';
import {jsonString} from '@synclets/utils';
import type {Database} from 'sqlite3';
import {arrayMap, arrayNew, arraySlice} from '../../../common/array.ts';
import {
  objFromEntries,
  objIsEqual,
  objNotEmpty,
} from '../../../common/object.ts';
import {errorNew, promiseAll, promiseNew, size} from '../../../common/other.ts';
import {getQuery, sql} from '../index.ts';

const query = <Row>(database: Database, sql: Sql): Promise<Row[]> =>
  promiseNew((resolve, reject) => {
    database.all(...getQuery(sql), (error, rows: Row[]) =>
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
  const addressPartColumns = arrayMap(
    arrayNew(depth),
    (_, i) => `${addressColumn}${i + 1}`,
  );

  const connect = async () => {
    const schema = objFromEntries(
      (
        await query<{name: string; type: string}>(
          database,
          sql`
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
      await query(
        database,
        sql`
        CREATE TABLE $"${table} (
          $"${addressColumn} TEXT PRIMARY KEY, 
          $"${leafColumn} TEXT, 
          $,${arrayMap(
            addressPartColumns,
            (addressPartColumn) => sql`$"${addressPartColumn} TEXT`,
          )}
        )`,
      );

      await promiseAll(
        arrayMap(addressPartColumns, (_, c) =>
          query(
            database,
            sql`
              CREATE INDEX $"${table + c} ON $"${table} ($,${arrayMap(
                arraySlice(addressPartColumns, 0, c + 1),
                (addressPartColumn) => sql`$"${addressPartColumn}`,
              )})`,
          ),
        ),
      );
    }
  };

  const readLeaf = async (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
  ) =>
    (
      await query<{leaf: string}>(
        database,
        sql`
        SELECT $"${leafColumn} AS leaf FROM $"${table} 
        $&${{[addressColumn]: jsonString(address)}}
      `,
      )
    )[0]?.leaf;

  const writeLeaf = async (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
    leaf: Atom | Timestamp,
  ) => {
    await query(
      database,
      sql`
        INSERT INTO $"${table} 
        (
          $"${addressColumn}, $"${leafColumn}, 
          $,${arrayMap(address, (_, a) => sql`$"${addressPartColumns[a]}`)}
        ) VALUES (
          ${jsonString(address)}, ${leaf},
          $,${arrayMap(address, (addressPart) => sql`${addressPart}`)}
        ) 
        ON CONFLICT($"${addressColumn}) 
        DO UPDATE SET $"${leafColumn}=excluded.$"${leafColumn}
      `,
    );
  };

  const removeAtom = async (address: AtomAddress<Depth>) => {
    await query(
      database,
      sql`
        DELETE FROM $"${table} $&${{[addressColumn]: jsonString(address)}}
      `,
    );
  };

  const readChildIds = async (address: AnyParentAddress<Depth>) =>
    arrayMap(
      await query<{id: string}>(
        database,
        sql`
          SELECT DISTINCT $"${addressPartColumns[size(address)]} AS id
          FROM $"${table}
          $&${objFromEntries(
            arrayMap(address, (addressPart, a) => [
              addressPartColumns[a],
              addressPart,
            ]),
          )}
        `,
      ),
      ({id}) => id,
    );

  const readLeaves = async (
    address: AtomsAddress<Depth> | TimestampsAddress<Depth>,
  ) =>
    objFromEntries(
      arrayMap(
        await query<{id: string; leaf: string}>(
          database,
          sql`
            SELECT 
              $"${addressPartColumns[size(address)]} AS id, 
              $"${leafColumn} AS leaf
            FROM $"${table}
            $&${objFromEntries(
              arrayMap(address, (addressPart, a) => [
                addressPartColumns[a],
                addressPart,
              ]),
            )}
          `,
        ),
        ({id, leaf}) => [id, leaf],
      ),
    );

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
