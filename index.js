const keys = require('./keys')
const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const csrf = require('csurf')
const flash = require('connect-flash')
const mongoose = require('mongoose')
const helmet = require('helmet')
const compression = require('compression')
const session = require('express-session')
const MongoStore = require('connect-mongodb-session')(session)
const homeRoutes = require('./routes/home')
const cartRoutes = require('./routes/cart')
const addRoutes = require('./routes/add')
const coursesRoutes = require('./routes/courses')
const ordersRoutes = require('./routes/orders')
const authRoutes = require('./routes/auth')
const profileRoutes = require('./routes/profile')
const varMiddleware = require('./middleware/variables')
const userMiddleware = require('./middleware/user')
const errorHandler = require('./middleware/error')
const fileMiddleware = require('./middleware/file')


// Creating new express app 
const app = express()

// Creating handlebars engine
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs', 
    helpers: require('./utils/hbs-helpers'),
    allowProtoMethodsByDefault: true, 
    allowProtoPropertiesByDefault: true
})

// Saving sessions in MongoDB
const store = new MongoStore({
    collection: 'sessions', 
    uri: keys.MONGODB_URI
})

// Handlebars-engine register
app.engine('hbs', hbs.engine)

// Handlebars-engine activating 
app.set('view engine', 'hbs')

// Pages folder register (folder views)
app.set('views', 'views')

// Styles and images folder register
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(express.urlencoded({extended: true}))

// Create session 
app.use(session({
    secret: keys.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false, 
    store
}))

// Avatar uploading middleware
app.use(fileMiddleware.single('avatar'))

// Session protection
app.use(csrf())

// Middleware for errors transfering
app.use(flash())

// Using helmet and compression
app.use(helmet())
app.use(compression())

// Creating flag of authentication
app.use(varMiddleware)

// Transforming user data to model 'User'
app.use(userMiddleware)

// Routes
app.use('/', homeRoutes)
app.use('/add', addRoutes)
app.use('/courses', coursesRoutes)
app.use('/cart', cartRoutes)
app.use('/orders', ordersRoutes)
app.use('/auth', authRoutes)
app.use('/profile', profileRoutes)

// Error 404
app.use(errorHandler)

const PORT = process.env.PORT || 3000

async function start() {
    try {
        await mongoose.connect(keys.MONGODB_URI, {
            useNewUrlParser: true, 
            useUnifiedTopology: true, 
            useFindAndModify: false
        })

        app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}...`)
    })
    } catch (e) {
        console.log(e);
    }
}

start()