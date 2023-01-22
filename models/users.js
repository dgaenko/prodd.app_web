const bcrypt   = require('bcrypt');
const CryptoJS = require("crypto-js");
const SHA256   = require("crypto-js/sha256");

const { db, QueryStatus } = require("../components/db.js");
const Log                 = require("../components/log.js");

class Users extends Log {

    name = "Users";
    saltRounds = 10;

    constructor(db) {
        super();
        this.db = db;
    }

    /**
     * Возвращает хэш пароля
     * @param string passwd     Хешируемый пароль
     * @returns string          Вычисленный хеш
     */
    createPasswordHash(passwd) {
        this.d(".createPasswordHash");
        const salt = bcrypt.genSaltSync(this.saltRounds);
        return bcrypt.hashSync(passwd.toString(), salt);
    }

    createAccessToken() {
        this.d(".createAccessToken");
        return SHA256(new Date().getTime().toString()).toString();
    }

    /**
     * Проверка переданного пароля и хеша пароля из БД
     * @param string password       Проверяемый пароль
     * @param string passwordHash   Хэш пароля
     * @returns boolean             Соответствует ли пароль хешу
     */
    async checkPassword(password, passwordHash) {
        this.d(".checkPassword");
        return await bcrypt.compare(password, passwordHash);
    }

    async add(name, email, password, ip = "") {
        this.d(`.add name:${name} email:${email}, password:${password} ip:${ip}`);
        const hash = this.createPasswordHash(password);
        return await this.db.asyncQuery('call sp_add_user(?, ?, ?, ?)', [ name, email, hash, ip ]);
    }

    async setAccessToken(user_id, token) {
        this.d(`.setAccessToken user_id:${user_id} token:${token}`);
        await db.asyncQuery("call sp_set_user_token(?, ?)", [ user_id, token ]);
    }

    async findByToken(token, sanitize = 0) {
        this.d(".findByToken");
        let result;
        const res = await this.db.asyncQuery('call sp_find_user_by_token(?, ?)', [ token, sanitize ]);
        if (res.status === QueryStatus.OK && res.data.length) {
            result = res.data[0];
        }
        return result;
    }

    async login(email, password) {
        this.d(".login");
        let result;
        const res = await this.db.asyncQuery('call sp_find_user_by_email(?, ?)', [ email, 1 ]);
        if (res.status === QueryStatus.OK && res.data.length && await this.checkPassword(password, res.data[0].passwd)) {
            result = res.data[0];
        }
        return result;
    }

    async setFirebaseToken(user_id, platform_id, token) {
        this.d(`.setFirebaseToken user_id:${user_id} platform_id:${platform_id} token:${token}`);
        return await db.asyncQuery("call sp_set_user_fbtoken(?, ?, ?)", [ user_id, platform_id, token ]);
    }

}

module.exports = new Users(db);