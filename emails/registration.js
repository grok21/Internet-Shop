const keys = require('../keys')

module.exports = function(email) {
    return {
        to: email,
        from: keys.EMAIL_FROM, 
        subject: 'Account has been created', 
        html: `
            <h1>Welcome to our internet shop</h1>
            <p>Registration of your account has been completed successfully with e-mail - ${email}</p>
            <hr />
            <a href="${keys.BASE_URL}">Internet shop</a>
        `
    }
}