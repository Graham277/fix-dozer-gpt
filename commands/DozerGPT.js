const { SlashCommandBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
  .setName("dozergpt")
  .setDescription("Talk to DozerGPT")
  .addStringOption((option) =>
    option.setName('Prompt')
    .setDescription('Your prompt to send to DozerGPT')
    .setRequired(true)
  ),

  async execute(interaction) {    
    // Get the prompt from the interaction, send a reply to Discord
    const prompt = interaction.options.getString("Prompt");
    const originalReply = "Q:" + prompt + "\n\n Processing your request...";
    await interaction.reply(originalReply);
    // await interaction.deferReply();

    // Write the prompt to the file
    const promptFilePath = 'prompt.txt';
    fs.writeFileSync(promptFilePath, prompt);

    const { spawn } = require('child_process');

    // Function to run Python script and notify when done
    function runPythonScript() {
      return new Promise((resolve) => {
        const pythonProcess = spawn('python3', ['CallFromJS.py']); 
    
        // When the Python process ends, resolve the promise
        pythonProcess.on('close', (code) => {
          resolve(); 
        });
      });
    }

    await runPythonScript();

    // Read the response from the Python script, send back to Discord
    const responseFilePath = 'response.txt';
    const pythonResponse = fs.readFileSync(responseFilePath, 'utf8');
    const response =  "Q:" + prompt + "\n\nA:" + pythonResponse;
    await interaction.editReply(response);
  }
}