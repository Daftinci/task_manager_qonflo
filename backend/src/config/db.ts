import dns from "node:dns"
import mongoose from "mongoose"

const isDnsError = (e: unknown): boolean => {
    const err = e as { code?: string; syscall?: string }
    return (
        err?.syscall === "querySrv" ||
        ["ECONNREFUSED", "ENOTFOUND", "ETIMEOUT", "ESERVFAIL"].includes(err?.code ?? "")
    )
}

// No MONGO_URI: start a throwaway in-memory replica set (transactions need one)
const startInMemoryMongo = async (): Promise<string> => {
    const { MongoMemoryReplSet } = await import("mongodb-memory-server")
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
    const uri = replSet.getUri("taskmanager")
    console.log("MONGO_URI not set, using in-memory MongoDB (data is lost on restart)")
    console.log("Inspect it with MongoDB Compass or mongosh:", uri)
    return uri
}

export const connectDB = async (): Promise<void> => {
    const uri = process.env.MONGO_URI || await startInMemoryMongo()
    try {
        await mongoose.connect(uri)
    } catch (e) {
        if (!isDnsError(e)) {
            console.log("Error connecting to MongoDB", e)
            process.exit(1)
        }
        //fallback if normal DNS failed to connect
        console.log("DNS lookup failed, retrying with public DNS (8.8.8.8, 1.1.1.1)")
        try {
            dns.setServers(["8.8.8.8", "1.1.1.1"])
            await mongoose.connect(uri)
        } catch (e2) {
            console.log("Error connecting to MongoDB", e2)
            process.exit(1)
        }
    }
    console.log("MONGODB connect successfully")
}
