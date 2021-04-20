/**
 * The Fate Core game system for Foundry Virtual Tabletop
 * Author: Richard Bellingham, partially based on work by Nick van Oosten (NickEast)
 * Software License: GNU GPLv3
 * Content License:
 *      This work is based on Fate Core System and Fate Accelerated Edition (found at http://www.faterpg.com/),
 *      products of Evil Hat Productions, LLC, developed, authored, and edited by Leonard Balsera, Brian Engard,
 *      Jeremy Keller, Ryan Macklin, Mike Olson, Clark Valentine, Amanda Valentine, Fred Hicks, and Rob Donoghue,
 *      and licensed for our use under the Creative Commons Attribution 3.0 Unported license
 *      (http://creativecommons.org/licenses/by/3.0/).
 *
 *      This work is based on Fate Condensed (found at http://www.faterpg.com/), a product of Evil Hat Productions, LLC, 
 *      developed, authored, and edited by PK Sullivan, Ed Turner, Leonard Balsera, Fred Hicks, Richard Bellingham, Robert Hanz, Ryan Macklin, 
 *      and Sophie Lagacé, and licensed for our use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).
 *
 * 
 * Note to self: New standardised hook signatures:
 * preCreate[documentName](document:Document, data:object, options:object, userId:string) {}
 * create[documentName](document:Document, options:object, userId: string) {}
 * preUpdate[documentName](document:Document, change:object, options:object, userId: string) {}
 * update[documentName](document:Document, change:object, options:object, userId: string) {}
 * preDelete[documentName](document:Document, options:object, userId: string) {}
 * delete[documentName](document:Document, options:object, userId: string) {}

 */

/* -------------------------------- */
/*	System initialization			*/
/* -------------------------------- */

import { ModularFateCharacter } from "./scripts/ModularFateCharacter.js"
import { ExtraSheet } from "./scripts/ExtraSheet.js"
import { Thing } from "./scripts/Thing.js"
import { ModularFateActor } from "./scripts/ModularFateActor.js"
import { ModularFateExtra } from "./scripts/ModularFateExtra.js"

Hooks.on("preCreateActor", async (actor, data, options, userId) => {

    if (actor.type == "Thing"){
        if (!options.thing){
            ui.notifications.error(game.i18n.localize("ModularFate.CantCreateThing"));
            return false;
        }
    }

    if (actor.type == "ModularFate"){
        if (game.user == game.users.find(e => e.isGM && e.active) || game.user.id === userId){
            if (actor?.data?.data?.details?.fatePoints?.refresh === ""){
                let modified_data = await initialiseModularFateCharacter(actor);
                data.data = modified_data.data;            
            }
        }
    }
});

