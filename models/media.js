const { db }    = require("../components/db.js");
const Log       = require("../components/log.js");

const MediaType = {
    Logo: 1,
    Media: 2
}

class Media extends Log {

    name = "Media";

    constructor(db) {
        super();
        this.db = db;
    }

    async getOrderMedia(order_id) {
        this.d(`.getOrderMedia order_id:${order_id}`);
        return await this.db.asyncQuery('call sp_get_order_media(?)', [ order_id ]);
    }

    async add(order_id, type_id, src) {
        this.d(`.add order_id: ${order_id} type_id: ${type_id} src: ${src}`);
        return await this.db.asyncQuery('call sp_add_media(?, ?, ?)', [ order_id, type_id, src ]);
    }

}

module.exports = {
    media_type: MediaType,
    media: new Media(db)
};