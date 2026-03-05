/**
 * Shared test utility types for AudioVerse React test suite.
 */

/**
 * Capture type for mutation functions hoisted out of test render components.
 *
 * Pattern:
 * ```ts
 * let mutateFn: MutateFnCapture;
 * const Test = () => { mutateFn = useSomeMutation().mutateAsync; return <div/>; };
 * await act(async () => { await mutateFn(args); });
 * ```
 *
 * Uses `any` intentionally — actual argument/return types are validated at the
 * API boundary; this type only captures the hoisted reference.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MutateFnCapture = (...args: any[]) => Promise<any>;
