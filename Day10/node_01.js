const express=require('express');
const bodyParser=require('body-parser');
const static=require('serve-static');
const path=require('path');
const logger=require('morgan');
// npm install express-error-handler
const expressErrorHandler=require('express-error-handler');
const cookieParser=require('cookie-parser');
const expressSession=require('express-session');
// npm install passport
const passport=require('passport');

let app=express();
let port=3000;
let router=express.Router();
let router_loader=require('./routes/route_loader');
router_loader.init(app, router);

app.use(cookieParser());
app.use(expressSession({
    secret:'!@#$%^&*()',
    resave:false,
    saveUninitialized:true,
    cookie:{maxAge:60*60*1000}
}));
// passport 사용설정
// passport의 세션을 사용하려면 그 전에 Express의 세션을 사용하는 코드가 있어야 한다.
app.use(passport.initialize()); // initialize() 함수롤 호출하면 사용할 수 있다.
app.use(passport.session());
app.use(bodyParser.urlencoded({extended:false}));
// /public이라는 명령어를 치면 현재디렉토리와 'public' 폴더를 연결합니다.
app.use('/public', static(path.join(__dirname, 'public')));
// loger('dev') : 요청에 대한 정보를 콘솔에 기록해줍니다.
app.use(logger('dev'));
app.use('/', router);

let errorHandler=expressErrorHandler({
    static:{
        '404':'./public/404.html'
    }
});
app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

/* ejs 를 사용한 처리 */ // 현재 디렉토리에 views 라는 폴더를 추가한다.
app.set('views', __dirname+'/views');
app.set('view engine', 'ejs');

/* db 설정 파일 불러오기 */
// 몽고디비를 연결한 주소와, 컬렉션, 스키마에 대한 정의를 하는 곳이다.
let config = require('./config/config');

/* db를 만들어 연결*/
let database = require('./database/database');

/* 패스포트 설정 (로그인, 계정 담당) */
let configPassport = require('./config/passport');
configPassport(app, passport);


let userPassport=require('./routes/route_member');
userPassport(router, passport);

app.listen(port, ()=>{
    console.log('Server listening on port : ' + config.server_port);
    // database.init() : 서버가 실행되면서 db를 연결해준다.
    database.init(app, config);
});