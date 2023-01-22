const fs            = require("fs");
const path          = require("path");
const config        = require("config");
const cors          = require("@koa/cors");
const cacheControl  = require("koa-cache-control");
const session       = require("koa-session");
const koaBody       = require("koa-body");
const serve         = require("koa-static");
const koaTwig       = require("koa-twig");
const morgan        = require("koa-morgan");
const Logger        = require("koa-logger");
const compress      = require('koa-compress');

const yamljs         = require('yamljs');
const { koaSwagger } = require('koa2-swagger-ui');

const routers       = require("../routers");
const errorHandler  = require('../middleware/errorHandler.js');
const Log           = require("../components/log.js");
const db            = require("../components/db.js").db;

const { initializeApp } = require("firebase/app");
const { getAuth }       = require("firebase/auth");


require('dotenv').config();

class Init extends Log {

    name = "Init";

    views_path = "views";
    host = null;

    constructor(app) {
        super();
        this.app = app;

        this.showSplash();

        app.use(cacheControl({ maxAge: 5 }));
        app.use(cors());
        app.use(errorHandler);

        const options = { threshold: 1024 };
        app.use(compress(options));

        this.initFirebase();
        this.initStateHost();
        this.initContextState();
        this.initLogs();
        this.initSession();
        this.initTemplateSystem();
        this.initSwagger();
        routers.init(app);

        db.connect(config.get('db'));
    }

    showSplash() {
        const splash = [
            "\n", '-'.repeat(80),
            'Запуск приложения ' + config.get("version"),
            '-'.repeat(80)
        ];
        splash.forEach(line => this.w(line));
    }

    /**
     * https://www.npmjs.com/package/koa2-swagger-ui
     */
    initSwagger() {
        const filename = config.get('swagger.file');
        this.d(".initSwagger " + filename);
        const spec = path.extname(filename) === '.yaml'
            ? yamljs.load(filename)
            : require(filename);
        this.app.use(
            koaSwagger({
                routePrefix: config.get('swagger.route'),
                swaggerOptions: { spec },
            }),
        );
    }

    initStateHost() {
        const args = process.argv.slice(2);
        if (args.length) {
            this.host = args[0];
        }
    }

    initSession() {
        this.d(".initSession");
        const CONFIG = {
            key: 'koa.sess',
            maxAge: 86400000,
            autoCommit: true,
            overwrite: true,
            httpOnly: true,
            signed: true,
            rolling: false,
            renew: false,
            secure: false,
            sameSite: null,
        };
        this.app.keys = [ config.get('keys.session') ];
        this.app.use(session(CONFIG, this.app));
    }

    initTemplateSystem() {
        this.d(".initTemplateSystem");
        const appDir = path.dirname(require.main.filename);
        //this.app.use(koaBody(/*{ multipart: true }*/));
        this.app.use(serve(appDir + '/' + this.views_path));
        this.app.use(
            koaTwig({
                views: `${appDir}/` + this.views_path,
                extension: "twig",
                errors: false,
/*
                errors: {
                    401: "401",
                    403: "403",
                    404: "404",
                    500: "500"
                },
*/

                data: { NODE_ENV: process.env.NODE_ENV },
            })
        );
    }

    initContextState() {
        this.d(".initContextState");
        this.app.use(async (ctx, next) => {
            ctx.state.settings = config.get('settings');
            ctx.state.urlWithoutQuery = ctx.origin + ctx.path;
            await next();
        });
    }

    initLogs = () => {
        this.d(".initLogs");
        if (config.get("log.enabled")) {
            // логирование в файл
            this.app.use(morgan('common', {
                stream: fs.createWriteStream(config.get("log.path"), {flags: 'a'})
            }));
            // Логирование в консоль
            this.app.use(Logger());
        }
    }

    initFirebase() {
        const firebaseConfig = require(config.get("firebase"));
        console.log(firebaseConfig);
        const app = initializeApp(firebaseConfig);
        console.log(app);
    }

    startServer() {
        const self = this;
        const port = process.env.PORT || config.get('server.port');
        this.d(".startServer port:" + port);
        this.app.listen(port, function() {
            self.w('Server running on http://localhost:' + port);
        });
    }

}

module.exports = Init;