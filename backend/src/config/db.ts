import dns from "node:dns"
import mongoose from "mongoose"

dns.setServers(["8.8.8.8","1.1.1.1"])

export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string)
        console.log("MONGODB connect successfully")
    } catch (e) {
        console.log("Error connecting to MongoDB",e)
        process.exit(1)
    }
}
