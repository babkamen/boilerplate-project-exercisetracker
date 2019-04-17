const Users = require('../model/user.model.js')

module.exports =  {
    findById: (id) => {
        return Users.findById(id);
    },
    findAll:()=>{
        return Users.find({});
    },
    save:(username)=>{
        let u=new Users({name:username})
        u.save()
        return u;
    },
    existsWithId:(id)=>{
         return Users.count({ _id: id }).then((count) => {
             return count>0;
         });
    },
    existsWithUsername:(username)=>{
         return Users.count({ name: username }).then((count) => {
             return count>0;
         });
    }
    
}
