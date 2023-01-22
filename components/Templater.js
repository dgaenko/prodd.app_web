const fs    = require('fs').promises;
const Twig  = require('twig');

const Log   = require("./log.js");

class Templater extends Log {

    path = "./";

    setOptions(options) {
        if (options && options.path) {
            this.path = options.path;
        }
    }

    renderHtml(template, params) {
        let res = "";
        try {
            res = Twig.twig({ data: template }).render(params);
        } catch (ex) {
            this.e(ex);
        }
        return res;
    }

    async render(file, params) {
        let res = "";
        try {
            const content = await fs.readFile(this.path + file, "utf-8");
            res = this.renderHtml(content, params);
        } catch (ex) {
            this.e(ex);
        }
        return res;
    }

}

module.exports = new Templater();