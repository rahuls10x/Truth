import type { Db } from "mongodb";
/**
 * Ensure all token delete themselves after expiration time
 *
 * Inorder Flow:
 * - Create TTL index on field recieved
 * - Log the success
 *
 * @readonly You might need to drop the index once manually if you decide to change config later
 */
export declare function createTimeToLiveIndex(db: Db, collectionName: string, field: string): Promise<void>;
//# sourceMappingURL=ConfigFunctions.d.ts.map