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
  arrayJoin,
  arrayMap,
  arrayNew,
  arrayPop,
  arrayPush,
  arrayReduce,
  arrayShift,
  arraySome,
} from '../../common/array.ts';
import {objFreeze} from '../../common/object.ts';
import {errorNew, isEmpty, promiseAll, size} from '../../common/other.ts';

export const createPgliteMetaConnector: typeof createPgliteMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  pglite: PGlite,
  table: string,
): PgliteMetaConnector<Depth> => {
  const escapedTable = identifier`${table}`;
  const columns = arrayMap(arrayNew(depth), (_, i) => `address${i + 1}`);

  const connect = async () => {
    const {rows: columnSchema} = await pglite.sql<{name: string; type: string}>`
      SELECT column_name AS name, data_type AS type 
      FROM information_schema.columns 
      WHERE table_name=${table} 
      ORDER BY column_name
    `;

    if (isEmpty(columnSchema)) {
      metaConnector.log(`Creating table ${escapedTable.str}`);

      await pglite.transaction(async (tx: Transaction) => {
        const createColumns =
          'address TEXT PRIMARY KEY, ' +
          arrayJoin(arrayMap(columns, (column) => `${column} TEXT, `)) +
          'timestamp TEXT';
        await tx.sql`
          CREATE TABLE ${escapedTable} (${raw`${createColumns}`})
        `;

        const indexColumns: string[] = [];
        await promiseAll(
          arrayMap(columns, (column, c) => {
            arrayPush(indexColumns, column);
            return tx.sql`
              CREATE INDEX ON ${escapedTable} 
              (${raw`${indexColumns.join(', ')}`})
            `;
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
      errorNew(`Table ${escapedTable.str} needs correct schema`);
    }
  };

  const readTimestamp = async (address: AtomAddress<Depth>) =>
    (
      await pglite.sql<{timestamp: string}>`
        SELECT timestamp FROM ${escapedTable} 
        WHERE address=${jsonString(address)}
      `
    ).rows[0]?.timestamp;

  const writeTimestamp = async (
    address: AtomAddress<Depth>,
    timestamp: Timestamp,
  ) => {
    const [columns, values] = arrayReduce(
      address,
      ([columns, values], addressPart, a) => [
        `${columns}, address${a + 1}`,
        sql`${values}, ${addressPart}`,
      ],
      ['address, timestamp', sql`${jsonString(address)}, ${timestamp}`],
    );
    await pglite.sql`
      INSERT INTO ${escapedTable} 
      (${raw`${columns}`}) 
      VALUES (${values})
      ON CONFLICT(address) 
      DO UPDATE SET timestamp=excluded.timestamp
    `;
  };

  const readChildIds = async (address: AnyParentAddress<Depth>) => {
    const where = arrayReduce(
      address,
      (where, addressPart, a) =>
        sql`${where} AND address${raw`${a + 1}`}=${sql`${addressPart}`}`,
      sql`1=1`,
    );

    const {rows} = await pglite.sql<{id: string}>`
      SELECT DISTINCT ${raw`address${size(address) + 1}`} AS id 
      FROM ${escapedTable} 
      WHERE ${where}
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
