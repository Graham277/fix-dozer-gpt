import datetime
import os
from dotenv import load_dotenv
import ollama
import tbapy
import re

# Tba key
load_dotenv()
tba = tbapy.TBA(os.getenv("TBA_KEY"))

# Get the event depending on the time of year
theDate = datetime.datetime.now()
if (theDate.month < 3):
   theEventIWant = None

elif ((theDate.day < 7) & (theDate.month == 3)):
   theEventIWant = None

elif ((theDate.day < 29) & (theDate.day >= 7) & (theDate.month == 3)):
   theEventIWant = '2025onwel'

elif ((theDate.day in [29, 30]) & (theDate.month == 3)):  
   theEventIWant = '2025onham'

elif ((theDate.day in [1, 2]) & (theDate.month == 4)):
    theEventIWant = '2025onham'

else:
    theEventIWant = '2025oncmp'


# Get rankings for an event
# If there is no data, convey there is no data to the bot by setting data to be "No data", instead of nothing
if(theEventIWant != None):
    rawData = tba.event_rankings(theEventIWant)
    data = str(rawData)
else:
    data = "No data"

# Get the prompt 
filePath = '/home/dozer/GPTStuff/prompt.txt'
with open(filePath, 'r') as file:
    prompt = file.read()

# Get the response from dozergpt
combinedPrompt = 'Respond in less than 2 sentences. Here is the data set:' + data + ' \nHere is the prompt from the user:\n' + prompt
rawResponse = ollama.chat(model='DozerGPT', messages=[{'role': 'user', 'content': combinedPrompt}])
weirdresponse = str(rawResponse)

# Keep only what's inside the double quotes function
def extract_content(weirdresponse):
    content_regex = r"content=['\"](.*?)(?=['\"][,])"
    only_text = re.findall(content_regex, weirdresponse)
    joined_together = "".join(only_text)
    response = joined_together.replace(r'\n', '\n')  # This will make sure \n is interpreted as a newline
    return response
response = extract_content(weirdresponse)

# Put the data into the file 
filePath = '/home/dozer/GPTStuff/response.txt'
with open(filePath, "w") as file:
    file.write(response)
