const config            = require('config');
const path              = require("path");
const fs                = require('fs/promises');
const moment            = require("moment");
const multer            = require('@koa/multer');

const Log               = require("../components/log.js");
const { QueryStatus }   = require("../components/db.js");
const Utils             = require("../components/Utils.js");
const users             = require('../models/users.js');
const user_roles        = require('../models/user_roles.js');
const { dictionaries }  = require('../models/dictionaries.js');
const orders            = require('../models/orders.js');
const { media }         = require('../models/media.js');
const {isArray} = require("lodash");

class ApiController extends Log {

    name = "ApiController";

    constructor() {
        super();
    }

    defaultSuccessResponse() {
        return {
            "status": "OK"
        }
    }
    defaultErrorResponse() {
        return {
            "status": "ERROR",
            "message": ""
        }
    }

    sendResponse(ctx, response, code = null) {
        if (!code) {
            ctx.status = response.status === "OK" ? 200 : 400;
        } else {
            ctx.status = code;
        }
        ctx.body = response;
    }

    /**
     * Удаление загруженных файлов в случае ошибки
     * @param files
     * @returns {Promise<void>}
     */
    async unlinkFile(files) {
        for (let i in files) {
            try {
                await fs.unlink(files[i].path);
            } catch (ex) {
                self.e(ex);
            }
        }
    }



    async index(ctx) {
        self.d(".index");
        self.sendResponse(ctx, self.defaultSuccessResponse());
    }

    async config(ctx) {
        self.d(".config");
        let response = self.defaultSuccessResponse();
        try {
            response.config = {
                max_file_size_mb: config.get("settings.max_file_size_mb"),
                valid_exts: config.get("settings.valid_exts"),
                defaults: config.get("settings.defaults")
            }
        } catch (ex) {
            self.e(ex);
        }
        self.sendResponse(ctx, response);
    }

    /**
     * Возвращает данные справочников (delivery, style, format)
     */
    async dictionary(ctx) {
        self.d(".index");
        let response = self.defaultErrorResponse();
        const res = await dictionaries.getDictionary(ctx.params['name']);
        if (res) {
            response = self.defaultSuccessResponse();
            response.list = res;
        }
        self.sendResponse(ctx, response);
    }


    /**
     * Регистрация пользователей
     */
    async register(ctx) {
        self.d(".register");

        let response = self.defaultErrorResponse();

        const { email, password, name } = ctx.request.body;
        if (!email) {
            response.message = "Email is required";
        } else
        if (!password) {
            response.message = "Password is required";
        } else

        try {
            const res = await users.add(
                name.substr(0, 255),
                email.substr(0, 255),
                password.substr(0, 255),
                Utils.parseRealIp(ctx.request.header['x-real-ip'])
            );
            if (res.status === QueryStatus.OK) {
                const token = users.createAccessToken();
                await users.setAccessToken(res.data[0].user_id, token);
                response = self.defaultSuccessResponse();
                response.token = token;
            } else {
                console.log(res);
                response.message = res.error.sqlMessage.replace(/ for key.*/, "");
            }
        } catch (e) {
            console.log(e);
        }

        self.sendResponse(ctx, response);
    }

    /**
     * Авторизация пользователей
     */
    async login(ctx) {
        self.d(".login");

        let response = self.defaultErrorResponse();

        let http_code;
        const { email, password } = ctx.request.body;
        if (!email) {
            response.message = "Email is required";
        } else
        if (!password) {
            response.message = "Password is required";
        } else {
            const user = await users.login(
                email.substr(0, 255),
                password.substr(0, 255)
            );
            if (user) {
                const token = users.createAccessToken();
                await users.setAccessToken(user.user_id, token);
                response = self.defaultSuccessResponse();
                response.token = token;
            } else {
                http_code = 401;
                response.message = "Invalid email or password";
            }
        }

        self.sendResponse(ctx, response, http_code);
    }

    /**
     * Возвращает данные учетной записи пользователя
     */
    async user(ctx) {
        self.d(".user");
        const response = self.defaultSuccessResponse();
        response.user = ctx.session.user;
        self.sendResponse(ctx, response);
    }

