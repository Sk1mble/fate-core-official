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
 */

/* -------------------------------- */
/*	System initialization			*/
/* -------------------------------- */

import { ModularFateCharacter } from "./scripts/ModularFateCharacter.js"
import { ExtraSheet } from "./scripts/ExtraSheet.js"
import { Thing } from "./scripts/Thing.js"
import { ModularFateActor } from "./scripts/ModularFateActor.js"

Hooks.on("preCreateActor", (data, options, userId) => {
    if (data.type =="Core" || data.type=="Accelerated"){
        data = migrateFateCharacter(data);
    }

    if (data.type == "Thing"){
        if (!options.thing){
            ui.notifications.error(game.i18n.localize("ModularFate.CantCreateThing"));
            return false;
        }
    }
});

Hooks.on("createActor", async (data, options, userId) => {
    if (data.data.type == "ModularFate") {
        if (game.user == game.users.find(e => e.isGM && e.active) || game.user.id === userId){
            if (data?.data?.data?.details?.fatePoints?.refresh === ""){  
                await initialiseModularFateCharacter(data);
            }
        }
    }
});

async function initialiseModularFateCharacter (data) {
    let actor = new Actor(data);
    let working_data = duplicate(data.data);
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
    await setTimeout(function(){actor.update(working_data)},0);
}

async function importFateCharacter(actor) {
    console.log("Original Fate Core character detected; setting them up for ModularFate")
            let actorData = duplicate(actor.data); //We'll do all our modifications to this data and then write out a corrected version.
            //We won't be using these
            delete actorData.data.health;
            delete actorData.data.details.extras;

            let aspects = {}
            //console.log("Setting up aspects for " + actor.name)
            let hc = {"name":"High Concept","description":"Your high concept is a broad description of the character, covering the vital bits. It’s how you would open your pitch for the character when telling a friend about them.","value":actorData.data.aspects.hc.value};
            aspects["High Concept"]=hc;
            let trouble = {"name":"Trouble","description":"Next is your character’s trouble—something that makes your character’s life more complicated. It could be a personal weakness, family entanglements, or other obligations. Pick something you’ll enjoy roleplaying!", "value":actorData.data.aspects.trouble.value}
            aspects["Trouble"]=trouble;
            let other1 = {"name":"Other 1","description":"A third aspect", "value":actorData.data.aspects.other.value[0]}
            aspects["Other 1"]=other1;
            let other2 = {"name":"Other 2","description":"A fourth aspect", "value":actorData.data.aspects.other.value[1]}
            aspects["Other 2"]=other2;
            let other3 = {"name":"Other 3","description":"A fifth aspect", "value":actorData.data.aspects.other.value[2]}
            aspects["Other 3"]=other3;
            
            //Delete the old aspects
            delete actorData.data.aspects;
            actorData.data.aspects = aspects;

            //This can stay blank as it will be initialised from the system's universal tracks upon first load of the character sheet.
            let tracks = {}
            actorData.data.tracks = tracks;

            //Now set up skills, stunts, and extras from items
            let skills = {}
            let stunts = {}
            let items = [];
            let allitems = actorData.items;

            for (let i = 0; i<allitems.length; i++){            
                let item = allitems[i];
                if (item.type=="Extra"){
                    item.refresh=0;
                    items.push(item);
                }
                if (item.type=="Skill"){
                    let newSkill = {
                        "name":item.name,
                        "description":item.data.description.value,
                        "rank":item.data.level,
                        "attack":"",
                        "caa":"",
                        "overcome":"",
                        "defend":"",
                        "pc":true
                    }
                    skills[newSkill.name]=newSkill;
                }
                if (item.type=="Stunt"){
                    let newStunt ={
                        "name":item.name,
                        "linked_skill":"",
                        "description":item.data.description.value,
                        "refresh_cost":1,
                        "overcome":false,
                        "caa":false,
                        "attack":false,
                        "defend":false,
                        "bonus":0
                    }
                    stunts[newStunt.name]=newStunt;
                }
            }
            actorData.data.skills=skills;
            actorData.data.stunts=stunts
            actorData.items=items;
            actorData.type="ModularFate"
            actorData.data.details.fatePoints = duplicate(actorData.data.details.points)
            delete actorData.data.details.points;

            await actor.update({"data.aspects":"-=null"})
            await actor.update(actorData)
}

