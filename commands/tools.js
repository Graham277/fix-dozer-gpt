const axios = require("axios");
const dayjs = require("dayjs");

let config = {
  method: "get",
  maxBodyLength: Infinity,
  headers: {
    "X-TBA-Auth-Key": process.env.TBA,
  },
};

async function recentEvent(team) {
  const response = await axios.get(
    `https://www.thebluealliance.com/api/v3/team/frc${team}/events/${dayjs().year()}/simple`,
    config
  );

  const currentDate = dayjs();

  const startedEvents = response.data
    .map((event) => ({ ...event, key: null })) // Set .key to null for all events initially
    .filter(
      (event) =>
        dayjs(event.start_date).diff(currentDate, "milliseconds") <= 0
    );

  if (startedEvents.length === 0) {
    console.log("No events have started for team", team);
    return { key: null }; // Return an object with .key set to something
  }

  startedEvents.sort(
    (a, b) =>
      Math.abs(dayjs(a.start_date).diff(currentDate)) -
      Math.abs(dayjs(b.start_date).diff(currentDate))
  );

  return startedEvents[0];
}

async function fetchFromGist(filename) {
  const gistId = 'ab62f85c0462ebffea37d2d2f897ccab';
  const gistUrl = `https://api.github.com/gists/${gistId}`;
  const headers = {
    Authorization: process.env.GIT,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.get(gistUrl, { headers });

    // Check if the file exists in the Gist
    if (response.data.files && response.data.files[filename]) {
      return response.data.files[filename].content;
    } else {
      console.error(`File '${filename}' not found in Gist.`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching Gist data:', error);
    return null;
  }
}

module.exports = { recentEvent, fetchFromGist };
