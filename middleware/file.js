const multer = require('multer')

// Saving image with needed name
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'images')
    }, 
    filename(req, file, cb) {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    }
})

// Image format validation
const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg']

const fileFilter = (req, file, cb) => {
    
    // Validation ok
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    
    // Validation not ok
    } else {
        cb(null, false)
    }
}

module.exports = multer({
    storage, fileFilter
})