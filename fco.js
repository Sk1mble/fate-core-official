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

function setupSheet(){
    // Setup the character sheet according to the user's settings
    let val = game.settings.get("fate-core-official","fco-aspects-pane-mheight");
    document.documentElement.style.setProperty('--fco-aspects-pane-mheight', `${val}%`);
    document.documentElement.style.setProperty('--fco-stunts-pane-mheight', `${100-val}%`);

	val = game.settings.get("fate-core-official","fco-skills-pane-mheight");
    document.documentElement.style.setProperty('--fco-skills-pane-mheight', `${val}%`);
    document.documentElement.style.setProperty('--fco-tracks-pane-mheight', `${100-val}%`);

    if (game.settings.get("fate-core-official","fco-notched-headers")) {
        document.documentElement.style.setProperty('--fco-header-notch', "polygon(0% 10px, 10px 0%, 100% 0%, 100% 0px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0px 100%, 0 calc(100% - 20px))");
        document.documentElement.style.setProperty('--fco-border-radius', "0px");
    } else {
        document.documentElement.style.setProperty('--fco-header-notch', "polygon(0% 0px, 0px 0%, 100% 0%, 100% 0px, 100% 100%, 100% 100%, 0px 100%, 0 100%)");
        document.documentElement.style.setProperty('--fco-border-radius', "15px");
    }

    val = game.settings.get("fate-core-official","sheetHeaderColour");
    document.documentElement.style.setProperty('--fco-header-colour', `${val}`);

    val = game.settings.get("fate-core-official","sheetAccentColour");
    document.documentElement.style.setProperty('--fco-accent-colour', `${val}`);

    val = game.settings.get("fate-core-official","sheetLabelColour");
    document.documentElement.style.setProperty('--fco-label-colour', `${val}`);

    val = game.settings.get("fate-core-official","sheetBackgroundColour");
    document.documentElement.style.setProperty('--fco-sheet-background-colour', `${val}`);

    val = game.settings.get("fate-core-official","sheetInputColour");
    document.documentElement.style.setProperty('--fco-sheet-input-colour', `${val}`);

    val = game.settings.get("fate-core-official","sheetTextColour");
    document.documentElement.style.setProperty('--fco-sheet-text-colour', `${val}`);

    val = game.settings.get("fate-core-official","sheetInteractableColour");
    document.documentElement.style.setProperty('--fco-foundry-interactable-color', `${val}`);
}

function setupFont(){
    // Setup the system font according to the user's settings
    let val = CONFIG.fontFamilies[game.settings.get("fate-core-official","fco-font-family")];
    let override = game.settings.get("fate-core-official", "override-foundry-font");
    if (override) {
        document.documentElement.style.setProperty('--fco-foundry-font-family', "")
        document.documentElement.style.setProperty('--fco-font-family', `${val}`);
    } else {
        document.documentElement.style.setProperty('--fco-font-family', `${val}`);
        document.documentElement.style.setProperty('--fco-foundry-font-family', `${val}`);
    }
}
    
Hooks.once('ready', () => {

    // Set up a reference to the Fate Core Official translations file or fallback file.
    if (game.i18n?.translations["fate-core-official"]) {
        game.system["lang"] = game.i18n.translations["fate-core-official"];
    } else {
        game.system["lang"] = game.i18n._fallback["fate-core-official"];
    }

    if (game.settings.get ("fate-core-official", "drawingsOnTop")){
        try {
            game.canvas.drawings.setParent(game.canvas.interface);
        } catch {
            // This just means that the layers aren't instantiated yet.
        }
    }
    setupSheet();
    setupFont();
});

Hooks.on('diceSoNiceReady', function() {
    game.dice3d.addSFXTrigger("fate4df", "Fate Roll", ["-4","-3","-2","-1","0","1","2","3","4"]);
})

