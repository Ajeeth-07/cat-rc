const express = require("express");
const router = express.Router();
const {Essay } = require("../db");



router.post("/essays", async(req,res) => {
    try{
        const {title,url,category,content,publishedDate,scrappedDate, wordCount} = req.body;

        const existingTitle = await Essay.findOne({title});
        const existingUrl = await Essay.findOne({url});

        if(existingTitle) return res.status(411).json({msg : "Essay already exists with the title"});
        if(existingUrl) return res.status(411).json({msg : "Essay already exists"});

        const newEssay = await Essay.create({
            title,
            url,
            category,
            content,
            publishedDate,
            scrappedDate,
            wordCount
        })

        res.status(200).json({msg : "Essay added to db"})

    }catch(err){
        console.error(err);
    }
})

module.exports = router;