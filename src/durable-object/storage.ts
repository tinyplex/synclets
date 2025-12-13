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
import {Sql} from '@synclets/@types/database';
import type {
  createDurableObjectStorageDataConnector as createDurableObjectStorageDataConnectorDecl,
  createDurableObjectStorageMetaConnector as createDurableObjectStorageMetaConnectorDecl,
  DurableObjectStorageDataConnector,
  DurableObjectStorageDataConnectorOptions,
  DurableObjectStorageMetaConnector,
  DurableObjectStorageMetaConnectorOptions,
} from '@synclets/@types/durable-object';
import {jsonString} from '@synclets/utils';
import type {DurableObjectStorage} from 'cloudflare:workers';
import {arrayMap, arrayNew, arraySlice} from '../common/array.ts';
import {objFromEntries, objIsEqual, objNotEmpty} from '../common/object.ts';
import {errorNew, promiseAll, size} from '../common/other.ts';
import {getQuery, sql} from '../database/index.ts';

export const createDurableObjectStorageDataConnector: typeof createDurableObjectStorageDataConnectorDecl =
  <Depth extends number>({
    depth,
    storage,
    dataTable = 'data',
    addressColumn = 'address',
    atomColumn = 'atom',
  }: DurableObjectStorageDataConnectorOptions<Depth>): DurableObjectStorageDataConnector<Depth> =>
    createStorageConnector(false, depth, storage, {
      table: dataTable,
      addressColumn,
      leafColumn: atomColumn,
    });

export const createDurableObjectStorageMetaConnector: typeof createDurableObjectStorageMetaConnectorDecl =
  <Depth extends number>({
    depth,
    storage,
    metaTable = 'meta',
    addressColumn = 'address',
    timestampColumn = 'timestamp',
  }: DurableObjectStorageMetaConnectorOptions<Depth>): DurableObjectStorageMetaConnector<Depth> =>
    createStorageConnector(true, depth, storage, {
      table: metaTable,
      addressColumn,
      leafColumn: timestampColumn,
    });

const createStorageConnector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  depth: Depth,
  storage: DurableObjectStorage,
  config: {
    table: string;
    addressColumn: string;
    leafColumn: string;
  },
) => {
  const query = async <Row>(sql: Sql): Promise<Row[]> => {
    const [queryString, args] = getQuery(sql);
    const cursor = storage.sql.exec(queryString, ...args);
    return cursor.toArray() as Row[];
  };

  const getSchema = async () => {
    const columns = await query<{name: string; type: string}>(
      sql`
        SELECT name, type 
        FROM pragma_table_info(${config.table})
        ORDER BY name
      `,
    );
    return objFromEntries(columns.map(({name, type}) => [name, type]));
  };

  const addressPartColumns = arrayMap(
    arrayNew(depth),
    (_, i) => `${config.addressColumn}${i + 1}`,
  );

  const connect = async () => {
    const schema = await getSchema();

    const targetSchema = {
      [config.addressColumn]: 'TEXT',
      [config.leafColumn]: 'TEXT',
      ...objFromEntries(
        arrayMap(addressPartColumns, (column) => [column, 'TEXT']),
      ),
    };

    if (objNotEmpty(schema)) {
      if (!objIsEqual(schema, targetSchema)) {
        errorNew(`Table "${config.table}" needs correct schema`);
      }
    } else {
      connector.log(`Creating table "${config.table}"`);
      await query(
        sql`
        CREATE TABLE $"${config.table} (
          $"${config.addressColumn} TEXT PRIMARY KEY, 
          $"${config.leafColumn} TEXT, 
          $,${arrayMap(
            addressPartColumns,
            (addressPartColumn) => sql`$"${addressPartColumn} TEXT`,
          )}
        )`,
      );

      await promiseAll(
        arrayMap(addressPartColumns, (_, c) =>
          query(
            sql`
              CREATE INDEX $"${config.table + c} ON $"${config.table} ($,${arrayMap(
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
        sql`
        SELECT $"${config.leafColumn} AS leaf FROM $"${config.table} 
        $&${{[config.addressColumn]: jsonString(address)}}
      `,
      )
    )[0]?.leaf;

  const writeLeaf = async (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
    leaf: Atom | Timestamp,
  ) => {
    await query(
      sql`
        INSERT INTO $"${config.table} 
        (
          $"${config.addressColumn}, $"${config.leafColumn}, 
          $,${arrayMap(address, (_, a) => sql`$"${addressPartColumns[a]}`)}
        ) VALUES (
          ${jsonString(address)}, ${leaf},
          $,${arrayMap(address, (addressPart) => sql`${addressPart}`)}
        ) 
        ON CONFLICT($"${config.addressColumn}) 
        DO UPDATE SET $"${config.leafColumn}=excluded.$"${config.leafColumn}
      `,
    );
  };

  const removeAtom = async (address: AtomAddress<Depth>) => {
    await query(
      sql`
        DELETE FROM $"${config.table} $&${{[config.addressColumn]: jsonString(address)}}
      `,
    );
  };

  const readChildIds = async (address: AnyParentAddress<Depth>) =>
    arrayMap(
      await query<{id: string}>(
        sql`    
          SELECT DISTINCT $"${addressPartColumns[size(address)]} AS id
          FROM $"${config.table}
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
          sql`
              SELECT 
                $"${addressPartColumns[size(address)]} AS id, 
                $"${config.leafColumn} AS leaf
              FROM $"${config.table}
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
        {getStorage: () => storage},
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
        {getStorage: () => storage},
      );

  return connector as CreateMeta extends true
    ? DurableObjectStorageMetaConnector<Depth>
    : DurableObjectStorageDataConnector<Depth>;
};
