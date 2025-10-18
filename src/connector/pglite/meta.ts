import type {PGlite, Transaction} from '@electric-sql/pglite';
import {identifier, raw} from '@electric-sql/pglite/template';
import {createMetaConnector} from '@synclets';
import {AnyParentAddress, AtomAddress, Timestamp} from '@synclets/@types';
import type {
  createPgliteMetaConnector as createPgliteMetaConnectorDecl,
  PgliteMetaConnector,
} from '@synclets/@types/connector/pglite';
import {
  arrayJoin,
  arrayMap,
  arrayNew,
  arrayPop,
  arrayPush,
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

  const connect = async () => {
    const {rows: columnSchema}: {rows: Array<{name: string; type: string}>} =
      await pglite.sql`SELECT column_name AS name, data_type AS type FROM information_schema.columns WHERE table_name=${table} ORDER BY column_name`;

    if (isEmpty(columnSchema)) {
      metaConnector.log(`Creating table ${escapedTable.str}`);

      await pglite.transaction(async (tx: Transaction) => {
        const columns = arrayMap(arrayNew(depth), (_, i) => `address${i + 1}`);
        const createColumns =
          'address TEXT PRIMARY KEY, ' +
          arrayJoin(arrayMap(columns, (column) => `${column} TEXT, `)) +
          'timestamp TEXT';
        await tx.sql`CREATE TABLE ${escapedTable} (${raw`${createColumns}`});`;

        const indexColumns: string[] = [];
        await promiseAll(
          arrayMap(columns, (column, c) => {
            arrayPush(indexColumns, column);
            return tx.sql`CREATE INDEX ${raw`index${c + 1}`} ON ${escapedTable} (${raw`${indexColumns.join(', ')}`})`;
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

  const readTimestamp = async (address: AtomAddress<Depth>) => {
    return '';
  };

  const writeTimestamp = async (
    address: AtomAddress<Depth>,
    timestamp: Timestamp,
  ) => {};

  const readChildIds = async (address: AnyParentAddress<Depth>) => {
    return [];
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
