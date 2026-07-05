import type {  Organization, Session, User } from "../types/dbSchema.js";
import { strictCheck } from "../utils/ApplicationError.js";
import CryptoService from "./CryptoService.js";
import type UserRepository from "../repositories/UserRepository.js";
import type OrganizationRepository from "../repositories/OrganizationRepository.js";
import type SessionRepository from "../repositories/SessionRepository.js";
import type { IdentityPayload, LinkPayload, LoginPayload } from "../types/index.js";
import type LinkRepository from "../repositories/LinkRepository.js";

export default class AuthService{
    private sessionRepository: SessionRepository;
    private userRepository: UserRepository;
    private orgRepository: OrganizationRepository;
    private linkRepository: LinkRepository;

    constructor(sessionRepository:SessionRepository, userRepository:UserRepository, orgRepository:OrganizationRepository, linkRepository:LinkRepository){
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.orgRepository = orgRepository;
        this.linkRepository = linkRepository;
    }

    /**
     * Creates a new session of given type
     * 
     * Inorder Flow:
     * - Create Session object (sessionId is also created here)
     * - Create and verify session creation
     * - Return sessionId
     */
    private async createSession(type: "user" | "organization", entity:User | Organization, email:string, ip:string, hardware:object): Promise<string> {
        const sessionId = CryptoService.generateSessionId();
        const sessionObject:Session = {
            sessionId,
            entityId: type === 'user' ? ( entity as User).userId : ( entity as Organization).orgId,
            type,
            email,
            isRevoked:false,
            ip,
            hardware,
            createdAt:new Date(),
            expiresAt:new Date(Date.now() + 4320 * 60 * 1000),
        }

        strictCheck(await this.sessionRepository.createSession(sessionObject), 500, "Internal Server Error");

        return sessionId;
    }

    private async createMagicLink( type: "user" | "organization", entity:User | Organization, action: string): Promise<void> {
        
        const link = CryptoService.generateMagicToken();
        const linkPayload: LinkPayload = {
            entityType: type,
            entityId: type === 'user' ? ( entity as User).userId : ( entity as Organization).orgId,
            action
        };

        strictCheck(await this.linkRepository.createCacheLink(link, linkPayload, 5 * 60 * 1000), 500, "Internal Server Error");
    }

    /**
     * Creates user login payload DTO
     * 
     * Inorder Flow:
     * - Get user details by email and check if user exists also verify password
     * - Retrieve sessionId and generate session
     * - Return login payload
     */
    async userLogin({email, password, ip, hardware}:{email:string, password:string, ip:string, hardware:object}): Promise<LoginPayload> {
        
        const user = strictCheck(await this.userRepository.getUserByEmail(email), 404, "User does not exist");
        strictCheck(await CryptoService.verifyhashedPassword(password, user.password), 401, "Invalid Credentials");

        const sessionId = await this.createSession("user", user, email, ip, hardware);

        return {
            name: user.name,
            email: user.email,
            sessionId
        };
    }

    /**
     * Creates organization login payload DTO
     * 
     * Inorder Flow:
     * - Get organization details by email and check if organization exists also verify password
     * - Retrieve sessionId and generate session
     * - Return login payload
     */
    async organizationLogin({email, password, ip, hardware}:{email:string, password:string, ip:string, hardware:object}): Promise<LoginPayload> {
        
        const organization = strictCheck(await this.orgRepository.getOrganizationByEmail(email), 404, "Organization does not exist");
        strictCheck(await CryptoService.verifyhashedPassword(password, organization.password), 401, "Invalid Credentials");

        const sessionId = await this.createSession("organization", organization, email, ip, hardware);

        return {
            name: organization.userName,
            email: organization.email,
            sessionId
        };
    }

    
    /**
     * Consumes Magic Token and performs action
     * 
     * Inorder Flow:
     * - Retrieve link from cache and delete it
     */
    async consumeMagicToken(link:string): Promise<void> {
        
        const _linkPayload = strictCheck(await this.linkRepository.getAndDeleteCachedLink(link), 404, "invalid verification link");
        
        //perform the update in db depending on the action
        
        return;
    }

    /**
     * Logouts the entity
     * 
     * Inorder Flow:
     * - Revoke current session
     */
    async logout(sessionId: string): Promise<void> {
        strictCheck(await this.sessionRepository.revokeSessionById(sessionId), 500, "Internal Server Error");
    }

    /**
     * Creates identity verification DTO
     * 
     * Inorder Flow:
     * - Retrieve entity details
     * - create safe identity payload
     * - return safe identity payload
     */
    async whoAmI(entityId: string):Promise <IdentityPayload>{
        let entity;
        if(entityId.startsWith("user_")){
            entity = strictCheck(await this.userRepository.getUserById(entityId), 404, "User does not exist");
        }
        if(entityId.startsWith("org_")){
            entity = strictCheck(await this.orgRepository.getOrganizationById(entityId), 404, "Organization does not exist");
        }
        
        let safeIdentityPayload = {
            name:(entity as User) ?.name ?? (entity as Organization)?.userName,
            email:entity!.email,
            type:(entityId.startsWith("user_") ? "user" : "organization") as "user" | "organization"
        }

        return safeIdentityPayload;
    }
}