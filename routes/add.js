const {Router} = require('express')
const {validationResult} = require('express-validator')
const Course = require('../models/course')
const auth = require('../middleware/auth')
const {courseValidators} = require('../utils/validators')
const router = Router()

router.get('/', auth, (req, res) => {
    res.render('add', {
        title: 'Add course', 
        isAdd: true
    })
})

router.post('/', auth, courseValidators, async (req, res) => {
    
    // Get validation errors
    const errors = validationResult(req)
    
    // If there are any errors - try again
    if (!errors.isEmpty()) {
        return res.status(422).render('add', {
            title: 'Add course', 
            isAdd: true, 
            error: errors.array()[0].msg, 
            data: {
                title: req.body.title,
                price: req.body.price,
                img: req.body.img
            }
        })
    }

    // Create new course
    const course = new Course({
        title: req.body.title,
        price: req.body.price,
        img: req.body.img,
        userId: req.user
    })

    // Save new course in MongoDB 
    // and redirect to courses page
    try {
        await course.save()
        res.redirect('/courses')
    } catch(e) {
        console.log(e)
    }
})

module.exports = router