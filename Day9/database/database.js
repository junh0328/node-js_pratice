const mongoose = require('mongoose');
// 비워두는 database 객체를 만드는 이유(초기화 하는 이유)
// let database; >> 단일값을 저장하는 변수로 선언
// let database = {}; 값이 비어있는 객체를 선언
let database = {
    // db: mongoose.connection
};

//database.init() 시 여기로 넘어온다.
database.init = function(app, config){
    console.log('database.init() 호출');
    connect(app, config);
};

function connect(app, config){
    console.log('connect() 호출');
    // 동시다발적으로 비동기 통신을 하기 위해 전역객체를 몽구스에 넘겨준다.
    mongoose.Promise = global.Promise;
    // 후에 config 폴더에서 몽구스 폴더안에서 사용 될 사용자 지정 값을 바꿀 수 있다.
    mongoose.connect(config.db_url);
    // 데이터베이스 객체 안에 db라는 프로퍼티에 몽구스에 연결된 객체를 담을 거야
    database.db = mongoose.connection;
    //데이터베이스에서 error 이벤트가 발생하게 되면 'mongoose connection error.'를 띄우면서 콘솔창에 바인드(연결) 시켜줘라
    database.db.on('error', console.error.bind(console, 'mongoose connection error.'));
    database.db.on('open', () => {
        console.log('데이터베이스 연결 성공! ');
        createSchema(app, config);
    });
    // 만약 데이터베이스가 끊어지는 상황이 발생하면(이벤트), connect 다시 연결해줘라
    database.db.on('disconnected', connect);
}
/*
    console.log() :
    console.dir() : 
    console.info() : 정보를 찍어줄 때
    console.error() : 에러를 찍어줄 때 
    console.warn() : 경고를 찍어줄 때
*/

function createSchema(app, config){
    //스키마의 길이를 보여줄 변수 config.js 폴더에 db_schemas가 정의되어 있음
    let schemaLen = config.db_schemas.length;
    console.log('설정에 정의된 스키마의 갯수 : %d', schemaLen);

    for(let i=0; i<schemaLen; i++){
        // let curItem >> current item 현재 아이템을 나타냄, db_schemas 안에 들어있는 객체 [{file: './user_schema' , collection: 'member2', schemaName: 'MemberSchema', modelName : 'MemberModel'}] 
        let curItem = config.db_schemas[i];
        // 객체를 읽어들여와서 몽구스로 보내 파일을 만들어라. curItem.file 은 member_schema.js 파일이다.
        let curSchema = require(curItem.file).createSchema(mongoose);
        console.log('%s 모듈을 불러들인 후 스키마를 정의함', curItem.file);

        // curModel 은 컬렉션을 정의하는 것이다.
        let curModel = mongoose.model(curItem.collection, curSchema);
        console.log('%s 컬렉션을 위해 모델 정의함', curItem.collection);

        database[curItem.schemaName] = curSchema;
        // database [MemberSchema] = curSchema 객체;
        database[curItem.modelName] = curModel;
        // database [MemberModel] = curModel 객체;
        console.log('스키마 이름[%s], 모델이름[%s]이 데이터베이스 객체의 속성으로 추가되었습니다.', curItem.schemaName, curItem.modelName);
        app.set('database', database);
        console.log('database 객체가 app객체의 속성으로 추가됨');
    }
}

module.exports = database;