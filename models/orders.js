const Log                   = require("../components/log.js");
const { db }                = require("../components/db.js");
const { dictionaries }      = require("../models/dictionaries.js");
const { dictionaries_list } = require("../models/dictionaries.js");

class Orders extends Log {

    name = "Orders";

    constructor(db) {
        super();
        this.db = db;
    }

    async get(order_id) {
        this.d(`.get order_id:${order_id}`);
        return await this.db.asyncQuery('call sp_get_order(?)', [ order_id ]);
    }

    async getAll(user_id = null) {
        this.d(`.getAll user_id:${user_id}`);
        const res = await this.db.asyncQuery('call sp_get_orders(?)', [ user_id ]);
        return res;
    }

    async add(user_id, content, cost, delivery_id, style_id, format_id) {
        this.d(".findByToken");
        return await this.db.asyncQuery('call sp_add_order(?, ?, ?, ?, ?, ?)', [
            user_id, content, cost, delivery_id, style_id, format_id
        ]);
    }

    async setStatus(order_id, status_id) {
        this.d(`.setStatus order_id:${order_id}, status_id:${status_id}`);
        return await this.db.asyncQuery('call sp_set_order_status(?, ?)', [ order_id, status_id ]);
    }

    /**
     * Возвращает рассчитанную стоимость заказа с учетом опций
     * @param text                  Тект описание заказа (для расчета с учетом длины текста?)
     * @param delivery_id
     * @param style_id
     * @param format_id
     * @returns {Promise<number>}   Стоимость. Пример: 6
     */
    async calcCost(text, delivery_id, style_id, format_id) {
        this.d(`.calcOptionsCost text:${text} delivery_id:${delivery_id}, style_id:${style_id}, format_id:${format_id}`);
        let res = 0;
        let dicts = await dictionaries.getDictionaries();

        let val = dicts[dictionaries_list.Delivery].filter(i => i.delivery_id == delivery_id);
        if (val.length) {
            res += val[0].cost;
        }
        val = dicts[dictionaries_list.Style].filter(i => i.style_id == style_id);
        if (val.length) {
            res += val[0].cost;
        }
        val = dicts[dictionaries_list.Format].filter(i => i.format_id == format_id);
        if (val.length) {
            res += val[0].cost;
        }
        return res;
    }

}

module.exports = new Orders(db);