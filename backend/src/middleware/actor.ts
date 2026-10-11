import type { NextFunction, Request, Response } from "express";
import { isValidUser } from "../config/users.js";

// Every write needs a known actor, sent in the x-user header.
// The result is stored in res.locals.actor so controllers never read the raw header.
export const requireActor = (req: Request, res: Response, next: NextFunction) => {
    const actor = req.get("x-user")

    if (!actor) return res.status(401).json({message: "Missing x-user header"})
    if (!isValidUser(actor)) return res.status(403).json({message: `Unknown user "${actor}"`})

    res.locals.actor = actor
    next()
}
