const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')

let db = undefined

const startDbServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })
}

startDbServer()

app.post('/register/', async (req, res) => {
  let {username, name, password, gender, location} = req.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const registerQuery = `insert into user values ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}')`
  const user = await db.get(`select * from user where username = '${username}'`)
  if (user === undefined) {
    if (password.length < 5) {
      res.status(400)
      res.send('Password is too short')
    } else {
      await db.run(registerQuery)
      res.status(200)
      res.send('User created successfully')
    }
  } else {
    res.status(400)
    res.send('User already exists')
  }
})

app.post('/login/', async (req, res) => {
  let {username, password} = req.body
  const dbUser = await db.get(
    `select * from user where username = '${username}'`,
  )

  if (dbUser === undefined) {
    res.status(400)
    res.send('Invalid user')
  } else {
    const isValid = await bcrypt.compare(password, dbUser.password)
    console.log(isValid)
    if (isValid) {
      res.status(200)
      res.send('Login success!')
    } else {
      res.status(400)
      res.send('Invalid password')
    }
  }
})

app.put('/change-password/', async (req, res) => {
  const {username, oldPassword, newPassword} = req.body
  const dbUser = await db.get(
    `select * from user where username = '${username}'`,
  )
  const isCorrectOldPassword = await bcrypt.compare(
    oldPassword,
    dbUser.password,
  )
  if (isCorrectOldPassword) {
    if (newPassword.length < 5) {
      res.status(400)
      res.send('Password is too short')
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)
      console.log(hashedNewPassword)
      const updatePasswordQuery = `update user set password = '${hashedNewPassword}' where username = '${username}'`
      await db.run(updatePasswordQuery)
      res.status(200)
      res.send('Password updated')
    }
  } else {
    res.status(400)
    res.send('Invalid current password')
  }
})

app.listen(3000, () => {
  'server started.'
})

module.exports = app
