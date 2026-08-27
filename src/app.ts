import express, { Application, Request, Response } from "express";
import cors from "cors";
import { db } from "./prisma/db";

const app:Application = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Courier Management API is running",
  });
});

app.get('/health', (req:Request, res:Response) => {
    res.json({
        success:true, 
        message:"Api is healthy"
    })
}); 



export default app;