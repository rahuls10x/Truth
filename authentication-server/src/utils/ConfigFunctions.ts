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
export async function createTimeToLiveIndex(db:Db, collectionName:string, field: string){
    await db.collection(collectionName).createIndex({ [field]: 1 },{ expireAfterSeconds: 0 });

    console.log(`TTL index on ${collectionName} created successfully`);
}

/**
 * Ensures quick searching of a unique field
 * 
 * Inorder Flow:
 * - Create index on field recieved
 * - Log the success
 * 
 * @readonly You might need to drop the index once manually if you decide to change config later
 */
export async function createUniqueIndex(db:Db, collectionName:string, field: string){
    await db.collection(collectionName).createIndex({ [field]: 1 }, { unique: true });

    console.log(`Unique index on ${collectionName} created successfully`);
}