import { launch } from 'puppeteer-core';
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { URL } from "url";
import dotenv from "dotenv";
import metadata from "node-id3";
import path from "path";

dotenv.config();
/**
 * func for retrieving mp3 from soundcloud
 * @param {string} link
 * @returns {Promise<string>}
 */
export default function get(link) {
  return new Promise(async (resolve, reject) => {
    const UA =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";
    const outdir = `./${process.env.OUTPUTDIR}/`;
    const browser = await launch({
      headless: 'new',
      args: [`--user-agent=${UA}`, '--no-sandbox'],
      executablePath: process.env.CHROMEPATH
    });
    let mainTimeoutId;
    try {
      const urlObj = new URL(link);
      if (
        !urlObj.hostname.startsWith("on.") &&
        urlObj.pathname.split("/").length < 3
      )
        return reject("You must specify song link, not an author link.");
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const reqUrl = new URL(request.url()).pathname;
        const check = [
          ".png",
          ".jpg",
          ".mp3",
          ".svg",
          ".woff",
          ".gif",
          ".css",
          ".ico",
          "/announcements",
          "/b2",
          "/me",
          "/authorize",
          "/location",
          "/session",
          "/register2.php",
          "comments",
          "web-profiles",
          "client",
          "/tr",
          "/intermediatesupport",
        ].some((x) => reqUrl.endsWith(x));
        // if (!request.url().includes("base64") && !check) console.log("REQ", reqUrl,'PASS');
        if (reqUrl.endsWith("50-000f2d54.js")) request.continue();
        else if (check) request.abort();
        else request.continue();
      });
      const jsrespromise = page.waitForResponse(
        (res) => res.url().includes("50-000f2d54.js") && res.status() == 200
      );
      await page.goto(link, { waitUntil: "domcontentloaded" });
      const jsresponse = await jsrespromise;
      console.log("Got static JS");
      const js = await jsresponse.text();
      await page.evaluate(js);
      const hlsresponse = await page.waitForResponse(
        (res) => res.url().includes("playlist.m3u") && res.status() == 200
      );
      const title = await page.title();
      const pname = new URL(page.url()).pathname;
      console.log("Got HLS playlist URL");
      const id = pname.substring(pname.lastIndexOf("/") + 1);
      const resultfilename =
        outdir + (id + ".mp3").replace(/[/\\?%*:|"<>]/g, "-");
      if (fs.existsSync(resultfilename)) {
        console.log("Found file in cache, skipping concat & metadata");
        resolve(resultfilename);
        return;
      }
      const m3uContent = await hlsresponse.text();
      const lines = m3uContent.split("\n");
      const ffmpegList = lines
        .map((x) => x.trim())
        .filter((y) => y && !y.startsWith("#"))
        .map((z) => `file ${z}\n`);
      const listpath = outdir + id + ".txt";
      if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
      fs.writeFile(listpath, ffmpegList.join(""), (err) => {
        if (err) console.error(err);
        else console.log("Saved temp to", listpath);
      });
      await makemp3(listpath, title, resultfilename);
      resolve(resultfilename);
      await new Promise((r) => {
        mainTimeoutId = setTimeout(async () => {
          console.log("Timeout");
          reject("Timeout.");
          r();
        }, 20000);
      });
    } catch (error) {
      console.error("GLOBAL ERROR", error);
      reject(error.message);
    } finally {
      clearTimeout(mainTimeoutId);
      if (!browser.process().killed) browser.process().kill();
    }
  });
}

function makemp3(txtfile, title, resultfilename) {
  return new Promise(async (resolve, reject) => {
    const [song, artist] = title.split(" by ");
    ffmpeg()
    .setFfmpegPath(process.env.FFMPEGPATH)
      .input(txtfile)
      .inputOptions([
        "-f concat",
        "-safe 0",
        "-protocol_whitelist file,http,https,tcp,tls,crypto",
      ])
      .outputOptions("-c copy")
      .output(resultfilename)
      .on("error", (e) => {
        console.log("Concat finished with errors:", e.message);
        reject(e);
      })
      .on("end", async () => {
        console.log("Concat finished.");
        metadata.write(
          {
            title: song,
            artist: artist,
          },
          resultfilename,
          (err) => {
            if (err) console.warn(err);
            else console.log("Metadata finished.");
            fs.unlinkSync(txtfile);
            resolve();
          }
        );
      })
      .run();
  });
}