async function initialiseModularFateCharacter (actor) {

    //Modifies the data of the supplied actor to add tracks, aspects, etc. from system settings, then returns the data.
    let working_data = actor.data.toJSON();
    // Logic to set up Refresh and Current

    let refresh = game.settings.get("ModularFate", "refreshTotal");

    working_data.data.details.fatePoints.refresh = refresh;
    working_data.data.details.fatePoints.current = refresh;
    
    let p_skills=working_data.data.skills;
    
    //Check to see what skills the character has compared to the global skill list
        var skill_list = game.settings.get("ModularFate","skills");
        // This is the number of skills the character has currently.
        //We only need to add any skills if this is currently 0,
        
        
        let skills_to_add = [];

        for (let w in skill_list){
            let w_skill = skill_list[w];
            if (p_skills[w]!=undefined){
            } else {
                if(w_skill.pc){
                    skills_to_add.push(w_skill);
                }
            }
        }

        if (skills_to_add.length >0){
            //Add any skills from the global list that they don't have at rank 0.
            skills_to_add.forEach(skill => {
                skill.rank=0;
                p_skills[skill.name]=skill;
            })
        }        

        let aspects = game.settings.get("ModularFate", "aspects");
        let player_aspects = duplicate(aspects);
        for (let a in player_aspects) {
            player_aspects[a].value = "";
        }
        //Now to store the aspect list to the character
        working_data.data.aspects = player_aspects;
    
        //Step one, get the list of universal tracks.
        let world_tracks = duplicate(game.settings.get("ModularFate", "tracks"));
        let tracks_to_write = working_data.data.tracks;
        for (let t in world_tracks) {
            let track = world_tracks[t];
            if (track.universal == true) {
                tracks_to_write[t] = world_tracks[t];
            }
        }
        for (let t in tracks_to_write) {
            let track = tracks_to_write[t];
            //Add a notes field. This is a bit redundant for stress tracks,
            //but useful for aspects, indebted, etc. Maybe it's configurable whether we show the
            //notes or not for any given track. LATER NOTE: It is not.
            track.notes = "";

            //If this box is an aspect when marked, it needs an aspect.name data field.
            if (track.aspect == game.i18n.localize("ModularFate.DefinedWhenMarked")) {
                track.aspect = {};
                track.aspect.name = "";
                track.aspect.when_marked = true;
                track.aspect.as_name = false;
            }
            if (track.aspect == game.i18n.localize("ModularFate.AspectAsName")) {
                track.aspect = {};
                track.aspect.name = "";
                track.aspect.when_marked = true;
                track.aspect.as_name = false;
            }

            //Initialise the box array for this track 
            if (track.boxes > 0) {
                let box_values = [];
                for (let i = 0; i < track.boxes; i++) {
                    box_values.push(false);
                }
                track.box_values = box_values;
            }
        }
    working_data.data.tracks = tracks_to_write;
    let tracks = working_data.data.tracks;
    
    let categories = game.settings.get("ModularFate", "track_categories");
    //GO through all the tracks, find the ones with boxes, check the number of boxes and linked skills and initialise as necessary.
    for (let t in tracks) {
        let track = tracks[t];

        if (track.universal) {
            track.enabled = true;
        }

        // Check for linked skills and enable/add boxes as necessary.
        if (track.linked_skills != undefined && track.linked_skills.length > 0 && Object.keys(working_data.data.skills).length > 0) {
            let skills = working_data.data.skills;
            let linked_skills = tracks[t].linked_skills;
            let box_mod = 0;
            for (let i = 0; i < linked_skills.length; i++) {
                let l_skill = linked_skills[i].linked_skill;
                let l_skill_rank = linked_skills[i].rank;
                let l_boxes = linked_skills[i].boxes;
                let l_enables = linked_skills[i].enables;

                //Get the value of the player's skill
                if (working_data.data.skills[l_skill] == undefined){

                }else {
                    let skill_rank = working_data.data.skills[l_skill].rank;
                    //If this is 'enables' and the skill is too low, disable.
                    if (l_enables && skill_rank < l_skill_rank) {
                    track.enabled = false;
                }

                //If this adds boxes and the skill is high enough, add boxes if not already present.
                //Telling if the boxes are already present is the hard part.
                //If boxes.length > boxes it means we have added boxes, but how many? I think we need to store a count and add
                //or subract them at the end of our run through the linked skills.
                    if (l_boxes > 0 && skill_rank >= l_skill_rank) {
                        box_mod += l_boxes;
                    }
                }
            } //End of linked_skill iteration
            //Now to add or subtract the boxes

            //Only if this track works with boxes, though
            if (track.boxes > 0 || track.box_values != undefined) {
                //If boxes + box_mod is greater than box_values.length add boxes
                let toModify = track.boxes + box_mod - track.box_values.length;
                if (toModify > 0) {
                    for (let i = 0; i < toModify; i++) {
                        track.box_values.push(false);
                    }
                }
                //If boxes + box_mod is less than box_values.length subtract boxes.
                if (toModify < 0) {
                    for (let i = toModify; i < 0; i++) {
                        track.box_values.pop();
                    }
                }
            }
        }
    }
    return working_data;
}

Hooks.once('ready', async function () {
    if (game.settings.get("ModularFate","run_once") == false){
        if (game.user.isGM){
            ModularFateConstants.awaitOKDialog(game.i18n.localize("ModularFate.WelcomeTitle"),game.i18n.localize("ModularFate.WelcomeText"),500,250);
            game.settings.set("ModularFate","run_once", true);
            console.log(game.i18n.localize("ModularFate.baseDefaults"));
            game.settings.set("ModularFate","defaults",game.i18n.localize("ModularFate.baseDefaults"))
        }
    }
})


// Needed to update with token name changes in FU.
Hooks.on('updateToken', (token, data, userId) => {
    if (data.hidden != undefined || data.actorData != undefined || data.flags != undefined || data.name!=undefined){
        game.system.apps["actor"].forEach(a=> {
            a.renderMe(token.id, data, token);
        })
    }
})

