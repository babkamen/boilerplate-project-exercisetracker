const Exercises = require('../model/exercise.model.js')

module.exports = {

    findBy: (req) => {
        var query = { username: req.username };

        let fromDate = req.from;
        if (fromDate) {
            query.date = { "$gte": new Date(fromDate) };
        }
        let toDate = req.to;
        if (toDate) {
            query.date = { "$lte": new Date(toDate) };
        }
        var exercises = Exercises.find(query, { _id: false, __v: false });
        let limit = parseInt(req.limit);
        if (limit) {
            exercises = exercises.limit(limit);
        }
        return exercises;

    },

    save: (exerciseJSON) => {
        let ex = new Exercises({
            username: exerciseJSON.username,
            description: exerciseJSON.description,
            duration: exerciseJSON.duration
        });
        if (exerciseJSON.date) {
            ex.date = new Date(exerciseJSON.date);
        }

        console.log("Saving new exercises " + ex);
        ex.save();
        return ex;
    }

}
