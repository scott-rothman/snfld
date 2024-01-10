import {DataManager} from './data.js';

const dataManager = new DataManager();
let showData = {};


const MAP = document.querySelector('.map');
const MENTIONS = document.querySelector('.mentions');

buildRelationshipTree();



async function buildRelationshipTree() {
  await dataManager.bootstrapData();
  dataManager.boostrapUserDataFunctionality();

  showData = dataManager.data;
  
  for (const season of showData.seasons) {
    if (season) {
      const seasonDOM = document.createElement('div');
      seasonDOM.classList.add('season');
      
      const seasonTitle = document.createElement('h2');
      seasonTitle.innerText = `Season ${season.season}`;
      
      const seasonEpisodes = document.createElement('div')
      seasonEpisodes.classList.add('season__episodes');
      seasonDOM.appendChild(seasonTitle);
      
      if (season.episodes) {
        const episodeKeys = Object.keys(season.episodes);
        for (const key of episodeKeys) {
          if (key) {
            const mentionsDom = buildAndReturnMentionDOM(season.episodes[key].mentions);
            const episodeDom = buildAndReturnEpisodeDOM(season.episodes[key], mentionsDom);
            seasonEpisodes.appendChild(episodeDom);
          }
        }
        
        
        seasonDOM.appendChild(seasonEpisodes);
      }
      
      MAP.appendChild(seasonDOM);
    }
  }
  addTreeInteractivity();
}



function addTreeInteractivity() {
  const episodeMentions = document.querySelectorAll('.episode-mention');
  
  for (const episodeMention of episodeMentions) {
    episodeMention.addEventListener('mouseover', (e) => {
      const activeID = e.target.dataset.id;
      activateHoveredMentions(activeID);
    });
    
    episodeMention.addEventListener('mouseout', (e) => {
      const activeID = e.target.dataset.id;
      hideHoveredMentions(activeID);
    });
  }
}


//  Helper functions to add interactivity

function activateHoveredMentions(mentionID) {
  const matchingMentions = document.querySelectorAll(`.episode-mention[data-id="${mentionID}"]`);
  const matchingGlobalMention = MENTIONS.querySelector(`[data-id="${mentionID}"]`);
  
  matchingGlobalMention.classList.add('active');
  for (const matchignMention of matchingMentions) {
    matchignMention.classList.add('active');
  }
}

function hideHoveredMentions(mentionID) {
  const matchingMentions = document.querySelectorAll(`.episode-mention[data-id="${mentionID}"]`);
  const matchingGlobalMention = MENTIONS.querySelector(`[data-id="${mentionID}"]`);
  
  matchingGlobalMention.classList.remove('active');
  for (const matchignMention of matchingMentions) {
    matchignMention.classList.remove('active');
  }
}

// Helper functions to build DOM

function buildAndReturnEpisodeDOM(episodeData, mentions) {
  const episodeDOM = document.createElement('div');
  const episodeTitle = document.createElement('h3');
  
  episodeDOM.classList.add('episode');
  episodeTitle.innerHTML = `<span class="episode__number">${episodeData.episode}.</span> <span class="episode__name">${episodeData.title}</span>`;
  episodeDOM.appendChild(episodeTitle);
  
  if (mentions) {
    episodeDOM.appendChild(mentions);
  }
  
  return episodeDOM;
}

function buildAndReturnMentionDOM(mentionData) {
  const mentionsDom = document.createElement('div');
  mentionsDom.classList.add('episode-mention__wrapper');
  
  if (!mentionData) {
    return null;
  }
  
  for (const mention of mentionData) {
    const mentionDom = document.createElement('div');
    mentionDom.dataset.id = mention;
    mentionDom.classList.add('episode-mention');
    mentionsDom.appendChild(mentionDom);
    checkAndAddToGlobalMentions(mention);
  }
  
  return mentionsDom;
}

function checkAndAddToGlobalMentions(mentionID) {
  const globalMention = MENTIONS.querySelector(`[data-id='${mentionID}']`);
  if (!globalMention) {
    const globalMentionDom = document.createElement('div');
    const title = document.createElement('h2');
    const description = document.createElement('p');
    
    for (const mention of showData.mentions) {
      if (mention.id === mentionID) {
        title.innerText = mention.shorthand;
        description.innerText = mention.description;
      }
    }
    
    
    globalMentionDom.appendChild(title);
    globalMentionDom.appendChild(description);
    globalMentionDom.classList.add(`global-mention`);
    globalMentionDom.dataset.id = mentionID;
    
    MENTIONS.appendChild(globalMentionDom);
  }
}