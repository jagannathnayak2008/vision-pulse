import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type '${file.mimetype}'. Only JPEG, PNG, and WebP images are allowed.`), false);
  }
};

export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter,
}).single("imageFile");

export const uploadComparison = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
  },
  fileFilter,
}).fields([
  { name: "baselineImage", maxCount: 1 },
  { name: "currentImage", maxCount: 1 },
]);

