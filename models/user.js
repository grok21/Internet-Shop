const {Schema, model} = require('mongoose')

const userSchema = new Schema({
    email: {
        type: String, 
        required: true
    }, 
    name: String, 
    password: {
        type: String, 
        required: true
    },
    cart: {
        items: [
            {
                count: {
                    type: Number, 
                    required: true, 
                    default: 1
                }, 
                courseId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Course',
                    required: true
                }
            }
        ]
    },
    avatarUrl: String, 
    resetToken: String, 
    resetTokenExp: Date
})

userSchema.methods.addToCart = function(course) {
    
    // Getting list of courses in the cart
    const items = [...this.cart.items]
    
    // Looking for index of passed course
    const index = items.findIndex(c => {
        return c.courseId.toString() === course._id.toString()
    })

    // If course already exists - increment its count
    if (index >= 0) {
        items[index].count = items[index].count + 1
    
    // If not - create and set count to 1
    } else { 
        items.push({
            courseId: course._id,
            count: 1
        })
    }

    // Update current cart
    this.cart = {items}

    // Save changes in MongoDB
    return this.save()
}

userSchema.methods.removeFromCart = function(id) {
    let items = [...this.cart.items]
    const index = items.findIndex(c => { return c.courseId.toString() === id.toString() })

    // If amount = 1 - delete course from the cart
    if (items[index].count === 1) {
        items = items.filter(c => c.courseId.toString() !== id.toString())

    // If amount > 1 -  decrement its count   
    } else {
        items[index].count--
    }

    // Update current cart
    this.cart = {items}

    // Save changes in MongoDB
    return this.save()
}

// Delete all items from current cart
userSchema.methods.clearCart = function() {
    this.cart = {items: []}
    return this.save()
}

module.exports = model('User', userSchema)