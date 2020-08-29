const { Schema } = require('mongoose');
const passport = require('passport');
//npm install crypto
const crypto = require('crypto');

Schema.createSchema = function(mongoose){
    console.log('createSchema() 호출');
    let MemberSchema = mongoose.Schema({
        // userid의 아이디가 틀리면 에러를 만들기 위해 required : true를 설정
        userid: {type: String, required: true, default:''},
        // hashed_password : 몽구스에서 암호화시킬 때, 특별한 랜덤키를 만들어 내가 집어넣은 패스워드와 결합시켜 묶어서 저장한다. 그때마다 랜덤한 값이 틀리므로 매번 다르게 비밀번호를 가질 수 있다. hash는 단방향 암호화이므로 복호화가 되지 않는다. 
        hashed_password: {type: String, required: true, default:''},
        name: {type: String, default:''},
        //salt : 암호화 키, 랜덤한 값을 salt에 저장한다.
        salt: {type: String, required: true},
        // created_ at : 데이터가 들어간 날짜 시간
        age: {type: Number, default: ''},
        created_at: {type: Date, default: Date.now},
        updated_at: {type: Date, default: Date.now}
    });

    // virtual() : 가상으 필드를 만들겠다.
    MemberSchema
    .virtual('password')
    .set(function(password) {
        // _password 는 field를 나타낸다. 자바와 달리 자기 자신을 나타내는 필드지만 (_) 표시를 해줘야 한다. 하지 않으면 재귀함수로 무한 콜백이 될 수 있기 때문에...
        // 함수를 부를 때도 (_)를 쓸 때가 있는데 get, set 메소드에서 주로 사용한다.
        /* _password는 가상의 필드임 나머지는 위에서 가져옴 */
        this._password = password;
        this.salt = this.makeSalt(); 
        this.hashed_password = this.encryptPassword(password);
        console.log('virtual password 호출됨 : ' + this.hashed_password);
    })
    .get(function() {
        return this._password;
    });
    //MemberSchema 안에서 사용할 메소드 'makeSalt' 를 만드는 방법
    MemberSchema.method('makeSalt', function() {
        console.log('makeSalt() 호출');
        // valuedof >>> timestamp 값으로 나온다. (숫자 + ''[문자] 이므로 문자열(String) 값으로 리턴된다.)
        return Math.round((new Date().valueOf() * Math.random())) + '';
    });
    // plainText : 사용자가 입력한 퓨어한 패스워드, inSalt : 위에서 만든 Salt 값

    MemberSchema.method('encryptPassword', function(plainText, inSalt) {

        if(inSalt){
            return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex');
        }else{
            // createHmac() : 핵사를 만드는 메소드
            // sha1 : 단방향 암호
            // plainText를 hex값(16진수)로 바꿔서 리턴시켜준다.
            return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
        }
    });
    // plainText 와 inSalt를 결합시켜 hashed_password 와 같은지 비교해본다.
    MemberSchema.method('authenticate', function(plainText, inSalt, hashed_password){
        if(inSalt){
            console.log('authenticate 호출');
            return this.encryptPassword(plainText, inSalt) === hashed_password;
        }else{
            console.log('authenticate 호출');
            return this.encryptPassword(plainText) === this.hashed_password;
        }
    });

    let validatePresenceOf = function(value){
        return value && value.length;
    }

    /* 
        pre() : 트리거, 특정 기간이 지나면 질의 없이도 바로 실행되도록 하는 함수
    */

    // pre() : save가 발생하게되면 save가 처리되기 이전에 실행하라
    MemberSchema.pre('save', (next) => {
        // 객체 안에는 isNew라는 제공되는 필드가 있는데, 새로 들어가는 필드가 아닐 때 다음과 같이 실행하라.
        if(!this.isNew) return next();
        if(!validatePresenceOf(this.password)){
            next(new Error('유효하지 않은 password 필드입니다.'));
        }else{
            next();
        }
    });

    MemberSchema.path('userid').validate((userid) => {
        return userid.length;
    }, 'userid 컬럼의 값이 없습니다.');

    MemberSchema.path('hashed_password').validate((hashed_password) =>{
        return hashed_password.length;
    }, 'hashed_password 컬럼의 값이 없습니다.');

    MemberSchema.static('findByUserid', (userid, callback) => {
        return this.find({userid: userid}, callback);
    });

    MemberSchema.static('findAll', (callback) => {
        return this.find({},callback);
    });
    console.log('MemberSchema 정의 완료');
    return MemberSchema;
}

module.exports = Schema;