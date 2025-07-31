/// connector

export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

export class BaseConnector {
  getConnected(): boolean;

  connect(): Promise<void>;

  disconnect(): Promise<void>;
}
