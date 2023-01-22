const users = require('../models/users.js');
const Log   = require('../components/log.js');

const log = new Log("authenticated");
module.exports = async (ctx, next) => {
    const token = ctx.request.headers['x-auth-token'];
    log.d(`.token:${token}`);
    ctx.session.user = null;
    if (token) {
        ctx.session.user = await users.findByToken(token, 1);
    }
    if (ctx.session.user) {
        await next();
    } else {
        if (ctx.request.url.substr(0, 4) === '/api') {
            ctx.status = 401;
            ctx.body = {
                status: "ERROR",
                message: "Unauthorized"
            };
        } else {
            ctx.redirect("/login");
        }
    }
};