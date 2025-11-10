import express from 'express'

const app = express()
const port = 3000;


/*
app.get('/', (req, res) => {
  res.send('Hello World')
})
*/


app.get('/name', (req, res) => {
    res.send('users obtained')
})


app.get('/assingment', (req, res) => {
    res.send('assignments obtained')
})


app.post('/create-user', (req, res) => {
    res.send('created user')
})

app.delete('/create-user', (req, res) => {
    res.send('deleted user')
})


app.get('/permission', (req, res) => {
    res.send('verifying permissions')
})

app.put('/update-user', (req, res) => {
    res.send('updated user')
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});