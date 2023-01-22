const fs          = require("fs").promises;
const mysql       = require("mysql2");
const extend      = require('util')._extend;

const QueryStatus = require('./QueryStatus.js');
const Log         = require("./log.js");


/**
 * Класс для доступа к БД. Запросы логируются с автоматической ротацией
 */
class Db extends Log {

    name            = "Db";

    port            = 3306;
    max_connections = 1500;
    charset         = 'utf8mb4';
    error_log       = 'logs/error.log';

    constructor() {
        super();
    }

    /**
     * Коннект к БД
     * @param {string} db_host      Имя хоста или объект с данными для коннекта
     * @param {string} db_user      Имя пользователя
     * @param {string} db_passwd    Пароль
     * @param {string} db_name      Имя базы данных
     */
    connect(db_host, db_user = "", db_passwd = "", db_name = "") {
        // если db_host объект - разворачиваем параметры
        let socketPath;
        if (typeof(db_host) === 'object') {
            const options = extend({}, db_host);
            db_host = options.host;
            db_user = options.user;
            db_passwd = options.password;
            db_name = options.database;
            socketPath = options.socketPath;
        }

        if (!db_host.includes(":")) {
            db_host += ":" + this.port;
        }
        const [ host, port ] = db_host.split(':');

        const db_config = {
            host: host,
            port: port,
            user: db_user,
            password: db_passwd,
            database: db_name,
            charset : this.charset,
            multipleStatements: true,
            connectionLimit : this.max_connections
        };
        if (socketPath) {
            db_config.socketPath = socketPath;
            delete(db_config.port);
        }

        this.d(".connect to " + host + ":" + port);
        this.pool = mysql.createPool(db_config);
        this.promisePool = this.pool.promise();

        this.asyncQuery("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    }

    /**
     * Асинхронных запрос к БД
     * @param {string} sql          SQL запрос
     * @param {string[]} params     массив параметров
     * @returns {Promise<*>}        Возвращает структуру:
     *                              {
     *                                  status: QueryStatus.OK | QueryStatus.ERROR,
     *                                  data: [
     *                                      object[]                    // возвращаемые данные
     *                                      object<ResultSetHeader>     // служебные данные
     *                                  ]
     *                              }
     */
    async asyncQuery1(sql, params = []) {
        this.d(".asyncQuery sql: " + sql);

        let res = {
            status: QueryStatus.OK
        };
        try {
            const [rows] = await this.promisePool.query(sql, params);
            res.data = rows[0];
        } catch (ex) {
            this.e(sql, ex);
            res.status = QueryStatus.ERROR;
            res.error = ex;
            await fs.appendFile(this.error_log, JSON.stringify(ex) + "\n");
        }
        return res;
    }

    async asyncQuery(sql, params = []) {
        this.d(".asyncQuery sql: " + sql);
        let res = {
            status: QueryStatus.OK
        };
        let conn;
        try {
            //conn = await this.promisePool.getConnection(async conn => conn);
            conn = await this.promisePool.getConnection();
            const [rows] = await conn.query(sql, params);
            res.data = rows[0];
        } catch (ex) {
            this.e(sql, ex);
            res.status = QueryStatus.ERROR;
            res.error = ex;
            //await fs.appendFile(this.error_log, JSON.stringify(ex) + "\n");
        } finally {
            if (conn) await conn.release();
        }
        return res;
    }

    /**
     * Завершает соединение с БД
     */
    close() {
        this.d(".close");
        this.pool.end();
    }

}

module.exports = {
    db: new Db(),
    QueryStatus: QueryStatus
};