Hooks.on('controlToken', (token, control) => {
        game.system.apps["actor"].forEach (a=> {
            a.renderMe("controlToken",token.id, control);
    })
})


Hooks.on('updateUser',(...args) =>{
        game.system.apps["user"].forEach (a=> {
            a.renderMe("updateUser");
        })
})

Hooks.on('renderPlayerList',(...args) =>{
    game.system.apps["user"].forEach (a=> {
        a.renderMe("updateUser");
    })
})

Hooks.on('updateActor', (actor, data) => {
    game.system.apps["actor"].forEach(a=> {
        a.renderMe(actor.id, data, actor);
    })
})

Hooks.on('updateItem', (item, data) => {
    game.system.apps["item"].forEach(a=> {
        a.renderMe(item.id, data, item);
    })
})

Hooks.on('renderCombatTracker', () => {
    game.system.apps["combat"].forEach(a=> {
        a.renderMe("renderCombatTracker");
    })
})
Hooks.on('updateCombat', (...args) => {
    let ags = args;
    game.system.apps["combat"].forEach(a=> {
        a.renderMe(ags);
    })
})

Hooks.on('deleteCombat', (...args) => {
    game.system.apps["combat"].forEach(a=> {
        a.renderMe("deleteCombat");
    })
})

Hooks.on('deleteToken', (...args) => {
    game.system.apps["actor"].forEach(a=> {
        a.renderMe("deleteToken")
    })
})

Hooks.on('createToken', (...args) => {
    game.system.apps["actor"].forEach(a=> {
        a.renderMe("createToken");
    })
})

Hooks.on('updateScene', (...args) => {
    game.system.apps["combat"].forEach(a=> {
        a.renderMe(args);
    })
})

