import { strictCheck } from "../utils/ApplicationError.js";
export default class UserService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
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
    async getResource(params) {
        const user = strictCheck(await this.userRepository.getUserById(params.id), 400, "User doesnt exist");
        const userPayload = {};
        if (params.scopes.includes("name"))
            userPayload.name = user.name;
        if (params.scopes.includes("age"))
            userPayload.age = user.age ?? -1;
        if (params.scopes.includes("email"))
            userPayload.email = user.email;
        if (params.scopes.includes("gender"))
            userPayload.gender = user.gender ?? 'Prefer not to say';
        return userPayload;
    }
}
//# sourceMappingURL=UserService.js.map