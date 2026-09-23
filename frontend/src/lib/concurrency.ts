// Optimistic locking and idempotency (backend Section 6.5).
// Every mutation sends If-Match with the version the user was looking at, so two agents can't overwrite
// each other (the loser gets 409 STALE_VERSION). Create / transition POSTs also send an Idempotency-Key,
// so a network retry of "Submit claim" never submits twice.

export const ifMatch = (version: number) => ({ "If-Match": `W/"${version}"` });

export const idempotencyKey = () => ({ "Idempotency-Key": crypto.randomUUID() });

/** Headers for a versioned state change. */
export const mutationHeaders = (version: number) => ({ ...ifMatch(version), ...idempotencyKey() });
