import { logEvents } from "./logEvents"

const errorHandler = (err:any, res:any) => {
    logEvents(`${err.name} : ${err.message}`, 'errorLog.txt')
    console.log(err.stack)
    res.status(500).send(err.message)
}

export { errorHandler }