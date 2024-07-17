const PORT = process.env.PORT || 8000

const express = require('express') 
const { v4: uuid4 } = require('uuid')
const app = express() 
const cors = require('cors')
const pool = require('./db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

app.use(cors())
app.use(express.json())

//get all todos
app.get('/todos/:userEmail', async (req, res) => {
    console.log(req.params)
    const {userEmail} = req.params
    try {
        const todos = await pool.query('select * from todos where user_email = $1',[userEmail])
        res.json(todos.rows)

    } catch (err) {
        console.error(err)
    }
})  

//create a new todos
app.post('/todos', async (req, res) => {
    console.log(req.body)
    const { user_email, title, progress, date } = req.body
    const id = uuid4()
    try {
        const newToDo = await pool.query('insert into todos(id, user_email, title, progress, date) values($1, $2, $3, $4, $5);', 
            [id, user_email, title, progress, date])
        res.json(newToDo)
    } catch (err) {
        console.error(err);
    }
})

//edit a new todos
app.put('/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { user_email, title, progress, date } = req.body
    try {
        const editToDo = await pool.query('update todos set user_email = $1, title = $2, progress = $3, date = $4 where id = $5;', [user_email, title, progress, date, id])
        res.json(editToDo);
    } catch (err) {
        console.error(err);
    }
})

app.delete(`/todos/:id`, async (req, res) => {
    const { id } = req.params;
    try {
        const deleteToDo = await pool.query('delete from todos where "id" = $1;', [id])
        res.json(deleteToDo)
    } catch (err) {
        console.error(err);
    }
})

// signup
app.post('/signup', async (req, res) => {
    const { email, password } = req.body
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    try {
        const signUp = await pool.query('insert into users(email, hashed_password) values($1, $2);',
            [email, hashedPassword])
        
        const token = jwt.sign({ email }, 'secret', { expiresIn: '1hr' })
        res.json({email, token})

        
    } catch (err) {
        console.error(err);
        if (err) {
            res.json({detail: err.detail})
        }
    }
})


// login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const users = await pool.query('select * from users where "email" = $1;', [email])
        console.log(users)
        if (!users.rows.length) return res.json({ detail: 'User does not exist!' })
        
        const success = await bcrypt.compare(password, users.rows[0].hashed_password)
        const token = jwt.sign({ email }, "secret", { expiresIn: "1hr" });

        if (success) {
            res.json({'email': users.rows[0].email, token})
        } else {
            res.json({detail: "Login failed"})
        }
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`)) 