    async userToken(ctx) {
        self.d(".user");

        let response = self.defaultErrorResponse();

        let platform_id = ctx.request.headers['x-platform'];
        const token = ctx.request.body.token;
        if (!platform_id) {
            response.message = "Platform is required";
        } else
        if (!token) {
            response.message = "Firebase token is required";
        } else

        try {
            const user_id = ctx.session.user['user_id'];
            platform_id = parseInt(platform_id);
            const res = await users.setFirebaseToken(user_id, platform_id, token);
            if (res.status === QueryStatus.OK) {
                response = self.defaultSuccessResponse();
            } else {
                response.message = res.error.message;
            }
        } catch (ex) {
            console.log(ex);
        }

        self.sendResponse(ctx, response);
    }


    /**
     * Создание заказа
     */
    async order(ctx) {
        self.d(".order");

        let response = self.defaultErrorResponse();

        const { content, delivery_id, style_id, format_id } = ctx.request.body;
        if (!content) {
            response.message = "Content is required";
        } else
        if (!delivery_id) {
            response.message = "Delivery ID is required";
        } else
        if (!style_id) {
            response.message = "Style ID is required";
        } else
        if (!format_id) {
            response.message = "Format ID is required";
        } else

        try {
            const user_id = ctx.session.user['user_id'];
            const cost = await orders.calcCost(content, delivery_id, style_id, format_id);
            const res = await orders.add(user_id, content, cost, delivery_id, style_id, format_id);
            if (res.status === QueryStatus.OK && res.data.length) {
                response = self.defaultSuccessResponse();
                response.order = res.data[0];
            } else {
                response.message = res.error.message;
            }
        } catch (ex) {
            console.log(ex);
        }

        self.sendResponse(ctx, response);
    }

    async orderCalc(ctx) {
        self.d(".orderCalc");

        let response = self.defaultErrorResponse();
        const { content, delivery_id, style_id, format_id } = ctx.request.body;
        if (content == undefined) {
            response.message = "Content is required";
        } else
        if (!delivery_id) {
            response.message = "Delivery ID is required";
        } else
        if (!style_id) {
            response.message = "Style ID is required";
        } else
        if (!format_id) {
            response.message = "Format ID is required";
        } else

        try {
            response = self.defaultSuccessResponse();
            response.cost = await orders.calcCost(content, delivery_id, style_id, format_id);
        } catch (ex) {
            console.log(ex);
        }

        self.sendResponse(ctx, response);
    }

    async orderData(ctx) {
        self.d(".orderData");

        let response = self.defaultErrorResponse();
        const { order_id } = ctx.params;
        if (!order_id) {
            response.message = "Order ID is required";
        } else
        try {
            let res = await orders.get(order_id);
            if (res.status === QueryStatus.OK) {
                if (res.data.length && (
                    res.data[0].user_id === ctx.session.user.user_id ||
                    ctx.session.user.role_id === user_roles.Admin
                )) {
                    response = self.defaultSuccessResponse();
                    response.site = "https://" + Utils.getDomain(ctx.request.header.host) + "/";
                    response.order = res.data[0];
                    res = await media.getOrderMedia( response.order.order_id);
                    response.order.media = res.data;
                    //console.log(res);
                } else {
                    response.message = "Access denied";
                }
            } else {
                response.message = res.error.message;
            }
        } catch (e) {
            console.log(e);
        }
        self.sendResponse(ctx, response);
    }

    /**
     * Список заказов пользователя
     */
    async orders(ctx) {
        self.d(".order");
        let response = self.defaultSuccessResponse();
        try {
            const user_id = ctx.session.user.role_id === user_roles.Admin
                ? 0
                : ctx.session.user['user_id'];
            const res = await orders.getAll(user_id);
            response.orders = res.data;
        } catch (ex) {
            console.log(ex);
            response = self.defaultErrorResponse();
            response.message = ex.message;
        }

        self.sendResponse(ctx, response);
    }

    async orderStatus(ctx) {
        self.d(".orderStatus");

        let response = self.defaultErrorResponse();

        const { order_id, status_id } = ctx.params;
        if (!order_id) {
            response.message = "Order ID is required";
        } else
        if (!status_id) {
            response.message = "Status is required";
        } else

        try {
            let res = await orders.get(order_id);
            if (res.status === QueryStatus.OK) {
                if (res.data.length && ctx.session.user.role_id === user_roles.Admin) {
                    res = await orders.setStatus(order_id, status_id);
                    if (res.status === QueryStatus.OK) {
                        response = self.defaultSuccessResponse();
                    } else {
                        response.message = res.error.message;
                    }
                } else {
                    response.message = "Access denied";
                }
            } else {
                response.message = res.error.message;
            }
        } catch (e) {
            console.log(e);
        }

        self.sendResponse(ctx, response);
    }

