import type {PGlite, Transaction} from '@electric-sql/pglite';
import {identifier, raw, sql} from '@electric-sql/pglite/template';
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
import {
  PgliteDataConnector,
  PgliteMetaConnector,
} from '@synclets/@types/connector/pglite';
import {jsonString} from '@synclets/utils';
import {arrayMap, arrayNew, arrayReduce} from '../../common/array.ts';
import {
  objFreeze,
  objFromEntries,
  objIsEqual,
  objNotEmpty,
} from '../../common/object.ts';
import {errorNew, promiseAll, size} from '../../common/other.ts';

type Leaf = Atom | Timestamp;
type LeafAddress<Depth extends number> =
  | AtomAddress<Depth>
  | TimestampAddress<Depth>;
type LeavesAddress<Depth extends number> =
  | AtomsAddress<Depth>
  | TimestampsAddress<Depth>;

export const createPgliteConnector = <
  Depth extends number,
  IsMeta extends boolean,
>(
  isMeta: IsMeta,
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
): IsMeta extends true
  ? PgliteMetaConnector<Depth>
  : PgliteDataConnector<Depth> => {
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
        await pglite.sql<{name: string; type: string}>`
          SELECT column_name AS name, data_type AS type 
          FROM information_schema.columns 
          WHERE table_name=${table} 
          ORDER BY column_name
        `
      ).rows.map(({name, type}) => [name, type]),
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
            sql`${createColumns}, ${addressPartColumnId} TEXT`,
          sql`${addressColumnId} TEXT PRIMARY KEY, ${leafColumnId} TEXT`,
        );
        await tx.sql`
          CREATE TABLE ${tableId} (${createColumns})
        `;

        let indexColumns = sql``;
        await promiseAll(
          arrayMap(addressPartColumnIds, (column, c) => {
            indexColumns = sql`${indexColumns}${c ? raw`, ` : raw``}${column}`;
            return tx.sql`
              CREATE INDEX ON ${tableId} (${indexColumns})
            `;
          }),
        );
      });
    }
  };

  const readLeaf = async (address: LeafAddress<Depth>) =>
    (
      await pglite.sql<{leaf: string}>`
        SELECT ${leafColumnId} AS leaf FROM ${tableId} 
        WHERE ${addressColumnId}=${jsonString(address)}
      `
    ).rows[0]?.leaf;

  const writeLeaf = async (address: LeafAddress<Depth>, leaf: Leaf) => {
    const [columns, values] = arrayReduce(
      address,
      ([columns, values], addressPart, a) => [
        sql`${columns}, ${addressPartColumnIds[a]}`,
        sql`${values}, ${addressPart}`,
      ],
      [
        sql`${addressColumnId}, ${leafColumnId}`,
        sql`${jsonString(address)}, ${leaf}`,
      ],
    );
    await pglite.sql`
      INSERT INTO ${tableId} 
      (${columns}) VALUES (${values})
      ON CONFLICT(${addressColumnId}) 
      DO UPDATE SET ${leafColumnId}=excluded.${leafColumnId}
    `;
  };

  const removeLeaf = async (address: LeafAddress<Depth>) => {
    await pglite.sql`
      DELETE FROM ${tableId} WHERE ${addressColumnId}=${jsonString(address)}
    `;
  };

  const readChildIds = async (address: AnyParentAddress<Depth>) => {
    const tableWhere = arrayReduce(
      address,
      (where, addressPart, a) =>
        sql`
          ${where}${a ? raw`AND` : raw`WHERE`}
          ${addressPartColumnIds[a]}=${addressPart}
        `,
      sql`${tableId}`,
    );
    const {rows} = await pglite.sql<{id: string}>`
      SELECT DISTINCT ${addressPartColumnIds[size(address)]} AS id
      FROM ${tableWhere}
    `;
    return arrayMap(rows, ({id}) => id);
  };

  const readLeaves = async (address: LeavesAddress<Depth>) => {
    const tableWhere = arrayReduce(
      address,
      (where, addressPart, a) =>
        sql`
            ${where}${a ? raw`AND` : raw`WHERE`}
            ${addressPartColumnIds[a]}=${addressPart}
          `,
      sql`${tableId}`,
    );
    const {rows} = await pglite.sql<{id: string; leaf: string}>`
      SELECT 
        ${addressPartColumnIds[size(address)]} AS id, 
        ${leafColumnId} AS leaf
      FROM ${tableWhere}
    `;
    return objFromEntries(arrayMap(rows, ({id, leaf}) => [id, leaf]));
  };

  const connector = isMeta
    ? createMetaConnector(
        depth,
        {
          connect,
          readTimestamp: readLeaf,
          writeTimestamp: writeLeaf,
          readChildIds,
        },
        {readTimestamps: readLeaves},
      )
    : createDataConnector(
        depth,
        {
          connect,
          readAtom: readLeaf,
          writeAtom: writeLeaf,
          removeAtom: removeLeaf,
          readChildIds,
        },
        {readAtoms: readLeaves},
      );

  const getPglite = () => pglite;

  return objFreeze({
    ...connector,
    getPglite,
  }) as IsMeta extends true
    ? PgliteMetaConnector<Depth>
    : PgliteDataConnector<Depth>;
};
