import {AnyParentAddress, Atom, AtomAddress} from '@synclets/@types';
import type {
  createTinyBaseTablesDataConnector as createTinyBaseTablesDataConnectorDecl,
  createTinyBaseValuesDataConnector as createTinyBaseValuesDataConnectorDecl,
  TinyBaseTablesDataConnector,
  TinyBaseValuesDataConnector,
} from '@synclets/@types/connector/tinybase';
import type {Cell, Id, Store, Value} from 'tinybase';
import {size} from '../../common/other.ts';
import {createDataConnector} from '../../core/index.ts';

export const createTinyBaseTablesDataConnector: typeof createTinyBaseTablesDataConnectorDecl =
  (store: Store) => {
    let listenerId: Id;

    const connect = async (
      onChange: (address: AtomAddress<3>) => Promise<void>,
    ) => {
      listenerId = store.addCellListener(
        null,
        null,
        null,
        (_, tableId, rowId, cellId) => {
          onChange([tableId, rowId, cellId]);
        },
      );
    };

    const disconnect = async () => {
      store.delListener(listenerId);
    };

    const readAtom = async (address: AtomAddress<3>) =>
      store.getCell(...address);

    const writeAtom = async (address: AtomAddress<3>, atom: Atom) => {
      store.setCell(...address, atom as Cell);
    };

    const removeAtom = async (address: AtomAddress<3>) => {
      store.delCell(...address);
    };

    const readChildIds = async (address: AnyParentAddress<3>) =>
      size(address) === 0
        ? store.getTableIds()
        : size(address) === 1
          ? store.getRowIds(address[0] as string)
          : store.getCellIds(address[0] as string, address[1] as string);

    const extraFunctions = {
      getStore: () => store,
    };

    return createDataConnector(
      3,
      {connect, disconnect, readAtom, writeAtom, removeAtom, readChildIds},
      {},
      extraFunctions,
    ) as TinyBaseTablesDataConnector;
  };

export const createTinyBaseValuesDataConnector: typeof createTinyBaseValuesDataConnectorDecl =
  (store: Store) => {
    const readAtom = async (address: AtomAddress<1>) =>
      store.getValue(...address);

    const writeAtom = async (address: AtomAddress<1>, atom: Atom) => {
      store.setValue(...address, atom as Value);
    };

    const removeAtom = async (address: AtomAddress<1>) => {
      store.delValue(...address);
    };

    const readChildIds = async () => store.getValueIds();

    const extraFunctions = {
      getStore: () => store,
    };

    return createDataConnector(
      1,
      {readAtom, writeAtom, removeAtom, readChildIds},
      {},
      extraFunctions,
    ) as TinyBaseValuesDataConnector;
  };
