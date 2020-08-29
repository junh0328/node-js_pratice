// npm install passport-facebook
let FacebookStrategy = require('passport-facebook').Strategy;
let config = require('../config');

module.exports = function(app, passport){
    return new FacebookStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.facebook.callbackURL,
        profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type[large]', 'email']
    }, (accessToken, refreshToken, profile, done) => {
        console.log('passport의 facebook 호출');
        console.dir(profile);

        let database = app.get('database');
        database.UserModel.findOne({userid: profile.id}, (err, user) =>{
            if(err) return done(err);
            if(!user){
                let user = new database.UserModel({
                    name: profile.displayName,
                    userid: profile.id,
                    provider: 'facebook',
                    authToken: accessToken,
                    facebook: profile.__json,
                    //profile.__json (정보가 담겨있는 json 형식의 파일)
                });

                user.save((err) => {
                    if(err){ throw err; }
                    return done(null, user);
                });
            }else{
                return done(null, user);
            }
        })
    });
}