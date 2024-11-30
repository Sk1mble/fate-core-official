class fcoConstants { 

    // Convenience method to get the world data item
    static wd(){
        return fromUuidSync (game.settings.get("fate-core-official","wid"));
    }

    getFateLadder(){
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

    // The methods used by the Evil Hat Worlds of Adventure to set a playmat background from the module's art folder
    static async randomPlaymatBG (module)
    {
        async function getFiles(target, extensions = ``, source = `user`)
        {
            extensions = extensions instanceof Array ? extensions : [extensions];
            let filePicker = await FilePicker.browse(source, target);
            if(filePicker.files)
                return [...filePicker.files];
            return [];
        }

        async function getRandomPlaymat () {
            let playmats = await getFiles(`/modules/${module}/art/playmats/`)
            let min = 0;
            let max = playmats.length - 1;
            let rand = Math.floor(twist.random() * (max - min + 1) + min);    
            return (playmats[rand]);
        }

        let newImage = false;
        let img = "";
        let pmImg = game.scenes.getName("Playmat").background.src;
        let loopCounter = 0;

        while (newImage == false){
        loopCounter ++;
        img = await getRandomPlaymat();
        if (img != pmImg) newImage = true;
        if (loopCounter >= 100) newImage = true;
        }
        let pm = game.scenes.getName("Playmat")
        let thumb = await pm.createThumbnail({img});
        await game.scenes.getName("Playmat").update({"background.src":img, thumb:thumb.thumb});
    }

    static async choosePlaymatBG (module){
        async function getFiles(target, extensions = ``, source = `user`)
        {
            extensions = extensions instanceof Array ? extensions : [extensions];
            let filePicker = await FilePicker.browse(source, target);
            if(filePicker.files)
                return [...filePicker.files];
            return [];
        }


            let playmats = await getFiles(`/modules/${module}/art/playmats/`)
            let scenes = `<div style="width:100%; height:50vh; background-color:white; overflow-y:auto">`
            for (let playmat of playmats){
                scenes += `<img style="width: 500px; padding:10px" class="playmat-image" src = "${playmat}" data-img = "${playmat}"></img>`
            }
            
            scenes += `</div>`

        let dia = new foundry.applications.api.DialogV2({
                        window:{title: "Pick an image"},
                        content: scenes,
                        buttons: [{
                            action:"close",
                            label:"Close this window"
                        }]
                    }).render(true);


        $(document).on('click', '.playmat-image', async event => {
        let img = event.target.getAttribute("data-img")
            let pm = game.scenes.getName("Playmat")
            let thumb = await pm.createThumbnail({img});
            await game.scenes.getName("Playmat").update({"background.src":img, thumb:thumb.thumb});
            dia.close()
        })
    }

    getAdjective(r){
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
            let d = new foundry.applications.api.DialogV2({
                window:{title: prompt},
                content: `<p>${content}<br/>`,
                modal:false,
                buttons: [
                    {
                        action: "ok",
                        label: game.i18n.localize("fate-core-official.OK"),
                        callback: () => {
                            resolve("OK");
                        }
                    }
                ],
                default:"ok",
                close: ()=> {resolve("OK)")},
            });
            d.position.height = height;
            d.position.width = width;
            d.render(true);
        })
    }

    static presentSkill(skill){
        fcoConstants.awaitOKDialog(game.i18n.localize("fate-core-official.SkillDetails"),`
                                            <div style="display:flex; flex-direction: column">
                                                <div style="width: 950px">
                                                    <h2>${skill.name}</h2>
                                                </div>
                                                
                                                <div style="display:flex; flex-direction:row; padding:5px">
                                                    <div style="width:200px">
                                                            <b>${game.i18n.localize("fate-core-official.Description")}:</b>
                                                    </div>
                                                    <div style="width:850px; margin-bottom:10px">
                                                        ${skill.description}
                                                    </div>
                                                </div>

                                                 <div style="display:flex; flex-direction:row; padding:5px; background-color: rgb(107, 102, 97, 0.25)">
                                                    <div style="width:200px; padding:0; margin:0px">
                                                        <b>${game.i18n.localize("fate-core-official.Overcome")}:</b>
                                                    </div>
                                                    <div style="width:850px; padding:0px; margin-bottom:10px">
                                                        ${skill.overcome}
                                                    </div>
                                                </div>

                                                <div style="display:flex; flex-direction:row; padding:5px">
                                                    <div style="width:200px">
                                                        <b>${game.i18n.localize("fate-core-official.CAA")}:</b>
                                                    </div>
                                                    <div style="width:850px; margin-bottom:20px">
                                                        ${skill.caa}
                                                    </div>
                                                </div>

                                                <div style="display:flex; flex-direction:row; padding:5px; background-color:rgb(107, 102, 97, 0.25)">
                                                    <div style="width:200px; padding:0; margin:0px">
                                                        <b>${game.i18n.localize("fate-core-official.Attack")}:</b>
                                                    </div>
                                                    <div style="width:850px; padding:0px; margin-bottom:10px">
                                                        ${skill.attack}
                                                    </div>
                                                </div>

                                                <div style="display:flex; flex-direction:row; padding:5px">
                                                    <div style="width:200px">
                                                        <b>${game.i18n.localize("fate-core-official.Defend")}:</b>
                                                    </div>
                                                    <div style="width:850px">
                                                        ${skill.defend}
                                                    </div>
                                                </div>
                                            </div>`,1000)
    }

    static async awaitYesNoDialog(prompt, content){
        let response = await foundry.applications.api.DialogV2.confirm({
            window:{title:prompt},
            modal: true,
            content: content,
            rejectClose: false,
        })
        return response;
    }

    static awaitColourPicker(prompt){
        return new Promise(resolve => {
            new foundry.applications.api.DialogV2({
                window:{title: prompt},
                modal:false,
                content: '<input type="color" id="mf_cp" value="#000000"></input>',
                buttons:[{
                    action: "setColour",
                    label: game.i18n.localize("fate-core-official.OK"),
                    callback: () => {
                        resolve(document.getElementById("mf_cp").value)
                    },
                    default: true
                }],
            }).render(true);
        })
    }

    static async confirmDeletion(){
        let confirm = game.settings.get("fate-core-official","confirmDeletion");
        if (!confirm){
            return true;
        } else {
            return await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.Delete"),game.i18n.localize("fate-core-official.ConfirmDeletion"));
        }
    }

    static async getInput(prompt){
        let response = await foundry.applications.api.DialogV2.prompt({
            window:{ title: prompt},
            modal: false,
            content: '<div align="center"><input name = "response" style="width:375px; margin:5px" autofocus></input></div>',
            ok: {
                label: game.i18n.localize("fate-core-official.OK"),
                callback: (event, button, dialog) => {
                    return button.form.elements.response.value;
                },
            }
        })
        return response;
    }

    static getInputFromList(prompt, options){
        let optionsText = "";
        options.forEach(option =>{
            optionsText+=`<option>${option}</option>`
        })

        return new Promise(resolve => {
            new foundry.applications.api.DialogV2 ({
                window:{title:prompt},
                content: `<div align="center"><select id="dialog_box" name="choice" style="width:375px">${optionsText}</select></div>`,
                buttons: [{
                    action: "choice",
                    label: game.i18n.localize("fate-core-official.OK"),
                    callback: (event, button, dialog) => {
                        resolve(button.form.elements.choice.value);
                    }
                }]
            }).render(true)
        });
    }

    static getCopiableDialog(title, toCopy){
        new foundry.applications.api.DialogV2({
            modal: false,
            window:{title: title}, 
            content: `<div style="background-color:white; color:black;"><textarea name="fcoCopiable" rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;">${toCopy}</textarea></div>`,
            buttons: [{
                label: game.i18n.localize("fate-core-official.CopyToClipboardAndClose"),
                callback: (event, button, dialog) => {
                    let text = button.form.elements.fcoCopiable.value;
                    navigator.clipboard.writeText(text);
                }
            }],
        }).render(true);
    }

    static async getImportDialog (title){
        let str = await new Promise(resolve => {
            new foundry.applications.api.DialogV2({
                window:{title: title},
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" name="toImport"></textarea></div>`,                    
                buttons: [{
                        action:"ok",
                        label: "Save",
                        callback: (event, button, dialog) => {
                            resolve (button.form.elements.toImport.value);
                        }
                }],
            }).render(true)
        });
        return str;
    }

    static async updateText(prompt, textToUpdate, apply){
        let label = game.i18n.localize("fate-core-official.Save");
        if (apply) label = game.i18n.localize("fate-core-official.Apply");

        let response = await foundry.applications.api.DialogV2.prompt({
            window:{title:prompt, resizable:true},
            content:`<div style="background-color:white; color:black;"><textarea style="min-height:600px; font-family:var(--fco-font-family); width:800px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" name="response">${textToUpdate}</textarea></div>`,
            modal: false,
            position:{width:820},
            buttons:[{
                    action: "ok",
                    label: label,
                    callback: (event, button, dialog) => {
                        return DOMPurify.sanitize(button.form.elements.response.value);
                    }
            },
            {
                action: "discard",
                label: game.i18n.localize("fate-core-official.Discard"),
                callback: () => {
                   return "discarded";
                }
            }]
        });
        return response;
    }

    static async updateShortText(prompt, textToUpdate){
        let response = await foundry.applications.api.DialogV2.prompt({
            window:{title:prompt, resizable:true},
            content: `<div style="background-color:white; color:black;"><textarea rows="1" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" name="response">${textToUpdate}</textarea></div>`,
            modal: false,
            buttons:[{
                    action: "ok",
                    label: game.i18n.localize("fate-core-official.Save"),
                    callback: (event, button, dialog) => {
                        return DOMPurify.sanitize(button.form.elements.response.value);
                    },
                    default: true
            }]
        });
        return response;
    }

    static sortByKey(json_object){
        let ordered_object = {}
        let unordered_object = json_object;
        Object.keys(unordered_object).sort().forEach(function(key) {ordered_object[key] = unordered_object[key];})
        return ordered_object;
    }

    static sortByName (json_object){
        let ordered_object ={};
        let unordered_object = Object.values(foundry.utils.duplicate(json_object));
        fcoConstants.sort_name(unordered_object);
        unordered_object.forEach (obj => {
            let key = fcoConstants.gkfn(json_object, obj.name);
            ordered_object[key] = obj;
        })
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
        output.stunts = fcoConstants.wd().system.stunts;
        output.defaults = fcoConstants.wd().system.defaults;
        output.skills = fcoConstants.wd().system.skills;
        output.aspects = fcoConstants.wd().system.aspects;
        output.tracks = fcoConstants.wd().system.tracks;
        output.skillTotal = game.settings.get("fate-core-official", "skillTotal");
        output.freeStunts = game.settings.get("fate-core-official","freeStunts");
        output.refreshTotal = game.settings.get("fate-core-official","refreshTotal");
        output.track_categories = game.settings.get("fate-core-official","track_categories");
        output.enforceSkillTotal = game.settings.get("fate-core-official", "enforceSkillTotal");
        output.enforceColumn = game.settings.get("fate-core-official", "enforceColumn");
        output.init_skill = game.settings.get("fate-core-official", "init_skill");
        output.modifiedRollDefault = game.settings.get("fate-core-official", "modifiedRollDefault")
        output.sheet_template = game.settings.get("fate-core-official", "sheet_template")
        output.limited_sheet_template = game.settings.get("fate-core-official", "limited_sheet_template")
        output.playerThings = game.settings.get("fate-core-official", "PlayerThings")
        output.DeleteOnTransfer = game.settings.get("fate-core-official", "DeleteOnTransfer")
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
        return await fcoConstants.getImportDialog(game.i18n.localize("fate-core-official.PasteDataToOverwrite"));
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
         
        let current_stunts = fcoConstants.wd().system.stunts;
        let stunts = input?.stunts;

        let current_defaults = fcoConstants.wd().system.defaults;
        let defaults = input?.defaults;

        // Give option to merge stunts, if there are stunts in the new settings AND stunts in the existing settings.

        if (Object.keys(current_stunts).length > 0){
            if (Object.keys(stunts).length > 0){
                let confirm = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.mergeStuntsTitle"),game.i18n.localize("fate-core-official.mergeStunts"));
                if ( confirm ) {
                    let final_stunts = foundry.utils.mergeObject(current_stunts, stunts);
                    await fcoConstants.wd().update({"system.stunts":final_stunts});
                } else {
                    await fcoConstants.wd().update({"system.stunts":stunts});
                }
            }   
        } else {
            await fcoConstants.wd().update({"system.stunts":stunts});
        }

        // Give option to merge character default frameworks, if there are stunts in the new settings AND stunts in the existing settings.

        if (Object.keys(current_defaults).length > 0){
            if (Object.keys(defaults).length > 0){
                let confirm = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.mergeDefaultsTitle"), `<p>${game.i18n.localize("fate-core-official.mergeDefaults")}</p>`);
                if ( confirm ) {
                    let final_defaults = foundry.utils.mergeObject(current_defaults, defaults);
                    await fcoConstants.wd().update({"system.defaults":final_defaults});
                } else {
                    await fcoConstants.wd().update({"system.defaults":defaults});
                }
            }   
        } else {
            await fcoConstants.wd().update({"system.defaults":defaults});
        }

        await fcoConstants.wd().update({"system.skills":input?.skills});      
        await fcoConstants.wd().update({"system.tracks":input?.tracks});
        await fcoConstants.wd().update({"system.aspects":input?.aspects});
        await game.settings.set("fate-core-official","track_categories",input?.track_categories);   
        await game.settings.set("fate-core-official","skillTotal",input?.skillTotal);
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
        foundry.utils.debouncedReload();
    }

    static getKey(text){
        return text.hashCode();
    }

    static tob64 (text){
        let bytes = new TextEncoder().encode(text);
        const binString = String.fromCodePoint(...bytes);
        return btoa(binString).split("=").join("");
    }

    static fromb64 (base64){
        const binString = atob(base64);
        let bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
        return new TextDecoder().decode(bytes);
    }
    
    static async ulStunts(stunts){
        let db = await foundry.utils.duplicate(fcoConstants.wd().system.stunts);

        // First check for duplicates and permission to overwrite
        for (let st in stunts){
            delete stunts[st].extra_id;
            delete stunts[st].original_name;
            let existing = fcoConstants.gbn (db, stunts[st].name);
            if (existing){
                let overwrite = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"),`${game.i18n.localize("fate-core-official.stunt")} "${existing.name}": `+game.i18n.localize("fate-core-official.exists"));
                if (!overwrite) delete stunts[st];
            }
        }
        await fcoConstants.wd().update({"system.stunts":stunts});
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

    // Function to get an object by looking up its name in an object by 'name field'
    // If the object can be found by looking directly for the base 64 version of the name, do that first. If not, search by name. 
    // This is in preparation to eventually change all existing string keys into base 64 keys to lookup by hashing the name, as this will be much safer.
   static gbn (object, name, name_string){
        if (name_string) {
            return Object.values(object).find(i=> i?.[name_string] === name);      
        } else {
            if (object[fcoConstants.tob64(name)]){
                return object[fcoConstants.tob64(name)];
            } else {
                return Object.values(object).find(i=> i.name === name);
            }
        }
    }

    // Function to get the key of an object by looking up its name in an object's 'name' field
    // If the key exists as a hash of the name, we can just immediately return that. 
    static gkfn (object, name, name_string){
        if (name_string) {
            return Object.entries(object).find(i=> i[1]?.[name_string] === name)?.[0];
        } else {
            if (object[fcoConstants.tob64(name)]){
                return fcoConstants.tob64(name);
            } else {
                return Object.entries(object).find(i=> i[1]?.name === name)?.[0];    
            }
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