Hooks.once('ready', async function () {
    //Convert any straggling ModularFate actors to fate-core-official actors.
    let updates = [];
    game.actors.contents.forEach(actor => {
        if (actor.type == "ModularFate" || actor.type == "FateCoreOfficial") updates.push({_id:actor.id, type:"fate-core-official"})
    });
    if (game.user.isGM) await Actor.updateDocuments(updates)

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
        if (game.user.isGM) await Setting.updateDocuments(systemSettings);
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

    // Users
    for (let doc of game.users){
        if (game.user.isGM) await changeFlags(doc);
    }

    // Actors
    for (let doc of game.actors){
        if (game.user.isGM) await changeFlags(doc);
    }

    // Scenes & Token actors
    for (let doc of game.scenes){
        if (game.user.isGM) await changeFlags(doc);
        for (let tok of doc.tokens){
            if (game.user.isGM) await changeFlags(tok);
        }
    }

    // Combats & combatants
    for (let doc of game.combats) {
        if (game.user.isGM) await changeFlags (doc);
        for (let com of doc.combatants){
            if (game.user.isGM) await changeFlags (com);
        }
    }


    // The code for initialising a new world with the content of a module pack goes here.
    // The fallback position is to display a similar message to the existing one.            
    if (game.settings.get("fate-core-official","run_once") == false && game.user.isGM){
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
                    await game.settings.set("fate-core-official","defaults",game.system["lang"]["baseDefaults"])
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
                //First we sort by entity - this is primarily because I want JournalEntries to be
                //loaded before Scenes so that on first load the map pins aren't 'unknown'.

                if (isNewerVersion(game.version, "9.224")){
                    await fcoConstants.sort_key(packs, "type");
                } else {
                    await fcoConstants.sort_key(packs, "entity");
                }

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
                await fetch(foundry.utils.getRoute("setup"), {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: "editWorld",
                      background: `modules/${module_name}/art/world.webp`, title:game.world.data.title, name:game.world.data.name, nextSession:null
                    })
                });

                game.folders.forEach (folder => game.folders._expanded[folder.id] = true);
                ui.sidebar.render(true);
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

Hooks.on('getSceneControlButtons', function(hudButtons)
{
    let hud = hudButtons.find(val => {return val.name == "token";})
            if (hud && game.user.isGM){
                hud.tools.push({
                    name:"StuntDB",
                    title:game.i18n.localize("fate-core-official.ViewTheStuntDatabase"),
                    icon:"fas fa-book",
                    onClick: ()=> {let sd = new StuntDB("none"); sd.render(true)},
                    button:true
                });
            }
})

Hooks.once('init', async function () {
    CONFIG.Actor.documentClass = fcoActor;
    CONFIG.Item.documentClass = fcoExtra;
    CONFIG.fontFamilies.push("Montserrat");
    CONFIG.fontFamilies.push("Jost");
    CONFIG.fontFamilies.push("Fate");

    //Let's initialise the settings at the system level.
    // ALL settings that might be relied upon later are now included here in order to prevent them from being unavailable later in the init hook.

    if (isNewerVersion(game.version, "9.230")){
        let bindings = [
            {
                key: "SHIFT"
            }
        ];

        if (isNewerVersion(game.version, "9.235")){
            bindings = [
                {
                  key: "ShiftLeft"
                },
                {
                  key: "ShiftRight"
                }
            ];
        }
        
        game.keybindings.register("fate-core-official", "fcoInteractionModifier", {
            name: "Fate Core Official modifier key for dragging and clicking",
            editable: bindings,
            onDown: () => { game.system["fco-shifted"] = true; },
            onUp: () => { game.system["fco-shifted"] = false; }
          })
    }
    
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
                        game.settings.set("fate-core-official","skills",game.system["lang"]["FateCoreDefaultSkills"]);
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
                        game.settings.set("fate-core-official","skills",game.system["lang"]["FateCondensedDefaultSkills"]);
                        game.settings.set("fate-core-official","defaultSkills","nothing");
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.defaultSkillsLabel"));
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","skills",game.system["lang"]["FateAcceleratedDefaultSkills"]);
                        game.settings.set("fate-core-official","defaultSkills","nothing");
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.FateAcceleratedSkillsLabel"));
                    }
                }
                if (value=="dfa"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","skills",game.system["lang"]["DresdenFilesAcceleratedDefaultSkills"]);
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
                            game.settings.set("fate-core-official","aspects",game.system["lang"]["FateCoreDefaultAspects"]);
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                    if (value == "fateCondensed"){
                        if (game.user.isGM){
                            game.settings.set("fate-core-official","aspects",game.system["lang"]["FateCondensedDefaultAspects"]);
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
                            game.settings.set("fate-core-official","aspects",game.system["lang"]["FateAcceleratedDefaultAspects"]);
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                    if (value=="dfa"){
                        if (game.user.isGM){
                            game.settings.set("fate-core-official","aspects",game.system["lang"]["DresdenFilesAcceleratedDefaultAspects"]);
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
                        game.settings.set("fate-core-official","tracks",game.system["lang"]["FateCoreDefaultTracks"]);
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                        game.settings.set("fate-core-official","track_categories",{"Combat":"Combat","Other":"Other"});
                    }
                }
                if (value=="clearAll"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","tracks",{});
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                        game.settings.set("fate-core-official","track_categories",{"Combat":"Combat","Other":"Other"});
                    }
                }
                if (value=="fateCondensed"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","tracks",game.system["lang"]["FateCondensedDefaultTracks"]);
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                        game.settings.set("fate-core-official","track_categories",{"Combat":"Combat","Other":"Other"});
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","tracks",game.system["lang"]["FateAcceleratedDefaultTracks"]);
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                        game.settings.set("fate-core-official","track_categories",{"Combat":"Combat","Other":"Other"});
                    }
                }
                if (value == "dfa"){
                    if (game.user.isGM){
                        game.settings.set("fate-core-official","tracks",game.system["lang"]["DresdenFilesAcceleratedDefaultTracks"]);
                        game.settings.set("fate-core-official","track_categories",game.system["lang"]["DresdenFilesAcceleratedDefaultTrackCategories"]);
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
                    content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="export_settings">${text}</textarea></div>`,
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

// Register a setting to determine whether the refresh total on PCs should be enforced
game.settings.register("fate-core-official", "enforceRefresh", {
    name: game.i18n.localize("fate-core-official.enforceRefreshMenuName"),
    hint: game.i18n.localize("fate-core-official.enforceRefreshMenuHint"),
    scope: "world",
    config: true,
    type: Boolean,
    default:true,
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

    game.settings.register("fate-core-official", "default_actor_permission", {
        name: game.i18n.localize("fate-core-official.default_actor_permission"),
        hint: game.i18n.localize("fate-core-official.default_actor_permission_hint"),
        scope: "world",
        config: true,
        type: String,
        choices:  {
          NONE:"None",
          LIMITED:"Limited",
          OBSERVER:"Observer",
          OWNER:"Owner"
        },
        default: "none"
      });

    game.settings.register("fate-core-official","sheet_template", {
        name:game.i18n.localize("fate-core-official.DefaultSheetTemplateName"),
        hint:game.i18n.localize("fate-core-official.DefaultSheetTemplateHint"),
        scope:"world",
        config:"true",
        type:String,
        default:'systems/fate-core-official/templates/fate-core-officialSheet.html',
        filePicker:true
    })
    

    game.settings.register("fate-core-official","limited_sheet_template", {
        name:game.i18n.localize("fate-core-official.DefaultLimitedSheetTemplateName"),
        hint:game.i18n.localize("fate-core-official.DefaultLimitedSheetTemplateHint"),
        scope:"world",
        config:"true",
        type:String,
        default:'systems/fate-core-official/templates/fate-core-officialSheet.html',
        filePicker:true
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
        default:false,
        onChange: () => {
            let val = game.settings.get("fate-core-official","drawingsOnTop");
            if (val) {
                game.canvas.drawings.setParent(game.canvas.interface);
                game.socket.emit("system.fate-core-official",{"drawingsOnTop":true})
            }
            else {
                game.canvas.drawings.setParent(game.canvas.primary);
                game.socket.emit("system.fate-core-official",{"drawingsOnTop":false})
            }
        }
    })

    game.settings.register("fate-core-official","fco-aspects-pane-mheight", {
        name:game.i18n.localize("fate-core-official.fcoAspectPaneHeight"),
        hint:game.i18n.localize("fate-core-official.fcoAspectPaneHeightHint"),
        config:false,
        type:Number,
        default:40,
        scope:"user",
        range: {             // If range is specified, the resulting setting will be a range slider
            min: 10,
            max: 90,
            step: 5
          },
        onChange: () =>{
            setupSheet();
        }
    })

    game.settings.register("fate-core-official","fco-skills-pane-mheight", {
        name:game.i18n.localize("fate-core-official.fcoSkillsPaneHeight"),
        hint:game.i18n.localize("fate-core-official.fcoSkillsPaneHeightHint"),
        config:false,
        type:Number,
        default:55,
        scope:"user",
        range: {             // If range is specified, the resulting setting will be a range slider
            min: 10,
            max: 90,
            step: 5
          },
        onChange: () =>{
            setupSheet();
        }
    })

    // Register the menu to setup the user's character sheet preferences.
    game.settings.registerMenu("fate-core-official", "CustomiseSheet", {
        name: game.i18n.localize("fate-core-official.customiseSheet"),
        label: game.i18n.localize("fate-core-official.Setup"),      // The text label used in the button
        hint: game.i18n.localize("fate-core-official.customiseSheetHint"),
        type: CustomiseSheet,   // A FormApplication subclass which should be created
        restricted: false    // Restrict this submenu to gamemaster only?
      });

    // System font (also overrides default Foundry font for consistency unless next setting is false)

    game.settings.register("fate-core-official", "fco-font-family", {
       name: game.i18n.localize("fate-core-official.fontFamilyName"),
       label:game.i18n.localize("fate-core-official.fontFamilyLabel"),
       hint:game.i18n.localize("fate-core-official.fontFamilyHint"),
       type:String,
       default:CONFIG.fontFamilies.indexOf("Montserrat"),
       restricted:false,
       scope:"user",
       config:true,
       choices:CONFIG.fontFamilies,
       onChange:() => {
           setupFont();
       }
    });

    game.settings.register("fate-core-official", "override-foundry-font", {
        name: game.i18n.localize("fate-core-official.overrideFontName"),
        label:game.i18n.localize("fate-core-official.overrideFontLabel"),
        hint:game.i18n.localize("fate-core-official.overrideFontHint"),
        type:Boolean,
        default:false,
        restricted:false,
        scope:"user",
        config:true,
        onChange:() => {
            setupFont();
        }
     });

    game.settings.register("fate-core-official", "fco-notched-headers", {
        name: game.i18n.localize("fate-core-official.notched-headers"),
        label: game.i18n.localize("fate-core-official.notched-headers"),
        hint: game.i18n.localize("fate-core-official.notched-headers-hint"),
        type: Boolean,
        default: false,
        config: false,
        scope:"user",
        onChange: () =>{
           setupSheet();
        }
    })

    //Sheet header colour
    game.settings.register("fate-core-official","sheetHeaderColour", {
        name: game.i18n.localize("fate-core-official.sheetHeaderColour"),
        hint:game.i18n.localize("fate-core-official.sheetHeaderColourHint"),
        scope:"user",
        config:false,
        restricted:false,
        type:String,
        default:"#185CAB",
        onChange: () => {
            setupSheet();
        }
    })

    //Sheet accent colour
    game.settings.register("fate-core-official","sheetAccentColour", {
        name: game.i18n.localize("fate-core-official.sheetAccentColour"),
        hint:game.i18n.localize("fate-core-official.sheetAccentColourHint"),
        scope:"user",
        config:false,
        restricted:false,
        type:String,
        default:"#6793c5",
        onChange: () => {
            setupSheet();
        }
    })

    //Sheet label colour
    game.settings.register("fate-core-official","sheetLabelColour", {
        name: game.i18n.localize("fate-core-official.sheetLabelColour"),
        hint:game.i18n.localize("fate-core-official.sheetLabelColourHint"),
        scope:"user",
        config:false,
        restricted:false,
        type:String,
        default:"#FFFFFF",
        onChange: () => {
            setupSheet();
        }
    })     

    //Sheet input field colour
    game.settings.register("fate-core-official","sheetInputColour", {
        name: game.i18n.localize("fate-core-official.sheetInputColour"),
        hint:game.i18n.localize("fate-core-official.sheetInputColourHint"),
        scope:"user",
        config:false,
        restricted:false,
        type:String,
        default:"#FFFFFF",
        onChange: () => {
            setupSheet();
        }
    })  
    
        //Sheet background colour
        game.settings.register("fate-core-official","sheetBackgroundColour", {
            name: game.i18n.localize("fate-core-official.sheetBackgroundColour"),
            hint:game.i18n.localize("fate-core-official.sheetBackgroundColourHint"),
            scope:"user",
            config:false,
            restricted:false,
            type:String,
            default:"#FFFFFF",
            onChange: () => {
                setupSheet();
            }
        })  

        //Sheet text colour
        game.settings.register("fate-core-official","sheetTextColour", {
            name: game.i18n.localize("fate-core-official.sheetTextColour"),
            hint:game.i18n.localize("fate-core-official.sheetTextColourHint"),
            scope:"user",
            config:false,
            restricted:false,
            type:String,
            default:"#000000",
            onChange: () => {
                setupSheet();
            }
        })  
        
        //Sheet interactable colour
        game.settings.register("fate-core-official","sheetInteractableColour", {
            name: game.i18n.localize("fate-core-official.sheetInteractableColour"),
            hint:game.i18n.localize("fate-core-official.sheetInteractableColourHint"),
            scope:"user",
            config:false,
            restricted:false,
            type:String,
            default:"#b0c4de",
            onChange: () => {
                setupSheet();
            }
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

    if (isNewerVersion(game.version, '9.220')){
        game.system.documentTypes.Item = ["Extra"];
        game.system.documentTypes.Actor = ["fate-core-official","Thing","FateCoreOfficial", "ModularFate"];
    } else {
        game.system.entityTypes.Item = ["Extra"];
        game.system.entityTypes.Actor = ["fate-core-official","Thing","FateCoreOfficial", "ModularFate"];
    }
    

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
    Items.registerSheet('fate', ExtraSheet, { types: ['Extra'], makeDefault: true });
    Items.unregisterSheet('core', ItemSheet);

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

    game.settings.register("fate-core-official", "fu-ignore-list", {
        name: game.i18n.localize("fate-core-official.fu-ignore-list-name"),
        hint: game.i18n.localize("fate-core-official.fu-ignore-list-hint"),
        scope: "world",
        config: true,
        type: String,
        default:"",
        onChange:() => {
            for (let app in ui.windows){
                if (ui.windows[app]?.options?.id == "FateUtilities"){
                    ui.windows[app]?.render(false);
                }
            }
        }
    });

    game.settings.register("fate-core-official", "fuAspectLabelBorderAlpha", {
        name: game.i18n.localize("fate-core-official.aspectBorderAlpha"),
        hint: game.i18n.localize("fate-core-official.AspectBorderAlphaLabel"),
        scope: "world",
        config: false,
        type: Number,
        range: {
            min: 0,
            max: 1,
            step: 0.1,
        },
        default:1
    });

    game.settings.register("fate-core-official", "fuAspectLabelFillAlpha", {
        name: game.i18n.localize("fate-core-official.aspectFillAlpha"),
        hint: game.i18n.localize("fate-core-official.AspectFillAlphaLabel"),
        scope: "world",
        config: false,
        type: Number,
        range: {
            min: 0,
            max: 1,
            step: 0.1,
        },
        default:1
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
    let secrets = false;
    if (object) secrets = object.isOwner;
    if (game.user.isGM) secrets = true;
    //enrichHTML(content, secrets, entities, links, rolls, rollData) → {string}
    if (isNewerVersion(game.version, '9.224')){
        return DOMPurify.sanitize(TextEditor.enrichHTML(value, {secrets:secrets, documents:true}));
    } else {
        return DOMPurify.sanitize(TextEditor.enrichHTML(value, {secrets:secrets, entities:true}));
    }
    
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
    return value1?.concat(value2);
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

class CustomiseSheet extends FormApplication {
    static get defaultOptions (){
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/CustomiseSheet.html";
        options.closeOnSubmit = true;
        options.submitOnClose = false;
        options.title = game.i18n.localize("fate-core-official.customiseSheet");
        return options;
    }

    async _updateObject(event, formData){
        await game.settings.set("fate-core-official", "fco-aspects-pane-mheight", formData.fco_aspects_panel_height);
        await game.settings.set("fate-core-official", "fco-skills-pane-mheight", formData.fco_skills_panel_height);
        await game.settings.set("fate-core-official", "sheetLabelColour", formData.sheet_label_colour);
        await game.settings.set("fate-core-official", "sheetAccentColour", formData.sheet_accent_colour);
        await game.settings.set("fate-core-official", "sheetHeaderColour", formData.sheet_header_colour);
        await game.settings.set("fate-core-official", "sheetInputColour", formData.inputColour);
        await game.settings.set("fate-core-official", "sheetBackgroundColour", formData.backgroundColour);
        await game.settings.set("fate-core-official", "fco-notched-headers", formData.use_notched);
        await game.settings.set("fate-core-official", "sheetTextColour",formData.textColour)
        await game.settings.set("fate-core-official", "sheetInteractableColour",formData.interactableColour)
        this.close();
    }

    async getData(){
        if (this.custom){
            return this.custom;
        }

        if (this.reset){
            return {
                sheetHeaderColour:'#185cab',
                sheetAccentColour:'#6793c5',
                sheetLabelColour:'#ffffff',
                notch:false,
                aspectsHeight:40,
                skillsHeight:55,
                inputColour:'#ffffff',
                backgroundColour:'#ffffff',
                textColour:'#000000',
                interactableColour:'#b0c4de'
            }
        } else {
            return {
                sheetHeaderColour:game.settings.get("fate-core-official","sheetHeaderColour"),
                sheetAccentColour:game.settings.get("fate-core-official","sheetAccentColour"),
                sheetLabelColour:game.settings.get("fate-core-official","sheetLabelColour"),
                notch:game.settings.get("fate-core-official","fco-notched-headers"),
                aspectsHeight:game.settings.get("fate-core-official","fco-aspects-pane-mheight"),
                skillsHeight:game.settings.get("fate-core-official","fco-skills-pane-mheight"),
                inputColour:game.settings.get("fate-core-official","sheetInputColour"),
                backgroundColour:game.settings.get("fate-core-official","sheetBackgroundColour"),
                textColour:game.settings.get("fate-core-official","sheetTextColour"),
                interactableColour:game.settings.get("fate-core-official","sheetInteractableColour"),
            }
        }
    }

    async activateListeners(html){
        super.activateListeners(html);
        $('#save_sheet_settings').on('click', async event => {
            this.submit();
        })

        $('#load_defaults').on('click', async event => {
            this.reset = true;
            this.custom = undefined;
            this.render(false);
        })

        $('#fco_view_colourSchemes').on('click', async event => {
            let cs = Object.values(ui.windows).find(window=>window.options.id=="FcoColourSchemes");
            if (cs){
                cs.render(true);
                try {
                    cs.bringToTop();
                } catch {

                }
            } else {
                cs = new FcoColourSchemes();
                cs.customiseSheet = this;
                cs.render(true);
            }
        })

        $('#fco_store_colourScheme').on('click', async event => {
            let schemes = game.user.getFlag("fate-core-official", "colourSchemes");
            if (!schemes) schemes = [];
            let scheme = this._getSubmitData();
            let name = await fcoConstants.getInput(game.i18n.localize("fate-core-official.nameToUse"));
            if (!name) name = "Unnamed Colour Scheme";
            let p = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.makePublic"), game.i18n.localize("fate-core-official.saveAsPublic"));
            let publicB = false;
            if (p == "yes") publicB = true;
            let schemeData = {name:name, scheme:scheme, public:publicB};
            schemes.push(schemeData);
            await game.user.unsetFlag("fate-core-official", "colourSchemes");
            await game.user.setFlag("fate-core-official", "colourSchemes", schemes);
            let cs = Object.values(ui.windows).find(window=>window.options.id=="FcoColourSchemes");
            if (cs){
                cs.render(true);
                try {
                    cs.bringToTop();
                } catch {

                }
            } else {
                cs = new FcoColourSchemes();
                cs.customiseSheet = this;
                cs.render(true);
            }
        })

        $('#load_custom').on('click', async event => {
            let text = JSON.stringify(await this.getData(),null,5);
            let value =  await new Promise(resolve => {
                new Dialog({
                    title: game.i18n.localize("fate-core-official.LoadCustomSheet"),
                    content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="custom_sheet_value">${text}</textarea></div>`,
                    buttons: {
                        ok: {
                            label: game.i18n.localize("fate-core-official.PopulateFromPasted"),
                            callback: () => {
                                resolve (document.getElementById("custom_sheet_value").value);
                            }
                        }
                    },
                }).render(true)
            });
            let data = JSON.parse(value);
            this.custom = data;
            this.reset = false;
            this.render(false);
        })
    }
}

