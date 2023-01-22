const config                = require('config');
const path                  = require('path');
const { QueryStatus }       = require("../components/db.js");
const Log                   = require("../components/log.js");
const orders                = require('../models/orders.js');
const { dictionaries_list } = require('../models/dictionaries.js');
const { dictionaries }      = require('../models/dictionaries.js');
const { media }             = require("../models/media.js");
const { media_type }        = require("../models/media.js");
const Utils                 = require("../components/Utils.js");


const { getAuth, signInWithCredential, GoogleAuthProvider } = require("firebase/auth");


class SiteController extends Log {

    name = "SiteController";

    constructor() {
        super();
    }

    /**
     * Для вывода главной страницы
     */
    async index(ctx) {
        self.d(".index");
        await ctx.render("index", {
            content: 'start.twig'
        });
    }

    async test(ctx) {
        self.d(".test");

        const { id_token } = ctx.request.body;

        try {
            const credential = GoogleAuthProvider.credential(id_token);
            const auth = getAuth();
            const result = await signInWithCredential(auth, credential);
            console.log(result);
            console.log(result.user.displayName, result.user.email);
        } catch (ex) {
            console.log(ex);
        }

        ctx.body = {
            status: "OK"
        };
    }

    async login(ctx) {
        self.d(".login");

        const data = {
            content: 'login/login.twig',
            GOOGLE_CLIENT_ID: config.get("GOOGLE_CLIENT_ID"),
            FACEBOOK_APP_ID: config.get("FACEBOOK_APP_ID")
        }
        await ctx.render("index", data);
    }

    async main(ctx) {
        self.d(".main");
        await ctx.render("index", {
            content: 'main.twig'
        });
    }

    async orders(ctx) {
        self.d(".orders");

        const data = {
            content: 'orders.twig'
        }

        let res = await orders.getAll(ctx.session.user['user_id']);
        if (res.status === QueryStatus.OK) {
            data.orders = res.data;
        }

        const filters = {};
        res = await dictionaries.getDictionary(dictionaries_list.Status);
        for (let i in res) {
            filters[res[i].status_id] = res[i];
        }
        data.statuses = filters;
        console.log(data);

        await ctx.render("index", data);
    }

    async order(ctx) {
        self.d(".order");

        const data = {
            content: 'order.twig',
        }

        const order_id = ctx.params.order_id;
        let res = await orders.get(order_id);
        if (res.status === QueryStatus.OK && res.data.length) {
            data.site = "https://" + Utils.getDomain(ctx.request.header.host) + "/";
            data.order =  res.data[0];
            const dicts = await dictionaries.getDictionaries();
            res = dicts[dictionaries_list.Status].filter(i => i.status_id === data.order.status_id);
            data.order.status = res[0];
            res = dicts[dictionaries_list.Delivery].filter(i => i.delivery_id === data.order.delivery_id);
            data.order.delivery = res[0];
            res = dicts[dictionaries_list.Style].filter(i => i.style_id === data.order.style_id);
            data.order.style = res[0];
            res = dicts[dictionaries_list.Format].filter(i => i.format_id === data.order.format_id);
            data.order.format = res[0];

            res = await media.getOrderMedia(order_id);
            for (let i in res.data) {
                res.data[i].ext = path.extname(res.data[i].src).substr(1);
            }
            data.order.logo = res.data.filter(i => i.type_id === media_type.Logo)[0];
            data.order.media = res.data;
            console.log(data);
        }

        await ctx.render("index", data);
    }

    async newOder(ctx) {
        self.d(".newOder");

        let data = {};
        try {
            data = {
                content: 'new/new.twig',
                settings: config.get("settings"),
                dicts: await dictionaries.getDictionaries()
            }
            console.log(data);
        } catch (ex) {
            self.e(ex);
        }

        await ctx.render("index", data);
    }

}

const self = new SiteController();
module.exports = self;