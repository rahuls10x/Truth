import type UserRepository from "../repositories/UserRepository.js";
import type { UserPayload } from "../types/index.js";
import { strictCheck } from "../utils/ApplicationError.js";

export default class UserService {
    private userRepository: UserRepository

    constructor(userRepository: UserRepository){
        this.userRepository = userRepository
    }

    /**
     * Get requested user resource
     * 
     * Inorder flow: 
     * - Get user details by id and check if user exists
     * - Construct user payload
     * - Return constructed user payload
     *  
     * @param {{id: string, scopes: string[]}} params 
     * @returns {UserPayload} User Payload
     */
    async getResource(params:{id: string, scopes: string[]}): Promise<UserPayload> {

        const user = strictCheck(await this.userRepository.getUserById(params.id), 400, "User doesnt exist");

        const userPayload: UserPayload = {}
        if(params.scopes.includes("name")) userPayload.name = user.name;
        if(params.scopes.includes("age")) userPayload.age = user.age ?? -1;
        if(params.scopes.includes("email")) userPayload.email = user.email;
        if(params.scopes.includes("gender")) userPayload.gender = user.gender ?? 'Prefer not to say';

        return userPayload;
    }
}