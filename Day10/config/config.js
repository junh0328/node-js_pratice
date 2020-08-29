module.exports = {
    server_port : 3000,
    // db_url >>> database.js에서 불려져 사용되는 객체
    db_url : 'mongodb://localhost:27017/nodedb',
    db_schemas : [{file: './member_schema' , collection: 'member2', schemaName: 'MemberSchema', modelName : 'MemberModel'}],
    route_info: [],
    facebook: {
        clientID: '731377644109245',
        clientSecret: 'dea22176af8b9cbe99b70c7edd6eda37',
        callbackURL: 'http://localhost:3000/auth/facebook/callback'
    }
}