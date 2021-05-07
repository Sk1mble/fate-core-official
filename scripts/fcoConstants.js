class fcoConstants { 

    static getFateLadder(){
        return  {
                    "10":"",
                    "9":"",
                    "8":game.i18n.localize("fate-core-official.Legendary"),
                    "7":game.i18n.localize("fate-core-official.Epic"),
                    "6":game.i18n.localize("fate-core-official.Fantastic"),
                    "5":game.i18n.localize("fate-core-official.Superb"),
                    "4":game.i18n.localize("fate-core-official.Great"),
                    "3":game.i18n.localize("fate-core-official.Good"),
                    "2":game.i18n.localize("fate-core-official.Fair"),
                    "1":game.i18n.localize("fate-core-official.Average"),
                    "0":game.i18n.localize("fate-core-official.Mediocre"),
                    "-1":game.i18n.localize("fate-core-official.Poor"),
                    "-2":game.i18n.localize("fate-core-official.Terrible"),
                }
    }

    static getAdjective(r){
        const ladder = this.getFateLadder()
        return (ladder[r])
    }

    static getPen (id){
        let editor = $(`#${id}`)[0];
        if (editor){
            var options = {
                editor: editor, // {DOM Element} [required]
                stay: false,
                class: 'pen', // {String} class of the editor,
                debug: false, // {Boolean} false by default
                textarea: '<textarea name="content"></textarea>', // fallback for old browsers
                linksInNewWindow: false // open hyperlinks in a new windows/tab
            }
            return new Pen(options);
        }
    }

    static awaitOKDialog(prompt, content, width, height){
        if (width === undefined){
            width = "500";
        }
        if (height === undefined){
            height = "auto";
        }
        
        return new Promise(resolve => {
            new Dialog({
                title: prompt,
                content: content,
                buttons: {
                    ok: {
                        label: game.i18n.localize("fate-core-official.OK"),
                        callback: () => {
                            resolve("OK");
                        }
                    }
                },
                default:"ok",
                close: ()=> {resolve("OK)")},
            },
            {
                width:width,
                height:height,
            }).render(true);
        })
    }

    static awaitYesNoDialog(prompt, content){
        return new Promise(resolve => {
            new Dialog({
                title: prompt,
                content: content,
                buttons: {
                    yes: {
                        label: game.i18n.localize("fate-core-official.Yes"),
                        callback: () => {
                            resolve("yes");
                        }
                    },
                    no: {
                        label: game.i18n.localize("fate-core-official.No"),
                        callback: () => {
                            resolve("no");
                        }
                    }
                },
                default:"no",
                close: ()=> {resolve("no")},
            }).render(true);
        })
    }

    static awaitColourPicker(prompt){
        return new Promise(resolve => {
            new Dialog({
                title: prompt,
                content: '<input type="color" id="mf_cp" value="#000000"></input>',
                buttons: {
                    ok: {
                        label: game.i18n.localize("fate-core-official.OK"),
                        callback: () => {
                            resolve(document.getElementById("mf_cp").value)
                        }
                    }
                },
                default:"ok",
            }).render(true);
        })
    }

    static async confirmDeletion(){
        let confirm = game.settings.get("fate-core-official","confirmDeletion");
        if (!confirm){
            return true;
        } else {
            let del = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.ConfirmDeletion"));
            if (del=="yes"){
                return true;
            } else {
                return false;
            }
        }
    }

    static getInput(prompt){        
        return new Promise(resolve => {
            new Dialog({
                title: prompt,
                content: '<div align="center"><input id="dialog_box" style="width:375px; margin:5px" autofocus></input></div>',
                buttons: {
                    ok: {
                        label: game.i18n.localize("fate-core-official.OK"),
                        callback: () => {
                            resolve(document.getElementById("dialog_box").value)
                        }
                    }
                },
                default:"ok"
            }).render(true);
        });
    }

    static getInputFromList(prompt, options){
        let optionsText = "";
        options.forEach(option =>{
            optionsText+=`<option>${option}</option>`
        })        
        return new Promise(resolve => {
            new Dialog({
                title: prompt,
                content: `<div align="center"><select id="dialog_box" style="width:375px">${optionsText}</select></div>`,
                buttons: {
                    ok: {
                        label: game.i18n.localize("fate-core-official.OK"),
                        callback: () => {
                            resolve(document.getElementById("dialog_box").value)
                        }
                    }
                },
                default:"ok"
            }).render(true);
        });
    }

    static updateText(prompt, textToUpdate){
    return new Promise(resolve => {
        new Dialog({
            title: prompt, 
            content: `<div style="background-color:white; color:black;"><textarea rows="10" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="get_text_box">${textToUpdate}</textarea></div>`,
            buttons: {
                ok: {
                    label: game.i18n.localize("fate-core-official.Save"),
                    callback: () => {
                        resolve(document.getElementById("get_text_box").value)
                    }
                }
            },
        }).render(true);
    });
    }

    static updateShortText(prompt, textToUpdate){
        return new Promise(resolve => {
            new Dialog({
                title: prompt, 
                content: `<div style="background-color:white; color:black;"><textarea rows="1" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="get_text_box">${textToUpdate}</textarea></div>`,
                buttons: {
                    ok: {
                        label: game.i18n.localize("fate-core-official.Save"),
                        callback: () => {
                            resolve(document.getElementById("get_text_box").value)
                        }
                    },
                },
                default:"ok",
            }).render(true);
        });
        }

    static sortByKey(json_object){
        let ordered_object = {}
        let unordered_object = json_object;
        Object.keys(unordered_object).sort().forEach(function(key) {ordered_object[key] = unordered_object[key];})
        return ordered_object;
    }

    static sortByRank(json_object){
        //Sort a JSON object by rank.
        let toSort = []
        for (let x in json_object){
            toSort.push(json_object[x])
        }
        this.sort_rank(toSort);
        return toSort;
    }
    //Sort an array of JSON objects by object.name
    static async sort_name(array){
        array.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);//This actually properly sorts by name; case sensitive.
    }
    //Sort an array of JSON objects by object.rank
    static async sort_rank(array){
        array.sort((a, b) => parseInt(b.rank) - parseInt(a.rank));
    }

    //Sort an array of JSON objects by a key
    static async sort_key(array, key){
        array.sort((a, b) => a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0);//This actually properly sorts by name; case sensitive.
    }

    static moveKey (object, key, numPlaces){
        //If numPlaces is positive, we move down, if negative, up. 

        let current_object = object;
        let end_object = {};
        let key_to_move = key;
        let keys = Object.keys(current_object);

        let currentIndex = keys.indexOf(key);
        let newIndex = currentIndex + numPlaces;
        if (newIndex <0){
            newIndex = 0;
        }
        if (newIndex > keys.length){
            newIndex = keys.length;
        }

        let tempKey = keys.splice(currentIndex,1);
        keys.splice(newIndex, 0, tempKey[0]);

        //Now we iterate through the array and copy the keys to the new object, before assigning the old object to the new object to finish the job.

        keys.forEach(key => {
            end_object[key] = current_object[key]
        })
        
        return end_object;
    }

    static exportSettings (){
        //This function returns a text string in JSON notation containing all of the game's settings for backup or import into another world.
        let output = {};
        output.stunts = game.settings.get("fate-core-official","stunts");
        output.skills = game.settings.get("fate-core-official","skills");
        output.skillTotal = game.settings.get("fate-core-official", "skillTotal");
        output.tracks = game.settings.get("fate-core-official","tracks");
        output.aspects = game.settings.get("fate-core-official","aspects");
        output.freeStunts = game.settings.get("fate-core-official","freeStunts");
        output.refreshTotal = game.settings.get("fate-core-official","refreshTotal");
        output.track_categories = game.settings.get("fate-core-official","track_categories");
        output.defaults = game.settings.get("fate-core-official", "defaults");
        output.enforceSkillTotal = game.settings.get("fate-core-official", "enforceSkillTotal");
        output.enforceColumn = game.settings.get("fate-core-official", "enforceColumn");
        output.init_skill = game.settings.get("fate-core-official", "init_skill");
        output.modifiedRollDefault = game.settings.get("fate-core-official", "modifiedRollDefault")
        output.sheet_template = game.settings.get("fate-core-official", "sheet_template")
        output.limited_sheet_template = game.settings.get("fate-core-official", "limited_sheet_template")
        output.playerThings = game.settings.get("fate-core-official", "PlayerThings")
        output.DeleteOnTransfer = game.settings.get("fate-core-official", "DeleteOnTransfer")
        output.drawingsOnTop = game.settings.get("fate-core-official", "drawingsOnTop")
        output.fuFontSize = game.settings.get("fate-core-official", "fuFontSize")
        output.aspectWidth = game.settings.get("fate-core-official", "aspectwidth")
        output.fuAspectLabelSize = game.settings.get("fate-core-official", "fuAspectLabelSize")
        output.fuAspectLabelFont = game.settings.get("fate-core-official", "fuAspectLabelFont")
        output.fuAspectLabelTextColor = game.settings.get("fate-core-official", "fuAspectLabelTextColour")
        output.fuAspectLabelFillColour = game.settings.get("fate-core-official", "fuAspectLabelFillColour")
        output.fuAspectLabelBorderColour = game.settings.get("fate-core-official", "fuAspectLabelBorderColour")
        output.skillsLabel = game.settings.get("fate-core-official", "skillsLabel")
        return JSON.stringify(output, null, 5);
    }

    static async getSettings (){
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("fate-core-official.PasteDataToOverwrite"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="import_settings"></textarea></div>`,
                buttons: {
                    ok: {
                        label: game.i18n.localize("fate-core-official.Save"),
                        callback: () => {
                            resolve (document.getElementById("import_settings").value);
                        }
                    }
                },
            }).render(true)
        });
    }
    
    // I'll need this code to get file data
    //let f = await fetch("/systems/dnd5e/system.json")
    //let j = await f.json()
    
    static async getJSON(filename){
        let f = await fetch(filename)
        let j = await f.json()
        return j;
    }
    
    static async importSettings (input){
        if (input.constructor === String) input = await JSON.parse(input);

        //This function parses a text string in JSON notation containing all of the game's settings and writes those settings to System.settings.
        await game.settings.set("fate-core-official","stunts",input?.stunts);
        await game.settings.set("fate-core-official","skills",input?.skills);
        await game.settings.set("fate-core-official","skillTotal",input?.skillTotal);
        await game.settings.set("fate-core-official","tracks",input?.tracks);
        await game.settings.set("fate-core-official","aspects",input?.aspects);
        await game.settings.set("fate-core-official","freeStunts",input?.freeStunts);
        await game.settings.set("fate-core-official","refreshTotal",input?.refreshTotal);
        await game.settings.set("fate-core-official","track_categories",input?.track_categories);
        await game.settings.set("fate-core-official", "defaults", input?.defaults) 
        await game.settings.set("fate-core-official", "enforceSkillTotal", input?.enforceSkillTotal);
        await game.settings.set("fate-core-official", "enforceColumn", input?.enforceColumn);
        await game.settings.set("fate-core-official", "init_skill", input?.init_skill);
        await game.settings.set("fate-core-official", "modifiedRollDefault", input?.modifiedRollDefault);
        await game.settings.set("fate-core-official", "sheet_template", input?.sheet_template);
        await game.settings.set("fate-core-official", "limited_sheet_template", input?.limited_sheet_template);
        await game.settings.set("fate-core-official", "PlayerThings", input.PlayerThings)
        await game.settings.set("fate-core-official", "DeleteOnTransfer", input.DeleteOnTransfer)
        await game.settings.set("fate-core-official", "drawingsOnTop", input.drawingsOnTop)
        await game.settings.set("fate-core-official", "fuFontSize", input.fuFontSize)
        await game.settings.set("fate-core-official", "aspectwidth", input.aspectWidth)
        await game.settings.set("fate-core-official", "fuAspectLabelSize", input.fuAspectLabelSize)
        await game.settings.set("fate-core-official", "fuAspectLabelFont", input.fuAspectLabelFont)
        await game.settings.set("fate-core-official", "fuAspectLabelTextColour", input.fuAspectLabelTextColor)
        await game.settings.set("fate-core-official", "fuAspectLabelFillColour", input.fuAspectLabelFillColour)
        await game.settings.set("fate-core-official", "fuAspectLabelBorderColour", input.fuAspectLabelBorderColour)
        await game.settings.set("fate-core-official", "skillsLabel", input.skillsLabel)
        await ui.sidebar.render(false);
    }

    static async getMFSettings(){
            let settings = game.user.getFlag("world", "oldSettings");
            if (settings){
                settings.forEach(async s =>{
                    await game.settings.set("fate-core-official", s.key, s.data)
                })
                game.user.unsetFlag("world", "oldSettings");
            }            
    }

    static getKey(text){
        return text.hashCode();
    }

    static async index_journals(){
        // First we store the linkages between journals and map pins and journals and scenes.
        let scenes = Array.from(game.scenes);
        for (let scene of scenes){
            let s_index = {};
            s_index["scene_journal"] = scene.journal?.name;

            let notes = Array.from(scene.notes);
            for (let note of notes){
                let name = game.journal.get(note.data.entryId).name;
                s_index[note.data.entryId] = name;
            }
            await scene.setFlag("fate-core-official","s_index", s_index);
        }
        //Now we store a flag on every journal entry with its current reference so that we can re-map after importing.
        let journals = Array.from(game.journal);
        for (let journal of journals){
            journal.setFlag("fate-core-official","oldId",journal.id);
        }
    }

    static async relink_after_compendia (){
        for (let scene of Array.from(game.scenes)){
            let update = [];
            for (let token of scene.tokens.contents){
                let match_id = game.actors.getName(token.name)?.id;
                if (match_id) {
                    update.push({_id:token.id, actorId:match_id})
                }
            }
            await scene.updateEmbeddedDocuments("Token", update);
            // Now let us link to the journal for the scene and map pins. 
            // These must have been stored in the scenes BEFORE being put in the compendia.
            // The macro to do this is called "Index Scene Journals"
            let s_index = scene.getFlag("fate-core-official", "s_index");
            if (s_index){
                if (s_index["scene_journal"]){
                    await scene.update({journal:game.journal.getName(s_index["scene_journal"]).id});
                }
            }
            let notes = Array.from(scene.notes);
            update = [];
            for (let note of notes){
                console.log(note);
                let id = game.journal.getName(s_index[note.data.entryId])?.id;
                if (id){
                    update.push({"_id":note.id, "entryId":id});
                }
            }
            if (update.length > 0){
                await scene.updateEmbeddedDocuments("Note", update);
            }
        }
        // Now to re-link the journal text
        let journals = Array.from(game.journal);
        for (let journal of journals){
            let text = journal.data.content;
            for (let j3 of journals){
                let oldId = j3.getFlag("fate-core-official","oldId");
                if (text.indexOf(oldId)==-1) continue;
                let newId = j3.id;
                let regex = new RegExp(oldId, 'g');
                text = text.replace(regex, newId);
            }
            await journal.update({content:text});
        }
    }
} 

String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }