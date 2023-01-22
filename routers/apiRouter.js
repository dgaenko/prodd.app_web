const koaBody       = require("koa-body");
const Router        = require('koa-router');

const apiController = require('../controllers/apiController.js');
const authenticated = require('../middleware/authenticated.js');
//const upload        = require('../middleware/upload.js');

const router = new Router({
    prefix: '/api'
});
router.get('/', apiController.index);
router.get('/config', /*authenticated,*/ apiController.config);
router.get('/dict/:name', apiController.dictionary);

router.get('/user', authenticated, apiController.user);
router.post('/register', koaBody(), apiController.register);
router.post('/login', koaBody(), apiController.login);
router.patch('/user/token', koaBody(), authenticated, apiController.userToken);

router.post('/order', koaBody(), authenticated, apiController.order);
router.post('/order/calc', koaBody(), authenticated, apiController.orderCalc);
router.get('/order/:order_id', authenticated, apiController.orderData);
router.get('/orders', authenticated, apiController.orders);
router.patch('/order/:order_id/:status_id', authenticated, apiController.orderStatus);
router.get('/order/:order_id/media', koaBody(), authenticated, apiController.orderMedia);

router.post('/upload', authenticated, /*upload,*/ apiController.upload);

exports.router = router;