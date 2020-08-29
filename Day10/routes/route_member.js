module.exports =function(router, passport){
    console.log('route_user 호출');

    router.route('/').get((req, res) => {
        res.render('index.ejs');
    });

    router.route('/signup').get((req, res) =>{
        res.render('signup.ejs');
    });
    //authenticate() : 인증을 받을 수 있는 메소드
    // passport의 기능이다.
    router.route('/signup').post(passport.authenticate('local-signup',{
        //signup에 성공할 시 
        successRedirect: '/profile',
        //signup에 실패할 시
        failureRedirect: '/signup',
        failureFlash: true
    }));
    router.route('/login').get((req, res) => {
        res.render('login.ejs');
    });

    router.route('/login').post(passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }));

    router.route('/profile').get((req,res) => {
        if(!req.user){
            console.log('사용자 인증 실패 상태');
            res.redirect('/');
            return;
        }
        console.log('사용자 인증 성공');
        if(Array.isArray(req.user)){
            res.render('profile.ejs', {user: req.user[0]._doc});
        }else{
            res.render('profile.ejs', {user: req.user});
        }
    });

    //scope 범위 [req에게 받고 싶은 자료 프로필과 이메일을 받겠다]
    router.route('/auth/facebook').get(passport.authenticate('facebook', {
        scope: ['public_profile', 'email']
    }));

    router.route('/auth/facebook/callback').get(passport.authenticate('facebook',{
        successRedirect: '/profile',
        failureRedirect: '/'
    }));


    router.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
    });
    router.route('/list').get((req, res) =>{
        res.render('list.ejs')
    });
}
