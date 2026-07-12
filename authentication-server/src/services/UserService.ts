import type UserRepository from "../repositories/UserRepository.js";
import type { ProfilePayload, UpdateProfileBody } from "../types/index.js";
import { strictCheck } from "../utils/ApplicationError.js";
import CryptoService from "./CryptoService.js";
import type { User } from "../types/dbSchema.js";
import type LinkService from "./LinkSevice.js";
import type MailService from "./MailService.js";

export default class UserService {
	private userRepository:UserRepository;
	private linkService:LinkService;
	private mailService:MailService;

	constructor(userRepository: UserRepository, linkService:LinkService, mailService:MailService){
		this.userRepository = userRepository;
		this.linkService = linkService;
		this.mailService = mailService;
	}

	/**
	 * Handles user signup
	 * 
	 * Inorder Flow:
	 * - Check if user already exists (by email)
	 * - create user object (password hashing also done here)
	 * - create user and verify user creation
	 * - create magic token and emails it
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

		const magicToken = await this.linkService.createMagicToken(userObject.userId, "user", "verify");
		await this.mailService.sendVerificationEmail(email, magicToken);

		return true;
	}

	/**
	 * Creates and send Password reset link
	 * 
	 * Inorder Flow:
	 * - Retrieve and check the user by email
	 * - create magic token and emails it
	 * - returns true
	 */
	async forgotPassword( email: string ):Promise<true> {
		const userObject = strictCheck(await this.userRepository.getUserByEmail(email), 409, "User does not exist");
		
		const magicToken = await this.linkService.createMagicToken(userObject.userId, "user", "resetPassword");
		await this.mailService.sendPasswordResetEmail(email, magicToken);

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
			age:updateBody.age,
			gender:updateBody.gender
		}

		strictCheck(await this.userRepository.updateUserById(userId, updateData), 500, "Internal Server Error");
	}
}
