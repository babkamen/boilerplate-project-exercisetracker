const { validate } = require('../validator.js')
const { processValidation } = require('./common.js')
const userRepo = require('../repository/user.repo.js')

module.exports = (app) => {

    app.route('/api/exercise/users')
        .get(function(req, res) {
            userRepo.findAll().exec(function(err, docs) {
                if (err) { throw err; }
                res.json(docs);
            });

        });

    app.route('/api/exercise/new-user')
        .post(validate("createUser"), function(req, res) {
            processValidation(req, res);
            console.log("Saving new user " + req.body.username);
            let u=userRepo.save(req.body.username);
            res.json(u);
        });

}
