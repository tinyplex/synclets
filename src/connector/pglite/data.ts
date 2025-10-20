import type {PGlite, Transaction} from '@electric-sql/pglite';
import {identifier, raw, sql} from '@electric-sql/pglite/template';
import {createDataConnector} from '@synclets';
import {
  AnyParentAddress,
  Atom,
  AtomAddress,
  AtomsAddress,
} from '@synclets/@types';
import type {
  createPgliteDataConnector as createPgliteDataConnectorDecl,
  DatabaseDataOptions,
  PgliteDataConnector,
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

export const createPgliteDataConnector: typeof createPgliteDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  pglite: PGlite,
  {
    table = 'data',
    addressColumn = 'address',
    atomColumn = 'atom',
  }: DatabaseDataOptions = {},
): PgliteDataConnector<Depth> => {
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
  const atomColumnId = identifier`${atomColumn}`;

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
      [atomColumn]: 'text',
      ...objFromEntries(
        arrayMap(addressPartColumns, (column) => [column, 'text']),
      ),
    };

    if (objNotEmpty(schema)) {
      if (!objIsEqual(schema, targetSchema)) {
        errorNew(`Table ${tableId.str} needs correct schema`);
      }
    } else {
      dataConnector.log(`Creating table ${tableId.str}`);
      await pglite.transaction(async (tx: Transaction) => {
        const createColumns = arrayReduce(
          addressPartColumnIds,
          (createColumns, addressPartColumnId) =>
            sql`${createColumns}, ${addressPartColumnId} TEXT`,
          sql`${addressColumnId} TEXT PRIMARY KEY, ${atomColumnId} TEXT`,
        );
        await tx.sql`CREATE TABLE ${tableId} (${createColumns})`;

        let indexColumns = sql``;
        await promiseAll(
          arrayMap(addressPartColumnIds, (column, c) => {
            indexColumns = sql`${indexColumns}${c ? raw`, ` : raw``}${column}`;
            return tx.sql`CREATE INDEX ON ${tableId} (${indexColumns})`;
          }),
        );
      });
    }
  };

  const readAtom = async (address: AtomAddress<Depth>) =>
    (
      await pglite.sql<{atom: string}>`
        SELECT ${atomColumnId} AS atom FROM ${tableId} 
        WHERE ${addressColumnId}=${jsonString(address)}
      `
    ).rows[0]?.atom;

  const writeAtom = async (address: AtomAddress<Depth>, atom: Atom) => {
    const [columns, values] = arrayReduce(
      address,
      ([columns, values], addressPart, a) => [
        sql`${columns}, ${addressPartColumnIds[a]}`,
        sql`${values}, ${addressPart}`,
      ],
      [
        sql`${addressColumnId}, ${atomColumnId}`,
        sql`${jsonString(address)}, ${atom}`,
      ],
    );
    await pglite.sql`
      INSERT INTO ${tableId} 
      (${columns}) VALUES (${values})
      ON CONFLICT(${addressColumnId}) 
      DO UPDATE SET ${atomColumnId}=excluded.${atomColumnId}
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

  const readAtoms = async (address: AtomsAddress<Depth>) => {
    const tableWhere = arrayReduce(
      address,
      (where, addressPart, a) =>
        sql`
            ${where}${a ? raw`AND` : raw`WHERE`}
            ${addressPartColumnIds[a]}=${addressPart}
          `,
      sql`${tableId}`,
    );
    const {rows} = await pglite.sql<{id: string; atom: string}>`
        SELECT 
          ${addressPartColumnIds[size(address)]} AS id, 
          ${atomColumnId} AS atom
        FROM ${tableWhere}
      `;
    return objFromEntries(arrayMap(rows, ({id, atom}) => [id, atom]));
  };

  const dataConnector = createDataConnector(
    depth,
    {
      connect,
      readAtom,
      writeAtom,
      removeAtom,
      readChildIds,
    },
    {readAtoms},
  );

  const getPglite = () => pglite;

  return objFreeze({
    ...dataConnector,
    getPglite,
  });
};
