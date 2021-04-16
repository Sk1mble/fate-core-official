// Register a game setting for storing character defaults

Hooks.once('init', async function () {
    game.settings.register("ModularFate", "defaults", {
        name: "Character defaults",
        hint: "Character defaults - sets of tracks, skills, stunts, etc. for ease of character creation for GMs.",
        scope: "world",
        config: false,
        type: Object,
        default:{}
    });
})

class FateCharacterDefaults {

    getSafeName(name){
        // Return a safe name that can be used as an object key
        return name.slugify().split(".").join("-");
    }

    async storeDefault (character_default, overwrite){
        // Store a character default (usually derived from extractDefault) in the game's settings.
        // If overwrite is true, automatically overwrite the existing default without asking.
        let defaults = duplicate(game.settings.get("ModularFate", "defaults"));
        if (!character_default?.default_name){
            return;
        }
        // Check to see if this default already exists
        if (defaults[this.getSafeName(character_default.default_name)] && overwrite !== true){
            let response  = await ModularFateConstants.awaitYesNoDialog(game.i18n.localize("ModularFate.checkDefaultOverwritePrompt"),character_default.default_name + game.i18n.localize("ModularFate.checkDefaultOverwriteContent"));
            if (response === "yes"){
                defaults[this.getSafeName(character_default.default_name)] = character_default;
                await game.settings.set("ModularFate", "defaults", defaults)
            } else {
                let count = 0;
                for (let d in defaults){
                    if (defaults[d].default_name.startsWith(character_default.default_name)) count++
                }
                let newName = `${character_default.default_name} ${count + 1}`;
                character_default.default_name = newName;
                defaults[this.getSafeName(newName)] = character_default;
                await game.settings.set("ModularFate", "defaults", defaults)
                ui.sidebar.render(false);
            }
        } else {
            defaults[this.getSafeName(character_default.default_name)] = character_default;
            await game.settings.set("ModularFate", "defaults", defaults)
            ui.sidebar.render(false);
        }
    }

    get defaults(){
        // Return an array of strings of default_name values from defaults
        let defaults = duplicate(game.settings.get("ModularFate", "defaults"));
        let list = [];
        for (let d in defaults){
            list.push (defaults[d].default_name)
        }
        return list;
    }

    async removeDefault (name){
        // Remove a character default from the game's settings.
        let defaults = duplicate(game.settings.get("ModularFate", "defaults"));
        // Check to see if this default already exists, then delete it
        if (defaults[this.getSafeName(name)]){
            delete defaults[this.getSafeName(name)];
            await game.settings.set("ModularFate", "defaults", defaults);
            ui.sidebar.render(false);
        } 
    }

    async renameDefault (old_name, new_name){
        let defaults = duplicate(game.settings.get("ModularFate", "defaults"));
        let de = duplicate(defaults[this.getSafeName(old_name)]);
        await this.removeDefault(old_name);
        de.default_name = new_name;
        await this.storeDefault(de);
        ui.sidebar.render(false);
    }

    async editDescription (name, new_desc){
        let defaults = await duplicate(game.settings.get("ModularFate", "defaults"));
        let de = defaults[this.getSafeName(name)];
        de.default_description = new_desc;
        await game.settings.set("ModularFate","defaults",defaults);
    }