Hooks.once('init', async function () {
    CONFIG.Actor.documentClass = ModularFateActor;
    CONFIG.Item.documentClass = ModularFateExtra;
    CONFIG.fontFamilies.push("Montserrat");

    // Register a setting for replacing the existing skill list with one of the pre-defined default sets.
    game.settings.register("ModularFate", "defaultSkills", {
        name: game.i18n.localize("ModularFate.ReplaceSkills"),
        hint: game.i18n.localize("ModularFate.ReplaceSkillsHint"),
        scope: "world",     // This specifies a client-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        restricted:true,
        choices: {           // If choices are defined, the resulting setting will be a select menu
            "nothing":game.i18n.localize("ModularFate.No"),
            "fateCore":game.i18n.localize("ModularFate.YesFateCore"),
            "fateCondensed":game.i18n.localize("ModularFate.YesFateCondensed"),
            "accelerated":game.i18n.localize("ModularFate.YesFateAccelerated"),
            "dfa":game.i18n.localize("ModularFate.YesDFA"),
            "clearAll":game.i18n.localize("ModularFate.YesClearAll")
        },
        default: "nothing",        // The default value for the setting
        onChange: value => { // A callback function which triggers when the setting is changed
                if (value == "fateCore"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","skills",game.i18n.localize("ModularFate.FateCoreDefaultSkills"));
                        game.settings.set("ModularFate","defaultSkills","nothing");
                        game.settings.set("ModularFate","skillsLabel",game.i18n.localize("ModularFate.defaultSkillsLabel"));
                    }
                }
                if (value=="clearAll"){
                    if (game.user.isGM) {
                        game.settings.set("ModularFate","skills",{});
                        game.settings.set("ModularFate","skillsLabel",game.i18n.localize("ModularFate.defaultSkillsLabel"));
                    }
                }
                if (value=="fateCondensed"){
                    if (game.user.isGM){ 
                        game.settings.set("ModularFate","skills",game.i18n.localize("ModularFate.FateCondensedDefaultSkills"));
                        game.settings.set("ModularFate","defaultSkills","nothing");
                        game.settings.set("ModularFate","skillsLabel",game.i18n.localize("ModularFate.defaultSkillsLabel"));
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","skills",game.i18n.localize("ModularFate.FateAcceleratedDefaultSkills"));
                        game.settings.set("ModularFate","defaultSkills","nothing");
                        game.settings.set("ModularFate","skillsLabel",game.i18n.localize("ModularFate.FateAcceleratedSkillsLabel"));
                    }
                }
                if (value=="dfa"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","skills",game.i18n.localize("ModularFate.DresdenFilesAcceleratedDefaultSkills"));
                        game.settings.set("ModularFate","defaultSkills","nothing");
                        game.settings.set("ModularFate","skillsLabel",game.i18n.localize("ModularFate.FateAcceleratedSkillsLabel"));
                    }
                }
            }
    });

        // Register a setting for replacing the existing aspect list with one of the pre-defined default sets.
        game.settings.register("ModularFate", "defaultAspects", {
            name: game.i18n.localize("ModularFate.ReplaceAspectsName"),
            hint: game.i18n.localize("ModularFate.ReplaceAspectsHint"),
            scope: "world",     // This specifies a client-stored setting
            config: true,        // This specifies that the setting appears in the configuration view
            type: String,
            restricted:true,
            choices: {           // If choices are defined, the resulting setting will be a select menu
                "nothing":game.i18n.localize("No"),
                "fateCore":game.i18n.localize("ModularFate.YesFateCore"),
                "fateCondensed":game.i18n.localize("ModularFate.YesFateCondensed"),
                "accelerated":game.i18n.localize("ModularFate.YesFateAccelerated"),
                "dfa":game.i18n.localize("ModularFate.YesDFA"),
                "clearAll":game.i18n.localize("ModularFate.YesClearAll")
            },
            default: "nothing",        // The default value for the setting
            onChange: value => { // A callback function which triggers when the setting is changed
                    if (value == "fateCore"){
                        if (game.user.isGM){
                            game.settings.set("ModularFate","aspects",game.i18n.localize("ModularFate.FateCoreDefaultAspects"));
                            game.settings.set("ModularFate","defaultAspects","nothing");
                        }
                    }
                    if (value == "fateCondensed"){
                        if (game.user.isGM){
                            game.settings.set("ModularFate","aspects",game.i18n.localize("ModularFate.FateCondensedDefaultAspects"));
                            game.settings.set("ModularFate","defaultAspects","nothing");
                        }
                    }
                    if (value=="clearAll"){
                        if (game.user.isGM){
                            game.settings.set("ModularFate","aspects",{});
                            game.settings.set("ModularFate","defaultAspects","nothing");
                        }
                    }
                    if (value=="accelerated"){
                        if (game.user.isGM){
                            game.settings.set("ModularFate","aspects",game.i18n.localize("ModularFate.FateAcceleratedDefaultAspects"));
                            game.settings.set("ModularFate","defaultAspects","nothing");
                        }
                    }
                    if (value=="dfa"){
                        if (game.user.isGM){
                            game.settings.set("ModularFate","aspects",game.i18n.localize("ModularFate.DresdenFilesAcceleratedDefaultAspects"));
                            game.settings.set("ModularFate","defaultAspects","nothing");
                        }
                    }
                }
        });

    // Register a setting for replacing the existing track list with one of the pre-defined default sets.
    game.settings.register("ModularFate", "defaultTracks", {
        name: game.i18n.localize("ModularFate.ReplaceTracksName"),
        hint: game.i18n.localize("ModularFate.ReplaceTracksHint"),
        scope: "world",     // This specifies a client-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        restricted:true,
        choices: {           // If choices are defined, the resulting setting will be a select menu
            "nothing":game.i18n.localize("ModularFate.No"),
            "fateCore":game.i18n.localize("ModularFate.YesFateCore"),
            "fateCondensed":game.i18n.localize("ModularFate.YesFateCondensed"),
            "accelerated":game.i18n.localize("ModularFate.YesFateAccelerated"),
            "dfa":game.i18n.localize("ModularFate.YesDFA"),
            "clearAll":game.i18n.localize("ModularFate.YesClearAll")
        },
        default: "nothing",        // The default value for the setting
        onChange: value => { // A callback function which triggers when the setting is changed
                if (value == "fateCore"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","tracks",game.i18n.localize("ModularFate.FateCoreDefaultTracks"));
                        game.settings.set("ModularFate","defaultTracks","nothing");
                    }
                }
                if (value=="clearAll"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","tracks",{});
                        game.settings.set("ModularFate","defaultTracks","nothing");
                    }
                }
                if (value=="fateCondensed"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","tracks",game.i18n.localize("ModularFate.FateCondensedDefaultTracks"));
                        game.settings.set("ModularFate","defaultTracks","nothing");
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","tracks",game.i18n.localize("ModularFate.FateAcceleratedDefaultTracks"));
                        game.settings.set("ModularFate","defaultTracks","nothing");
                    }
                }
                if (value == "dfa"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","tracks",game.i18n.localize("ModularFate.DresdenFilesAcceleratedDefaultTracks"));
                        game.settings.set("ModularFate","track_categories",game.i18n.localize("ModularFate.DresdenFilesAcceleratedDefaultTrackCategories"));
                        game.settings.set("ModularFate","defaultTracks","nothing");
                    }
                }
            }
    });

    game.settings.register("ModularFate","exportSettings", {
        name: game.i18n.localize("ModularFate.ExportSettingsName"),
        scope:"world",
        config:true,
        type:Boolean,
        restricted:true,
        default:false,
        onChange: value => {
            if (value == true && game.user.isGM){
                let text = ModularFateConstants.exportSettings();
 
                new Dialog({
                    title: game.i18n.localize("ModularFate.ExportSettingsDialogTitle"), 
                    content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="export_settings">${text}</textarea></div>`,
                    buttons: {
                    },
                }).render(true);
                game.settings.set("ModularFate","exportSettings",false);
            }
        }
    })

    game.settings.register("ModularFate","importSettings", {
        name: game.i18n.localize("ModularFate.ImportSettingsName"),
        scope:"world",
        hint:game.i18n.localize("ModularFate.ImportSettingsHint"),
        config:true,
        type:Boolean,
        restricted:true,
        default:false,
        onChange: async value => {
            if (value == true && game.user.isGM){
                let text = await ModularFateConstants.getSettings();
                ModularFateConstants.importSettings(text);
                game.settings.set("ModularFate","importSettings",false);
            }
        }
    })

//Register a setting for the game's current Refresh total
game.settings.register("ModularFate", "refreshTotal", {
    name: game.i18n.localize("ModularFate.RefreshTotalName"),
    hint: game.i18n.localize("ModularFate.RefreshTotalHint"),
    scope: "world",
    config: true,
    type: Number,
    default:3,
    onChange: () =>{
        for (let app in ui.windows){
            if (ui.windows[app]?.object?.type == "Thing" || ui.windows[app]?.object?.type == "ModularFate"){
                ui.windows[app]?.render(false);
            }
        }
    }
});

game.settings.register("ModularFate","freeStunts", {
    name:game.i18n.localize("ModularFate.FreeStunts"),
    hint:game.i18n.localize("ModularFate.FreeStuntsHint"),
    scope:"world",
    config:true,
    type:Number,
    restricted:true,
    default:3,
    onChange: () =>{
        for (let app in ui.windows){
            if (ui.windows[app]?.object?.type == "Thing" || ui.windows[app]?.object?.type == "ModularFate"){
                ui.windows[app]?.render(false);
            }
        }
    }
})

      //Register a setting for the game's current skill total
      game.settings.register("ModularFate", "skillTotal", {
        name: game.i18n.localize("ModularFate.SkillPointTotal"),
        hint: game.i18n.localize("ModularFate.SkillPointTotalHint"),
        scope: "world",
        config: true,
        type: Number,
        restricted:true,
        default:20,
        onChange: () =>{
            for (let app in ui.windows){
                if (ui.windows[app]?.object?.type == "Thing" || ui.windows[app]?.object?.type == "ModularFate"){
                    ui.windows[app]?.render(false);
                }
            }
        }
    });

    game.settings.register("ModularFate","enforceSkillTotal", {
        name: game.i18n.localize("ModularFate.EnforceSkillTotal"),
        hint: game.i18n.localize("ModularFate.EnforceSkillTotalHint"),
        scope:"world",
        config:true,
        type: Boolean,
        restricted:true,
        default:true,
        onChange: () =>{
            for (let app in ui.windows){
                if (ui.windows[app]?.object?.type == "Thing" || ui.windows[app]?.object?.type == "ModularFate"){
                    ui.windows[app]?.render(false);
                }
            }
        }
    })

    game.settings.register("ModularFate","enforceColumn", {
        name: game.i18n.localize("ModularFate.EnforceColumn"),
        hint: game.i18n.localize("ModularFate.EnforceColumnHint"),
        scope:"world",
        config:true,
        type: Boolean,
        restricted:true,
        default:true,
        onChange: () =>{
            for (let app in ui.windows){
                if (ui.windows[app]?.object?.type == "Thing" || ui.windows[app]?.object?.type == "ModularFate"){
                    ui.windows[app]?.render(false);
                }
            }
        }
    })
    
    let skill_choices = {};
    let skills = game.settings.get("ModularFate", "skills")
    
    skill_choices["None"]="None";
    skill_choices["Disable"]="Disable";
    for (let skill in skills){skill_choices[skill]=skill};

    game.settings.register("ModularFate","init_skill", {
        name:game.i18n.localize("ModularFate.initiativeSkill"),
        hint:game.i18n.localize("ModularFate.initiativeSetting"),
        "scope":"world",
        "config":true,
        "restricted":true,
        type:String,
        default:"None",
        choices:skill_choices
    })

    game.settings.register("ModularFate","modifiedRollDefault", {
        name:game.i18n.localize("ModularFate.modifiedRollDefault"),
        hint:game.i18n.localize("ModularFate.modifiedRollDefaultExplainer"),
        scope:"world",
        config:"true",
        type:Boolean,
        default:false
    })

    game.settings.register("ModularFate","sheet_template", {
        name:game.i18n.localize("ModularFate.DefaultSheetTemplateName"),
        hint:game.i18n.localize("ModularFate.DefaultSheetTemplateHint"),
        scope:"world",
        config:"true",
        type:String,
        default:'systems/ModularFate/templates/ModularFateSheet.html'
    })
    

    game.settings.register("ModularFate","limited_sheet_template", {
        name:game.i18n.localize("ModularFate.DefaultLimitedSheetTemplateName"),
        hint:game.i18n.localize("ModularFate.DefaultLimitedSheetTemplateHint"),
        scope:"world",
        config:"true",
        type:String,
        default:'systems/ModularFate/templates/ModularFateSheet.html'
    })

    game.settings.register ("ModularFate","PlayerThings", {
        name:game.i18n.localize("ModularFate.AllowPlayerThingCreation"),
        label:game.i18n.localize("ModularFate.ThingCreationLabel"),
        hint:game.i18n.localize("ModularFate.ThingCreationHint"),
        type:Boolean,
        scope:"world",
        config:true,
        restricted:true,
        default:true
    });

    game.settings.register ("ModularFate","DeleteOnTransfer", {
        name:game.i18n.localize("ModularFate.DeleteOnTransfer"),
        label:game.i18n.localize("ModularFate.DeleteOnTransferLabel"),
        hint:game.i18n.localize("ModularFate.DeleteOnTransferHint"),
        type:Boolean,
        scope:"world",
        config:true,
        restricted:true,
        default:true
    });

    game.settings.register("ModularFate","confirmDeletion", {
        name: game.i18n.localize("ModularFate.ConfirmDeletionName"),
        hint:game.i18n.localize("ModularFate.ConfirmDeletionHint"),
        scope:"user",
        config:true,
        type:Boolean,
        restricted:false,
        default:false
    });

    game.settings.register("ModularFate","drawingsOnTop", {
        name:game.i18n.localize("ModularFate.DrawingsOnTop"),
        hint:game.i18n.localize("ModularFate.DrawingsOnTopHint"),
        scope:"world",
        config:"true",
        type:Boolean,
        default:false
    })

    game.settings.register("ModularFate","fu_actor_avatars", {
        name:"Use actor avatars instead of token avatars in Fate Utilities?",
        hint:"Whether to use actor avatars instead of token avatars in Fate Utilities' aspect viewer",
        scope:"world",
        config:false,
        default:false,
        type:Boolean
    })

    game.settings.register("ModularFate","fu_combatants_only", {
        name:"Display information only for combatants in the current 'encounter' rather than all tokens?",
        hint:"Toggle between display of all tokens or just active combatants in Fate Utilities",
        scope:"user",
        config:false,
        default:false,
        type:Boolean
    })

    game.settings.register("ModularFate", "run_once", {
        name: "Run Once?",
        hint:"Pops up a brief tutorial message on first load of a world with this system",
        scope:"world",
        config:false,
        type: Boolean,
        default:false
    })

    game.system.entityTypes.Item = ["Extra"];
    game.system.entityTypes.Actor = ["ModularFate","Thing"]

    game.system.apps= {
        actor:[],
        combat:[],
        scene:[],
        user:[],
        item:[]
    }

    //On init, we initialise any settings and settings menus and HUD overrides as required.
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet("ModularFate", ModularFateCharacter, { types: ["ModularFate"], makeDefault: true });
    Actors.registerSheet("Thing" , Thing, {types: ["Thing"]});

    // Register Item sheets
    Items.registerSheet('fate', ExtraSheet, { types: ['Extra'] });

    game.settings.register("ModularFate", "gameTime", {
        name: game.i18n.localize("ModularFate.GameTime"),
        scope:"world",
        config:false,
        type:String,
        restricted:true,
        default:""
    })
    
    game.settings.register("ModularFate", "gameNotes", {
        name: game.i18n.localize("ModularFate.GameNotes"),
        scope:"world",
        config:false,
        type:String,
        restricted:true,
        default:""
    })

    game.settings.register("ModularFate", "gameAspects", {
        name: game.i18n.localize("ModularFate.GameTime"),
        scope:"world",
        config:false,
        type:Object,
        restricted:true,
        default:[]
    })

    game.settings.register("ModularFate", "fuFontSize", {
        name: "Fate Utilities Font Size",
        scope:"user",
        config:false,
        type:Number,
        restricted:false,
        default:10 //Size in points (pt)
    })

    game.settings.register("ModularFate", "aspectwidth", {
        name: game.i18n.localize("ModularFate.aspectWidth"),
        hint: game.i18n.localize("ModularFate.AspectLabelWidth"),
        scope: "world",
        config: true,
        type: Number,
        range: {
            min: 5,
            max: 50,
            step: 1,
        },
        default:12
    });

    game.settings.register("ModularFate", "fuAspectLabelSize", {
        name: game.i18n.localize("ModularFate.fuAspectLabelSizeName"),
        hint:game.i18n.localize("ModularFate.fuAspectLabelSizeHint"),
        scope:"world",
        config:false,
        type:Number,
        restricted:true,
        default:0 
    })

    game.settings.register("ModularFate","fuAspectLabelFont", {
        name: game.i18n.localize("ModularFate.fuAspectLabelFont"),
        hint:game.i18n.localize("ModularFate.fuAspectLabelFontHint"),
        scope:"world",
        config:false,
        type:String,
        restricted:true,
        choices:CONFIG.fontFamilies,
        default:"Montserrat",
    })

    // Text colour
    game.settings.register("ModularFate","fuAspectLabelTextColour", {
        name: game.i18n.localize("ModularFate.fuAspectLabelTextColour"),
        hint:game.i18n.localize("ModularFate.fuAspectLabelTextColourHint"),
        scope:"world",
        config:false,
        type:String,
        restricted:true,
        default:"#000000",
    })

    //BG Colour
    game.settings.register("ModularFate","fuAspectLabelFillColour", {
        name: game.i18n.localize("ModularFate.fuAspectLabelFillColour"),
        hint:game.i18n.localize("ModularFate.fuAspectLabelFillColourHint"),
        scope:"world",
        config:false,
        restricted:true,
        type:String,
        restricted:true,
        default:"#FFFFFF"
    })

    // Border colour
    game.settings.register("ModularFate","fuAspectLabelBorderColour", {
        name: game.i18n.localize("ModularFate.fuAspectLabelBorderColour"),
        hint:game.i18n.localize("ModularFate.fuAspectLabelBorderColourHint"),
        scope:"world",
        config:false,
        restricted:true,
        type:String,
        restricted:true,
        default:"#000000"
    })

});

Combatant.prototype._getInitiativeFormula = function () {
    let init_skill = game.settings.get("ModularFate","init_skill");
    if (init_skill === "None" || init_skill === "Disable") {
        return "1d0";
    }else {
        return `1d0+${this.actor.data.data.skills[init_skill].rank}`;
    }
}

// Custom drawings layer with different z index
class CustomDrawingsLayer extends DrawingsLayer {
    static get layerOptions() {
        const options = super.layerOptions;
        options.zIndex = 350;
        return options;
    }
}

Hooks.on("init", () => {
    if (game.settings.get ("ModularFate", "drawingsOnTop")){
        // Force Canvas to use the new DrawingsLayer
        const existingLayers = Canvas.layers;
        existingLayers.drawings = CustomDrawingsLayer;
        Object.defineProperty(Canvas, "layers", { get: () => existingLayers });
    }
});

Hooks.on("getSceneControlButtons", (controls) => {
    if (game.settings.get ("ModularFate", "drawingsOnTop")){
        controls.find(c => c.name === "drawings").layer = "CustomDrawingsLayer";
    }
})

