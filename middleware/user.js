// This middleware is needed to transform user data 
// to model 'User' and get access to its functions
// For example, to add items by 'addToCart' function
const User = require('../models/user')

module.exports = async function(req, res, next) {
    // If there is no user - then continue
    if (!req.session.user) {
        return next()
    }

    // Transforming data to model
    req.user = await User.findById(req.session.user._id)
    next()
}