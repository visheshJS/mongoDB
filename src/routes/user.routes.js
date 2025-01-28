import { Router } from "express";
import registerUser from "../controllers/user.controller.js";

const userRouter = Router();

// Define the POST route
userRouter.route("/register").post(registerUser);

export default userRouter;
