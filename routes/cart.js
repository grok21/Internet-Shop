const {Router} = require('express')
const Course = require('../models/course')
const auth = require('../middleware/auth')
const router = Router()


function mapCartItems(cart) {
    return cart.items.map(c => ({
        ...c.courseId._doc, 
        id: c.courseId.id,
        count: c.count
    }))
}

function computePrice(courses) {
    return courses.reduce((total, c) => (total += c.price * c.count), 0)
}

router.post('/add', auth, async (req, res) => {
    
    // Add chosen course to the cart
    const course = await Course.findById(req.body.id)
    await req.user.addToCart(course)
    res.redirect('/cart')
})

router.get('/', auth, async (req, res) => {
    
    // Add cart to current user
    const user = await req.user 
                        .populate('cart.items.courseId')
                        .execPopulate()

    // Get courses list for current user
    const courses = mapCartItems(user.cart)

    // Render cart
    res.render('cart', {
        title: 'Cart', 
        isCart: true, 
        courses: courses,
        price: computePrice(courses)
    })
})

router.delete('/remove/:id', auth, async (req, res) => {
    
    // Remove course from the cart
    await req.user.removeFromCart(req.params.id)

    // Add cart to user object
    const user = await req.user.populate('cart.items.courseId').execPopulate()
    
    // Get new list of courses
    const courses = mapCartItems(user.cart)
    const cart = {
        courses, price: computePrice(courses)
    }
    res.status(200).json(cart)
})

module.exports = router