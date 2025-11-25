import type {PGlite, Transaction} from '@electric-sql/pglite';
import {identifier, raw, sql as sqlO} from '@electric-sql/pglite/template';
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
import {arrayMap, arrayNew, arrayReduce} from '../../../common/array.ts';
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
  const tableId = identifier`${table}`;
  const addressColumnId = identifier`${addressColumn}`;
  const addressPartColumns = arrayMap(
    arrayNew(depth),
    (_, i) => `${addressColumn}${i + 1}`,
  );
  const addressPartColumnIds = arrayMap(
    addressPartColumns,
    (column) => identifier`${column}`,
  );
  const leafColumnId = identifier`${leafColumn}`;

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
        errorNew(`Table ${tableId.str} needs correct schema`);
      }
    } else {
      connector.log(`Creating table ${tableId.str}`);
      await pglite.transaction(async (tx: Transaction) => {
        const createColumns = arrayReduce(
          addressPartColumnIds,
          (createColumns, addressPartColumnId) =>
            sqlO`${createColumns}, ${addressPartColumnId} TEXT`,
          sqlO`${addressColumnId} TEXT PRIMARY KEY, ${leafColumnId} TEXT`,
        );
        await tx.sql`
          CREATE TABLE ${tableId} (${createColumns})
        `;

        let indexColumns = sqlO``;
        await promiseAll(
          arrayMap(addressPartColumnIds, (column, c) => {
            indexColumns = sqlO`${indexColumns}${c ? raw`, ` : raw``}${column}`;
            return tx.sql`
              CREATE INDEX ON ${tableId} (${indexColumns})
            `;
          }),
        );
      });
    }
  };

  const readLeaf = async (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
  ) =>
    (
      await pglite.sql<{leaf: string}>`
        SELECT ${leafColumnId} AS leaf FROM ${tableId} 
        WHERE ${addressColumnId}=${jsonString(address)}
      `
    ).rows[0]?.leaf;

  const writeLeaf = async (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
    leaf: Atom | Timestamp,
  ) => {
    const [columns, values] = arrayReduce(
      address,
      ([columns, values], addressPart, a) => [
        sqlO`${columns}, ${addressPartColumnIds[a]}`,
        sqlO`${values}, ${addressPart}`,
      ],
      [
        sqlO`${addressColumnId}, ${leafColumnId}`,
        sqlO`${jsonString(address)}, ${leaf}`,
      ],
    );
    await pglite.sql`
      INSERT INTO ${tableId} 
      (${columns}) VALUES (${values})
      ON CONFLICT(${addressColumnId}) 
      DO UPDATE SET ${leafColumnId}=excluded.${leafColumnId}
    `;
  };

  const removeAtom = async (address: AtomAddress<Depth>) => {
    await pglite.sql`
      DELETE FROM ${tableId} WHERE ${addressColumnId}=${jsonString(address)}
    `;
  };

  const readChildIds = async (address: AnyParentAddress<Depth>) => {
    const tableWhere = arrayReduce(
      address,
      (where, addressPart, a) =>
        sqlO`
          ${where}${a ? raw`AND` : raw`WHERE`}
          ${addressPartColumnIds[a]}=${addressPart}
        `,
      sqlO`${tableId}`,
    );
    const {rows} = await pglite.sql<{id: string}>`
      SELECT DISTINCT ${addressPartColumnIds[size(address)]} AS id
      FROM ${tableWhere}
    `;
    return arrayMap(rows, ({id}) => id);
  };

  const readLeaves = async (
    address: AtomsAddress<Depth> | TimestampsAddress<Depth>,
  ) => {
    const tableWhere = arrayReduce(
      address,
      (where, addressPart, a) =>
        sqlO`
            ${where}${a ? raw`AND` : raw`WHERE`}
            ${addressPartColumnIds[a]}=${addressPart}
          `,
      sqlO`${tableId}`,
    );
    const {rows} = await pglite.sql<{id: string; leaf: string}>`
      SELECT 
        ${addressPartColumnIds[size(address)]} AS id, 
        ${leafColumnId} AS leaf
      FROM ${tableWhere}
    `;
    return objFromEntries(arrayMap(rows, ({id, leaf}) => [id, leaf]));
  };

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
