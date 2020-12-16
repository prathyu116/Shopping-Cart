const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=function(done){
    const url='mongodb://localhost:27017';//connection string to mongoDB
    const dbname='shopping';
    mongoClient.connect(url,(err,data)=>{    //ivdea call back aanue nadakkunnnea..portaril connect ayy kainjal nammal parayunna method execute cheyyum
        if (err) return done(err)
        state.db=data.db(dbname)
        done()
    })
   

}
module.exports.get=()=>{
    return state.db
}