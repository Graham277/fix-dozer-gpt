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
    option.setName("prompt")
    .setDescription("Your prompt to send to DozerGPT")
    .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("style")
    .setDescription("Happy, Sad, Angry")
    .setRequired(false)
  ),

  async execute(interaction) {
    // Get the prompt from the interaction, send a reply to Discord
    const prompt = interaction.options.getString("prompt");
    const style = interaction.options.getString("style");

    var originalReply
    if (style == "Happy" || style == "Sad" || style == "Angry") {
      originalReply = "*Q:* " + prompt + "\n\nStyle: " + style +"\n\n *Processing your request...*";
    } 
    else if (style == "Costcoguys" || style == "UwU") {
      originalReply = "*Q:* " + prompt + "\n\nStyle: Hidden Style" + "\n\n *Processing your request...*";
    }
    else {
      originalReply = "*Q:* " + prompt + "\n\nNo Style\n\n *Processing your request...*";
    }
    await interaction.reply(originalReply);

    // Write the prompt to the file
    // const promptFilePath = '/home/dozer/GPTStuff/prompt.txt';
    // fs.writeFileSync(promptFilePath, prompt);

    const { spawn } = require('child_process');
    // Function to run Python script and notify when done
    function runPythonScript() {
      return new Promise((resolve) => {
        var pythonProcess
        if (style == "Happy") {
          pythonProcess = spawn('python3', ['/home/dozer/GPTStuff/HappyCallFromJS.py', prompt]);
        }
        else if (style == "Sad") {
          pythonProcess = spawn('python3', ['/home/dozer/GPTStuff/SadCallFromJS.py', prompt]);
        }
        else if (style == "Angry") {
          pythonProcess = spawn('python3', ['/home/dozer/GPTStuff/AngryCallFromJS.py', prompt]);

        }
        else if (style == "Costcoguys") {
          pythonProcess = spawn('python3', ['/home/dozer/GPTStuff/CostcoGuysCallFromJS.py', prompt]);
        }
        else if (style == "UwU") {
          pythonProcess = spawn('python3', ['/home/dozer/GPTStuff/UwUCallFromJS.py', prompt]);
        } 
        else{
          pythonProcess = spawn('python3', ['/home/dozer/GPTStuff/CallFromJS.py', prompt]);
        }

        // When the Python process ends, resolve the promise
        pythonProcess.on('close', (code) => {
          resolve(); 
        });
      });
    }

    await runPythonScript();

    // Read the response from the Python script, send back to Discord
    const responseFilePath = '/home/dozer/GPTStuff/response.txt';
    const pythonResponse = fs.readFileSync(responseFilePath, 'utf8');

    var response
    if (style == "Happy" || style == "Sad" || style == "Angry") {
      response =  "*Q:* " + prompt + "\n\nStyle: " + style + "\n\n*A:* " + pythonResponse;
    } 
    else if (style == "Costcoguys" || style == "UwU") {
      response =  "*Q:* " + prompt + "\n\nStyle: Hidden Style" + "\n\n*A:* " + pythonResponse;
    } 
    else {
      response = "*Q:* " + prompt + "\n\nNo Style\n\n*A:* " + pythonResponse;
    }
    await interaction.editReply(response);
  }
}
