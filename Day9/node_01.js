const express = require('express');
const bodyParser = require('body-parser');
const static = require('serve-static');
const path = require('path');
const logger = require('morgan');
// npm install mysql
const mysql = require('mysql');

// mysql의 커넥션풀기능을 사용하기위한 pool객체 생성
let pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'junh0328',
    password: 'Dl!wnsgml24',
    database: 'nodedb',
    debug: false
});

let app = express();
let port = 3000;
let router = express.Router();

app.use(bodyParser.urlencoded({ extended: false }));
// /public이라는 명령어를 치면 현재디렉토리와 'public' 폴더를 연결합니다.
app.use('/public', static(path.join(__dirname, 'public')));
// loger('dev') : 요청에 대한 정보를 콘솔에 기록해줍니다.
app.use(logger('dev'));
// 제일 상위루트에 라우터를 등록합니다.
app.use('/', router);

//포스트맨 사용 >> 가입, 리스트, 로그인

//포스트로 호출하게되면 실행하라
router.route('/member/regist').post((req, res) => {
    // 사용자가 포스트맨을통해 입력한 변수를 let (변수명) 안에 저장하라.
    let userid = req.body.userid;
    let userpw = req.body.userpw;
    let name = req.body.name;
    let age = req.body.age;

    console.log('요청 파라미터 : ' + userid + ', ' + userpw + ', ' + name + ', ' + age);
    // 위에서 만들어진 pool객체가 제대로 만들어졌다면 >>
    if (pool) {
        addMember(userid, userpw, name, age, (err, result) => {
            if (err) {
                console.log(err);
            }
            if (result) {
                res.writeHead('200', { 'Content-Type': 'text.html;charset=utf8' });
                res.write('<h2>사용자 추가 성공!</h2>');
                res.end();
            } else {
                res.writeHead('200', { 'Content-Type': 'text.html;charset=utf8' });
                res.write('<h2>사용자 추가 실패..</h2>');
                res.end();
            }
        });

    } else {
        res.writeHead('200', { 'Content-Type': 'text.html;charset=utf8' });
        res.write('<h2>DB연결 실패</h2>');
        res.end();
    }
});

router.route('/member/login').post((req, res) => {
    // 사용자가 포스트맨을통해 입력한 변수를 let (변수명) 안에 저장하라.
    let userid = req.body.userid;
    let userpw = req.body.userpw;


    console.log('요청 파라미터 : ' + userid + ', ' + userpw);
    if (pool) {
        loginMember(userid, userpw, (err, result) => {
            if (err) {
                console.log(err);
            }
            if (result) {
                console.log(result);
                let name = result[0].NAME;
                let age = result[0].age;

                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h2>로그인 성공!</h2>')
                res.write('<p>아이디 : ' + userid + '</p>')
                res.write('<p>이름 : ' + name + '</p>')
                res.write('<p>나이 : ' + age + '</p>')

                res.end();
            } else {
                res.writeHead('200', { 'Content-Type': 'text.html;charset=utf8' });
                res.write('<h2>아이디 또는 비밀번호를 확인하세요.</h2>');
                res.end();
            }

        });
    }

});
router.route('/member/update').post((req, res) => {
    let userid = req.body.userid;
    let userpw = req.body.userpw;

    console.log('요청 파라미터 : ' + userid + ', ' + userpw);
    if (pool) {
        updateMember(userid, userpw, name, age, (err, result) => {
            if (err) {
                console.log(err);
            }
            if (result.modifiedCount > 0) {
                console.log(result);

                let name = result[0].NAME;
                let age = result[0].age;

                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h2>정보수정 성공</h2>');
                res.write('<p> 수정된 이름 :' + name + '</p>');
                res.write('<p> 수정된 나이 :' + age + '</p>');
                res.end();
            }
            else {
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h2>정보수정 실패</h2>');
                res.write('<p>정보 수정에 실패했습니다.</p>');
                res.end();
            }
        });
    }
});
/* 함수 생성 */
let addMember = function (userid, userpw, name, age, callback) {
    console.log('addMember 호출');

    pool.getConnection((err, conn) => {
        if (err) {
            if (conn) {
                conn.release(); //에러가 났는데, 디비와 연결되어 있는 경우에는 연결을 해지한다.
            }
            callback(err, null);
            //더이상 진행하지 않도록 return해준다.
            return;
        }
        console.log('데이터베이스 연결 성공!');
        // 물음표에 따른 앞의 변수명으로 데이터가 들어간다.
        // [] 대괄호 안에 있는 데이터가 물음표로 들어간다.
        let sql = conn.query("insert into members(userid, userpw, name, age) values(?, ?, ?, ?)", [userid, userpw, name, age], (err, result) => {
            conn.release();
            console.log('정상적인 sql 실행');
            if (err) {
                callback(err, null);
                return;
            }
            console.log('가입완료');
            //콜백이 되면 불러졌던 addMember(xxx)로 들어가 결과값이 담긴다.
            callback(null, result);
        });
    });
}

let loginMember = function (userid, userpw, callback) {

    console.log('loginMember 호출 : ' + userid + ", " + userpw);
    pool.getConnection((err, conn) => {
        if (err) {
            // connection이 있다면,
            if (conn) {
                conn.release(); //에러가 났는데, 디비와 연결되어 있는 경우에는 연결을 해지한다.
            }
            callback(err, null);
            //더이상 진행하지 않도록 return해준다.
            return;
        }
        let sql = conn.query("select * from members where userid= ? and userpw = ?", [userid, userpw], (err, result) => {
            conn.release();
            console.log('정상적인 sql 실행');
            if (err) {
                callback(err, null);
                return;
            }
            if (result.length > 0) {
                console.log('일치하는 사용자를 찾았습니다!')
                callback(null, result);
            } else {
                console.log('일치하는 사용자를 찾지 못하였습니다')
                callback(null, null);
            }
        });
    });
}
// userid와 userpw를 입력하여 정보를 확인하고, name과 age를 바꾸고 싶을 때
let updateMember = function (userid, userpw, name, age, callback) {
    console.log('updateMember 호출 : ' + userid + ", " + userpw + ", " + name + ", " + age);
    pool.getConnection((err, conn) => {
        if (err) {
            if (conn) {
                conn.release();
            }
            callback(err, null);
            return;
        }
        let sql = conn.query("update members set name = ? and age = ? where userid = ? ", [name, age, userid], (err, result) => {
            conn.release();
            console.log('정상적인 sql 실행');
            if (err) {
                callback(err, null);
                return;
            }
            if (result.modifiedCount > 0) {
                console.log('사용자 document 수정됨 : ' + result.modifiedCount);
            } else {
                console.log('수정된 document가 없음');
            }
            //콘솔에 찍어주고난 실행 결과를 리턴한다.
            callback(null, result);
        });
    });
}

/* 포트에 서버 연결 */
app.listen(port, () => {
    console.log('Server listening on port : ' + port);

});