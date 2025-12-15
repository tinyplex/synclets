import {RESERVED} from '@synclets';
import {Address, AnyParentAddress, Atom, AtomAddress} from '@synclets/@types';
import type {
  createTinyBaseDataConnector as createTinyBaseDataConnectorDecl,
  createTinyBaseSynclet as createTinyBaseSyncletDecl,
  TinyBaseDataConnector,
  TinyBaseSyncletOptions,
} from '@synclets/@types/tinybase';
import type {Cell, Id, Value} from 'tinybase';
import {arrayConcat} from '../common/array.ts';
import {size} from '../common/other.ts';
import {createDataConnector, createSynclet} from '../core/index.ts';
import {createMemoryMetaConnector} from '../memory/connector.ts';

const VALUE_STEM = RESERVED + 'v';

const isValueAddress = (address: Address) =>
  address[0] == VALUE_STEM && address[1] == VALUE_STEM;

export const createTinyBaseDataConnector: typeof createTinyBaseDataConnectorDecl =
  ({store}) => {
    let cellListenerId: Id;
    let valueListenerId: Id;

    const connect = async (
      syncChangedAtoms: (...addresses: AtomAddress<3>[]) => Promise<void>,
    ) => {
      cellListenerId = store.addCellListener(
        null,
        null,
        null,
        (_, tableId, rowId, cellId) => {
          syncChangedAtoms([tableId, rowId, cellId]);
        },
      );
      valueListenerId = store.addValueListener(null, (_, valueId) => {
        syncChangedAtoms([VALUE_STEM, VALUE_STEM, valueId]);
      });
    };

    const disconnect = async () => {
      store.delListener(cellListenerId);
      store.delListener(valueListenerId);
    };

    const readAtom = async (address: AtomAddress<3>) =>
      isValueAddress(address)
        ? store.getValue(address[2])
        : store.getCell(...address);

    const writeAtom = async (address: AtomAddress<3>, atom: Atom) => {
      if (isValueAddress(address)) {
        store.setValue(address[2], atom as Value);
      } else {
        store.setCell(...address, atom as Cell);
      }
    };

    const removeAtom = async (address: AtomAddress<3>) => {
      if (isValueAddress(address)) {
        store.delValue(address[2]);
      } else {
        store.delCell(...address);
      }
    };

    const readChildIds = async (address: AnyParentAddress<3>) =>
      size(address) === 0
        ? arrayConcat(
            store.getTableIds(),
            store.hasValues() ? [VALUE_STEM] : [],
          )
        : size(address) === 1
          ? address[0] === VALUE_STEM
            ? store.hasValues()
              ? [VALUE_STEM]
              : []
            : store.getRowIds(address[0] as string)
          : isValueAddress(address)
            ? store.getValueIds()
            : store.getCellIds(address[0] as string, address[1] as string);

    const extraFunctions = {
      getStore: () => store,
    };

    return createDataConnector(
      {depth: 3},
      {connect, disconnect, readAtom, writeAtom, removeAtom, readChildIds},
      {},
      extraFunctions,
    ) as TinyBaseDataConnector;
  };

export const createTinyBaseSynclet: typeof createTinyBaseSyncletDecl = ({
  store,
  transport,
  implementations,
  id,
  logger,
}: TinyBaseSyncletOptions) =>
  createSynclet(
    {
      dataConnector: createTinyBaseDataConnector({store}),
      metaConnector: createMemoryMetaConnector({depth: 3}),
      transport,
    },
    implementations,
    {id, logger},
  );
