// --- 1. Either Data Structure ---
export type Either<L, R> =
  | { kind: 'left'; value: L }
  | { kind: 'right'; value: R };
export const left = <L>(value: L): Either<L, never> => ({
  kind: 'left',
  value,
});
export const right = <R>(value: R): Either<never, R> => ({
  kind: 'right',
  value,
});
