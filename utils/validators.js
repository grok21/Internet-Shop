const {body} = require('express-validator')
const User = require('../models/user')

exports.registerValidators = [
    body('name', 'Name should be at least 2 symbols')
      .trim()
      .isLength({min: 2}),

    body('email', 'Input correct e-mail')
      .trim()  
      .isEmail()
      .custom(async (value, {req}) => {
        try {
            const candidate = await User.findOne({email: value})
            if (candidate) {
                return Promise.reject('User with this e-mail already exists')
            }
        } catch (e) {
            console.log(e)
        }
      })
      .normalizeEmail({ gmail_remove_dots: false }), 

    body('password', 'Password should be at least 6 symbols')
      .trim()
      .isLength({min: 6, max: 56}),

    body('confirm')
      .trim()
      .custom((value, {req}) => {
        if (value !== req.body.password) {
            throw new Error('Passwords should match')
        }
        return true
      })
]

exports.loginValidators = [
    body('email', 'Input correct e-mail')
      .trim()
      .isEmail()
      .normalizeEmail({ gmail_remove_dots: false }),
    
    body('password', 'Password should be at least 6 symbols')
      .trim()
      .isLength({min: 6, max: 56})
]

exports.courseValidators = [
    body('title', 'Title should be at least 3 symbols').isLength({min: 3})
      .trim(),

    body('price', 'Input correct price')
      .trim()
      .isNumeric(),
      

    body('img', 'Input correct URL')
      .trim()
      .isURL()
]