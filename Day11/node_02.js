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
const { Console } = require('console');
const { send } = require('process');
userPassport(router, passport);

const server = app.listen(port, ()=>{
    console.log('Server listening on port : ' + config.server_port);
    // database.init() : 서버가 실행되면서 db를 연결해준다.
    database.init(app, config);
});

//socket.io 서버
const io = socketio.listen(server);
console.log('socket.io 요청을 받을 준비 완료!');

let login_ids = {};

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
            if(message.command == 'chat'){
                if(login_ids[message.recepient]){
                    io.sockets.connected[login_ids[message.recepient]].emit('message', message);
                    sendResponse(socket, 'message', '200', '메세지를 전송했습니다.');
                }else{
                    sendResponse(socket, 'login', '404', '상대방이 로그인하지 않았습니다.');
                }
            }else if(message.command == 'groupchat'){
                io.sockets.in(message.recepient).emit('message', message);
                sendResponse(socket, 'message', '200', '방[' + message.recepient + ']의 방 사용자들에게 메세지를 전송했습니다.' );
            }
        }
    });

    socket.on('room', function(room){
        console.log('room 이벤트를 받았습니다.');
        console.dir(room);
        console.log(room.command);
        if(room.command == 'create'){
            //socket.io가 제공하는 기능, room은 처음 기본(base) 방에 들어가고 배열에 따른 roomId에 방을 만들면 특정 방(roomId)에 들어갈 수 있다.
            if(io.sockets.adapter.rooms[room.roomId]){  
                console.log('방이 이미 만들어져 있습니다.');
            }else{
                console.log('방을 새로 만듭니다.');
                socket.join(room.roomId); // 사용자가 만들고자하는 방의 아이디값에 들어간다.
                let curRoom = io.sockets.adapter.rooms[room.roomId]; // 들어간 현재 방을 io.sockets.adapter.rooms[room.roomId] 배열에 추가한다.
                curRoom.id = room.roomId;
                curRoom.name = room.roomName;
                curRoom.owner = room.roomOwner;
            }
        }else if(room.command == 'update'){
            console.log('update 호출');
            let curRoom = io.sockets.adapter.rooms[room.roomId];
            curRoom.id = room.roomId;
            curRoom.name = room.roomName;
            curRoom.owner = room.roomOwner;
        }else if(room.command == 'delete'){
            console.log('delete 호출');
            socket.leave(room.roomId);
            if(io.sockets.adapter.rooms[room.roomId]){
                delete io.sockets.adapter.rooms[room.roomId];   // 방목록을 없앤다.
            }else{
                console.log('방이 만들어져 있지 않습니다.');
            }
        }else if(room.command== 'join'){
            console.log('join 됨');
            socket.join(room.roomId);
            sendResponse(socket, 'room', '200', '방에 입장하였습니다.');
        }else if(room.command== 'leave'){
            console.log('leave 됨');
            socket.leave(room.roomId);
            sendResponse(socket, 'toom', '200', '방에서 나갔습니다.')
        }else{
            console.log('command가 적용되지 않았습니다.');
        }
        let roomList = getRoomList();
        let output = {command:'list', rooms: roomList};
        console.log(`클라이언트로 보낼 데이터 : ${JSON.stringify(output)}`);
        // console.dir(output);
        io.sockets.emit('room', output);
    })
    
});

function sendResponse(socket, command, code, message){
    let statusObj = {command:command, code:code, message:message};
    socket.emit('response', statusObj);
}

function getRoomList(){
    console.log(io.sockets.adapter.rooms);  // io.sockets.adapter.rooms라는 array객체가 정보를 가지고 있다.
    let roomList = [];              // [] 대괄호로 감싸면 배열, {} 중괄호로 감사면 객체를 비워둔 것이다.

    Object.keys(io.sockets.adapter.rooms).forEach(function(roomId){   // forEach : io.sockets.adapter.rooms 의 개수만큼 돌면서 함수(function)을 실행해준다.
        console.log(`현재 room id : ${roomId}`);
        let outRoom = io.sockets.adapter.rooms[roomId];
        let foundDefault = false;
        let index = 0;


        Object.keys(outRoom.sockets).forEach(function(key){ //방에 들어있는 사람(소켓)의 갯수만큼 반복문을 돈다.
            console.log(`# ${index} : ${key}, ${outRoom.sockets[key]}`);
            if(roomId == key){
                foundDefault = true;
                console.log('여기는 기본 방입니다.');
            }
            index++;
        });
        if(!foundDefault){
            roomList.push(outRoom);     //기본방이 존재하지않으면, outRoom을 roomList에 추가시킨다.
        }
    });
    console.log('***** ROOM LIST *****');
    console.log(roomList);
    return roomList;
}