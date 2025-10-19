import type {PGlite, Transaction} from '@electric-sql/pglite';
import {identifier, raw, sql} from '@electric-sql/pglite/template';
import {createMetaConnector} from '@synclets';
import {AnyParentAddress, AtomAddress, Timestamp} from '@synclets/@types';
import type {
  createPgliteMetaConnector as createPgliteMetaConnectorDecl,
  PgliteMetaConnector,
} from '@synclets/@types/connector/pglite';
import {jsonString} from '@synclets/utils';
import {
  arrayMap,
  arrayNew,
  arrayPop,
  arrayReduce,
  arrayShift,
  arraySome,
} from '../../common/array.ts';
import {objFreeze} from '../../common/object.ts';
import {errorNew, isEmpty, promiseAll, size} from '../../common/other.ts';

type Options = {
  tableName?: string;
  addressColumnPrefix?: string;
};

export const createPgliteMetaConnector: typeof createPgliteMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  pglite: PGlite,
  table: string,
): PgliteMetaConnector<Depth> => {
  const defaultOptions = {
    tableName: table,
    addressColumnName: 'address',
    timestampColumnName: 'timestamp',
  };

  const {tableName, addressColumnName, timestampColumnName} = {
    ...defaultOptions,
  };

  const tableId = identifier`${tableName}`;
  const addressColumnId = identifier`${addressColumnName}`;
  const addressPartColumnIds = arrayMap(
    arrayNew(depth),
    (_, i) => identifier`${addressColumnName}${i + 1}`,
  );
  const timestampColumnId = identifier`${timestampColumnName}`;

  const connect = async () => {
    const {rows: columnSchema} = await pglite.sql<{name: string; type: string}>`
      SELECT column_name AS name, data_type AS type 
      FROM information_schema.columns 
      WHERE table_name=${tableName} 
      ORDER BY column_name
    `;

    if (isEmpty(columnSchema)) {
      metaConnector.log(`Creating table ${tableId.str}`);

      await pglite.transaction(async (tx: Transaction) => {
        const createColumns = arrayReduce(
          addressPartColumnIds,
          (createColumns, addressPartColumnId) =>
            sql`${createColumns}, ${addressPartColumnId} TEXT`,
          sql`${addressColumnId} TEXT PRIMARY KEY, ${timestampColumnId} TEXT`,
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
    } else if (
      size(columnSchema) != depth + 2 ||
      arraySome(columnSchema, ({type}) => type != 'text') ||
      arrayShift(columnSchema)?.name != 'address' ||
      arrayPop(columnSchema)?.name != 'timestamp' ||
      arraySome(columnSchema, ({name}, c) => name != `address${c + 1}`)
    ) {
      errorNew(`Table ${tableId.str} needs correct schema`);
    }
  };

  const readTimestamp = async (address: AtomAddress<Depth>) =>
    (
      await pglite.sql<{timestamp: string}>`
        SELECT ${timestampColumnId} as timestamp FROM ${tableId} 
        WHERE ${addressColumnId}=${jsonString(address)}
      `
    ).rows[0]?.timestamp;

  const writeTimestamp = async (
    address: AtomAddress<Depth>,
    timestamp: Timestamp,
  ) => {
    const [columns, values] = arrayReduce(
      address,
      ([columns, values], addressPart, a) => [
        sql`${columns}, ${addressPartColumnIds[a]}`,
        sql`${values}, ${addressPart}`,
      ],
      [
        sql`${addressColumnId}, ${timestampColumnId}`,
        sql`${jsonString(address)}, ${timestamp}`,
      ],
    );
    await pglite.sql`
      INSERT INTO ${tableId} 
      (${columns}) VALUES (${values})
      ON CONFLICT(${addressColumnId}) 
      DO UPDATE SET ${timestampColumnId}=excluded.${timestampColumnId}
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

  const metaConnector = createMetaConnector(depth, {
    connect,
    readTimestamp,
    writeTimestamp,
    readChildIds,
  });

  const getPglite = () => pglite;

  return objFreeze({
    ...metaConnector,
    getPglite,
  });
};
