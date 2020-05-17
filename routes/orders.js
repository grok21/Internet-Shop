const {Router} = require('express')
const Order = require('../models/order')
const auth = require('../middleware/auth')
const router = Router()

router.get('/', auth, async (req, res) => {
    try {
        
        // Download all user orders
        // and render them on the page
        const orders = await Order.find({'user.userId': req.user._id})
                                  .populate('user.userId')
                                  .lean()
        
        res.render('orders', {
            isOrder: true, 
            title: 'Orders', 
            orders: orders.map(o => {
                return {
                    ...o, 
                    price: o.courses.reduce((total,c) => {
                        return total += c.count * c.course.price
                    }, 0)
                }
            })
        })
    } catch (e) {
        console.log(e)
    }
})

router.post('/', auth, async (req, res) => {
    try {

        // Get elements from the cart
        const user = await req.user
                        .populate('cart.items.courseId')
                        .execPopulate()
    
        // Create courses list for current order
        const courses = user.cart.items.map(c => ({
            count: c.count, 
            course: {...c.courseId._doc}
        }))
        
        // Create new order 
        const order = new Order({
            user: {
                name: req.user.name,
                userId: req.user
            },
            courses
        })

        // Save this order for current user,
        // clear his cart and redirect to orders page
        await order.save()
        await req.user.clearCart()

        res.redirect('/orders')

    } catch(e) {
        console.log(e)
    }
})

module.exports = router
