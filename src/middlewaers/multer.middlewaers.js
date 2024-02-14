import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cd) {
    cb(null, "./public/Temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + "-" + uniqueSufffix);
  },
});

export const upload = multer({ storage: storage });
