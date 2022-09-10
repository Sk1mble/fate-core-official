class FateCharacterDefaults {

    getSafeName(name){
        // Return a safe name that can be used as an object key
        return name.slugify().split(".").join("-");
    }

    async storeDefault (character_default){
        // Store a character default (usually derived from extractDefault) in the game's settings.
        let defaults = duplicate(game.settings.get("fate-core-official", "defaults"));
        if (!character_default?.default_name){
            return;
        }
        // Check to see if this default already exists
        if (defaults[this.getSafeName(character_default.default_name)]){
            let response  = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.checkDefaultOverwritePrompt"),character_default.default_name + game.i18n.localize("fate-core-official.checkDefaultOverwriteContent"));
            if (response === "yes"){
                defaults[this.getSafeName(character_default.default_name)] = character_default;
                await game.settings.set("fate-core-official", "defaults", defaults)
            } else {
                let count = 0;
                for (let d in defaults){
                    if (defaults[d].default_name.startsWith(character_default.default_name)) count++
                }
                let newName = `${character_default.default_name} ${count + 1}`;
                character_default.default_name = newName;
                defaults[this.getSafeName(newName)] = character_default;
                await game.settings.set("fate-core-official", "defaults", defaults)
                ui.sidebar.render(false);
                if (game.system.mdf) game.system.mdf.render(false);
            }
        } else {
            defaults[this.getSafeName(character_default.default_name)] = character_default;
            await game.settings.set("fate-core-official", "defaults", defaults)
            ui.sidebar.render(false);
            if (game.system.mdf) game.system.mdf.render(false);
        }
    }

    get defaults(){
        // Return an array of strings of default_name values from defaults
        let defaults = duplicate(game.settings.get("fate-core-official", "defaults"));
        let list = [];
        for (let d in defaults){
            list.push (defaults[d].default_name)
        }
        return list;
    }

    async removeDefault (name){
        // Remove a character default from the game's settings.
        let defaults = duplicate(game.settings.get("fate-core-official", "defaults"));
        // Check to see if this default already exists, then delete it
        if (defaults[this.getSafeName(name)]){
            delete defaults[this.getSafeName(name)];
            await game.settings.set("fate-core-official", "defaults", defaults);
            ui.sidebar.render(false);
            if (game.system.mdf) game.system.mdf.render(false);
        } 
    }

    async presentDefault (default_name){
        //Returns the details of the default as an array with a human-readable format.
        //Used to present the default at the presentation layer so GM can get an idea of what the settings are for that template.
        let d = await duplicate(await this.getDefault(default_name));
        
        let output = {};

        output.img = d.img;
        output.token_img = d.token_img;
        output.actorLink = d.actorLink;
        output.default_name = d.default_name;
        output.default_description = d.default_description;
        let stunt_names = [];
        let aspect_names = [];
        let track_names = [];
        let skill_names = [];
        let extra_names = [];

        for (let stunt in d.stunts){
            stunt_names.push(d.stunts[stunt].name)
        }
        for (let aspect in d.aspects){
            if (d?.options?.keep_aspects){
                aspect_names.push(d.aspects[aspect].name + " ("+d.aspects[aspect].value+")")
            } else {
                aspect_names.push(d.aspects[aspect].name)
            }
        }
        for (let track in d.tracks){
            track_names.push(d.tracks[track].name)
        }
        for (let skill in d.skills){
            if (d?.options?.keep_skills) {
                skill_names.push(d.skills[skill].name + " ("+d.skills[skill].rank + ")");
            }
            else {
                skill_names.push(d.skills[skill].name)
            }
        }
        for (let extra of d.extras){
            extra_names.push(extra.name)
        }

        output.stunts = stunt_names.sort().join(", ");
        output.aspects = aspect_names.sort().join(", ");
        output.tracks = track_names.sort().join(", ");
        output.skills = skill_names.sort().join(", ");
        output.extras = extra_names.sort().join(", ");
        return output;
    }

    async renameDefault (old_name, new_name){
        let defaults = duplicate(game.settings.get("fate-core-official", "defaults"));
        let de = duplicate(defaults[this.getSafeName(old_name)]);
        await this.removeDefault(old_name);
        de.default_name = new_name;
        await this.storeDefault(de);
        ui.sidebar.render(false);
        if (game.system.mdf) game.system.mdf.render(false);
    }

    async editDescription (name, new_desc){
        let defaults = await duplicate(game.settings.get("fate-core-official", "defaults"));
        let de = defaults[this.getSafeName(name)];
        de.default_description = new_desc;
        await game.settings.set("fate-core-official","defaults",defaults);
        if (game.system.mdf) game.system.mdf.render(false);
    }

    async getDefault(name){
        // Get a named character default from the game's settings.
        let defaults = await duplicate(game.settings.get("fate-core-official", "defaults"));
        if (defaults[this.getSafeName(name)]){
            return(defaults[this.getSafeName(name)]);
        } 
    }

    async importDefaults(default_text){
        let new_defaults = JSON.parse(default_text);
        for (let d in new_defaults){
            if (new_defaults[d]?.default_name){
                await this.storeDefault(new_defaults[d]);
            } else {
                // Error handling goes here.
                ui.notifications.error(d + game.i18n.localize("fate-core-official.notAValidDefault"));
            }
        }
    }

    async exportDefaults(list_to_export){
        // Return a string of the chosen defaults to export. If no array of default_name values given, return all defaults.
        if (! list_to_export){
            return JSON.stringify(game.settings.get("fate-core-official","defaults"),null,5);
        } else {
            let to_export = {};
            let existing_defaults = duplicate (game.settings.get("fate-core-official", "defaults"));
            for (let d of list_to_export){
                to_export[this.getSafeName(d)]=existing_defaults[this.getSafeName(d)];
            }
            return JSON.stringify(to_export, null, 5);
        }
    }

    async extractDefault(actorData, default_name, default_description, options){
        // This method takes actorData and returns an object to store as a default.
        // This default contains empty versions of the character's:
        // Tracks
        // Skills
        // Aspects
        // Stunts are returned exactly as they are
        // Extras are returned exactly as they are
        // It also contains any necessary metadata for working with defaults.
        //First, we clone the actorData to make sure we're working with a copy and not the original.
        if (!default_description) default_description = "";
        let data = actorData.toJSON();
        let character_default = {};
        
        // Return stunts as they are; nothing further to do with these.
        let stunts = data.system.stunts;

        // For tracks we need to reset any stress boxes and aspects that are defined.
        let tracks = data.system.tracks;
        for (let t in tracks){
            let track = tracks[t];
            if (track?.aspect && track?.aspect !== "No"){
                track.aspect.name = "";
            }

            if (track?.boxes > 0){
                for (let i = 0; i < track.box_values.length; i++){
                    track.box_values[i] = false;
                }
            }

            if (track?.notes){
                track.notes = "";
            }
        }

        let aspects = data.system.aspects;
        
        if (!options?.keep_aspects){
            // For aspects we need to reset any aspect values to blank
            for (let a in aspects){
                let aspect = aspects[a];
                if (aspect?.value){
                    aspect.value = "";
                }
                if (aspect?.notes){
                    aspect.notes = "";
                }
            }    
        }
        
        let skills = data.system.skills;
        if (!options?.keep_skills){
            // For skills, we need to reset all ranks to 0.
            for (let s in skills){
                let skill = skills[s];
                if (skill?.rank){
                    skill.rank = 0;
                }
            }
        }

        // Return an array of item data - we don't need to do anything further with this for extras
        let extras = data.items;

        character_default.stunts = stunts;
        character_default.tracks = tracks;
        character_default.skills = skills;
        character_default.aspects = aspects;
        character_default.extras = extras;
        
        //Let's apply the actor's avatar to the default, too.
        character_default.img = data.img;
        character_default.token_img = data.prototypeToken.texture.src; 
        
        character_default.actorLink = data.prototypeToken.actorLink;

        //This is important; it's the value which is used to grab the default out of the settings.
        character_default.default_name = default_name;
        character_default.default_description = default_description;
        return character_default;
    }

    async createCharacterFromDefault(default_name, name, render){
        //We may need to set refresh to 0 to prevent the character from being initialised with system defaults.
        if(!render == false && !render == true){
            render = false;
        }
        // Create a character from a passed character default name and a name.
        let character_default = await this.getDefault(default_name);
        if (!character_default?.default_name){
            return; // This is not a proper character default.
        }
        // This method creates a character of the given name from the character default that's fed to it.

        let refresh = game.settings.get("fate-core-official","refreshTotal");

        let a_link = false;
        if (character_default.actorLink) a_link = character_default.actorLink;

        let perm  = {"default":CONST.DOCUMENT_OWNERSHIP_LEVELS[game.settings.get("fate-core-official", "default_actor_permission")]};
            
        const actor_data = {
            name:name,
            type:"fate-core-official",
            items:character_default.extras,
            img:character_default.img,
            prototypeToken:{texture:{src:character_default.token_img}, actorLink:a_link},
            permission: perm,
            system:{
                details:{fatePoints:{refresh:refresh, current:refresh}},
                skills:character_default.skills,
                stunts:character_default.stunts,
                aspects:character_default.aspects,
                tracks:character_default.tracks,

            }
        }
        return await Actor.create(actor_data, {renderSheet:render});
    }

    async applyDefault (actor, default_name, options){
        //Parameters are: 
        //Actor: A reference to the actor to which the template is to be applied
        //default_name: The character default to apply
        //Options: 
        //overwrite: If true, will replace the existing sections on the sheet with those from the default. 
        //If false, will merge the sections from the default with the existing sections on the sheet as much as possible.
        //extras: If true will copy the template's items to the actor.
        //avatar: If true will replace the avatar with the one from the template
        //sections: An array of section names which are to be applied

        const character_default = await this.getDefault(default_name);
        if (options.overwrite){
            let updates = {};
            let sections = options.sections;
            for (let section of sections){
                updates[`data.${section}`] = "blank";
            }
            await actor.update(updates, {render:false, noHook:true});

            for (let section of sections){
                updates[`data.${section}`] = character_default[section];
            }
            //Replace the avatar and token images also
            if (options.avatar) {
                updates["img"] = character_default["img"];
                updates["prototypeToken.texture.src"] = character_default["token_img"];
            }
        
            //Now commit the updates.
            await actor.update(updates);

            // delete all extras and add all extras from default.
            if (options.extras) {
                await (actor.deleteEmbeddedDocuments("Item", actor.items.contents.map(item=> item.id)));
                await (actor.createEmbeddedDocuments("Item", character_default.extras));
            }
        } else {
            // Here is where we try to merge the updates as best as possible; we can do that using mergeObject.
            let updates = {};
            let sections = options.sections;
            for (let section of sections){
                updates[`data.${section}`] = mergeObject (character_default[section], actor.system[`${section}`], {inplace:false});
            }
            if (options.avatar){
                updates["img"] = character_default["img"];
                updates["prototypeToken.texture.src"] = character_default["token_img"];
            }
            await actor.update(updates);

            //Add all extras from default.
            if (options.extras) {
                await (actor.createEmbeddedDocuments("Item", character_default.extras))
            }
        }
    }
}

