import dotenv from "dotenv";
import connectDB from "./db/connection.js";
// import express from "express";
// const app =express();
const port= 3000||process.env.PORT;
dotenv.config({
    path: "./.env"
})




connectDB()
.then(()=>{
    app.on("error: ",(error)=>{
        console.log("ERR:",error);
        throw error;
    })
    
    app.listen(port, ()=>{
        console.log(`server is running at port ${process.env.PORT}`)
    });
})
.catch((err)=>{
    console.log("mongo db connection is failed bro !!",err);

})

// app.listen(port , () => {
//     console.log(`App is listening on http://localhost:${process.env.PORT}`);
// });














/*------everything in index.js approach-----

import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
const app =express();
const port= 3000;

( async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("connected bc!!!")
        app.on("error",(error)=>{
            console.log("ERR: ",error);
        })

        app.listen(port , () => {
            console.log(`App is listening on http://localhost:${process.env.PORT}`);
        });
    }catch(error){
        console.error("ERROR: ",error);
        throw error;
    }



})()

*/