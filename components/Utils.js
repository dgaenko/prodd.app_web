const fs                 = require('fs').promises;
const util               = require('util');
const Twig               = require('twig');

class Utils {

    constructor() {
    }

    getDomain(host) {
        return host.replace(/:.*$/, "");
    }

    getSubdomain(domain) {
        return domain.replace(/[^\.]*/g, "").length === 2 ? domain.replace(/\..*$/, "") : "";
    }

    /**
     * Returns a random number between min (inclusive) and max (exclusive)
     */
    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive).
     * The value is no lower than min (or the next integer greater than min
     * if min isn't an integer) and no greater than max (or the next integer
     * lower than max if max isn't an integer).
     * Using Math.round() will give you a non-uniform distribution!
     */
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Возвращает значение из POST-запроса или параметра
     * @param ctx           Контекст запроса
     * @param name          Имя возвращаемого параметра
     * @returns {null}      Возвращаемое значение
     */
    getRequestParam(ctx, name) {
        let res = null;
        if (ctx.request.body[name]) {
            res = ctx.request.body[name];
        }
        if (ctx.params[name]) {
            res = ctx.params[name];
        }
        return res;
    }

    getRandomChars(length, use_upper = 0) {
        const chars = use_upper
            ? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
            : 'abcdefghijklmnopqrstuvwxyz';
        let res = "";
        while (res.length < length) {
            res += chars[this.getRandomInt(0, chars.length - 1)];
        }
        return res;
    }

    getRandomString(length, use_upper = 0) {
        const chars = use_upper
            ? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            : 'abcdefghijklmnopqrstuvwxyz0123456789';
        let res = "";
        while (res.length < length) {
            res += chars[this.getRandomInt(0, chars.length - 1)];
        }
        return res;
    }

    async renderTemplate(template, data = {}) {
        let res = "";
        try {
            if (!/\.[^.]+$/.test(template)) {
                template += ".twig";
            }
            const content = await fs.readFile(template, "utf-8");
            const twig = Twig.twig({ data: content });
            res = twig.render(data);
        } catch (ex) {
            res = ex.message;
        }
        return res;
    }

    async renderFile(filename, data = {}) {
        let res = "";
        try {
            if (!/\.[^.]+$/.test(filename)) {
                filename += ".twig";
            }
            const render = util.promisify(Twig.renderFile);
            res = await render(filename, data);
        } catch (ex) {
            res = ex.message;
        }
        return res;
    }

    parseRealIp(list) {
        if (list) {
            list = list.split(", ");
            list = [...new Set(list)].join(", ");
        }
        return list;
    }

}

module.exports = new Utils();