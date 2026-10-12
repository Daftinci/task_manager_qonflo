import express from 'express'
import taskRoutes from "./routes/taskRoutes.js";
import { connectDB } from './config/db.js';
import dotenv from "dotenv"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001



app.use(express.json())

// app.use((req,res,next)=> {
//     console.log(`Req method is ${req.method} & Req URL is ${req.url}`)
//     next()
// })

app.use("/api/task", taskRoutes)

connectDB().then(()=>{
    app.listen(PORT, ()=>{
        console.log("Server started at PORT:", PORT)
    })
})
