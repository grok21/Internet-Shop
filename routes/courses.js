const {Router} = require('express')
const {courseValidators} = require('../utils/validators')
const {validationResult} = require('express-validator')
const Course = require('../models/course')
const auth = require('../middleware/auth')
const router = Router()

// If user knows needed course id, which he didn't created, he could get
// access to editing it by using direct link. This condition prohibits such actions
function isOwner(course, req) {
    return course.userId.toString() === req.user._id.toString()
}

router.get('/', async (req, res) => {
    try {

        // Get all courses from MongoDB
        // and render page with list of them
        const courses = await Course.find().lean()
                                .populate('userId', 'email name')
                                .select('price title img')

        console.log(courses)
        res.render('courses', {
            title: 'Courses', 
            isCourses: true, 
            userId: req.user ? req.user._id.toString() : null,
            courses
        })
    } catch (e) {
        console.log(e)
    }
})

router.get('/:id/edit', auth, async (req, res) => {
    
    // Check query parameter 'allow'
    if (!req.query.allow) {
        return res.redirect('/')
    }

    try {

        // Looking for needed course in MongoDB
        const course = await Course.findById(req.params.id).lean()

        // Prohibit editing someone else's courses
        if (!isOwner(course, req)) {
            return res.redirect('/courses')
        }

        // Rendering needed page
        res.render('course-edit', {
            title: `Edit ${course.title}`, 
            course
        })

    } catch (e) {
        console.log(e)
    }
})

router.post('/edit', auth, courseValidators, async (req, res) => {
    
    // Get course id from page body
    const {id} = req.body

    // Get validation errors
    const errors = validationResult(req)
    
    // If there are any errors - try again
    if (!errors.isEmpty()) {
        return res.status(422).redirect(`/courses/${id}/edit?allow=true`)
    }
     
    try {

        // Looking for needed course in MongoDB
        delete req.body.id
        const course = await Course.findById(id)

        // Prohibit editing someone else's courses
        if (!isOwner(course, req)) {
            return res.redirect('/courses')
        }
        
        // Save changes and redirect to courses page
        Object.assign(course, req.body)
        await course.save()
        res.redirect('/courses')

    } catch (e) {
        console.log(e)
    }
})

router.get('/:id', async (req, res) => {
    try {
        
        // Looking for needed course in MongoDB
        const course = await Course.findById(req.params.id).lean()
    
        // Render its page
        res.render('course', {
            layout: 'empty', 
            title: `Course ${course.title}`,
            course
        })
    } catch (e) {
        console.log(e)
    }
})

router.post('/remove', auth, async (req, res) => {
    try {
        
        // Delete needed course
        await Course.deleteOne({
            _id: req.body.id, 
            userId: req.user._id
        })

        // Redirect to courses page
        res.redirect('/courses')
    } catch(e) {
        console.log(e);
    }
})

module.exports = router