// Add extra button to foundry's settings menu
Hooks.on("renderSidebarTab", (app, html) => {
    if (!(app instanceof ActorDirectory) || !game.user?.isGM) {
        return;
    }
    
    const targetElement = html.find('ol[class="directory-list"]');
    const f = new FateCharacterDefaults();
    let standard = `<option value = "fate-core-official" selected = 'selected'>${game.i18n.localize("fate-core-official.system_settings")}</option>\n`
    let blank = "<option>Blank</option>\n"
    let defaults = f.defaults.map(d => `<option>${d}</option>`).join("\n");
    let options = standard+blank+defaults;
    targetElement.before(`
        <div style="max-height:45px; text-align:center">
            <input type="text" value = "New Character" style="background-color:#f0f0e0; width:35%; height:25px;" id="MF_actor_to_create">
            <select style="width:35%; height:25px; background-color:#f0f0e0;" id="MF_default_to_use">${options}
            </select>
            <button type="button" style="width:10%; height:35px" id="create_from_default" title="${game.i18n.localize("fate-core-official.create_from_default")}">
            <i class="fas fa-user-check"></i>
            </button>
            <button type="button" style="width:10%; height:35px" id="manage_defaults" title="${game.i18n.localize("fate-core-official.manage_defaults")}">
            <i class="fas fa-users-cog"></i>
            </button>
        </div>
    `);

    html.on("click", 'input[id="MF_actor_to_create"]', (event) => {
        event.stopPropagation();
        html.find('input[id="MF_actor_to_create"]')[0].select();
    })

    html.on("click", 'button[id="manage_defaults"]', (event) => {
        //Code to handle the defaults management (view list, delete)
        event.stopPropagation()
        let md = new ManageDefaults().render(true);
    })

    html.on("click", 'button[id="create_from_default"]', async (event) => {
        event.stopPropagation();
        let actor_name = html.find('input[id="MF_actor_to_create"]')[0].value;
        const default_name = html.find('select[id="MF_default_to_use"]')[0].value;

        if (! actor_name) actor_name = "New Character";

        let perm  = {"default":CONST.DOCUMENT_OWNERSHIP_LEVELS[game.settings.get("fate-core-official", "default_actor_permission")]};

        if (default_name === "Blank"){
            let actorData = {
                "name":actor_name,
                "type":"fate-core-official",
                "permission": perm,
                "system.details.fatePoints.refresh":"0",
                "prototypeToken.actorLink":true
             }
             await Actor.create(actorData, {"renderSheet":true});
             return;
        }

        if (default_name === "fate-core-official"){
            await Actor.create({"name":actor_name, "type":"fate-core-official", permission: perm, "prototypeToken.actorLink":true},{renderSheet:true});
            return;
        }
        await f.createCharacterFromDefault(default_name, actor_name, true);
    });
});

