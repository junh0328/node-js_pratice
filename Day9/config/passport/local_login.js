let LocalStrategy = require('passport-local').Strategy;

module.exports = new LocalStrategy({
    usernameField: 'userid',
    passwordField: 'password',
    passReqToCallback: true
}, (req, userid, password, done) => {
    console.log(`passport의 로컬 로그인 호출 : userid ${userid}, password ${password} `);
    let database = req.app.get('database');
    database.MemberModel.findOne({userid: userid}, (err, user) => {
        if(err){ return done(err); }
        if(!user){
            console.log('계정이 일치하지 않습니다.');
        }
        let authenticate = user.authenticate(password, user._doc.salt, user._doc.hashed_password);
        if(!authenticate){
            console.log('비밀번호가 일치하지 않습니다.');
            return done(null, false);
        }
        return done(null, user);
    });
    
}); 