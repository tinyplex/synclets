import type {PGlite} from '@electric-sql/pglite';
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
import {Sql} from '@synclets/@types/connector/database';
import type {
  PgliteDataConnector,
  PgliteMetaConnector,
} from '@synclets/@types/connector/database/pglite';
import {jsonString} from '@synclets/utils';
import {arrayMap, arrayNew, arraySlice} from '../../../common/array.ts';
import {
  objFromEntries,
  objIsEqual,
  objNotEmpty,
} from '../../../common/object.ts';
import {errorNew, promiseAll, size} from '../../../common/other.ts';
import {getQuery, sql} from '../index.ts';

const query = async <Row>(pglite: PGlite, sql: Sql): Promise<Row[]> =>
  (await pglite.query<Row>(...getQuery(sql))).rows;

export const createPgliteConnector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  depth: Depth,
  pglite: PGlite,
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
          pglite,
          sql`
            SELECT column_name AS name, data_type AS type 
            FROM information_schema.columns 
            WHERE table_name=${table} 
            ORDER BY column_name
          `,
        )
      ).map(({name, type}) => [name, type]),
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
        pglite,
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
            pglite,
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
        pglite,
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
      pglite,
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
      pglite,
      sql`
        DELETE FROM $"${table} $&${{[addressColumn]: jsonString(address)}}
      `,
    );
  };

  const readChildIds = async (address: AnyParentAddress<Depth>) =>
    arrayMap(
      await query<{id: string}>(
        pglite,
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
          pglite,
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
    getPglite: () => pglite,
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
    ? PgliteMetaConnector<Depth>
    : PgliteDataConnector<Depth>;
};