    async orderMedia(ctx) {
        self.d(".orderMedia");

        let response = self.defaultErrorResponse();
        const { order_id } = ctx.params;
        if (!order_id) {
            response.message = "Order ID is required";
        } else
            try {
                let res = await orders.get(order_id);
                if (res.status === QueryStatus.OK) {
                    if (res.data.length && (
                        res.data[0].user_id === ctx.session.user.user_id ||
                        ctx.session.user.role_id === user_roles.Admin
                    )) {
                        res = await media.getOrderMedia(order_id);
                        if (res.status === QueryStatus.OK) {
                            response = self.defaultSuccessResponse();
                            response.site = "https://" + Utils.getDomain(ctx.request.header.host) + "/";
                            response.list = res.data;
                        } else {
                            response.message = res.error.message;
                        }
                    } else {
                        response.message = "Access denied";
                    }
                } else {
                    response.message = res.error.message;
                }
            } catch (e) {
                console.log(e);
            }

        self.sendResponse(ctx, response);
    }

    async upload(ctx, next) {
        self.d(".upload");

        let response = self.defaultErrorResponse();

        try {
            const upload_dir = path.join(process.cwd(), config.get("settings.upload_dir"));
            const storage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, upload_dir);
                },
                filename: function (req, file, cb) {
                    let filetypes = [];
                    config.get("settings.valid_exts").split(",").forEach(el => {
                        filetypes.push(el.replace(".", ""));
                    });
                    filetypes = new RegExp(filetypes.join("|"));
                    const mimetype = filetypes.test(file.mimetype);
                    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
                    if (mimetype && extname) {
                        const tm = moment().format('x');
                        const filename = file.originalname.replace(/[^0-9a-z\.]/ig, '');
                        cb(null, `${tm}_${filename}`);
                    } else {
                        cb("File upload only supports the following filetypes: " + filetypes);
                    }
                },
            });
            const limits = {
                fields: 10,
                fileSize: config.get("settings.max_file_size_mb") * 1024 * 1024,
                files: 10
            }
            const upload = multer({
                storage: storage,
                limits,
                fileFilter: function(req, file, cb){
                    cb(null, true);
                }
            }).any();
            await upload(ctx, next);

            let { order_id, type_id } = ctx.request.body;
            // если загружают пачку файлов - берем по первым значениям
            if (isArray(order_id)) order_id = order_id[0];
            if (isArray(type_id)) type_id = type_id[0];

            if (!order_id) {
                response.message = "Order ID is required";
                await self.unlinkFile(ctx.files);
            } else
            if (!type_id) {
                response.message = "Type ID is required";
                await self.unlinkFile(ctx.files);
            } else {

                // проверка существования заказа и прав доступа
                let res = await orders.get(order_id);
                if (res.status === QueryStatus.OK) {
                    if (res.data.length && (
                        res.data[0].user_id === ctx.session.user.user_id ||
                        ctx.session.user.role_id === user_roles.Admin
                    )) {
                        response = self.defaultSuccessResponse();
                        response.file = [];
                        for (let i in ctx.files) {
                            const filepath = config.get("settings.upload_dir") + ctx.files[i].filename;
                            res = await media.add(order_id, type_id, filepath);
                            if (res.status === QueryStatus.OK && res.data.length) {
                                response.file.push({
                                    path: config.get("settings.site_url") + filepath
                                });
                            } else {
                                response.status = "ERROR";
                                response.message = res.error.message;
                                await self.unlinkFile([ ctx.files[i] ]);
                            }
                        }
                    } else {
                        response.message = "Access denied";
                        await self.unlinkFile(ctx.files);
                    }
                } else {
                    response.message = res.error.message;
                    await self.unlinkFile(ctx.files);
                }
            }
        } catch (ex) {
            self.e("ERROR", ex);
            response.message = ex.message;
            //await self.unlinkFile(ctx.files);
        }

        self.sendResponse(ctx, response);
    }

}

const self = new ApiController();
module.exports = self;