// passport 회원가입

// npm install passport-local
let LocalStrategy = require('passport-local').Strategy;

module.exports = new LocalStrategy({
    usernameField: 'userid',
    passwordField: 'password',
    passReqToCallback: 'true'
}, (req, userid, password, done) => {
    let name = req.body.name;
    let age = req.body.age;
    console.log(`passport의 local-signup 호출 : userid : ${userid}, password =${password}, name = ${name}, age = ${age} `);
    
    //process.nextTick() : 실행 문장에서 데이터가 blocking 되지 않도록 사용, async 방식으로 변경합니다.
    process.nextTick(() => {
        let database = req.app.get('database');
        database.MemberModel.findOne({userid: userid}, (err, user) => {
            if(err){ return done(err)};
            if(user){
                console.log('이미 가입된 계정이 있습니다.');
                return done(null, false);
            }else{
                let user = new database.MemberModel({userid: userid, password: password, name: name, age:age});
                //save 하는 순간 pre(), 트리거 메소드가 발생한다.
                user.save((err) =>{
                    if(err) {throw err;}
                    console.log('가입완료!');
                    return done(null, user);
                });
                
            }
        });
    });
});