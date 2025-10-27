type OneLonger<Than extends string[] = []> = [string, ...Than];

type LeafAddressFor<
  Depth extends number,
  Address extends string[] = [],
> = Address['length'] extends Depth
  ? Address
  : LeafAddressFor<Depth, OneLonger<Address>>;

type LeafParentAddressFor<
  Depth extends number,
  Address extends string[] = [],
> = OneLonger<Address>['length'] extends Depth
  ? Address
  : LeafParentAddressFor<Depth, OneLonger<Address>>;

type AnyParentAddressFor<
  Depth extends number,
  Address extends string[] = [],
> = OneLonger<Address>['length'] extends Depth
  ? Address
  : Address | AnyParentAddressFor<Depth, [string, ...Address]>;
