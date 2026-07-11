import type {  Hardware, Organization, Session, User } from "../types/dbSchema.js";
import { strictCheck } from "../utils/ApplicationError.js";
import CryptoService from "./CryptoService.js";
import type UserRepository from "../repositories/UserRepository.js";
import type OrganizationRepository from "../repositories/OrganizationRepository.js";
import type SessionRepository from "../repositories/SessionRepository.js";
import type { IdentityPayload, LoginPayload, SessionPayload } from "../types/index.js";
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
    private async createSession(type: "user" | "organization", entity:User | Organization, email:string, ip:string, hardware:Hardware): Promise<string> {
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

    /**
     * Creates user login payload DTO
     * 
     * Inorder Flow:
     * - Get user details by email and check if user exists also verify password
     * - Retrieve sessionId and generate session
     * - Return login payload
     */
    async userLogin({email, password, ip, hardware}:{email:string, password:string, ip:string, hardware:Hardware}): Promise<LoginPayload> {
        
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
    async organizationLogin({email, password, ip, hardware}:{email:string, password:string, ip:string, hardware:Hardware}): Promise<LoginPayload> {
        
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
     * Retrieves all sessions belonging to entityId
     * 
     * Inorder Flow:
     * - Retrieve all sessions for entity id
     * - model the session into session Payload
     * - return the session payload else undefined
     */
    async getSessions(currentSessionId:string, entity:{id:string, email:string}): Promise<SessionPayload[] | undefined>{
        const sessions = await this.sessionRepository.findAllActiveSessionsByEntityId(entity.id);

        const sessionPayload = [];
        for(const session of sessions){
            sessionPayload.push({
                _id:session._id as string,
                hardware: session.hardware,
                expiresAt: session.expiresAt,
                createdAt:session.createdAt,
                ip: session.ip,
                isCurrent:currentSessionId === session.sessionId
            });
        }

        return sessionPayload.length > 0 ? sessionPayload : undefined;
    }

    /**
     * Revokes the session by maskedId(_id)
     * 
     * Inorder Flow:
     * - Revokes the session
     */
    async revokeSession(maskedId:string): Promise<void> {
        strictCheck(await this.sessionRepository.revokeSessionByMaskedId(maskedId), 500, "Internal Server Error");
    }

    /**
     * Revokes all sessions except current session
     * 
     * Inorder Flow:
     * - Revokes all sessions
     */
    async revokeAllSessions(currentSessionId:string, entityId:string): Promise<void> {
        strictCheck(await this.sessionRepository.revokeAllSessionsExceptCurrent(currentSessionId, entityId), 500, "Internal Server Error");
    }

    /**
     * Verifies the email
     * 
     * Inorder Flow:
     * - Retrieve linkPayload from cache, delete it and verify its action
     * - If user, verify the user and return the type
     * - If organization, verify the organization and return the type
     * - Return
     */
    async verifyEmail(magicToken:string): Promise<{type: 'user' | 'organization'} | undefined> {
        const linkPayload = strictCheck(await this.linkRepository.getAndDeleteCachedLink(magicToken), 404, "Invalid verification link");
        strictCheck(linkPayload.action === "verify", 404, "Invalid verification link");

        if(linkPayload.entityType === "user"){
            strictCheck(await this.userRepository.updateUserById(linkPayload.entityId, {isVerified:true}), 500, "Internal Server Error");
            return {type : 'user'}
        }
        
        if(linkPayload.entityType === "organization"){
            strictCheck(await this.orgRepository.updateOrganizationById(linkPayload.entityId, {isVerified:true}), 500, "Internal Server Error");
            return {type : 'organization'}
        }

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