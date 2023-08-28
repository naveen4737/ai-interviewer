require("dotenv").config();
const fs = require("fs");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const ask = async (messages) => {
  try {
    if (messages == null) {
      throw new Error("Uh oh, no prompt was provided");
    }
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
    });
    return response.data.choices[0].message.content
  } catch (error) {
    console.log(error);
    console.log(error.message);
    return 'Can\'t process the request';
  }
};

const audio_to_text = async (filename) => {
  const audioBuffer = fs.createReadStream("./local/"+filename)
  let transcript = "done";
  try {
    transcript = await openai.createTranscription(fs.createReadStream("./local/"+filename), 'whisper-1');
    return transcript.data.text
  } catch (error) {
    console.log(error)
    return 'NO RESPONSE FROM CANDIDATE'
  }
}

module.exports = { ask, audio_to_text };