import {
    Controller,
    Get,
    Injectable, Post, Redirect, Render, Req, Session,
} from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";
import { generators } from "openid-client";

import { GoogleService } from "../service/google.service";
import { Admin } from "../model/admin.model";
import { redirect } from "../util/redirect";
import { UserService } from "../service/user.service";

@Controller('login')
@Injectable()
export class LoginController {
    constructor(
        private googleService: GoogleService,
        @InjectModel(Admin)
        private adminModel: typeof Admin,
        private userService: UserService,
    ) {}

    @Get('')
    @Redirect()
    async login(@Session() session) {
        const nonce = generators.nonce();

        session.oauth_nonce = nonce;

        return {
            "url": this.googleService.client.authorizationUrl({
                                                                   scope: 'openid email profile',
                                                                   response_mode: 'form_post',
                                                                   nonce,
                                                               }),
            "statusCode": 302,
        };
    }

    @Post('cb')
    @Render('admin/error')
    async callback(@Session() session, @Req() req) {
        const params = this.googleService.client.callbackParams(req);
        const nonce = session.oauth_nonce;

        console.log('param', params);

        const tokenSet = await this.googleService.client.callback('http://localhost:8115/login/cb', params, { nonce });
        console.log('validated ID Token claims %j', tokenSet.claims());

        const claims = tokenSet.claims();

        if (claims.email_verified) {
            // Find a matching admin
            const admin = await this.adminModel.findOne({where: {email: claims.email}});
            if (admin !== null) {
                // Store login time and optional name
                admin.lastLoginAt = new Date();
                const updateName = admin.name === null;
                if (updateName) {
                    admin.name = claims.name;
                }
                await admin.save({silent: !updateName});

                this.userService.loginUser(admin);

                throw redirect('/');
            } else {
                // Error
                return {msg: "No such user"};
            }
        } else {
            return {msg: "Your email address is not verified"};
        }
    }
}
