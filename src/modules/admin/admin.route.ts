import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import authorized from "../../middlewares/role.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { adminController } from "./admin.controller.js";



const router = Router(); 

router.get(
    "/deliveries", 
    auth, 
    authorized("ADMIN"), 
    asyncHandler(adminController.getAllDeliveries), 
); 

router.patch(
    "/deliveries/:id/assign-agent", 
    auth, 
    authorized("ADMIN"),
    asyncHandler(adminController.assignAgent),
); 


export const adminRouter = router;