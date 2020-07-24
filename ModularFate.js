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
// Import modules
/*
import { FATE } from "./module/config.js";
import { preloadHandlebarsTemplates } from "./module/templates.js";
import { CoreCharacterSheet } from "./module/actor/CoreSheet.js";
import { FAECharacterSheet } from "./module/actor/FaeSheet.js";
import { CondensedCharacterSheet } from "./module/actor/CondensedSheet.js";
import { ItemSheetFATE } from "./module/item/ItemSheet.js";
import { ExtraSheet } from "./module/item/ExtraSheet.js";
import { ModularFateCharacter} from "./module/actor/ModularFateCharacter.js"
*/
/* -------------------------------- */
/*	System initialization			*/
/* -------------------------------- */

import { ModularFateCharacter } from "./scripts/ModularFateCharacter.js"
import { ExtraSheet } from "./scripts/ExtraSheet.js";

Hooks.on("preCreateActor", (data, options, userId) => {
    if (data.type =="Core" || data.type=="Accelerated"){
        //console.log("importing")
        data = migrateFateCharacter(data);
        //console.log(data);
    }
  });

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
            //console.log(actorData);
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
            ModularFateConstants.awaitOKDialog("Welcome to the Modular Fate System!","Welcome! Head on over to the System options in Foundry's Settings menu to get everything set up. Use the options to pre-load default skills, aspects, and tracks from Core, Condensed or Accelerated and then customise them, or you can start completely from scratch - it's up to you!<p/>Any character created will be initialised using those settings, so it's best not to create any characters until you've finished setting up your game.<p/> Have fun!",500,250);
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

let delay = 25;

Hooks.on('updateToken', (scene, token, data) => {
    if (data.hidden != undefined || data.actorData != undefined || data.flags != undefined || data.name!=undefined){
        game.system.apps["actor"].forEach(a=> {
            setTimeout(function(){a.renderMe(token._id, data);},delay);
        })
    }
})

Hooks.on('updateUser',(...args) =>{
        game.system.apps["user"].forEach (a=> {
            setTimeout(function(){a.renderMe("updateUser");},delay);
        })
})

Hooks.on('renderPlayerList',(...args) =>{
    game.system.apps["user"].forEach (a=> {
        setTimeout(function(){a.renderMe("updateUser");},delay);
    })
})

Hooks.on('updateActor', (actor, data) => {
    game.system.apps["actor"].forEach(a=> {
        setTimeout(function(){a.renderMe(actor.id, data);},delay);
    })
})

Hooks.on('renderCombatTracker', () => {
    game.system.apps["combat"].forEach(a=> {
        setTimeout(function(){a.renderMe("renderCombatTracker");},delay);
    })
})
Hooks.on('updateCombat', (...args) => {
    let ags = args;
    game.system.apps["combat"].forEach(a=> {
        setTimeout(function(){a.renderMe(ags);},delay);
    })
})

Hooks.on('deleteCombat', (...args) => {
    game.system.apps["combat"].forEach(a=> {
        setTimeout(function(){a.renderMe("deleteCombat");},delay);
    })
})

Hooks.on('deleteToken', (...args) => {
    game.system.apps["actor"].forEach(a=> {
        setTimeout(function(){a.renderMe("deleteToken");},delay);
    })
})

Hooks.on('createToken', (...args) => {
    game.system.apps["actor"].forEach(a=> {
        setTimeout(function(){a.renderMe("createToken");},delay);
    })
})

Hooks.on('updateScene', (...args) => {
    let ags = args;
    game.system.apps["combat"].forEach(a=> {
        setTimeout(function(){a.renderMe(args);},delay);
        
    })
})

Hooks.once('init', async function () {

    game.settings.register("ModularFate", "run_once", {
        name: "Run Once?",
        hint:"Pops up a brief tutorial message on first load of a world with this system",
        scope:"world",
        config:false,
        type: Boolean
    })

    game.system.entityTypes.Item = ["Extra"];
    game.system.entityTypes.Actor = ["ModularFate"]

    game.system.apps= {
        actor:[],
        combat:[],
        scene:[],
        user:[]
    }

    //On init, we initialise any settings and settings menus and HUD overrides as required.
    console.log(`Initializing Modular Fate`);
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet("ModularFate", ModularFateCharacter, { types: ["ModularFate"], makeDefault: true });
    // Register Item sheets
    Items.registerSheet('fate', ExtraSheet, { types: ['Extra'] });

    //Register a setting for the game's current Refresh total
    game.settings.register("ModularFate", "refreshTotal", {
        name: "Refresh Total",
        hint: "This is the current Refresh total for characters in this world.",
        scope: "world",
        config: true,
        type: Number
    });
    //Initialise if not yet set
    if (isNaN(game.settings.get("ModularFate","refreshTotal"))){
            game.settings.set("ModularFate","refreshTotal",3);
    }
    
    //Register a setting for the game's Issues?
});

SidebarDirectory.prototype._onCreate = async function(event) {
        // Do not allow the creation event to bubble to other listeners
        event.preventDefault();
        event.stopPropagation();
    
        // Collect data
        const ent = this.constructor.entity;
        const cls = this.constructor.cls;
        const types = game.system.entityTypes[ent];
    
        // Setup entity data
        const createData = {
          name: `New ${game.i18n.localize(cls.config.label)}`,
          type: types[0],
          folder: event.currentTarget.dataset.folder
        };
    
        // Render the entity creation form
        let templateData = {upper: ent, lower: ent.toLowerCase(), types: types},
            dlg = await renderTemplate(`templates/sidebar/entity-create.html`, templateData);
    
        // Render the confirmation dialog window
        new Dialog({
          title: `Create ${createData.name}`,
          content: dlg,
          buttons: {
            create: {
              icon: '<i class="fas fa-check"></i>',
              label: `Create ${game.i18n.localize(cls.config.label)}`,
              callback: html => {
                const form = html[0].querySelector("form");
                  try {
                      mergeObject(createData, FormApplication.processForm(form));   
                  }catch {
                      mergeObject(createData, validateForm(form));
                  }
                cls.create(createData, {renderSheet: true});
              }
            }
          },
          default: "create"
        }).render(true);
      }
  

