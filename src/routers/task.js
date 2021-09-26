const express = require('express')
const auth = require('../middleware/auth')
const Task = require('../models/Task')
const router = new express.Router()

// create task
router.post('/tasks',auth,  async (req,res)=>{
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task) 
    }catch(e){res.status(400).send(e)}
})

// get all tasks
router.get('/tasks',auth, async (req,res)=>{
    const match = {}
    const sort = {}
    if (req.query.completed){
        match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(":")
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try{
        const tasks = await req.user.populate({
            path: 'tasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        //const tasks= await Task.find({owner: req.user._id})
        res.send(req.user.tasks)
    }catch(e){res.status(500).send()}
    //Task.find({}).then((tasks)=>{ res.send(tasks)}).catch((e)=>{res.status(500).send()})
})
// get specific task by id
router.get('/tasks/:id',auth, async (req,res)=>{
    const _id = req.params.id
    try{
        const task = await Task.findOne({ _id , owner: req.user._id})
        if(!task){ res.status(404).send()}
        res.send(task)
    }
    catch(e){res.status(500).send()}
//     Task.findById(_id).then((task)=>{ 
//         if(!task){
//             return res.status(404).send()
//         }
//         res.send(task)
//     }).catch((e)=>{res.status(500).send()})
})

// update task 
router.patch('/tasks/:id', auth, async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['completed']
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update) )
    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates!'})
    }
    try{
        // update the tasks accepted fields
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id})
        if(!task){ return res.status(404).send()}
        updates.forEach((update) => task[update]= req.body[update])
        await task.save()
        res.send(task)
    } catch(e){ res.status(400).send(e)}
})
//delete
router.delete('/tasks/:id',auth, async (req,res)=>{
    try{
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if(!task){ return res.status(404).send()}
        res.send(task)
    } catch(e){res.status(500).send(e)}
})


module.exports = router