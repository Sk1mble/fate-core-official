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

    static async fcoEnrich (value, object){
        let secrets = false;
        if (object) secrets = object.isOwner;
        if (game.user.isGM) secrets = true;
        return DOMPurify.sanitize(await TextEditor.enrichHTML(value, {secrets:secrets, documents:true, async:true}));
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
            let p = new Pen (options);
            return p;
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
                content: `<p>${content}<br/>`,
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
                content: `<p>${content}<br/>`,
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
            let del = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.Delete"),game.i18n.localize("fate-core-official.ConfirmDeletion"));
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

    static updateText(prompt, textToUpdate, apply){
        let label = game.i18n.localize("fate-core-official.Save");
        if (apply) label = game.i18n.localize("fate-core-official.Apply");
        return new Promise(resolve => {
            new Dialog({
                title: prompt, 
                content: `<div style="background-color:white; color:black;"><textarea style="min-height:600px; font-family:var(--fco-font-family); width:800px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="get_text_box">${textToUpdate}</textarea></div>`,
                buttons: {
                    ok: {
                        label: label,
                        callback: () => {
                            resolve(DOMPurify.sanitize(document.getElementById("get_text_box").value))
                        }
                    },
                    discard: {
                        label: game.i18n.localize("fate-core-official.Discard"),
                        callback: () => {
                            resolve("discarded")
                        }
                    }
                }
            },
            {
                width:820,
                resizable:true
            }).render(true);
        });
    }

    static updateShortText(prompt, textToUpdate){
        return new Promise(resolve => {
            new Dialog({
                title: prompt, 
                content: `<div style="background-color:white; color:black;"><textarea rows="1" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="get_text_box">${textToUpdate}</textarea></div>`,
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
        let scheme = game.settings.get("fate-core-official", "fco-world-sheet-scheme");
        if (scheme) output.fco_world_sheet_scheme = scheme;
        let formulae = game.settings.get("fate-core-official","fu-roll-formulae");
        if (formulae) output["fu-roll-formulae"] = formulae;
        let default_actor_permission = game.settings.get("fate-core-official","default_actor_permission");
        if (default_actor_permission) output["default_actor_permission"] = default_actor_permission;
        let fuAspectLabelBorderAlpha = game.settings.get("fate-core-official","fuAspectLabelBorderAlpha");
        if (fuAspectLabelBorderAlpha) output["fuAspectLabelBorderAlpha"] = fuAspectLabelBorderAlpha;
        let fuAspectLabelFillAlpha = game.settings.get("fate-core-official","fuAspectLabelFillAlpha");
        if (fuAspectLabelFillAlpha) output["fuAspectLabelFillAlpha"] = fuAspectLabelFillAlpha;
        let fu_ignore_list = game.settings.get("fate-core-official","fu-ignore-list");
        if (fu_ignore_list) output["fu-ignore-list"] = fu_ignore_list;
        return JSON.stringify(output, null, 5);
    }

    static async getSettings (){
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("fate-core-official.PasteDataToOverwrite"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="import_settings"></textarea></div>`,
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
         
        let current_stunts = game.settings.get("fate-core-official","stunts");
        let stunts = input?.stunts;

        let current_defaults = game.settings.get("fate-core-official", "defaults");
        let defaults = input?.defaults;
        console.log(defaults);

        // Give option to merge stunts, if there are stunts in the new settings AND stunts in the existing settings.

        if (Object.keys(current_stunts).length > 0){
            if (Object.keys(stunts).length > 0){
                let confirm = await Dialog.confirm({
                    title:  game.i18n.localize("fate-core-official.mergeStuntsTitle"),
                    content: `<p>${game.i18n.localize("fate-core-official.mergeStunts")}</p>`
                });
                if ( confirm ) {
                    let final_stunts = mergeObject(current_stunts, stunts);
                    await game.settings.set("fate-core-official","stunts", final_stunts);
                } else {
                    await game.settings.set("fate-core-official","stunts", stunts);
                }
            }   
        } else {
            await game.settings.set("fate-core-official","stunts", stunts);
        }

        // Give option to merge character default frameworks, if there are stunts in the new settings AND stunts in the existing settings.

        if (Object.keys(current_defaults).length > 0){
            if (Object.keys(defaults).length > 0){
                let confirm = await Dialog.confirm({
                    title:  game.i18n.localize("fate-core-official.mergeDefaultsTitle"),
                    content: `<p>${game.i18n.localize("fate-core-official.mergeDefaults")}</p>`
                });
                if ( confirm ) {
                    let final_defaults = mergeObject(current_defaults, defaults);
                    await game.settings.set("fate-core-official","defaults", final_defaults);
                } else {
                    await game.settings.set("fate-core-official","defaults", defaults);
                }
            }   
        } else {
            await game.settings.set("fate-core-official","defaults", defaults);
        }
          
        await game.settings.set("fate-core-official","tracks",input?.tracks);
        await game.settings.set("fate-core-official","skills",input?.skills);
        await game.settings.set("fate-core-official","track_categories",input?.track_categories);   
        await game.settings.set("fate-core-official","skillTotal",input?.skillTotal);
        await game.settings.set("fate-core-official","aspects",input?.aspects);
        await game.settings.set("fate-core-official","freeStunts",input?.freeStunts);
        await game.settings.set("fate-core-official","refreshTotal",input?.refreshTotal);
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
        if (input?.fco_world_sheet_scheme) await game.settings.set("fate-core-official", "fco-world-sheet-scheme", input.fco_world_sheet_scheme);
        if (input?.["fu-roll-formulae"]) await game.settings.set("fate-core-official","fu-roll-formulae", input["fu_roll-formulae"]);
        if (input?.["default_actor_permission"]) await game.settings.set("fate-core-official", "default_actor_permission", input["default_actor_permission"])
        if (input?.["fuAspectLabelBorderAlpha"]) await game.settings.set("fate-core-official", "fuAspectLabelBorderAlpha", input["fuAspectLabelBorderAlpha"])
        if (input?.["fuAspectLabelFillAlpha"]) await game.settings.set("fate-core-official", "fuAspectLabelFillAlpha", input["fuAspectLabelFillAlpha"])
        if (input?.["fu-ignore-list"]) await game.settings.set("fate-core-official", "fu-ignore-list", input["fu-ignore-list"])
        await ui.sidebar.render(false);
    }

    static getKey(text){
        return text.hashCode();
    }

    static async ulStunts(stunts){
        let db = await duplicate(game.settings.get("fate-core-official", "stunts"))

        // First check for duplicates and permission to overwrite
        for (let st in stunts){
            delete stunts[st].extra_id;
            delete stunts[st].original_name;
            
            if (db[st]){
                let overwrite = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"),`${game.i18n.localize("fate-core-official.stunt")} "${db[st].name}": `+game.i18n.localize("fate-core-official.exists"));
                if (overwrite == "no") delete stunts[st];
            }
        }
        // Now prepare the merge
        let toSet = await foundry.utils.mergeObject(db, stunts);
        game.settings.set("fate-core-official", "stunts", toSet);
    }

    static async exportFolderStructure(){
        let folders = [];
        game.folders.forEach(f => folders.push(f));
        let output = await JSON.stringify(folders, null, 5);
        await saveDataToFile(output, "text/plain", "folders.json");
    }
    
    static async createFolders(folders){
        await Folder.createDocuments(folders, {keepId:true});
    }

    static async packModule (module){
        // Export folders to folders.json
        await this.exportFolderStructure();
        // Export world settings to setup.json
        let out = await this.exportSettings();
        await saveDataToFile(out, "text/plain", "setup.json");
        // Export all folder contents to the relevant compendium with {keepID:true}
        // The assumption here is that there is exactly ONE compendium for each type of content
        // If we breach this assumption, then the first compendium found for a given type will be populated with the given data
        // And the others left blank.
        // First, we find the compendium for the given module that meshes with each type of in-world entity.
        // This requires the prototype module to be installed on the system so its compendiums are available.
        let packStructure = {};
        game.packs.forEach(pack => {
            if (pack.metadata.packageName == module && pack.documentClass.documentName == "Actor"){
                packStructure.actor = pack.collection;
            }
            if (pack.metadata.packageName == module && pack.documentClass.documentName == "JournalEntry"){
                packStructure.journal = pack.collection;
            }
            if (pack.metadata.packageName == module && pack.documentClass.documentName == "RollTable"){
                packStructure.table = pack.collection;
            }
            if (pack.metadata.packageName == module && pack.documentClass.documentName == "Macro"){
                packStructure.macro = pack.collection;
            }
            if (pack.metadata.packageName == module && pack.documentClass.documentName == "Playlist"){
                packStructure.playlist = pack.collection;
            }
            if (pack.metadata.packageName == module && pack.documentClass.documentName == "Item"){
                packStructure.item = pack.collection;
            }
            if (pack.metadata.packageName == module && pack.documentClass.documentName == "Scene"){
                packStructure.scene = pack.collection;
            }
        })
        
        // Now comes the code to actually export the content into the various compendiums.
        let imports = [];
        let actors = await Array.from(game.actors);
        for (let actor of actors){
            imports.push(actor.toObject());
        }
        try {
            await Actor.createDocuments(imports, {pack:packStructure.actor, keepId: true});
        } catch (err) {
            //Nothing to do, this just means there were duplicates.
        }

        imports = [];
        let journals = await Array.from(game.journal);
        for (let journal of journals){
            imports.push(journal.toObject());
        }
        try {
            await JournalEntry.createDocuments(imports, {pack:packStructure.journal, keepId: true});
        } catch (err) {

        }

        imports = [];
        let tables = await Array.from(game.tables);
        for (let table of tables){
            imports.push(table.toObject());
        }
        try {
            await RollTable.createDocuments(imports, {pack:packStructure.table, keepId: true});
        } catch (err) {

        }

        imports = [];
        let macros = await Array.from(game.macros);
        for (let macro of macros){
            imports.push(macro.toObject());
        }
        try {
            await Macro.createDocuments(imports, {pack:packStructure.macro, keepId: true});
        } catch (err) {

        }

        imports = [];
        let playlists = await Array.from(game.playlists);
        for (let playlist of playlists){
            imports.push(playlist.toObject());
        }
        try {
            await Playlist.createDocuments(imports, {pack:packStructure.playlist, keepId: true});
        } catch (err) {

        }

        imports = [];
        let items = await Array.from(game.items);
        for (let item of items){
            imports.push(item.toObject());
        }
        try {
            await Item.createDocuments(imports, {pack:packStructure.item, keepId: true});
        } catch (err) {

        }

        imports = [];
        let scenes = await Array.from(game.scenes);
        for (let scene of scenes){
            imports.push(scene.toObject());
        }
        try {
            await Scene.createDocuments(imports, {pack:packStructure.scene, keepId: true});
        } catch (err) {

        }
    }

    static async importAllFromPack(pack) {
        let documents = await pack.getDocuments();
        const collection = game.collections.get(pack.documentName);
        for (let doc of documents){
            await collection.importFromCompendium(pack, doc.id, {folder:doc.folder}, {keepId:true}); 
        }
        ui.notifications.info(`Imported ${documents.length} documents of type ${pack.documentName}`);
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