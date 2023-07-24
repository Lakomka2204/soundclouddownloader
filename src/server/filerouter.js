import { Router } from "express";
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import maincsrf from './maincsrf.js'

dotenv.config();

const router = Router();

router.get("/:filename",maincsrf,(req,res)=>{
    const file = req.params.filename;
    const filepath = path.join(".",process.env.OUTPUTDIR,file);
    if (!fs.existsSync(filepath))
        return res.status(404).send("Not found.");
    res.contentType('audio/mpeg');
    res.set('content-disposition',`attachment;filename=${file}`);
    const fstream = fs.createReadStream(filepath);
    fstream.pipe(res);
});
export default router;