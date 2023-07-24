import ViteExpress from 'vite-express';
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import get from "./sc.js";
import maincsrf from "./maincsrf.js";
import filerouter from './filerouter.js';
import formBodyParser from 'body-parser';
import multer from 'multer';
import metadata from 'node-id3';
dotenv.config();
ViteExpress.config({mode:process.env?.NODE_ENV ?? 'development'});
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(formBodyParser.urlencoded({extended:false}));
app.use(multer().none());
app.use(cookieParser(process.env.COOKIESECRET));
app.use(
  session({
    secret: process.env.SESSIONSECRET,
    cookie: {
      maxAge: 60000 * 60 * 24
    },
    resave: false,
    saveUninitialized: true,
  })
);
app.use(maincsrf);
app.use((err,_req,res,next)=>{
  if (err.code !== 'EBADCSRFTOKEN')
    return next(err);
    res.status(403);
    res.send("Forbidden");
});
app.use('/'+process.env.OUTPUTDIR,filerouter);
app.get("/internal",(_req, res) => {
  res.header('x-token',_req.csrfToken());
  res.type('text').send("OK");
});

app.post("/internal",async (req,res) => {
  if (!req.body.link)
    return res.status(404).json({error:'No link.'});
    try{
      const result = await get(req.body.link);
      const md = metadata.read(result);
      res.status(200).json({result:result.substring(1), title: md.title});
    }
    catch(err)
    {
      res.status(400).json({error:err});
    }
});

const port = process.env.PORT;

ViteExpress.listen(app, port, () =>
  console.log("Server open on", port)
);
