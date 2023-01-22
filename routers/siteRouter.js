const koaBody   = require("koa-body");
const Router    = require('koa-router');

const siteController = require('../controllers/siteController.js');

const router = new Router();
router.get('/', siteController.index);
router.get('/test', siteController.test);
router.post('/test', koaBody(), siteController.test);
router.get('/login', siteController.login);
router.get('/main', siteController.main);
router.get('/orders', siteController.orders);
router.get('/order/:order_id', siteController.order);
router.get('/new', siteController.newOder);

exports.router = router;