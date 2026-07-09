import type LinkRepository from "../repositories/LinkRepository.js";
import type { LinkPayload } from "../types/index.js";
import { strictCheck } from "../utils/ApplicationError.js";
import CryptoService from "./CryptoService.js";

export default class LinkService {
	private linkRepository: LinkRepository;

	constructor(linkRepository: LinkRepository) {
		this.linkRepository = linkRepository;
	}

	/**
	 * Creates a magic Token
	 *
	 * Inorder Flow:
	 * - Create magic token and linkPayload
	 * - Create magic link in cache
	 * - Return magic token
	 */
	async createMagicToken(entityId: string, entityType:'user' | 'organization',  action: string): Promise<string> {
		const magicToken = CryptoService.generateMagicToken();
		const linkPayload: LinkPayload = {
			entityType,
			entityId,
			action,
		};

		strictCheck(await this.linkRepository.createCacheLink(magicToken, linkPayload, 5 * 60 * 1000), 500, "Internal Server Error");

		return magicToken;
	}
}
