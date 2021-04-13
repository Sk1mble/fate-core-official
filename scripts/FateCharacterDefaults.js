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
    async storeDefault (character_default){
        // Store a character default (usually derived from extractDefault) in the game's settings.
        let defaults = duplicate(game.settings.get("ModularFate", "defaults"));
        if (!character_default?.default_name){
            return;
        }
        // Check to see if this default already exists
        if (defaults[character_default.default_name]){
            let response  = await ModularFateConstants.awaitYesNoDialog(game.i18n.localize("ModularFate.checkDefaultOverwritePrompt"),game.i18n.localize("ModularFate.checkDefaultOverwriteContent"));
            if (response === "yes"){
                defaults[character_default.default_name] = character_default;
                await game.settings.set("ModularFate", "defaults", defaults)
            }
        } else {
            defaults[character_default.default_name] = character_default;
            await game.settings.set("ModularFate", "defaults", defaults)
        }
    }

    async removeDefault (name){
        // Remove a character default from the game's settings.
        let defaults = duplicate(game.settings.get("ModularFate", "defaults"));
        // Check to see if this default already exists, then delete it
        if (defaults[name]){
            delete defaults[name]
            await game.settings.set("ModularFate", "defaults", defaults);
        } 
    }

    async getDefault(name){
        // Get a named character default from the game's settings.
        let defaults = duplicate(game.settings.get("ModularFate", "defaults"));
        if (defaults[name]){
            return(defaults[name]);
        } 
    }

    async extractDefault(actorData, default_name){
        // This method takes actorData and returns an object to store as a default.
        // This default contains empty versions of the character's:
        // Tracks
        // Skills
        // Aspects
        // Stunts are returned exactly as they are
        // Extras are returned exactly as they are
        // It also contains any necessary metadata for working with defaults.
        //First, we clone the actorData to make sure we're working with a copy and not the original.
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

        return character_default;
    }

    async createCharacterFromDefault(default_name, name){
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
                skills:character_default.skills,
                stunts:character_default.stunts,
                aspects:character_default.aspects,
                tracks:character_default.tracks,
            }
        }
        await Actor.create(actor_data);
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
                console.log(character_default[section])
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

    //TODO: Now I just need to write the user interface for managing existing templates (delete template, create actor from template, maybe import template from JSON, export template to JSON) and the UI widgets on character sheets for applying templates to the sheet as a whole or a given section individually
    //Will be an option on apply to tick the following boxes: stunts, tracks, skills, aspects, avatar, items.
}
