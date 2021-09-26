const app = require('./app')
const port = process.env.PORT

// run the server
app.listen(port, ()=> { console.log('Server is up on port: '+ port) })
