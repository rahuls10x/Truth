import type UserRepository from "../repositories/UserRepository.js";
import type { UserPayload } from "../types/index.js";
export default class UserService {
    private userRepository;
    constructor(userRepository: UserRepository);
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
    getResource(params: {
        id: string;
        scopes: string[];
    }): Promise<UserPayload>;
}
//# sourceMappingURL=UserService.d.ts.map