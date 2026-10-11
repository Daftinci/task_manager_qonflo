import type { Response } from "express";

export class HttpError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

// Maps known errors to a status code; anything else is a 500.
export const sendError = (res: Response, error: unknown, context: string) => {
    if (error instanceof HttpError) return res.status(error.status).json({message: error.message})

    const name = (error as { name?: string })?.name
    if (name === "ValidationError") return res.status(400).json({message: (error as Error).message})
    if (name === "CastError") return res.status(400).json({message: "Invalid id"})

    console.error(`Error on ${context}`, error)
    return res.status(500).json({message: "Internal Server Error"})
}