async function migrateFateCharacter(actorData) {
    console.log("Original Fate Core character detected; setting them up for ModularFate")
            delete actorData.data.health;
            delete actorData.data.details.extras;

            let aspects = {}
            console.log("Setting up aspects for " + actorData.name)
            let hc = {"name":"High Concept","description":"Your high concept is a broad description of the character, covering the vital bits. It’s how you would open your pitch for the character when telling a friend about them.","value":actorData.data.aspects.hc.value};
            aspects["High Concept"]=hc;
            let trouble = {"name":"Trouble","description":"Next is your character’s trouble—something that makes your character’s life more complicated. It could be a personal weakness, family entanglements, or other obligations. Pick something you’ll enjoy roleplaying!", "value":actorData.data.aspects.trouble.value}
            aspects["Trouble"]=trouble;
            let other1 = {"name":"Other 1","description":"A third aspect", "value":actorData.data.aspects.other.value[0]}
            aspects["Other 1"]=other1;
            let other2 = {"name":"Other 2","description":"A fourth aspect", "value":actorData.data.aspects.other.value[1]}
            aspects["Other 2"]=other2;
            let other3 = {"name":"Other 3","description":"A fifth aspect", "value":actorData.data.aspects.other.value[2]}
            aspects["Other 3"]=other3;
            
            //Delete the old aspects
            delete actorData.data.aspects;
            actorData.data.aspects = aspects;

            //This can stay blank as it will be initialised from the system's universal tracks upon first load of the character sheet.
            let tracks = {}
            actorData.data.tracks = tracks;

            //Now set up skills, stunts, and extras from items
            let skills = {}
            let stunts = {}
            let items = [];
            let allitems = actorData.items;

            for (let i = 0; i<allitems.length; i++){            
                let item = allitems[i];
                if (item.type=="Extra"){
                    item.refresh=0;
                    items.push(item);
                }
                if (item.type=="Skill"){
                    let newSkill = {
                        "name":item.name,
                        "description":item.data.description.value,
                        "rank":item.data.level,
                        "attack":"",
                        "caa":"",
                        "overcome":"",
                        "defend":"",
                        "pc":true
                    }
                    skills[newSkill.name]=newSkill;
                }
                if (item.type=="Stunt"){
                    let newStunt ={
                        "name":item.name,
                        "linked_skill":"",
                        "description":item.data.description.value,
                        "refresh_cost":1,
                        "overcome":false,
                        "caa":false,
                        "attack":false,
                        "defend":false,
                        "bonus":0
                    }
                    stunts[newStunt.name]=newStunt;
                }
            }
            actorData.data.skills=skills;
            actorData.data.stunts=stunts
            actorData.items=items;
            actorData.type="ModularFate"
            actorData.data.details.fatePoints = duplicate(actorData.data.details.points)
            delete actorData.data.details.points;
            //console.log(actorData);
            return actorData;
}

Hooks.once('ready', async function () {
    if (game.settings.get("ModularFate","run_once") == false){
        if (game.user.isGM){
            ModularFateConstants.awaitOKDialog(game.i18n.localize("ModularFate.WelcomeTitle"),game.i18n.localize("ModularFate.WelcomeText"),500,250);
            game.settings.set("ModularFate","run_once", true)
        }
    }

    // Let us initialise the characters if they've been imported from Nick's Fate Core system.

    //We need to set their Type to ModularFate -- do this last so I can check how everything is going.
    //We need to set their skills up according to the items they have.
    //We need to copy over their aspects.
    //We need to copy over their biography and description
    
    let actors = game.actors.entries;
    actors.forEach(actor =>{
        if (actor.data.type == "Core" || actor.data.type=="Accelerated"){
            importFateCharacter(actor);
        }
    })
})

