const config = require("config");
const path   = require("path");
const multer = require('@koa/multer');

module.exports = async (ctx, next) => {
    console.log("middleware/upload");
    const upload_dir = path.join(process.cwd(), config.get("settings.upload_dir"));
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, upload_dir);
        },
        filename: function (req, file, cb) {
            const filetypes = /jpeg|jpg|png|gif/;
            const mimetype = filetypes.test(file.mimetype);
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            if (mimetype && extname) {
                cb(null, `${file.originalname}`);
            }
            cb("Error: File upload only supports the following filetypes - " + filetypes);
        },
    });
    multer({ storage: storage }).single('file')(ctx, next);
}