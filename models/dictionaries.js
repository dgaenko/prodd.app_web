const { db, QueryStatus } = require("../components/db.js");
const Log                 = require("../components/log.js");

const DictionariesList = {
    Delivery: 'delivery',
    Style: 'style',
    Format: 'format',
    Status: 'status',
    MediaTypes: 'media_types',
    Platform: 'platform'
}

class Dictionaries extends Log {

    name = "Dictionaries";

    constructor(db) {
        super();
        this.db = db;
    }

    /**
     * Возвращает имя таблицы для словаря
     * @param {string} name     Имя словаря (см. DictionariesList ключи)
     * @returns {string}        Имя таблицы в БД. Пример: tbl_delivery
     */
    getDictionaryTable(name) {
        let table_name;
        switch (name) {
            case DictionariesList.Delivery:
                table_name = 'tbl_delivery';
                break;
            case DictionariesList.Style:
                table_name = 'tbl_style';
                break;
            case DictionariesList.Format:
                table_name = 'tbl_format';
                break;
            case DictionariesList.Status:
                table_name = 'tbl_status';
                break;
            case DictionariesList.MediaTypes:
                table_name = 'tbl_media_types';
                break;
            case DictionariesList.Platform:
                table_name = 'tbl_platform';
                break;
        }
        return table_name;
    }

    async getDictionary(name) {
        this.d(`.getDictionary name:${name}`);

        let result;
        let table_name = this.getDictionaryTable(name);
        if (table_name) {
            const res = await this.db.asyncQuery('call sp_get_dictionary(?)', [ table_name ]);
            if (res.status === QueryStatus.OK && res.data.length) {
                result = res.data;
            }
        }
        return result;
    }

    /**
     * Возвращает объект со всеми словарями. Имена словарей в качестве ключей объекта
     * @returns {Promise<{}>}
     * Пример:
     * {
     *   delivery: [
     *     { delivery_id: 1, title: 'FAST', cost: 0, active: 1 },
     *     { delivery_id: 2, title: 'NORM', cost: 0, active: 1 },
     *     { delivery_id: 3, title: 'SLOW', cost: 0, active: 1 }
     *   ],
     *   ...
     * }
     */
    async getDictionaries() {
        let result = {}, res;
        for (let dict in DictionariesList) {
            res = await this.getDictionary(DictionariesList[dict]);
            result[DictionariesList[dict]] = res;
        }
        return result;
    }

}

module.exports = {
    dictionaries_list: DictionariesList,
    dictionaries: new Dictionaries(db)
};