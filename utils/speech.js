const gTTS = require('gtts');
const path = require("path");
const util = require('util');


const textToSpeech = async (text, filename) => {
  let speech = text;
  const gtts = new gTTS(speech, 'en', slow = false, tld = "com.au");
  const saveAsync = util.promisify(gtts.save.bind(gtts));
  await saveAsync(path.join(__dirname, '../local/', filename));
}

module.exports = {textToSpeech}