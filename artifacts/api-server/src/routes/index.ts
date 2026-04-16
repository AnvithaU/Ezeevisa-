import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import visasRouter from "./visas";
import applicationsRouter from "./applications";
import documentsRouter from "./documents";
import dashboardRouter from "./dashboard";
import ocrRouter from "./ocr";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(visasRouter);
router.use(applicationsRouter);
router.use(documentsRouter);
router.use(dashboardRouter);
router.use(ocrRouter);

export default router;
