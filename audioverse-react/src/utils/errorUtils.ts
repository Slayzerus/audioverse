/**
 * Tiny helpers for type-safe error handling.
 * Replaces widespread `catch (e: any)` → `catch (e: unknown)`.
 */

/** Extract a human-readable message from an unknown caught value. */
export function errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return String(err);
}

/** Return the `.stack` if available, otherwise a string representation. */
export function errorStack(err: unknown): string {
    if (err instanceof Error && err.stack) return err.stack;
    return String(err);
}

/**
 * Narrow an unknown error to an Axios-shaped error and return `.response.data`.
 * Returns `undefined` if the error is not an Axios response error.
 */
export function axiosResponseData(err: unknown): unknown {
    if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object"
    ) {
        const resp = (err as Record<string, unknown>).response as Record<string, unknown> | null;
        return resp?.data;
    }
    return undefined;
}

/**
 * Narrow an unknown error to an Axios-shaped error and return `.response.status`.
 * Returns `undefined` if not applicable.
 */
export function axiosResponseStatus(err: unknown): number | undefined {
    if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object"
    ) {
        const resp = (err as Record<string, unknown>).response as Record<string, unknown> | null;
        const status = resp?.status;
        return typeof status === "number" ? status : undefined;
    }
    return undefined;
}
