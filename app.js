const express = require('express');
const app = express();

const dbconnect = require('./config/db');

// Establishing DB Connection
dbconnect();

// configuring json parser middlware
app.use(express.json());

// route configuration
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is started on ${PORT}`)
});