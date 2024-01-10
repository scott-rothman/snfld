const database = firebase.database();

export class DataManager {
    constructor() {
        this.data = {};
        this.formWrapper = document.querySelector('.form__wrapper');
        this.mentionsForm = document.querySelector('.form__body--mentions');
        this.episodesForm = document.querySelector('.form__body--episodes');

        this.mentionSelector = document.querySelector('.form__mentions-list');
        this.mentionSeasonSelector = document.querySelector('.form__seasons-list--mentions');
        
        this.addButton = document.querySelector('.controls__add')
        this.closeFormWrapperButton = document.querySelector('.form__close-button');
        this.mentionsFormButton = document.querySelector('.form__mentions-button');
        this.episodesFormButton = document.querySelector('.form__episodes-button');
    }

    boostrapUserDataFunctionality() {
    
        this.addButton.addEventListener('click', () => {
            this.showFormWrapper();
        });

        this.closeFormWrapperButton.addEventListener('click', () => {
            this.hideFormWrapper();
        });
    
        this.mentionsFormButton.addEventListener('click', () => {
            this.mentionsFormButton.classList.add('active');
            this.episodesFormButton.classList.remove('active');
            this.showMentionsForm();
        });
    
        this.episodesFormButton.addEventListener('click', () => {
            this.mentionsFormButton.classList.remove('active');
            this.episodesFormButton.classList.add('active');
            this.showEpisodesForm();
        });

        this.episodesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEpisodeFormSubmission(e);
        });

        this.mentionsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMentionFormSubmission(e);
        });

        this.mentionSelector.addEventListener('change', (e) => {
            if (e.target.value === 'NEW') {
                this.adjustMentionInputs('NEW');
                this.clearFormFields();
            } else {
                this.adjustMentionInputs('OLD');
                this.prePopulateFormFields();
            }
        });

        this.mentionSeasonSelector.addEventListener('change', (e) => {
            this.purgeEpisodesSelector();
            this.populateEpisodesSelector();
        });
    }
    
    showFormWrapper() {
        this.clearFormFields();
        this.purgeEpisodesSelector();
        this.populateEpisodesSelector();
        this.formWrapper.classList.add('active');
    }
    
    hideFormWrapper() {
        this.formWrapper.classList.remove('active');
    }
    
    showMentionsForm() {
        this.mentionsForm.classList.add('active');
        this.episodesForm.classList.remove('active');
        this.populateMentionsSelectorWithNew();
        this.adjustMentionInputs('NEW');
    }

    showEpisodesForm() {
        this.episodesForm.classList.add('active');
        this.mentionsForm.classList.remove('active');
    }

    adjustMentionInputs(formStyle) {
        const inputsForExistingMentions = document.querySelectorAll('.form__input--existing');
        const inputsForNewMentions = document.querySelectorAll('.form__input--new input');
        if (formStyle === 'NEW') {
            for (const input of inputsForExistingMentions) {
                input.classList.add('hide');
            }
            for (const input of inputsForNewMentions) {
                input.removeAttribute('readonly');
            }
            
        } else {
            for (const input of inputsForExistingMentions) {
                input.classList.remove('hide');
            }
            for (const input of inputsForNewMentions) {
                input.setAttribute('readonly', 'readonly');
            }
        }
    }
    
    async bootstrapData() {
        return new Promise(async (resolve, reject) => {
            this.data.seasons = await this.gatherSeasonData();
            this.data.mentions = await this.gatherMentionsData();
            resolve();
        });
    }
    
    gatherSeasonData() {
        return new Promise((resolve, reject) => {
            const seasonsRef = database.ref('seasons/');
            seasonsRef.once('value', (snapshot) => {
                resolve(snapshot.val());
            });
        });
    }
    
    gatherMentionsData() {
        return new Promise((resolve, reject) => {
            const mentionsRef = database.ref('mentions/');
            mentionsRef.once('value', (snapshot) => {
                resolve(snapshot.val());
            });
        });
    }

    populateMentionsSelectorWithNew() {
        const mentionKeys = Object.keys(this.data.mentions).sort((a,b)=> this.data.mentions[a].slug > this.data.mentions[b].slug);

        for (const key of mentionKeys) {
            const optionCheck = this.mentionSelector.querySelector(`option[value="${key}"]`);
            if (!optionCheck) {
                const newOption = document.createElement('option');
                newOption.value = this.data.mentions[key].id;
                newOption.innerText = this.data.mentions[key].slug;
                this.mentionSelector.appendChild(newOption);
            }
        }
    }

    purgeEpisodesSelector() {
        const episodesSelector = document.querySelector('.form__episodes-list');
        const episodes = episodesSelector.querySelectorAll('option');

        if (episodes) {
            for (const episode of episodes) {
                episodesSelector.removeChild(episode);
            }
        }
    }

    populateEpisodesSelector() {
        const season = this.mentionSeasonSelector.value;
        const episodesSelector = document.querySelector('.form__episodes-list');
        const episodeKeys = Object.keys(this.data.seasons[season].episodes);

        for (const key of episodeKeys) {
            const episodeToAdd = document.createElement('option');
            episodeToAdd.value = key;
            episodeToAdd.innerText = key;

            episodesSelector.appendChild(episodeToAdd);
        }
    }

    prePopulateFormFields() {
        const curID = this.mentionSelector.value;

        const slugField = document.querySelector('input[name="slug"]');
        const shorthandField = document.querySelector('input[name="shorthand"]');
        const descriptionField = document.querySelector('input[name="description"]');

        slugField.value = this.data.mentions[curID].slug;
        shorthandField.value = this.data.mentions[curID].shorthand;
        descriptionField.value = this.data.mentions[curID].description;
    }

    clearFormFields() {
        const formFields = document.querySelectorAll('input');
        for (const field of formFields) {
            field.value = '';
        }
    }

    handleEpisodeFormSubmission(e) {
        const formInputs = e.target.querySelectorAll('input');
        const formData = {};
        for (const input of formInputs) {
            formData[input.name] = input.value;
        }

        try {
            this.addNewEpisodeToDatabase(formData);
        }
        catch {
            console.error('Error adding episode');
            this.setEpisdeMetaMessage('Error adding episode');
            return false;
        }
        finally {
            this.setEpisdeMetaMessage('Success!');
            this.clearFormFields();
        }
    }

    addNewEpisodeToDatabase(episodeData) {
        const seasonSelector = document.querySelector('.form__seasons-list--episodes');
        const seasonID = seasonSelector.value;
        const seasonsRef = database.ref(`seasons/${seasonID}/episodes/${episodeData.episode}`);
        
        seasonsRef.set({
            "episode": episodeData.episode,
            "season": seasonID,
            "title": episodeData.title
        });
    }

    handleMentionFormSubmission(e) {
        const formInputs = e.target.querySelectorAll('input');
        const formData = {};
        for (const input of formInputs) {
            formData[input.name] = input.value;
        }

        try {
            if (this.mentionSelector.value === 'NEW') {
                this.addNewMentionToDatabase(formData);
            } else {
                this.addMentionToEpisode()
            }
        }
        catch {
            console.error('Error adding mention');
            this.setMentionMetaMessage('Error adding mention');
            return false;
        }
        finally {
            this.setMentionMetaMessage('Success!');
            this.populateMentionsSelectorWithNew();
            this.clearFormFields();
        }
        
    }

    setMentionMetaMessage(messageText) {
        const errorContainer = document.querySelector('.form__mention-status');
        errorContainer.innerText = messageText;
        window.setTimeout(() => {
            errorContainer.innerText = '';
        }, 500);
    }

    setEpisdeMetaMessage(messageText) {
        const errorContainer = document.querySelector('.form__episode-status');
        errorContainer.innerText = messageText;
        window.setTimeout(() => {
            errorContainer.innerText = '';
        }, 500);
    }

    addMentionToEpisode() {
        const globalMentionID = this.mentionSelector.value;
        const seasonID = document.querySelector('.form__seasons-list--mentions').value;
        const episodeID = document.querySelector('.form__episodes-list').value;
        const episodeRef = database.ref(`seasons/${seasonID}/episodes/${episodeID}/`);
        episodeRef.once('value', (snapshot) => {
            const mentions = snapshot.val().mentions;
            let episodeMentionID = 0;
            if (mentions) {
                episodeMentionID = mentions.length;
            }
            const mentionRef = database.ref(`seasons/${seasonID}/episodes/${episodeID}/mentions/${episodeMentionID}`);
            mentionRef.set(globalMentionID);
        });
    }

    async addNewMentionToDatabase(mentionData) {
        await this.bootstrapData();
        const ID = this.getNextMentionID();
        const mentionsRef = database.ref(`mentions/${ID}/`);
        
        mentionsRef.set({
            "id": ID,
            "slug": mentionData.slug,
            "shorthand": mentionData.shorthand,
            "description": mentionData.description
        });
    }

    getNextMentionID() {
        const mentionKeys = Object.keys(this.data.mentions);
        const numberOfMentions = mentionKeys.length;
        const nextID = numberOfMentions;
        let nextIDString = nextID.toString();

        while (nextIDString.length < 4) {
            nextIDString = `0${nextIDString}`;
        }
        return nextIDString;
    }
}