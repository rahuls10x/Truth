/**
 * Ensure all token delete themselves after expiration time
 *
 * Inorder Flow:
 * - Create TTL index on field recieved
 * - Log the success
 *
 * @readonly You might need to drop the index once manually if you decide to change config later
 */
export async function createTimeToLiveIndex(db, collectionName, field) {
    await db.collection(collectionName).createIndex({ [field]: 1 }, { expireAfterSeconds: 0 });
    console.log("Time To Live Index created successfully on", collectionName);
}
//# sourceMappingURL=ConfigFunctions.js.map