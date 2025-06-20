import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
} from "@google/genai";
import express from "express";
import multer from "multer";
import fs from "fs";

const gemini_secret = process.env["REACT_APP_GEMINI_KEY"];
const ai = new GoogleGenAI({ apiKey: gemini_secret });

const app = express();
app.use(express.json());

const upload = multer({
  dest: "uploads/",
});

app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    console.log(response.text);
    res.json({
      error: false,
      output: response.text,
    });
  } catch (error) {
    console.error(error);
    req.status(500).json({
      error: true,
      message: e.message,
    });
  }
});

// upload.single(formDataYangDicari: string)
// contoh: upload.single('image') --> yang dicari di FormData yang bernama 'image'
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  const { prompt = "Describe this uploaded image." } = req.body;

  try {
    // 1. Baca file gambar
    const image = await ai.files.upload({
      file: req.file.path,
      config: {
        mimeType: req.file.mimetype,
      },
    });

    // 3. Sertakan dalam prompt
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        createUserContent([
          prompt,
          createPartFromUri(image.uri, image.mimeType),
        ]),
      ],
    });

    console.log(result.text);

    res.json({ output: result.text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: error.message });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    const { prompt = "Describe this uploaded document." } = req.body;

    try {
      const filePath = req.file.path;
      const buffer = fs.readFileSync(filePath);
      const base64Data = buffer.toString("base64");
      const mimeType = req.file.mimetype;

      const documentPart = {
        inlineData: { data: base64Data, mimeType },
      };

      console.log({ documentPart });

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [createUserContent([prompt, documentPart])],
      });

      console.log(result.text);

      res.json({ output: result.text });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({
        error: e.message,
      });
    } finally {
      fs.unlinkSync(req.file.path);
    }
  }
);

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const { prompt = "Describe this uploaded audio." } = req.body;

  try {
    console.log(req.file);
    const audioBuffer = fs.readFileSync(req.file.path);
    const base64Audio = audioBuffer.toString("base64");
    const mimeType = req.file.mimetype;

    const audioPart = {
      inlineData: { data: base64Audio, mimeType },
    };

    console.log({ audioPart });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [createUserContent([prompt, audioPart])],
    });

    console.log(result.text);

    res.json({ output: result.text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: error.message });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

const APP_PORT = 3000;
app.listen(APP_PORT, () => {
  console.log("Listening...");
});
