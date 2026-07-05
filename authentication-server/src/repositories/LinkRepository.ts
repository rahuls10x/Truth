import type { createClient } from "redis";
import type { LinkPayload } from "../types/index.js";

export default class LinkRepository{
    private cache: ReturnType<typeof createClient>
    
    constructor(cache:ReturnType<typeof createClient>){
        this.cache = cache;
    }

    /**
     * Retrieves a Link from cache and deletes it
     * 
     * Inorder Flow:
     * - retrieve the link from cache and delete it
     */
    async getAndDeleteCachedLink(key:string):Promise<LinkPayload | null>{
        const result = await this.cache.getDel(key);
        return result ? JSON.parse(result) : null;
    }

    /**
     * Creates a Link in cache
     * 
     * Inorder Flow:
     * - save the link with expiry and return status
     */
    async createCacheLink(key:string, linkPayload:LinkPayload, expiry:number): Promise<boolean>{
        const status = await this.cache.set(key, JSON.stringify(linkPayload), { 'PX':expiry });
        return status === "OK";
    }
}