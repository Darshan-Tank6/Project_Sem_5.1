// server.js
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

// Replace with your JDoodle credentials
const JDoodleClientId = "3062ae268e3ac61620ebae81c26305eb";
const JDoodleClientSecret =
  "3440dfc7083f4487038995d2c3aaecf0502a6ac3163367085be6bc493136764e";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static HTML
app.use(express.static(path.join(__dirname, "public")));

app.post("/run", async (req, res) => {
  const { code, language } = req.body;

  // Map language to JDoodle settings
  const languageMap = {
    python: { lang: "python3", versionIndex: "4" },
    c: { lang: "c", versionIndex: "5" },
  };

  if (!languageMap[language]) {
    return res.status(400).json({ error: "Unsupported language." });
  }

  const payload = {
    clientId: JDoodleClientId,
    clientSecret: JDoodleClientSecret,
    script: code,
    language: languageMap[language].lang,
    versionIndex: languageMap[language].versionIndex,
  };

  try {
    const response = await axios.post(
      "https://api.jdoodle.com/v1/execute",
      payload
    );
    res.json({ output: response.data.output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error executing code." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
