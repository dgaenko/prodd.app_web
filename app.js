const koa = require('koa');

const app = new koa();

const Init = require("./init");
const init = new Init(app);

module.exports = { app, init };