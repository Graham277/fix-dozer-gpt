const puppeteer = require('puppeteer');
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { parse } = require('path');
const axios = require('axios');
const dayjs = require('dayjs');
const fs = require('fs').promises;
let config = {
    method: 'get',
    maxBodyLength: Infinity,
    headers: { 
      'X-TBA-Auth-Key': process.env.TBA
    }
  };
module.exports = {
    data: new SlashCommandBuilder()
        .setName("schatchmedule")
        .setDescription("Get the strength of a team's schedule at an event")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("team")
                .setDescription("Get the strength of a team's schedule at an event")
                .addStringOption((option) =>
                    option.setName('team')
                        .setDescription('Team number to get data for (defaults to 2200)')
                        .setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName('event-key')
                        .setDescription('Event key to get data for (defaults to 2200\'s most recent)')
                        .setRequired(false)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("best")
                .setDescription("See which teams have the best schedules at an event")
                .addStringOption((option) =>
                    option.setName('event-key')
                        .setDescription('Event key to get data for (defaults to 2200\'s most recent)')
                        .setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName('sort-by')
                        .setDescription('Sort by Rank, RP, EPA, or Composite Score, or Ranking at the Competition (defaults to Composite)')
                        .setRequired(false)
                        .addChoices(
                            { name: "Rank Score", value: "rank_score"},
                            { name: "RP Score", value: "rp_score"},
                            { name: "EPA Score", value: "epa_score"},
                            { name: "Composite Score", value: "composite_score"}
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("worst")
                .setDescription("See which teams have the worst schedules at an event")
                .addStringOption((option) =>
                    option.setName('event-key')
                        .setDescription('Event key to get data for (defaults to 2200\'s most recent)')
                        .setRequired(false)
                )
                .addStringOption((option) =>
                    option.setName('sort-by')
                        .setDescription('Sort by Rank, RP, EPA, or Composite Score, or Ranking at the Competition (defaults to Composite)')
                        .setRequired(false)
                        .addChoices(
                            { name: "Rank Score", value: "rank_score"},
                            { name: "RP Score", value: "rp_score"},
                            { name: "EPA Score", value: "epa_score"},
                            { name: "Composite Score", value: "composite_score"}
                        )
                )
        ),
        

    async execute(interaction) {
        await interaction.deferReply();
        const eventKey = interaction.options.getString("event-key") || (await recentEvent(2200)).key;
        const sortBy = interaction.options.getString("sort-by") || "composite_score";

        let team = null;
        if(interaction.options.getSubcommand() === "team"){
            team = interaction.options.getString("team") || 2200;
        }

        let alreadyScraped = {};
        try {
            alreadyScraped = JSON.parse(await fs.readFile('./images/cached_sos.txt', 'utf-8'));
        } catch {/* no previous data */}

        let data = alreadyScraped[eventKey];

        let reverseTable = {
            "rank_score": "Rank Score",
            "rp_score": "RP Score",
            "epa_score": "EPA Score",
            "composite_score": "Composite Score",
            "rank:" : "Ranking"
        }
        
        if(!data){
            let eventres;
            try{
                eventres = await axios.get(`https://www.thebluealliance.com/api/v3/event/${eventKey}/matches/simple`, config);
            } catch (err) {
                    const notFoundEmbed = new EmbedBuilder()
                        .setColor(0xF79A2A)
                        .setTitle(`:x: Event ${eventKey} not found`);
                    return interaction.editReply({ embeds: [notFoundEmbed] });
            }
            if(eventres.data.filter(match => match.comp_level === "qm").length === 0){
                const notFoundEmbed = new EmbedBuilder()
                    .setColor(0xF79A2A)
                    .setTitle(`:x: Event ${eventKey} has no qualification matches`);
                return interaction.editReply({ embeds: [notFoundEmbed] });
            }
            await interaction.editReply("Scraping data from statbotics... (future requests for this event will be faster)");
            console.log("not fazt")
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            try {
                await page.goto(`https://www.statbotics.io/event/${eventKey}#sos`);

                const extractTableData = async () => {
                    const tableData = await page.evaluate(() => {
                        const table = document.querySelector('body > div > div.w-full > div.w-full > div.w-full > div.w-full > div > div.w-full > div > div > table');
                        const rows = table.querySelectorAll('tr');
                        const data = [];

                        rows.forEach(row => {
                            
                            const cells = row.querySelectorAll('td');

                            let rowData = {
                                "rank": cells[0]?.textContent.trim(),
                                "number": cells[1]?.textContent.trim(),
                                "team": cells[2]?.textContent.trim(),
                                "epa": cells[3]?.textContent.trim(),
                                "rp_score": cells[4]?.textContent.trim(),
                                "rank_score": cells[5]?.textContent.trim(),
                                "epa_score": cells[6]?.textContent.trim(),
                                "composite_score": cells[7]?.textContent.trim(),
                            };
                            
                            if (Object.keys(rowData).length > 0) {
                                data.push(rowData);
                            }
                        });

                        return data;
                    });

                    return tableData;
                };
                
                async function waitForCondition(page) {
                    let conditionMet = false;
                    while (!conditionMet) {
                        //wait one second
                        await setTimeout(() => {}, 1000);
                        conditionMet = await page.evaluate(() => {
                            const elemval = document.querySelector("body > div > div.w-full > div.w-full > div > div.w-full > div > div.w-full > div > div > table > tbody > tr:nth-child(1) > td:nth-child(5)");
                            try {
                                let elempar = elemval.parentElement.parentElement.parentElement.querySelector('thead > tr > th:nth-child(5)');
                                if (!elempar) {
                                    console.error("something wrong with table head");
                                    return false;
                                }
                                // console.log("val",!isNaN(parseFloat(elemval.textContent.trim())),parseFloat(elemval.textContent.trim()));
                                // console.log("par",elempar.textContent.trim() === "RP Score",elempar.textContent.trim());
                                return elemval && elempar && !isNaN(parseFloat(elemval.textContent.trim())) && elempar.textContent.trim() === "RP Score";
                            } catch {
                                console.log("waiting for values to load")
                                return false;
                            }
                        });
                    }
                }
                
                await waitForCondition(page);
                
                let tableData = await extractTableData();
                let newTableData;
                let lastTableData;
                while (!await page.$('body > div > div.w-full > div.w-full > div.w-full > div.w-full > div > div.w-full > div > div > div > div > button:nth-child(2).opacity-50')) {
                    await page.click('body > div > div.w-full > div.w-full > div.w-full > div.w-full > div > div.w-full > div > div > div > div > button:nth-child(2)'),
                    // wait 1s to settle
                    setTimeout(() => {}, 1000);
                    //in new data != old add it
                    newTableData = await extractTableData();
                    if (newTableData === lastTableData) {
                        break;
                    }
                    lastTableData = newTableData;

                    tableData = tableData.concat(newTableData);
                }
                // clean up empty objs
                tableData = tableData.filter(obj => Object.keys(obj).length > 0);

                alreadyScraped[eventKey] = tableData;
                await fs.writeFile('./images/cached_sos.txt', JSON.stringify(alreadyScraped), 'utf-8');
                data = tableData;
            } catch (error) {
                console.error("An error occurred:", error);
            } finally {
                await browser.close();
            }
        } else{console.log("fazt")}

        if (team) {
            let teamData = data.find(row => row.number === team.toString());
            if (!teamData) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor(0xF79A2A)
                    .setTitle(`:x: Team ${team} is not at ${eventKey}`);
                return interaction.editReply({ embeds: [notFoundEmbed] });
            }
            const teamEmbed = new EmbedBuilder()
                .setColor(0xF79A2A)
                .setTitle(`Team ${teamData.number} - ${teamData.team}${teamData.team.endsWith("s") ? "'" : "'s"} Strength of Schedule at ${eventKey}:`)
                .addFields(
                    { name: 'Composite Score', value: teamData.composite_score + ((teamData.composite_score <=0.33) ? " :green_circle:" : ((teamData.composite_score >=0.67) ? " :red_circle:" : ""))},
                    { name: 'RP Score', value: teamData.rp_score + ((teamData.rp_score <=0.33) ? " :green_circle:" : ((teamData.rp_score >=0.67) ? " :red_circle:" : ""))},
                    { name: 'Rank Score', value: teamData.rank_score + ((teamData.rank_score <=0.33) ? " :green_circle:" : ((teamData.rank_score >=0.67) ? " :red_circle:" : ""))},
                    { name: 'EPA Score', value: teamData.epa_score + ((teamData.epa_score <=0.33) ? " :green_circle:" : ((teamData.epa_score >=0.67) ? " :red_circle:" : ""))}
                );
            interaction.editReply({ embeds: [teamEmbed] });
        } else if (interaction.options.getSubcommand() === "best") {
            let bestTeams = data.sort((a, b) => a[sortBy] - b[sortBy]).slice(0, 5);
            const bestEmbed = new EmbedBuilder()
                .setColor(0xF79A2A)
                .setTitle(`:trophy: Best Strength of Schedule by ${reverseTable[sortBy]} at ${eventKey}:`)
                .setDescription(bestTeams.map(row => `**${row.number}:** ${row[sortBy]}`).join("\n"));
            interaction.editReply({ embeds: [bestEmbed] });
        } else if (interaction.options.getSubcommand() === "worst") {
            let worstTeams = data.sort((a, b) => a[sortBy] - b[sortBy]).slice(-5);
            const worstEmbed = new EmbedBuilder()
                .setColor(0xF79A2A)
                .setTitle(`:poop: Worst Strength of Schedule by ${reverseTable[sortBy]} at ${eventKey}:`)
                .setDescription(worstTeams.map(row => `**${row.number}:** ${row[sortBy]}`).join("\n"));
            interaction.editReply({ embeds: [worstEmbed] });
        } else {
            const unknownCommandEmbed = new EmbedBuilder()
                .setColor(0xF79A2A)
                .setDescription(`:question: What did you do`);
            interaction.editReply({ embeds: [unknownCommandEmbed] });
        }

        async function recentEvent(team) {
            const response = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${team}/events/${dayjs().year()}/simple`, config);
      
            const currentDate = dayjs();
            
            const startedEvents = response.data.filter(event =>
                dayjs(event.start_date).diff(currentDate, 'milliseconds') <= 0
            );
        
            if (startedEvents.length === 0) {
                //console.log("No events have started for team", team);
                return null;
            }
      
            startedEvents.sort((a, b) => Math.abs(dayjs(a.start_date).diff(currentDate)) - Math.abs(dayjs(b.start_date).diff(currentDate)));
            // console.log("Started events for team", team, ":", startedEvents);
            return startedEvents[0];
          }
    },
};
