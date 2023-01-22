const Utils = require("../components/Utils.js");
const db    = require("../components/db.js").db;
const name  = "errorHandler";

module.exports = async(ctx, next) => {
    try {
        await next()
        const status = ctx.status || 404
        if (status === 404) {
            ctx.throw(404)
        }
    } catch (err) {
        ctx.status = err.status || 500
        if (ctx.status === 404) {
            const data = {};
            try {
                const domain = Utils.getDomain(ctx.request.header.host);
            } catch (ex) {
                console.log(ex);
            }
            await ctx.render('404', data);
        } else {
            await ctx.render('other_error');
        }
    }
}