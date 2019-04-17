const { validate } = require('../validator.js')
const { processValidation } = require('./common.js')
const exerciseRepo = require('../repository/exercise.repo.js')
const userRepo = require('../repository/user.repo.js')



module.exports = (app) => {

    app.route('/api/exercise/log/')
        .get(validate("findExcercises"), (req, res) => {
            processValidation(req, res);
            let userId = req.query.userId;

            userRepo.findById(userId)
                .exec(function(err, result) {
                    if (err) { throw err; }
                    let exercises = exerciseRepo.findBy({
                        username: result.name,
                        from: req.query.from,
                        to: req.query.to,
                        limit: req.query.limit
                    });
                    exercises.exec(function(err, docs) {
                        if (err) { throw err; }
                        res.json({ count: docs.length, log: docs });
                    });

                });

        });



    app.route('/api/exercise/add')
        .post(validate("createExcercise"), function(req, res) {

            processValidation(req, res);

            userRepo.findById(req.body.userId)
                .exec(function(err, result) {
                    if (err) { throw err; }
                    let ex = exerciseRepo.save({
                        username: result.name,
                        description: req.body.description,
                        duration: req.body.duration,
                        date: req.body.date
                    })
                    res.json(ex);
                });

        });

}