class ManageDefaults extends FormApplication {
    constructor(...args){
        super(...args);
        this.editing = false;
        game.system.mdf = this;
    }

    async _render(html){
        // Override render to give focus back to the field that had focus when the 
        let type = $(':focus').attr('name');
        let focused = $(':focus').data('default_name');
        await super._render(html);

        if (type == "def_name"){
            const fo = html.find(`[name="def_name"][data-default_name="${focused}"]`);
            fo.focus();
        }

        if (type == "def_desc"){
            const fo = $(`[name="def_desc"][data-default_name="${focused}"]`);
            fo.focus();
        }
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/fate-core-official/templates/ManageDefaults.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("fate-core-official.defaultSetup")} in ${game.world.title}`;
        options.closeOnSubmit = true;
        options.id = "DefaultSetup"; // CSS id if you want to override default behaviors
        options.resizable = false;
        options.scrollY = ['#fu_manage_defaults']
        return options;
    }
    //The function that returns the data model for this window. In this case, we need the list of stress tracks
    //conditions, and consequences.
    async getData(){
        let f = new FateCharacterDefaults();
        let defaults = [];
        let def_objs = await duplicate(game.settings.get("fate-core-official","defaults"));
        for (let o in def_objs){
            defaults.push(def_objs[o]);
        }
        fcoConstants.sort_key(defaults, "default_name");
        let data = {
            default_names:f.defaults,
            defaults:defaults
        }
        data.editing = this.editing;
        return data;
    }

    //Here are the action listeners
    activateListeners(html) {
        super.activateListeners(html);

        const toggle_edit = $('#md_toggle_edit');
        if (toggle_edit.hasClass("fa-toggle-off")){
            this.editing = false;
                $('button[name="delete_default"]').hide();
        }

        toggle_edit.on('click', (event, html) => {
            toggle_edit.toggleClass("fa-toggle-off");
            toggle_edit.toggleClass("fa-toggle-on");
            if (toggle_edit.hasClass("fa-toggle-off")){
                this.editing = false;
                $('.md_edit').prop('disabled', true);
                $('button[name="delete_default"]').hide();
            }
            if (toggle_edit.hasClass("fa-toggle-on")){
                this.editing = true;
                $('.md_edit').prop('disabled', false)
                $('button[name="delete_default"]').show();
            }
        })

        const displayButton = $("button[name='inspect_default']");
        displayButton.on('click', async (event, html)=> {
            let f = new FateCharacterDefaults();
            let def = await f.getDefault(event.target.getAttribute("Data-default_name"));
            let prompt = game.i18n.localize("fate-core-official.defaultCharacterFramework")+ " " + def.default_name;
            let presentation = await f.presentDefault(def.default_name);
            let actorLink;
            if (presentation.actorLink){
                actorLink = '<i class = "far fa-check-square fa-2x" title="On"/>';
            } else {
                actorLink = '<i class = "far fa-square fa-2x" title="Off"/>';
            }
            let content = `
                <div style="max-height:100em; max-width:50em; scroll-y:auto">
                    <table style="background-color:transparent; border:0px; text-align:left; vertical-align:middle">
                        <th style="width:6em">
                            ${game.i18n.localize("fate-core-official.item")}
                        </th>
                        <th>
                            ${game.i18n.localize("fate-core-official.Contents")}
                        </th>
                        <tr>
                            <td>
                                ${game.i18n.localize("fate-core-official.avatar")}
                            </td>
                            <td>
                                <img style="width:50px; height:auto" title="${presentation.img}" src="${presentation.img}"/> 
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${game.i18n.localize("fate-core-official.token")}
                            </td>
                            <td>
                            <img style="width:50px; height:auto" title = "${presentation.img}" src="${presentation.token_img}"/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${game.i18n.localize("fate-core-official.actorLink")}
                            </td>
                            <td>
                                ${actorLink}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 ${game.i18n.localize("fate-core-official.Skills")}
                            </td>
                            <td>
                                ${presentation.skills}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 ${game.i18n.localize("fate-core-official.Tracks")}
                            </td>
                            <td>
                                ${presentation.tracks}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 ${game.i18n.localize("fate-core-official.Aspects")}
                            </td>
                            <td>
                                ${presentation.aspects}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 ${game.i18n.localize("fate-core-official.Stunts")}
                            </td>
                            <td>
                                ${presentation.stunts}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                 ${game.i18n.localize("fate-core-official.Extras")}
                            </td>
                            <td>
                                ${presentation.extras}
                            </td>
                        </tr>
                    </table>
                </div>
                `
            await fcoConstants.awaitOKDialog(prompt, content, "100em", "50em");
        })

        const imp = $('#md_import');
        const exp_all = $('#md_export_all');
        const exp_sel = $('#md_export_selected');

        imp.on('click', async (event, html)=>{
            let str = await new Promise(resolve => {
                new Dialog({
                    title: game.i18n.localize("fate-core-official.PasteDefaults"),
                    content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="import_defaults"></textarea></div>`,                    buttons: {
                        ok: {
                            label: "Save",
                            callback: () => {
                                resolve (document.getElementById("import_defaults").value);
                            }
                        }
                    },
                }).render(true)
            });
            let f = new FateCharacterDefaults();
            await f.importDefaults(str);
        })

        exp_all.on('click', async (event, html)=>{
            let f = new FateCharacterDefaults();
            let str = await f.exportDefaults();
            new Dialog({
                title: game.i18n.localize("fate-core-official.copyAndPasteToSaveDefaults"), 
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="stunt_db">${str}</textarea></div>`,
                buttons: {
                },
            }).render(true);
        })

        exp_sel.on('click', async (event, html)=>{
            let f = new FateCharacterDefaults();
            let boxes = $("input[name='def_select']");
            let list = [];
            for (let box of boxes){
                if (box.checked) list.push(box.dataset.default_name);
            }
            $("input[name='def_select']").prop('checked', false);
            let str = await f.exportDefaults(list);
           new Dialog({
                title: game.i18n.localize("fate-core-official.copyAndPasteToSaveDefaults"), 
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="stunt_db">${str}</textarea></div>`,
                buttons: {
                },
            }).render(true);
        })
    
        const d_name = html.find("input[name='def_name']");
        d_name.on('change', async (event, html) =>{
            let f = new FateCharacterDefaults();
            let oldName = event.target.getAttribute("data-oldValue");
            let newName = event.target.value;
            await f.renameDefault(oldName, newName);
        })     

        const d_desc = html.find("input[name='def_desc']");
        d_desc.on('change', async (event, html) =>{
            let f = new FateCharacterDefaults();
            await f.editDescription(event.target.getAttribute("data-default_name"), event.target.value);
        })     

        const d_def = html.find("button[name='delete_default']");
        d_def.on("click", async (event, html) =>{
            let f = new FateCharacterDefaults();
            let del = await fcoConstants.confirmDeletion();
            if (del) await f.removeDefault(event.target.getAttribute("data-default_name"));
        })

        const inspect_default = html.find("button[name='inspect_default']");
        inspect_default.on("click", async (event, html) => {
            let f = new FateCharacterDefaults();
            let name = event.target.getAttribute("data-default_name");
            let d = await f.getDefault(name);
        })
    }
}
