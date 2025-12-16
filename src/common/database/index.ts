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
  DatabaseDataConnectorOptions,
  DatabaseMetaConnectorOptions,
  Sql,
} from '@synclets/@types/database';
import {jsonParse, jsonString} from '@synclets/utils';
import {sql} from '../../database/index.ts';
import {arrayMap, arrayNew, arraySlice} from '../array.ts';
import {objFromEntries, objIsEqual, objNotEmpty} from '../object.ts';
import {errorNew, promiseAll, size} from '../other.ts';

export const createDatabaseConnector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  {
    depth,
    addressColumn = 'address',
    dataTable = 'data',
    atomColumn = 'atom',
    metaTable = 'meta',
    timestampColumn = 'timestamp',
  }: DatabaseMetaConnectorOptions<Depth> & DatabaseDataConnectorOptions<Depth>,
  query: <Row>(sql: Sql) => Promise<Row[]>,
  getSchema: (table: string) => Promise<{[column: string]: string}>,
  extraMembers: {[name: string]: any},
) => {
  const [table, leafColumn] = createMeta
    ? [metaTable, timestampColumn]
    : [dataTable, atomColumn];

  const addressPartColumns = arrayMap(
    arrayNew(depth),
    (_, i) => `${addressColumn}${i + 1}`,
  );

  const connect = async () => {
    const schema = await getSchema(table);
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
    jsonParse(
      (
        await query<{leaf: string}>(
          sql`
        SELECT $"${leafColumn} AS leaf FROM $"${table} 
        $&${{[addressColumn]: jsonString(address)}}
      `,
        )
      )[0]?.leaf,
    );

  const writeLeaf = async (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
    leaf: Atom | Timestamp,
  ) => {
    await query(
      sql`
        INSERT INTO $"${table} 
        (
          $"${addressColumn}, $"${leafColumn}, 
          $,${arrayMap(address, (_, a) => sql`$"${addressPartColumns[a]}`)}
        ) VALUES (
          ${jsonString(address)}, ${jsonString(leaf)},
          $,${arrayMap(address, (addressPart) => sql`${addressPart}`)}
        ) 
        ON CONFLICT($"${addressColumn}) 
        DO UPDATE SET $"${leafColumn}=excluded.$"${leafColumn}
      `,
    );
  };

  const removeAtom = async (address: AtomAddress<Depth>) => {
    await query(
      sql`
        DELETE FROM $"${table} $&${{[addressColumn]: jsonString(address)}}
      `,
    );
  };

  const readChildIds = async (address: AnyParentAddress<Depth>) =>
    arrayMap(
      await query<{id: string}>(
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
        ({id, leaf}) => [id, jsonParse(leaf)],
      ),
    );

  const connector = createMeta
    ? createMetaConnector(
        {depth},
        {
          connect,
          readTimestamp: readLeaf,
          writeTimestamp: writeLeaf,
          readChildIds,
        },
        {readTimestamps: readLeaves},
        extraMembers,
      )
    : createDataConnector(
        {depth},
        {
          connect,
          readAtom: readLeaf,
          writeAtom: writeLeaf,
          removeAtom,
          readChildIds,
        },
        {readAtoms: readLeaves},
        extraMembers,
      );

  return connector;
};
