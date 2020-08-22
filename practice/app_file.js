const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs')

var app = express();

// 애플리케이션이 bodyParser를 사용한다.
// post 방식으로 들어오는 요청을 낚아채서 포스트 데이터에 접근할 수 있게 해준다.
app.use(bodyParser.urlencoded({ extended: false }));
app.locals.pretty = true;

// views(템플릿 엔진에 담긴 파일) 들은 views_file 밑에 두겠다.
app.set('views', __dirname + '/views_file');
app.set('view engine', 'jade');

// /topic/new 라고 치고 들어오면 new.jade파일을 렌더링해줄거다
app.get('/topic/new', (req, res) => {
    fs.readdir('data', function (err, files) {
        if (err) {
            console.log(err);
        }
        res.render('new', { topics: files });
    });
});

app.get(['/topic', '/topic/:id'], function (req, res) {
    fs.readdir('data', function (err, files) {
        if (err) {
            console.log(err);
        }
        var id = req.params.id;
        if (id) {
            // id값이 있을 때
            fs.readFile('data/' + id, 'utf8', function (err, data) {
                if (err) {
                    console.log(err);
                }
                res.render('view', { topics: files, title: id, description: data });
            })
        } else {
            //id 값이 없을 때
            res.render('view', { topics: files, title: 'Welcome', description: 'Hello, JavaScript for server.' });
        }
    })
});

/*중복 코드 합체*/
// app.get('/topic/:id', function (req, res) {
//     var id = req.params.id;
//     fs.readdir('data', function (err, files) {
//         if (err) {
//             console.log(err);
//         } else {
//             fs.readFile('data/' + id, 'utf8', function (err, data) {
//                 if (err) {
//                     console.log(err);
//                 }
//                 res.render('view', { topics: files, title: id, description: data });
//             })
//         }
//     });

// });

app.post('/topic', function (req, res) {
    var title = req.body.title;
    var description = req.body.description;
    fs.writeFile('data/' + title, description, function (err) {
        if (err) {
            console.log(err)
        } else {
            // res.send('Success!');
            res.redirect('/topic/' + title);
        }
    });

});


app.listen(3300, function () {
    console.log("Server listening on port : 3300!");
});