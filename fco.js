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

import { fcoCharacter } from "./scripts/fcoCharacter.js"
import { ExtraSheet } from "./scripts/ExtraSheet.js"
import { Thing } from "./scripts/Thing.js"
import { fcoActor } from "./scripts/fcoActor.js"
import { fcoExtra } from "./scripts/fcoExtra.js"

Hooks.on("preCreateActor", (actor, data, options, userId) => {
    if (data.type == "Thing"){
        if (!options.thing){
            ui.notifications.error(game.i18n.localize("fate-core-official.CantCreateThing"));
            return false
        }
    }
});

Hooks.on("preCreateActor", (actor, data, options, userId) => {
    if (data.type == "ModularFate" || actor.type == "FateCoreOfficial"){
        data.type = "fate-core-official";
    }

    if (data.type == "fate-core-official"){
        if (game.user == game.users.find(e => e.isGM && e.active) || game.user.id === userId){
            if (actor?.data?.data?.details?.fatePoints?.refresh === ""){
                let modified_data = initialisefcoCharacter(actor);
                data.data = modified_data.data;
            }
        }
    }
});

function initialisefcoCharacter (actor) {

    //Modifies the data of the supplied actor to add tracks, aspects, etc. from system settings, then returns the data.
    let working_data = actor.data.toJSON();
    // Logic to set up Refresh and Current

    let refresh = game.settings.get("fate-core-official", "refreshTotal");

    working_data.data.details.fatePoints.refresh = refresh;
    working_data.data.details.fatePoints.current = refresh;
    
    let p_skills=working_data.data.skills;
    
    //Check to see what skills the character has compared to the global skill list
        var skill_list = game.settings.get("fate-core-official","skills");
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

        let aspects = game.settings.get("fate-core-official", "aspects");
        let player_aspects = duplicate(aspects);
        for (let a in player_aspects) {
            player_aspects[a].value = "";
        }
        //Now to store the aspect list to the character
        working_data.data.aspects = player_aspects;
    
        //Step one, get the list of universal tracks.
        let world_tracks = duplicate(game.settings.get("fate-core-official", "tracks"));
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
            if (track.aspect == game.i18n.localize("fate-core-official.DefinedWhenMarked")) {
                track.aspect = {};
                track.aspect.name = "";
                track.aspect.when_marked = true;
                track.aspect.as_name = false;
            }
            if (track.aspect == game.i18n.localize("fate-core-official.AspectAsName")) {
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
    
    let categories = game.settings.get("fate-core-official", "track_categories");
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

Hooks.once('ready', () => {
    if (game.settings.get ("fate-core-official", "drawingsOnTop")){
        try {
            canvas.layers.find(l => l.name === 'DrawingsLayer').zIndex = 350
        } catch {
            // This just means that the layers aren't instantiated yet.
        }
    }
});

Hooks.on('getSceneControlButtons', function(hudButtons){
    if (game.settings.get ("fate-core-official", "drawingsOnTop")){
        try {
            canvas.layers.find(l => l.name === 'DrawingsLayer').zIndex = 350
        }
        catch {
            // This just means that the layers aren't instantiated yet.
        }
    }
});

Hooks.once('ready', async function () {
    //Convert any straggling ModularFate actors to fate-core-official actors.
    let updates = [];
    game.actors.contents.forEach(actor => {
        if (actor.type == "ModularFate" || actor.type == "FateCoreOfficial") updates.push({_id:actor.id, type:"fate-core-official"})
    });
    await Actor.updateDocuments(updates)

    // We need to port any and all settings over from ModularFate/Fate Core Official and any or all flags.

    //First, settings.
    const systemSettings = [];
    try {
        for ( let s of game.data.settings ) {
            if ( s.key.startsWith("ModularFate.") ) {
                systemSettings.push({_id: s._id, key: s.key.replace("ModularFate.", "fate-core-official.")});
            }
            if ( s.key.startsWith("FateCoreOfficial.") ) {
                systemSettings.push({_id: s._id, key: s.key.replace("FateCoreOfficial.", "fate-core-official.")});
            }
        }
        await Setting.updateDocuments(systemSettings);
    }
    catch (error){
        //Do nothing, just don't stop what you're doing!
    }

    // Now flags, let us write a convenience function

    async function changeFlags(doc){
        let flags1 = doc.data.flags["ModularFate"];
        let flags2 = doc.data.flags["FateCoreOfficial"];
        if ( flags1 ) {
            await doc.update({"flags.fate-core-official": flags1}, {recursive: false});
            await doc.update({"flags.-=ModularFate": null});
        }
        if ( flags2 ) {
            await doc.update({"flags.fate-core-official": flags2}, {recursive: false});
            await doc.update({"flags.-=FateCoreOfficial": null});
        }
    }

    // Actors
    game.actors.contents.forEach(async doc =>{
        await changeFlags(doc);
    })

    // Scenes & Token actors
    game.scenes.contents.forEach(async doc => {
        await changeFlags(doc);
        doc.tokens.contents.forEach(async tok => {
            await changeFlags(tok);
        })
    })

    // Combats & combatants
    game.combats.contents.forEach(async doc => {
        await changeFlag (doc);
        doc.combatants.contents.forEach(async com =>{
            await changeFlag (dom);
        })
    })


    // The code for initialising a new world with the content of a module pack goes here.
    // The fallback position is to display a similar message to the existing one.            
    if (game.settings.get("fate-core-official","run_once") == false){
        const ehmodules = [];
        game.modules.forEach(m => {
            if (m.data?.flags?.ehproduct == "Fate Core"){
                ehmodules.push(m);
            }
        })
        //console.log(ehmodules);

        class fate_splash extends FormApplication {
            constructor(...args){
                super(...args);
            }

            static get defaultOptions (){
                let h = window.innerHeight;
                let w = window.innerWidth;
                let options = super.defaultOptions;
                options.template = "systems/fate-core-official/templates/fate-splash.html"
                options.width = w/2+15;
                options.height = h-50;
                options.title = "New World Setup"
                return options;
            }

            activateListeners(html){
                super.activateListeners(html);
                const cont = html.find('button[id="fco_continue_button"]');
                cont.on('click', async event => {
                    await game.settings.set("fate-core-official","run_once",true);
                    await game.settings.set("fate-core-official","defaults",game.i18n.localize("fate-core-official.baseDefaults"))
                    await ui.sidebar.render(false);
                    this.close();
                })

                const install = html.find('button[name="eh_install"]');
                install.on('click', async event => {
                    let module = event.target.id.split("_")[1];
                    game.settings.set("fate-core-official", "installing", module);
                    // Now to activate the module, which should kick off a refresh, allowing the installation to begin.
                    let mc = game.settings.get("core","moduleConfiguration");
                    if (mc[module] == true) {
                        this.installModule(module);
                        this.close();
                    }
                    else {
                        mc[module]=true;
                        await game.settings.set("core", "moduleConfiguration", mc);
                    }
                })
            }

           async getData(){
                let data = super.getData();
                data.ehmodules = ehmodules;
                data.num_modules = ehmodules.length;
                data.h = window.innerHeight /2;
                data.w = window.innerWidth /2;
                data.mh = data.h/1.1;
                return data;
            }

            async installModule(module_name){
                // Load the world settings from setup.json and install them
                let setup = await fcoConstants.getJSON(`/modules/${module_name}/json/setup.json`);
                let folders = await fcoConstants.getJSON(`/modules/${module_name}/json/folders.json`);
                await fcoConstants.importSettings(setup);
                await fcoConstants.createFolders(folders);
    
                // Grab all of the compendium pack data for the module
                let module = await game.modules.get(module_name);
                let packs = Array.from(module.packs);
                for (let pack of packs){
                    if (!pack.name.includes("fatex")){
                        let cc = new CompendiumCollection (pack);
                        await fcoConstants.importAllFromPack(cc)
                    }
                }

                // Set installing and run_once to the appropriate post-install values
                await game.settings.set("fate-core-official", "run_once", true);
                await game.settings.set("fate-core-official", "installing", "none");

                // Set the 'welcome' scene we grabbed from the scenes compendium to active
                let scene = game.scenes.getName("Welcome");
                if (scene) await scene.activate();

                // Set this game's image to the world's default
                console.log("About to try and set the world image")
                //action: "editWorld"
                //background: "modules/the-secrets-of-cats/art/world.webp"
                //description: null
                //name: "test"
                //nextSession: null
                //title: "test"

                await fetch(foundry.utils.getRoute("setup"), {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: "editWorld",
                      background: `modules/${module_name}/art/world.webp`, title:game.world.data.title, name:game.world.data.name, nextSession:null
                    })
                  });
            }
        }

        if (game.user.isGM){
            if (game.settings.get("fate-core-official","installing") === "none") {
                let f = new fate_splash().render(true);
            } else {
                new fate_splash().installModule(game.settings.get("fate-core-official","installing"))
            }
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
    CONFIG.Actor.documentClass = fcoActor;
    CONFIG.Item.documentClass = fcoExtra;
    CONFIG.fontFamilies.push("Montserrat");
    CONFIG.fontFamilies.push("Jost");

    //Let's initialise the settings at the system level.
    // ALL settings that might be relied upon later are now included here in order to prevent them from being unavailable later in the init hook.

    game.settings.register("fate-core-official","tracks",{
        name:"tracks",
        hint:game.i18n.localize("fate-core-official.TrackManagerHint"),
        scope:"world",
        config:false,
        type: Object,
        default: {}
    });

    game.settings.register("fate-core-official","track_categories",{
        name:"track categories",
        hint:game.i18n.localize("fate-core-official.TrackCategoriesHint"),
        scope:"world",
        config:false,
        type: Object,
        default:{"Combat":"Combat","Other":"Other"}
    });

    // Register the menu to setup the world's conditions etc.
    game.settings.registerMenu("fate-core-official", "TrackSetup", {
        name: game.i18n.localize("fate-core-official.SetupTracks"),
        label: game.i18n.localize("fate-core-official.Setup"),      // The text label used in the button
        hint: game.i18n.localize("fate-core-official.TrackSetupHint"),
        type: TrackSetup,   // A FormApplication subclass which should be created
        restricted: true    // Restrict this submenu to gamemaster only?
      });

    game.settings.register("fate-core-official", "aspects", {
        name: "Aspects",
        hint: "This is the list of aspects for this particular world.",
        scope: "world",
        config: false,
        type: Object,
        default:{}
    });

    // Register the menu to setup the world's aspect list.
    game.settings.registerMenu("fate-core-official","AspectSetup", {
        name:game.i18n.localize("fate-core-official.SetupAspects"),
        label:game.i18n.localize("fate-core-official.Setup"),
        hint:game.i18n.localize("fate-core-official.SetupAspectsHint"),
        type:AspectSetup,
        restricted:true
    });

    // Register a setting for replacing the existing skill list with one of the pre-defined default sets.
    //On init, we initialise all settings and settings menus for dealing with skills 
    //We will be using this setting to store the world's list of skills.
    game.settings.register("fate-core-official", "skills", {
        name: "Skill list",
        hint: "This is the list of skills for this particular world.",
        scope: "world",
        config: false,
        type: Object,
        default:{}
    });

    // Register a setting for storing character default templates
    game.settings.register("fate-core-official", "defaults", {
        name: "Character defaults",
        hint: "Character defaults - sets of tracks, skills, stunts, etc. for ease of character creation for GMs.",
        scope: "world",
        config: false,
        type: Object,
        default:{}
    });

    game.settings.register("fate-core-official","stunts", {
        name: "Stunts Database",
        hint:"A list of approved stunts that can be added to characters",
        scope:"world",
        config:false,
        type:Object,
        default:{}
    })

    // Register the menu to setup the world's skill list.
    game.settings.registerMenu("fate-core-official", "SkillSetup", {
        name: game.i18n.localize("fate-core-official.SetupSkills"),
        label: game.i18n.localize("fate-core-official.Setup"),      // The text label used in the button
        hint: game.i18n.localize("fate-core-official.SetupSkillsHint"),
        type: SkillSetup,   // A FormApplication subclass which should be created
        restricted: true                   // Restrict this submenu to gamemaster only?
      });

    game.settings.register("fate-core-official", "defaultSkills", {
        name: game.i18n.localize("fate-core-official.ReplaceSkills"),
        hint: game.i18n.localize("fate-core-official.ReplaceSkillsHint"),
        scope: "world",     // This specifies a client-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        restricted:true,
        choices: {           // If choices are defined, the resulting setting will be a select menu
            "nothing":game.i18n.localize("fate-core-official.No"),
            "fateCore":game.i18n.localize("fate-core-official.YesFateCore"),
            "fateCondensed":game.i18n.localize("fate-core-official.YesFateCondensed"),
            "accelerated":game.i18n.localize("fate-core-official.YesFateAccelerated"),
            "dfa":game.i18n.localize("fate-core-official.YesDFA"),
            "clearAll":game.i18n.localize("fate-core-official.YesClearAll")
        },
        default: "nothing",        // The default value for the setting
        onChange: value => { // A callback function which triggers when the setting is changed
                if (value == "fateCore"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","skills",game.i18n.localize("fate-core-official.FateCoreDefaultSkills"));
                        game.settings.set("fate-core-official","defaultSkills","nothing");
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.defaultSkillsLabel"));
                    }
                }
                if (value=="clearAll"){
                    if (game.user.isGM) {
                        game.settings.set("fate-core-official","skills",{});
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.defaultSkillsLabel"));
                    }
                }
                if (value=="fateCondensed"){
                    if (game.user.isGM){ 
                        game.settings.set("fate-core-official","skills",game.i18n.localize("fate-core-official.FateCondensedDefaultSkills"));
                        game.settings.set("fate-core-official","defaultSkills","nothing");
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.defaultSkillsLabel"));
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","skills",game.i18n.localize("fate-core-official.FateAcceleratedDefaultSkills"));
                        game.settings.set("fate-core-official","defaultSkills","nothing");
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.FateAcceleratedSkillsLabel"));
                    }
                }
                if (value=="dfa"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","skills",game.i18n.localize("fate-core-official.DresdenFilesAcceleratedDefaultSkills"));
                        game.settings.set("fate-core-official","defaultSkills","nothing");
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.FateAcceleratedSkillsLabel"));
                    }
                }
            }
    });

        // Register a setting for replacing the existing aspect list with one of the pre-defined default sets.
        game.settings.register("fate-core-official", "defaultAspects", {
            name: game.i18n.localize("fate-core-official.ReplaceAspectsName"),
            hint: game.i18n.localize("fate-core-official.ReplaceAspectsHint"),
            scope: "world",     // This specifies a client-stored setting
            config: true,        // This specifies that the setting appears in the configuration view
            type: String,
            restricted:true,
            choices: {           // If choices are defined, the resulting setting will be a select menu
                "nothing":game.i18n.localize("No"),
                "fateCore":game.i18n.localize("fate-core-official.YesFateCore"),
                "fateCondensed":game.i18n.localize("fate-core-official.YesFateCondensed"),
                "accelerated":game.i18n.localize("fate-core-official.YesFateAccelerated"),
                "dfa":game.i18n.localize("fate-core-official.YesDFA"),
                "clearAll":game.i18n.localize("fate-core-official.YesClearAll")
            },
            default: "nothing",        // The default value for the setting
            onChange: value => { // A callback function which triggers when the setting is changed
                    if (value == "fateCore"){
                        if (game.user.isGM){
                            game.settings.set("fate-core-official","aspects",game.i18n.localize("fate-core-official.FateCoreDefaultAspects"));
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                    if (value == "fateCondensed"){
                        if (game.user.isGM){
                            game.settings.set("fate-core-official","aspects",game.i18n.localize("fate-core-official.FateCondensedDefaultAspects"));
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                    if (value=="clearAll"){
                        if (game.user.isGM){
                            game.settings.set("fate-core-official","aspects",{});
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                    if (value=="accelerated"){
                        if (game.user.isGM){
                            game.settings.set("fate-core-official","aspects",game.i18n.localize("fate-core-official.FateAcceleratedDefaultAspects"));
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                    if (value=="dfa"){
                        if (game.user.isGM){
                            game.settings.set("fate-core-official","aspects",game.i18n.localize("fate-core-official.DresdenFilesAcceleratedDefaultAspects"));
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                }
        });

    // Register a setting for replacing the existing track list with one of the pre-defined default sets.
    game.settings.register("fate-core-official", "defaultTracks", {
        name: game.i18n.localize("fate-core-official.ReplaceTracksName"),
        hint: game.i18n.localize("fate-core-official.ReplaceTracksHint"),
        scope: "world",     // This specifies a client-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        restricted:true,
        choices: {           // If choices are defined, the resulting setting will be a select menu
            "nothing":game.i18n.localize("fate-core-official.No"),
            "fateCore":game.i18n.localize("fate-core-official.YesFateCore"),
            "fateCondensed":game.i18n.localize("fate-core-official.YesFateCondensed"),
            "accelerated":game.i18n.localize("fate-core-official.YesFateAccelerated"),
            "dfa":game.i18n.localize("fate-core-official.YesDFA"),
            "clearAll":game.i18n.localize("fate-core-official.YesClearAll")
        },
        default: "nothing",        // The default value for the setting
        onChange: value => { // A callback function which triggers when the setting is changed
                if (value == "fateCore"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","tracks",game.i18n.localize("fate-core-official.FateCoreDefaultTracks"));
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                    }
                }
                if (value=="clearAll"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","tracks",{});
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                    }
                }
                if (value=="fateCondensed"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","tracks",game.i18n.localize("fate-core-official.FateCondensedDefaultTracks"));
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","tracks",game.i18n.localize("fate-core-official.FateAcceleratedDefaultTracks"));
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                    }
                }
                if (value == "dfa"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","tracks",game.i18n.localize("fate-core-official.DresdenFilesAcceleratedDefaultTracks"));
                        game.settings.set("fate-core-official","track_categories",game.i18n.localize("fate-core-official.DresdenFilesAcceleratedDefaultTrackCategories"));
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                    }
                }
            }
    });

    game.settings.register("fate-core-official","exportSettings", {
        name: game.i18n.localize("fate-core-official.ExportSettingsName"),
        scope:"world",
        config:true,
        type:Boolean,
        restricted:true,
        default:false,
        onChange: value => {
            if (value == true && game.user.isGM){
                let text = fcoConstants.exportSettings();
 
                new Dialog({
                    title: game.i18n.localize("fate-core-official.ExportSettingsDialogTitle"), 
                    content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="export_settings">${text}</textarea></div>`,
                    buttons: {
                    },
                }).render(true);
                game.settings.set("fate-core-official","exportSettings",false);
            }
        }
    })

    game.settings.register("fate-core-official","importSettings", {
        name: game.i18n.localize("fate-core-official.ImportSettingsName"),
        scope:"world",
        hint:game.i18n.localize("fate-core-official.ImportSettingsHint"),
        config:true,
        type:Boolean,
        restricted:true,
        default:false,
        onChange: async value => {
            if (value == true && game.user.isGM){
                let text = await fcoConstants.getSettings();
                fcoConstants.importSettings(text);
                game.settings.set("fate-core-official","importSettings",false);
            }
        }
    })

//Register a setting for the game's current Refresh total
game.settings.register("fate-core-official", "refreshTotal", {
    name: game.i18n.localize("fate-core-official.RefreshTotalName"),
    hint: game.i18n.localize("fate-core-official.RefreshTotalHint"),
    scope: "world",
    config: true,
    type: Number,
    default:3,
    onChange: () =>{
        for (let app in ui.windows){
            if (ui.windows[app]?.object?.type == "Thing" || ui.windows[app]?.object?.type == "fate-core-official"){
                ui.windows[app]?.render(false);
            }
        }
    }
});

game.settings.register("fate-core-official","freeStunts", {
    name:game.i18n.localize("fate-core-official.FreeStunts"),
    hint:game.i18n.localize("fate-core-official.FreeStuntsHint"),
    scope:"world",
    config:true,
    type:Number,
    restricted:true,
    default:3,
    onChange: () =>{
        for (let app in ui.windows){
            if (ui.windows[app]?.object?.type == "Thing" || ui.windows[app]?.object?.type == "fate-core-official"){
                ui.windows[app]?.render(false);
            }
        }
    }
})

      //Register a setting for the game's current skill total
      game.settings.register("fate-core-official", "skillTotal", {
        name: game.i18n.localize("fate-core-official.SkillPointTotal"),
        hint: game.i18n.localize("fate-core-official.SkillPointTotalHint"),
        scope: "world",
        config: true,
        type: Number,
        restricted:true,
        default:20,
        onChange: () =>{
            for (let app in ui.windows){
                if (ui.windows[app]?.object?.type == "Thing" || ui.windows[app]?.object?.type == "fate-core-official"){
                    ui.windows[app]?.render(false);
                }
            }
        }
    });

    game.settings.register("fate-core-official","enforceSkillTotal", {
        name: game.i18n.localize("fate-core-official.EnforceSkillTotal"),
        hint: game.i18n.localize("fate-core-official.EnforceSkillTotalHint"),
        scope:"world",
        config:true,
        type: Boolean,
        restricted:true,
        default:true,
        onChange: () =>{
            for (let app in ui.windows){
                if (ui.windows[app]?.object?.type == "Thing" || ui.windows[app]?.object?.type == "fate-core-official"){
                    ui.windows[app]?.render(false);
                }
            }
        }
    })

    game.settings.register("fate-core-official","enforceColumn", {
        name: game.i18n.localize("fate-core-official.EnforceColumn"),
        hint: game.i18n.localize("fate-core-official.EnforceColumnHint"),
        scope:"world",
        config:true,
        type: Boolean,
        restricted:true,
        default:true,
        onChange: () =>{
            for (let app in ui.windows){
                if (ui.windows[app]?.object?.type == "Thing" || ui.windows[app]?.object?.type == "fate-core-official"){
                    ui.windows[app]?.render(false);
                }
            }
        }
    })

    game.settings.register("fate-core-official","showPronouns", {
        name: game.i18n.localize("fate-core-official.showPronouns"),
        hint: game.i18n.localize("fate-core-official.showPronounsHint"),
        scope:"user",
        config:true,
        type: Boolean,
        restricted:false,
        default:true,
    })
    
    let skill_choices = {};
    let skills = game.settings.get("fate-core-official", "skills")
    
    skill_choices["None"]="None";
    skill_choices["Disable"]="Disable";
    for (let skill in skills){skill_choices[skill]=skill};

    game.settings.register("fate-core-official","init_skill", {
        name:game.i18n.localize("fate-core-official.initiativeSkill"),
        hint:game.i18n.localize("fate-core-official.initiativeSetting"),
        "scope":"world",
        "config":true,
        "restricted":true,
        type:String,
        default:"None",
        choices:skill_choices
    })

    game.settings.register("fate-core-official","modifiedRollDefault", {
        name:game.i18n.localize("fate-core-official.modifiedRollDefault"),
        hint:game.i18n.localize("fate-core-official.modifiedRollDefaultExplainer"),
        scope:"world",
        config:"true",
        type:Boolean,
        default:false
    })

    game.settings.register("fate-core-official","sheet_template", {
        name:game.i18n.localize("fate-core-official.DefaultSheetTemplateName"),
        hint:game.i18n.localize("fate-core-official.DefaultSheetTemplateHint"),
        scope:"world",
        config:"true",
        type:String,
        default:'systems/fate-core-official/templates/fate-core-officialSheet.html'
    })
    

    game.settings.register("fate-core-official","limited_sheet_template", {
        name:game.i18n.localize("fate-core-official.DefaultLimitedSheetTemplateName"),
        hint:game.i18n.localize("fate-core-official.DefaultLimitedSheetTemplateHint"),
        scope:"world",
        config:"true",
        type:String,
        default:'systems/fate-core-official/templates/fate-core-officialSheet.html'
    })

    game.settings.register ("fate-core-official","PlayerThings", {
        name:game.i18n.localize("fate-core-official.AllowPlayerThingCreation"),
        label:game.i18n.localize("fate-core-official.ThingCreationLabel"),
        hint:game.i18n.localize("fate-core-official.ThingCreationHint"),
        type:Boolean,
        scope:"world",
        config:true,
        restricted:true,
        default:true
    });

    game.settings.register ("fate-core-official","DeleteOnTransfer", {
        name:game.i18n.localize("fate-core-official.DeleteOnTransfer"),
        label:game.i18n.localize("fate-core-official.DeleteOnTransferLabel"),
        hint:game.i18n.localize("fate-core-official.DeleteOnTransferHint"),
        type:Boolean,
        scope:"world",
        config:true,
        restricted:true,
        default:true
    });

    game.settings.register("fate-core-official","confirmDeletion", {
        name: game.i18n.localize("fate-core-official.ConfirmDeletionName"),
        hint:game.i18n.localize("fate-core-official.ConfirmDeletionHint"),
        scope:"user",
        config:true,
        type:Boolean,
        restricted:false,
        default:false
    });

    game.settings.register("fate-core-official","drawingsOnTop", {
        name:game.i18n.localize("fate-core-official.DrawingsOnTop"),
        hint:game.i18n.localize("fate-core-official.DrawingsOnTopHint"),
        scope:"world",
        config:"true",
        type:Boolean,
        default:false
    })

    game.settings.register("fate-core-official","fu_actor_avatars", {
        name:"Use actor avatars instead of token avatars in Fate Utilities?",
        hint:"Whether to use actor avatars instead of token avatars in Fate Utilities' aspect viewer",
        scope:"world",
        config:false,
        default:false,
        type:Boolean
    })

    game.settings.register("fate-core-official","fu_combatants_only", {
        name:"Display information only for combatants in the current 'encounter' rather than all tokens?",
        hint:"Toggle between display of all tokens or just active combatants in Fate Utilities",
        scope:"user",
        config:false,
        default:false,
        type:Boolean
    })

    game.settings.register("fate-core-official", "run_once", {
        name: "Run Once?",
        hint:"Display a splash screen for basic orientation that offers to initialise the world.",
        scope:"world",
        config:false,
        type: Boolean,
        default:false
    })

    game.settings.register("fate-core-official", "installing", {
        name: "Store the system we were in the process of installing before the last refresh. Required in order for an installation to proceed after we enable a module.",
        scope: "world",
        config:false,
        type: String, //the name of the module or system we were installing
        default:"none"
    })

    game.system.entityTypes.Item = ["Extra"];
    game.system.entityTypes.Actor = ["fate-core-official","Thing","FateCoreOfficial", "ModularFate"];

    game.system.apps= {
        actor:[],
        combat:[],
        scene:[],
        user:[],
        item:[]
    }

    //On init, we initialise any settings and settings menus and HUD overrides as required.
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet("fate-core-official", fcoCharacter, { types: ["fate-core-official", "FateCoreOfficial", "ModularFate"], makeDefault: true, label:game.i18n.localize("fate-core-official.fcoCharacter") });
    Actors.registerSheet("Thing" , Thing, {types: ["Thing"], label:game.i18n.localize("fate-core-official.Thing")});

    // Register Item sheets
    Items.registerSheet('fate', ExtraSheet, { types: ['Extra'] });

    game.settings.register("fate-core-official", "gameTime", {
        name: game.i18n.localize("fate-core-official.GameTime"),
        scope:"world",
        config:false,
        type:String,
        restricted:true,
        default:""
    })
    
    game.settings.register("fate-core-official", "gameNotes", {
        name: game.i18n.localize("fate-core-official.GameNotes"),
        scope:"world",
        config:false,
        type:String,
        restricted:true,
        default:""
    })

    game.settings.register("fate-core-official", "gameAspects", {
        name: game.i18n.localize("fate-core-official.GameTime"),
        scope:"world",
        config:false,
        type:Object,
        restricted:true,
        default:[]
    })

    game.settings.register("fate-core-official", "countdowns", {
        name: "countdowns",
        scope:"world",
        config:false,
        type:Object,
        restricted:true,
        default:{}
    })

    game.settings.register("fate-core-official", "fuFontSize", {
        name: "Fate Utilities Font Size",
        scope:"user",
        config:false,
        type:Number,
        restricted:false,
        default:10 //Size in points (pt)
    })

    game.settings.register("fate-core-official", "aspectwidth", {
        name: game.i18n.localize("fate-core-official.aspectWidth"),
        hint: game.i18n.localize("fate-core-official.AspectLabelWidth"),
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

    game.settings.register("fate-core-official", "fuAspectLabelSize", {
        name: game.i18n.localize("fate-core-official.fuAspectLabelSizeName"),
        hint:game.i18n.localize("fate-core-official.fuAspectLabelSizeHint"),
        scope:"world",
        config:false,
        type:Number,
        restricted:true,
        default:0 
    })

    game.settings.register("fate-core-official","fuAspectLabelFont", {
        name: game.i18n.localize("fate-core-official.fuAspectLabelFont"),
        hint:game.i18n.localize("fate-core-official.fuAspectLabelFontHint"),
        scope:"world",
        config:false,
        type:String,
        restricted:true,
        choices:CONFIG.fontFamilies,
        default:"Montserrat",
    })

    // Text colour
    game.settings.register("fate-core-official","fuAspectLabelTextColour", {
        name: game.i18n.localize("fate-core-official.fuAspectLabelTextColour"),
        hint:game.i18n.localize("fate-core-official.fuAspectLabelTextColourHint"),
        scope:"world",
        config:false,
        type:String,
        restricted:true,
        default:"#000000",
    })

    //BG Colour
    game.settings.register("fate-core-official","fuAspectLabelFillColour", {
        name: game.i18n.localize("fate-core-official.fuAspectLabelFillColour"),
        hint:game.i18n.localize("fate-core-official.fuAspectLabelFillColourHint"),
        scope:"world",
        config:false,
        restricted:true,
        type:String,
        restricted:true,
        default:"#FFFFFF"
    })

    // Border colour
    game.settings.register("fate-core-official","fuAspectLabelBorderColour", {
        name: game.i18n.localize("fate-core-official.fuAspectLabelBorderColour"),
        hint:game.i18n.localize("fate-core-official.fuAspectLabelBorderColourHint"),
        scope:"world",
        config:false,
        restricted:true,
        type:String,
        restricted:true,
        default:"#000000"
    })

});

Combatant.prototype._getInitiativeFormula = function () {
    let init_skill = game.settings.get("fate-core-official","init_skill");
    if (init_skill === "None" || init_skill === "Disable") {
        return "1d0";
    }else {
        return `1d0+${this.actor.data.data.skills[init_skill].rank}`;
    }
}

// Return enriched text WITH secret blocks if the user is GM and otherwise WITHOUT
Handlebars.registerHelper("enr", function(value, object) {
    let secrets;
    if (object) secrets = object.isOwner;
    if (game.user.isGM) secrets = true;
    //enrichHTML(content, secrets, entities, links, rolls, rollData) → {string}
    return DOMPurify.sanitize(TextEditor.enrichHTML(value, {secrets:secrets, entities:true}));
})

Handlebars.registerHelper("fco_strip", function (value) {
    return value.replace(/(<([^>]+)>)/gi, "")
})

Handlebars.registerHelper("fco_getKey", function(value) {
    return fcoConstants.getKey(value);
});

Handlebars.registerHelper("add1", function(value) {
    return value+1;
});

Handlebars.registerHelper("add5", function(value) {
    return value+5;
})

Handlebars.registerHelper("str", function(value) {
    return JSON.stringify(value);
});

Handlebars.registerHelper("concat", function(value1, value2){
    return value1.concat(value2);
});

Handlebars.registerHelper("category", function(category1, category2) {
    if (category1 == "All" || category1 == category2){
        return true;
    } else {
        return false;
    }
})

Handlebars.registerHelper("undefined", function(value) {
    if (value == undefined){
        return true;
    } else {
        return false;
    }
});

Handlebars.registerHelper("expanded", function (actor, item){
    let key;
    if (actor == "game"){
        key = "game"+item;
    } else {
        key = actor.id + item;
    }

    if (game.user.expanded != undefined){
        return game.user.expanded[key]==true;
    } else {
        return false;
    }
});

Handlebars.registerHelper("hasBoxes", function(track) {
    if(track.box_values==undefined || track.box_values.length==0){
        return false;
    } else {
        return true;
    }
});

