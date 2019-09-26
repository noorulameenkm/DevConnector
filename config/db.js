const mongoose = require('mongoose');
const config = require('config');

const mongoURI = config.get('mongoURI');

module.exports = function dbconnect() {
    mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false
        })
        .then(() => console.log('DB Connection established'))
        .catch(err => console.log(err, ' => error in connection'));
}