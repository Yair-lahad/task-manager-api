const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/User')
const {userOneId,userOne,setupDatabase} = require('./fixtures/db')

beforeEach(async ()=>{
    await User.deleteMany()
    await new User(userOne).save()
})

test('Should signup a new user', async()=>{
    const response = await request(app).post('/users').send({
        name: 'Yahoo',
        email: 'yah@example.com',
        password: 'MyPass777!'
    }).expect(201)
    // Assert that the database was change correctly
    const user= await User.findById(response.body.user._id)
    expect(user).not.toBeNull()
    //Assertions about the respone
    expect(response.body.user.name).toBe('Yahoo')
    expect(response.body).toMatchObject({
        user:{
            name: 'Yahoo',
            email: 'yah@example.com'
        },
        token: user.tokens[0].token  
    })
    expect(user.password).not.toBe('MyPass777!') 
})

test('Should login exsisting user', async ()=>{
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)
    const user = await User.findById(userOneId)
    expect(user.tokens[1].token).toBe(response.body.token)
})

test('Should not login nonexistent user', async() =>{
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: 'wrongpass'
    }).expect(400)
})

test('Should get Profile for user', async ()=>{
    await request(app).get('/users/me')
    .set('Authorization', 'Bearer '+userOne.tokens[0].token)
    .send().expect(200)
})

test('Should not get profile for unathenticated user', async () =>{
    await request(app).get('/users/me')
    .send().expect(401)
})

test(' Should delete account for user', async ()=>{
    await request(app).delete('/users/me')
    .set('Authorization', 'Bearer '+userOne.tokens[0].token)
    .send().expect(200)
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})
test(' Should not delete account for unauthenticated user', async ()=>{
    await request(app).delete('/users/me')
    .send().expect(401)
})

test('Should upload avatar image', async ()=>{
    await request(app).post('/users/me/avatar')
        .set('Authorization', 'Bearer '+userOne.tokens[0].token)
        .attach('avatar','tests/fixtures/profile-pic.jpg').expect(200)
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async ()=>{
    const name = 'Jess'
    await request(app).patch('/users/me')
        .set('Authorization', 'Bearer '+userOne.tokens[0].token)
        .send({
            name
        }).expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toEqual(name)
})

test('Should not update invalid user fields',async () => {
    await request(app).patch('/users/me')
        .set('Authorization', 'Bearer '+userOne.tokens[0].token)
        .send({
            location: 'Boston'
        }).expect(400)

})