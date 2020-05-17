const keys = require('../keys')

module.exports = function(email, token) {
    return {
        to: email,
        from: keys.EMAIL_FROM, 
        subject: 'Access recovery', 
        html: `
            <h1>Password reset</h1>
            <p>This letter has been sent because somebody had made a request for password reset.</p>
            <p>If you didn't do that - ignore this letter.</p>
            <p>Otherwise, follow this link: <a href="${keys.BASE_URL}/auth/password/${token}">reset password</a>. It expires in 1 hour.</p>
            <hr />
            <a href="${keys.BASE_URL}">Internet shop</a>
        `
    }
}