class FcoColourSchemes extends FormApplication {
    static get defaultOptions (){
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/FcoColourSchemes.html";
        options.closeOnSubmit = true;
        options.submitOnClose = false;
        options.width = 1024;
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.viewStoredColourSchemes");
        options.id = "FcoColourSchemes";
        return options;
    }

    async getData(){
        let mySchemes = game.user.getFlag("fate-core-official", "colourSchemes");
        let otherSchemes = [];
        
        game.users.forEach (user =>{
            if (user.id != game.user.id){
                let schemes = user.getFlag("fate-core-official", "colourSchemes");
                if (schemes){
                    otherSchemes = otherSchemes.concat(schemes.filter(sc => sc.public));
                }
            }
        })

        this.mySchemes = mySchemes;
        this.otherSchemes = otherSchemes;

        return {
            mySchemes:mySchemes,
            otherSchemes:otherSchemes
        } 
    }

    async activateListeners(html){
        super.activateListeners(html);

        $('.colourSchemeUpload').on('click', async event => {
            let index = event.currentTarget.getAttribute("data-index");
            let scheme = this.mySchemes[index].scheme;
            console.log(scheme);
            this.customiseSheet.custom = {
                sheetHeaderColour:scheme.sheet_header_colour,
                sheetAccentColour:scheme.sheet_accent_colour,
                sheetLabelColour:scheme.sheet_label_colour,
                aspectsHeight:scheme.fco_aspects_panel_height,
                skillsHeight:scheme.fco_skills_panel_height,
                inputColour:scheme.inputColour,
                backgroundColour:scheme.backgroundColour,
                textColour:scheme.textColour,
                interactableColour:scheme.interactableColour,
                notch:scheme.use_notched,
            }
            this.customiseSheet.reset = false;
            this.customiseSheet.render(true);
            try {
                this.customiseSheet.bringToTop();
            } catch {
                
            }
        })

        $('.colourSchemeDelete').on('click', async event => {
            let del = await fcoConstants.confirmDeletion();
            if (del){
                let index = event.currentTarget.getAttribute("data-index");
                this.mySchemes.splice(index, 1);
                await game.user.unsetFlag("fate-core-official","colourSchemes");
                await game.user.setFlag("fate-core-official","colourSchemes",this.mySchemes);
                this.render(false);
            }
        })

        $('.scheme_name').on('change', async event => {
            let index = event.currentTarget.getAttribute("data-index");
            this.mySchemes[index].name = event.currentTarget.value;
            await game.user.unsetFlag("fate-core-official","colourSchemes");
            await game.user.setFlag("fate-core-official","colourSchemes",this.mySchemes);
            this.render(false);
        })

        $('.colourSchemePublicCheck').on('change', async event => {
            let index = event.currentTarget.getAttribute("data-index");
            this.mySchemes[index].public = event.currentTarget.checked;
            await game.user.unsetFlag("fate-core-official","colourSchemes");
            await game.user.setFlag("fate-core-official","colourSchemes",this.mySchemes);
            this.render(false);
        })

        $('.publicColourSchemeUpload').on('click', async event => {
            let index = event.currentTarget.getAttribute("data-index");
            let scheme = this.otherSchemes[index].scheme;
            this.customiseSheet.custom = {
                sheetHeaderColour:scheme.sheet_header_colour,
                sheetAccentColour:scheme.sheet_accent_colour,
                sheetLabelColour:scheme.sheet_label_colour,
                aspectsHeight:scheme.fco_aspects_panel_height,
                skillsHeight:scheme.fco_skills_panel_height,
                inputColour:scheme.inputColour,
                backgroundColour:scheme.backgroundColour,
                textColour:scheme.textColour,
                interactableColour:scheme.interactableColour,
                notch:scheme.use_notched
            }
            this.customiseSheet.reset = false;
            this.customiseSheet.render(true);
            try {
                this.customiseSheet.bringToTop();
            } catch {

            }
        })
    }
}