    async getDefault(name){
        // Get a named character default from the game's settings.
        let defaults = await duplicate(game.settings.get("ModularFate", "defaults"));
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
                ui.notifications.error(d + game.i18n.localize("ModularFate.notAValidDefault"));
            }
        }
    }

    async exportDefaults(list_to_export){
        // Return a string of the chosen defaults to export. If no array of default_name values given, return all defaults.
        if (! list_to_export){
            return JSON.stringify(game.settings.get("ModularFate","defaults"));
        } else {
            let to_export = {};
            let existing_defaults = duplicate (game.settings.get("ModularFate", "defaults"));
            for (let d of list_to_export){
                to_export[this.getSafeName(d)]=existing_defaults[this.getSafeName(d)];
            }
            return JSON.stringify(to_export);
        }
    }

    async extractDefault(actorData, default_name, default_description){
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
        let stunts = data.data.stunts;

        // For tracks we need to reset any stress boxes and aspects that are defined.
        let tracks = data.data.tracks;
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

        // For aspects we need to reset any aspect values to blank
        let aspects = data.data.aspects;
        for (let a in aspects){
            let aspect = aspects[a];
            if (aspect?.value){
                aspect.value = "";
            }
            if (aspect?.notes){
                aspect.notes = "";
            }
        }

        // For skills, we need to reset all ranks to 0.
        let skills = data.data.skills;
        for (let s in skills){
            let skill = skills[s];
            if (skill?.rank){
                skill.rank = 0;
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
        character_default.token_img = data.token.img;

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
        const actor_data = {
            name:name,
            type:"ModularFate",
            items:character_default.extras,
            img:character_default.img,
            token:{img:character_default.token_img},
            data:{
                details:{fatePoints:{refresh:"0", current:"0"}},
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
            await actor.update(updates, {render:false});

            for (let section of sections){
                updates[`data.${section}`] = character_default[section];
            }
            //Replace the avatar and token images also
            if (options.avatar) {
                updates["img"] = character_default["img"];
                updates["token.img"] = character_default["token_img"];
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
                updates[`data.${section}`] = mergeObject (character_default[section], actor.data.data[`${section}`], {inplace:false});
            }
            if (options.avatar){
                updates["img"] = character_default["img"];
                updates["token.img"] = character_default["token_img"];
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
    let standard = "<option selected = 'selected'>ModularFate</option>\n"
    let blank = "<option>Blank</option>\n"
    let defaults = f.defaults.map(d => `<option>${d}</option>`).join("\n");
    let options = standard+blank+defaults;
    targetElement.before(`
        <div style="max-height:45px; text-align:center">
            <input type="text" value = "New Character" style="background-color:#f0f0e0; width:35%; height:25px;" id="MF_actor_to_create">
            <select style="width:35%; height:25px; background-color:#f0f0e0;" id="MF_default_to_use">${options}
            </select>
            <button type="button" style="width:10%; height:35px" id="create_from_default">
            <i class="fas fa-user-check"></i>
            </button>
            <button type="button" style="width:10%; height:35px" id="manage_defaults">
            <i class="fas fa-users-cog"></i>
            </button>
        </div>
    `);

    html.on("click", 'input[id="MF_actor_to_create"]', () => {
        html.find('input[id="MF_actor_to_create"]')[0].select();
    })

    html.on("click", 'button[id="manage_defaults"]', () => {
        //Code to handle the defaults management (view list, delete)
        let md = new ManageDefaults().render(true);
    })

    html.on("click", 'button[id="create_from_default"]', async () => {
        let actor_name = html.find('input[id="MF_actor_to_create"]')[0].value;
        const default_name = html.find('select[id="MF_default_to_use"]')[0].value;

        if (! actor_name) actor_name = "New Character";
        if (default_name === "Blank"){
            let actorData = {
                "name":actor_name,
                "type":"ModularFate",
                "data.details.fatePoints.refresh":"0"
             }
             await Actor.create(actorData, {"renderSheet":true});
             return;
        }
        if (default_name === "ModularFate"){
            await Actor.create({"name":actor_name, "type":"ModularFate"},{renderSheet:true});
            return;
        }

        await f.createCharacterFromDefault(default_name, actor_name, true);
    });
});

class ManageDefaults extends FormApplication {
    constructor(...args){
        super(...args);
    }
    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/ModularFate/templates/ManageDefaults.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("ModularFate.defaultSetup")} in ${game.world.data.title}`;
        options.closeOnSubmit = true;
        options.id = "DefaultSetup"; // CSS id if you want to override default behaviors
        options.resizable = false;
        return options;
    }
    //The function that returns the data model for this window. In this case, we need the list of stress tracks
    //conditions, and consequences.
    async getData(){
        let f = new FateCharacterDefaults();
        let data = {
            default_names:f.defaults,
            defaults:game.settings.get("ModularFate","defaults"),
        }
        return data;
    }

    //Here are the action listeners
    activateListeners(html) {
        super.activateListeners(html);
    
        const d_name = html.find("input[name='def_name']");
        d_name.on('change', async (event, html) =>{
            let f = new FateCharacterDefaults();
            let oldName = event.target.getAttribute("data-oldValue");
            let newName = event.target.value;
            await f.renameDefault(oldName, newName);
            this.render(false);
        })     

        const d_desc = html.find("input[name='def_desc']");
        d_desc.on('change', async (event, html) =>{
            let f = new FateCharacterDefaults();
            await f.editDescription(event.target.getAttribute("data-default_name"), event.target.value);
            this.render(false);
        })     

        const d_def = html.find("button[name='delete_default']");
        d_def.on("click", async (event, html) =>{
            let f = new FateCharacterDefaults();
            let del = await ModularFateConstants.confirmDeletion();
            if (del) await f.removeDefault(event.target.getAttribute("data-default_name"));
            this.render(false);
        })

        const inspect_default = html.find("button[name='inspect_default']");
        inspect_default.on("click", async (event, html) => {
            let f = new FateCharacterDefaults();
            let name = event.target.getAttribute("data-default_name");
            let d = await f.getDefault(name);
            //Todo: code to display window with details of tracks etc for this default.
        })
    }
}