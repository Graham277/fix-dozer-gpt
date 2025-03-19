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
    await interaction.deferReply();

    // Get the prompt from the interaction
    const prompt = interaction.options.getString("Prompt");

    // Write the prompt to a file
    const promptFilePath = 'prompt.txt';
    fs.writeFileSync(promptFilePath, prompt);

    const { spawn } = require('child_process');

    // Function to run Python script and notify when done
    function runPythonScript() {
      return new Promise((resolve) => {
        const pythonProcess = spawn('python', ['your-script.py']); //REPLACE!!!
    
        // When the Python process ends, resolve the promise
        pythonProcess.on('close', (code) => {
          resolve(); // Simply resolve when done (we don't care about the exit code)
        });
      });
    }

    // Wait for the Python script to finish
    await runPythonScript();

    // Read the response from the Python script
    const responseFilePath = 'response.txt';
    const response = fs.readFileSync(responseFilePath, 'utf8');

    // Send the response back to the Discord interaction
    await interaction.editReply(response);
  }
}