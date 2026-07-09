export default class MailService{
    private originUrl: string;

    constructor(originUrl:string){
        this.originUrl = originUrl;
    }

    /**
     * Sends verification email
     * 
     * Inorder Flow:
     * - Create and Log the verification link
     */
    async sendVerificationEmail(_email:string, magicToken:string){
        const verificationLink = `${this.originUrl}/verify-email/${magicToken}`;
        console.log(verificationLink);
    }
}