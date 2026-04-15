import { Router, IRouter } from "express";
import { visaCountries, getCountryByCode } from "../lib/visaData";

const router: IRouter = Router();

router.get("/visas/countries", (_req, res): void => {
  res.json(visaCountries);
});

router.get("/visas/countries/:countryCode", (req, res): void => {
  const { countryCode } = req.params;
  const country = getCountryByCode(typeof countryCode === "string" ? countryCode : countryCode[0]);
  if (!country) {
    res.status(404).json({ error: "Country not found" });
    return;
  }
  res.json(country);
});

export default router;
