const fs  			= require('fs');
const Router 		= require("koa-router");
const koaRouterMap 	= require("koa-router-map");

const Log 			= require("../components/log.js");

exports.init = (app) => {
	const log = new Log("routers");
	log.d(".init");

	const router0 = new Router();
	const routers_path = "./routers";
	fs.readdirSync(routers_path).forEach(file => {
		if (/router\.js$/i.test(file)) {
			log.d(" load " + file);
			const router = require('./' + file).router;
			for (let i of router.stack) {
				router0.stack.push(i);
			}
			app.use(router.routes());
			app.use(router.allowedMethods());
		}
	});
	app.use(koaRouterMap(router0));
}
