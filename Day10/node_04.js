const express=require('express');
const bodyParser=require('body-parser');
const static=require('serve-static');
const path=require('path');
const logger=require('morgan');
const expressErrorHandler=require('express-error-handler');
const cookieParser=require('cookie-parser');
const expressSession=require('express-session');
const passport=require('passport');
//npm install socket.io 
/* 서버용 소켓? 사용자를 위해 대기,  클라이언트용 소켓? 사용자들끼리 소통하기 위함 */
const socketio = require('socket.io');
//npm install cors
// 클라이언트에서 ajax로 요청시 cors(다중 서버 접속)을 지원하겠다.
const cors = require('cors');

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

// 클라이언트에서 ajax로 요청시 cors 지원을 익스프레스에 등록한다.
app.use(cors());

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
const { login } = require('passport/lib/http/request');
userPassport(router, passport);

const server = app.listen(port, ()=>{
    console.log('Server listening on port : ' + config.server_port);
    // database.init() : 서버가 실행되면서 db를 연결해준다.
    database.init(app, config);
});

//socket.io 서버
const io = socketio.listen(server);
console.log('socket.io 요청을 받을 준비 완료!');

login_ids = {};

io.sockets.on('connection', (socket)=>{
    //peername : 접속자의 이름
    console.log('connection : ', socket.request.connection._peername);
    socket.remoteAddress = socket.request.connection._peername.address;
    socket.remotePort = socket.request.connection._peername.port;

    socket.on('login', function(login){
        console.log('로그인 이벤트를 받았습니다.');
        console.log(login);

        console.log('접속한 소켓의 id : ' + socket.id);
        login_ids[login.id] = socket.id;
        socket.login_id = login.id;

        console.log('접속한 클라이언트 id 갯수 : %d', Object.keys(login_ids).length);
        sendResponse(socket, 'login', '200', '로그인되었습니다.');

    });


    socket.on('message', function(message){
        console.log('message 이벤트를 받았습니다.');
        console.dir(message);
        //recipient
        if(message.recepient == 'ALL'){
            console.log('나를 포함한 모든 클라이언트에게 message 이벤트를 전송합니다.');
            io.sockets.emit('message', message);
        }else{
            if(login_ids[message.recepient]){
                io.sockets.connection[login_ids[message.recepient]].emit('message', message);
                sendResponse(socket, 'message', '200', '메세지를 전송했습니다.');
            }else{
                sendResponse(socket, 'login', '404', '상대방이 로그인하지 않았습니다.');
            }
        }
    });
});

function sendResponse(socket, command, code, message){
    let statusObj = {command:command, code:code, message:message};
    socket.emit('response', statusObj);
}