Hooks.on('updateToken', (scene, token, data) => {
    if (data.hidden != undefined || data.actorData != undefined || data.flags != undefined || data.name!=undefined){
        game.system.apps["actor"].forEach(a=> {
            a.renderMe(token._id, data);
        })
    }
})

Hooks.on('controlToken', (token) => {
        game.system.apps["actor"].forEach (a=> {
            a.renderMe("controlToken");
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
        a.renderMe(actor.id, data);
    })
})

Hooks.on('updateItem', (item, data) => {
    game.system.apps["item"].forEach(a=> {
        a.renderMe(item._id, data);
    })
})

Hooks.on('updateOwnedItem', (actor, item, data) => {
    game.system.apps["item"].forEach(a=> {
        setTimeout(function(){a.renderMe(item._id, data)},200);
        a.renderMe(item._id, data);
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
    let ags = args;
    game.system.apps["combat"].forEach(a=> {
        a.renderMe(args);
    })
})

Hooks.once('init', async function () {

    CONFIG.Actor.entityClass = ModularFateActor;

    game.settings.register("ModularFate","fu_actor_avatars", {
        name:"Use actor avatars instead of token avatars in Fate Utilities?",
        hint:"Whether to use actor avatars instead of token avatars in Fate Utilities' aspect viewer",
        scope:"world",
        config:false,
        default:false,
        type:Boolean
    })

    //Initialise the setting if it is currently empty.
    if (jQuery.isEmptyObject(game.settings.get("ModularFate","stunts"))){
        game.settings.set("ModularFate","stunts",{});
    }

    game.settings.register("ModularFate", "run_once", {
        name: "Run Once?",
        hint:"Pops up a brief tutorial message on first load of a world with this system",
        scope:"world",
        config:false,
        type: Boolean
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

    //Register a setting for the game's current Refresh total
    game.settings.register("ModularFate", "refreshTotal", {
        name: game.i18n.localize("ModularFate.RefreshTotalName"),
        hint: game.i18n.localize("ModularFate.RefreshTotalHint"),
        scope: "world",
        config: true,
        type: Number
    });
    //Initialise if not yet set
    if (isNaN(game.settings.get("ModularFate","refreshTotal"))){
            game.settings.set("ModularFate","refreshTotal",3);
    }

    game.settings.register("ModularFate","confirmDeletion", {
        name: game.i18n.localize("ModularFate.ConfirmDeletionName"),
        hint:game.i18n.localize("ModularFate.ConfirmDeletionHint"),
        scope:"user",
        config:true,
        type:Boolean,
        restricted:false
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

    game.settings.register("ModularFate", "fuAspectLabelSize", {
        name: game.i18n.localize("ModularFate.fuAspectLabelSizeName"),
        hint:game.i18n.localize("ModularFate.fuAspectLabelSizeHint"),
        scope:"world",
        config:true,
        type:Number,
        restricted:true,
        default:0 
    })

    game.settings.register("ModularFate","fuAspectLabelFont", {
        name: game.i18n.localize("ModularFate.fuAspectLabelFont"),
        hint:game.i18n.localize("ModularFate.fuAspectLabelFontHint"),
        scope:"world",
        config:true,
        type:String,
        restricted:true,
        choices:CONFIG.fontFamilies,
        default:"Modesto Condensed",
    })

});


Combat.prototype._getInitiativeFormula = function (combatant) {
    let init_skill = game.settings.get("ModularFate","init_skill");
    if (init_skill === "None" || init_skill === "Disable") {
        return "0";
    }else {
        return combatant.actor.data.data.skills[`${init_skill}`].rank.toString();
    }
}