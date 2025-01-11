import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req,file,cb){
        cb(null,"./public/temp")
    },
    filename: function (req,file,cb){
        cb(null, Date.now() + " - " + file.originalname);
    }
})

export const upload = multer ({
    // storage: storage,   
    storage,  // in es6 same things are kept once only
});