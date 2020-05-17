const {Router} = require('express')
const crypto = require('crypto')
const {validationResult} = require('express-validator')
const {registerValidators} = require('../utils/validators')
const {loginValidators} = require('../utils/validators')
const User = require('../models/user')
const resetEmail = require('../emails/reset')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const sendgrid = require('nodemailer-sendgrid-transport')
const keys = require('../keys')
const regEmail = require('../emails/registration')
const router = Router()

// Creating transporter for sending e-mail letters
const transporter = nodemailer.createTransport(sendgrid({
    auth: {api_key: keys.SENDGRID_API_KEY}
}))

router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Authorization', 
        isLogin: true, 
        loginError: req.flash('loginError'), 
        registerError: req.flash('registerError')
    })
})

router.post('/login', loginValidators, async (req, res) => {
    try {
        const {email, password} = req.body

        // Getting validation errors
        const errors = validationResult(req)

        // If there are any errors - pass error using flash
        // and interrupt register procedure with 422 status
        if (!errors.isEmpty()) {
            req.flash('loginError', errors.array()[0].msg)
            return res.status(422).redirect('/auth/login#login')
        }
        
        // Trying to find this user
        const candidate = await User.findOne({ email })

        // If user exists - check passed password 
        if(candidate) {

            // Check passed password and provide access to account
            const isSame = await bcrypt.compare(password, candidate.password) 
            if (isSame) {
                req.session.user = candidate
                req.session.isAuthenticated = true
                req.session.save((err) => {
                    if(err) {
                        throw(err)
                    } else {
                        res.redirect('/')
                    }
                })

            // If password isn't correct - try again
            } else {
                req.flash('loginError', 'Incorrect password')
                res.redirect('/auth/login#login')
            }

        // If user doesn't exist - try again
        } else {
            req.flash('loginError', 'User with this e-mail doesn\'t exist')
            res.redirect('/auth/login#login')
        }
    } catch(e) {
        console.log(e)
    }
})

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login#login')
    })
})

router.post('/register', registerValidators, async (req, res) => {
    try {
        const {email, password, name} = req.body

        // Getting validation errors
        const errors = validationResult(req)

        // If there are any errors - pass error using flash
        // and interrupt register procedure with 422 status
        if (!errors.isEmpty()) {
            req.flash('registerError', errors.array()[0].msg)
            return res.status(422).redirect('/auth/login#register')
        }
        
        // Calculate password's hash
        const hashPassword = await bcrypt.hash(password, 10)

        // Create new user
        const user = new User({email, name, password: hashPassword, cart: {items: []}})

        // Save this user in MongoDB
        await user.save()

        // Redirect to login page
        res.redirect('/auth/login#login')

        // Send email letter about successful registration
        await transporter.sendMail(regEmail(email))
        
    } catch(e) {
        console.log(e)
    }
})

router.get('/reset', (req, res) => {
    res.render('auth/reset', {
        title: 'Forgot password?', 
        error: req.flash('error')
    })
})

router.post('/reset', (req, res) => {
    try {
        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                req.flash('error', 'Something gone wrong, please, try again later...')
                return res.redirect('/auth/reset')
            }

            // Verification token
            const token = buffer.toString('hex')

            // Looking for passed user 
            const candidate = await User.findOne({email: req.body.email})

            // If user exists - save created token in MongoDB, set expiration time = 1hour,
            // send email with verification key and redirect to login page
            if (candidate) {
                candidate.resetToken = token
                candidate.resetTokenExp = Date.now() + 60*60*1000
                await candidate.save()
                await transporter.sendMail(resetEmail(candidate.email, token))
                res.redirect('/auth/login#login')

            // If passed user doesn't exist - create error and redirect to reset page
            } else {
                req.flash('error', 'User with this e-mail doesn\'t exist')
                res.redirect('/auth/reset')
            }
        })
    } catch (e) {
        console.log(e)
    }
})

router.get('/password/:token', async (req, res) => {
    
    // If there is no token in url - interrupt password reset
    if (!req.params.token) {
        return res.redirect('/auth/login#login')
    }

    // Looking for user with passed token and
    // checking if this token hasn't expired
    try {
        const user = await User.findOne({
            resetToken: req.params.token, 
            resetTokenExp: {$gt: Date.now()}
        })

        // If user with passed token doesn't exist - redirect to login page
        if (!user) {
            return res.redirect('/auth/login')

        // Otherwise, begin access recovery procedure
        } else {
            res.render('auth/password', {
                title: 'Reset password', 
                error: req.flash('error'), 
                userId: user._id.toString(),
                token: req.params.token
            })
        }
    } catch (e) {
        console.log(e)
    }  
})

router.post('/password', async (req, res) => {
    try {
        
        // Looking for the user
        const user = await User.findOne({
            _id: req.body.userId, 
            resetToken: req.body.token, 
            resetTokenExp: {$gt: Date.now()}
        })

        // If user has been found - change password 
        // and redirect to login page
        if (user) {
            user.password = await bcrypt.hash(req.body.password, 10)
            user.resetToken = undefined
            user.resetTokenExp = undefined
            await user.save()
            res.redirect('/auth/login#login')

        // Otherwise - create error and redirect to login page
        } else {
            req.flash('loginError', 'Access recovery period has been expired. Try again.')
            res.redirect('/auth/login#login')
        }

    } catch (e) {
        console.log(e)
    }
})

module.exports = router