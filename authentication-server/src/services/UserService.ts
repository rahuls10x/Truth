import type UserRepository from "../repositories/UserRepository.js";
import type { LinkPayload, ProfilePayload, UpdateProfileBody } from "../types/index.js";
import { strictCheck } from "../utils/ApplicationError.js";
import CryptoService from "./CryptoService.js";
import type { User } from "../types/dbSchema.js";
import type LinkRepository from "../repositories/LinkRepository.js";

export default class UserService {
	private userRepository:UserRepository;
	private linkRepository:LinkRepository;

	constructor(userRepository: UserRepository, linkRepository:LinkRepository){
		this.userRepository = userRepository;
		this.linkRepository = linkRepository;
	}

	/**
	 * Creates a magic Token for user
	 * 
	 * Inorder Flow:
	 * - Create magic token and linkPayload
	 * - Create magic link in cache
	 * - Return magic token
	 */
	private async createMagicToken( entity:User, action: string): Promise<string> { 
        const magicToken = CryptoService.generateMagicToken();
        const linkPayload: LinkPayload = {
            entityType: 'user',
            entityId: entity.userId,
            action
        };

        strictCheck(await this.linkRepository.createCacheLink(magicToken, linkPayload, 5 * 60 * 1000), 500, "Internal Server Error");

		return magicToken;
    }

	/**
	 * Handles user signup
	 * 
	 * Inorder Flow:
	 * - Check if user already exists (by email)
	 * - create user object (password hashing also done here)
	 * - create user and verify user creation
	 * - create magic token and logs it
	 * - return true (will not reach here if any of the above step causes error)
	 * 
	 * @refinement
	 * implement otp veirfication system
	 */
	async signup({ name, email, password }: { name: string; email: string; password: string }):Promise<true> {
		
		strictCheck(!await this.userRepository.checkEmailExists(email), 409, "User already exists");

		const userObject:User = {
			userId:CryptoService.generateUserId(),
			name,
			email,
			password: await CryptoService.hashPassword(password),
			isVerified:false /// implement email verification later
		}
		
		strictCheck(await this.userRepository.createUser(userObject), 500, "Internal Server Error");

		const magicToken = await this.createMagicToken(userObject, "verify");
		console.log(magicToken); //temporary until i implement mailing service

		return true;
	}

	/**
	 * Provides User profile details DTO 
	 * 
	 * Inorder Flow:
	 * - Get user details by id and check if user exists
	 * - Construct user payload
	 * - Return user payload
	 * 
	 * @remarks Payload contains name, email, age, gender
	 */
	async getProfile(userId:string): Promise<ProfilePayload> {

		const user = strictCheck(await this.userRepository.getUserById(userId), 400,  "User not found");

		const profilePayload = {
			name:user.name,
			email:user.email,
			age:user.age ?? -1,
			gender:user.gender ?? 'Prefer not to say'
		}

		return profilePayload;
	}

	/**
	 * Update user profile details
	 * 
	 * Inorder Flow:
	 * - Retrieve userId and update data from updateBody
	 * - Update user details by userId
	 * 
	 * @remarks Overwrites existing user details
	 */
	async updateProfile(updateBody: UpdateProfileBody):Promise<void>{

		const userId = updateBody.userId;
		const updateData = {
			name:updateBody.name,
			email:updateBody.email,
			age:updateBody.age,
			gender:updateBody.gender
		}

		strictCheck(await this.userRepository.updateUserById(userId, updateData), 500, "Internal Server Error");
	}
}
