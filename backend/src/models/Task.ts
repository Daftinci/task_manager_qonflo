import mongoose from "mongoose";

export type Priority = "low" | "medium" | "high"
export type Progress = "to_do" | "pending" | "in_progress" | "done"

export interface ITask {
    title: string
    content: string
    priority: Priority
    progress: Progress
    deletedAt?: Date | null
}

//Create schema
//Create model

const taskSchema = new mongoose.Schema<ITask>(
 {
    title: {
        type:String,
        required: true
    },
    content: {
        type:String,
        required: true
    },
    priority: {
        type:String,
        enum: ["low","medium","high"],
        default: "low"
    },
    progress: {
        type:String,
        enum:["to_do","pending","in_progress","done"],
        default: "to_do"
    },
    deletedAt: {
        type: Date,
        default: null
    }
 },
 {timestamps:true}
) //createdAt, updateAt

const Task = mongoose.model<ITask>("Task", taskSchema)

export default Task
