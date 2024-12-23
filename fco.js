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

// The following hooks append the Fate Core Official settings to an Adventure document's flags so that they can be loaded/set on import of the adventure module.

Hooks.on("preCreateAdventure", (adventure, ...args) =>{
    let flags = foundry.utils.duplicate(adventure.flags);
    let fco_settings = JSON.parse(fcoConstants.exportSettings());
    if (!flags["fate-core-official"]) flags["fate-core-official"] = {};
    flags["fate-core-official"].settings = fco_settings;
    adventure.updateSource({"flags":flags});
})

Hooks.on("preUpdateAdventure", (adventure, changes, options, userId) =>{
    let flags = foundry.utils.duplicate(adventure.flags);
    let fco_settings = JSON.parse(fcoConstants.exportSettings());
    if (!flags["fate-core-official"]) flags["fate-core-official"] = {};
    flags["fate-core-official"].settings = fco_settings;
    changes.flags = flags;
})

Hooks.on("importAdventure", async (adventure, formData, created, updated) =>{
    let replace = false;
    let flags = foundry.utils.duplicate(adventure.flags);
    let settings = flags["fate-core-official"]?.settings;
    if (settings && !formData?.sheet?.overrideSettings){
        const confirm = await foundry.applications.api.DialogV2.confirm({
            window:{title:  game.i18n.localize("fate-core-official.overrideSettingsTitle")},
            content: `<p>${game.i18n.localize("fate-core-official.overrideSettings")} <strong>${adventure.name}</strong></p>`,
            modal: true,
            rejectClose: false
          });
      if ( confirm ) replace = true;
    } else {
        if (settings && adventure.sheet.overrideSettings) replace = true;  
    }
    if (replace){
        if (settings) fcoConstants.importSettings(settings); 
    }
})

Hooks.on("preCreateActor", (actor, data, options, userId) => {
    if (actor.type == "Thing"){
        if (!options.thing){
            ui.notifications.error(game.i18n.localize("fate-core-official.CantCreateThing"));
            return false
        }
    }
});

Hooks.on("preDeleteItem", (item, data, options, userId) => {
    // Prevent deletion of the world data item.
    if (item.uuid == game.settings.get("fate-core-official", "wid")){
        ui.notifications.error(game.i18n.localize("fate-core-official.CantDeleteWorldDataObject"));
        return false;
    }
});

Hooks.on("renderSettingsConfig", (app, html) => {
    const input = html[0].querySelector("[name='fate-core-official.fco-font-family']");
    input.remove(0);

    FontConfig.getAvailableFonts().forEach(font => {
        const option = document.createElement("option");
        option.value = font;
        option.text = font;
        input.add(option);
    });
    
    let options = input.getElementsByTagName('option');
    let current = game.settings.get("fate-core-official","fco-font-family");
    for (let option of options) if (option.value == current) option.selected = 'selected'
});

async function setupSheet(){

    let scheme = await game.user.getFlag("fate-core-official","current-sheet-scheme");
    if (!scheme) scheme = game.settings.get("fate-core-official","fco-world-sheet-scheme");

    // Setup the character sheet according to the user's settings
    let val = scheme.fco_aspects_panel_height;
    document.documentElement.style.setProperty('--fco-aspects-pane-mheight', `${val}%`);
    document.documentElement.style.setProperty('--fco-stunts-pane-mheight', `${100-val}%`);

	val = scheme.fco_skills_panel_height;
    document.documentElement.style.setProperty('--fco-skills-pane-mheight', `${val}%`);
    document.documentElement.style.setProperty('--fco-tracks-pane-mheight', `${100-val}%`);

    if (scheme.use_notched) {
        document.documentElement.style.setProperty('--fco-header-notch', "polygon(0% 10px, 10px 0%, 100% 0%, 100% 0px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0px 100%, 0 calc(100% - 20px))");
        document.documentElement.style.setProperty('--fco-border-radius', "0px");
    } else {
        document.documentElement.style.setProperty('--fco-header-notch', "polygon(0% 0px, 0px 0%, 100% 0%, 100% 0px, 100% 100%, 100% 100%, 0px 100%, 0 100%)");
        document.documentElement.style.setProperty('--fco-border-radius', "15px");
    }

    val = scheme.sheet_header_colour;
    document.documentElement.style.setProperty('--fco-header-colour', `${val}`);

    val = scheme.sheet_accent_colour;
    document.documentElement.style.setProperty('--fco-accent-colour', `${val}`);

    val = scheme.sheet_label_colour;
    document.documentElement.style.setProperty('--fco-label-colour', `${val}`);

    val = scheme.backgroundColour;
    document.documentElement.style.setProperty('--fco-sheet-background-colour', `${val}`);

    val = scheme.inputColour;
    document.documentElement.style.setProperty('--fco-sheet-input-colour', `${val}`);

    val = scheme.textColour;
    document.documentElement.style.setProperty('--fco-sheet-text-colour', `${val}`);

    val = scheme.interactableColour;
    document.documentElement.style.setProperty('--fco-foundry-interactable-color', `${val}`);

    // Re-render to make sure the logo is updated correctly.
    foundry.applications.instances.forEach(app => {
        if (app.constructor.name == "fcoCharacter") app.render(false);
    })
}

function setupFont(){
    // Setup the system font according to the user's settings
    let val = game.settings.get("fate-core-official","fco-font-family");
    if (FontConfig.getAvailableFonts().indexOf(val) == -1){
        // What we have here is a numerical value (or font not found in config list; nothing we can do about that).
        val = FontConfig.getAvailableFonts()[game.settings.get("fate-core-official","fco-font-family")]
    }
    let override = game.settings.get("fate-core-official", "override-foundry-font");
    if (override) {
        document.documentElement.style.setProperty('--fco-foundry-font-family', "")
        document.documentElement.style.setProperty('--fco-font-family', `${val}`);
    } else {
        document.documentElement.style.setProperty('--fco-font-family', `${val}`);
        document.documentElement.style.setProperty('--fco-foundry-font-family', `${val}`);
    }
}

function rationaliseKeys(){
    // We need to use a different method for getting countdown safe names as querySelector can't be used on an id starting with - and then a number
    let countdowns = game.settings.get("fate-core-official","countdowns");
    let amendedCountdowns = {};
    for (let countdown in countdowns){
        let name = countdowns[countdown].name
        if (countdown != fcoConstants.tob64(name)){
            amendedCountdowns[fcoConstants.tob64(name)] = countdowns[countdown]; 
        } else {
            amendedCountdowns[countdown] = countdowns[countdown];
        }
    }
    if (JSON.stringify (amendedCountdowns) != JSON.stringify (countdowns)) {
        game.settings.set("fate-core-official","countdowns", amendedCountdowns)
    }
    
    let types = ["stunts","aspects","tracks","skills", "defaults"];
    for (let type of types){
        let data = game.settings.get("fate-core-official", type);
        let export_data = {};

        for (let sub_item in data){
            let key = "";
            if (type == "defaults") {
                key = fcoConstants.tob64(data[sub_item].default_name);
            } else {
                key = fcoConstants.tob64(data[sub_item].name);
            }
            export_data[key] = data[sub_item];
        }
        
        let oldKeys = JSON.stringify(Object.keys(data));
        let newKeys = JSON.stringify(Object.keys(export_data));
        if (newKeys != oldKeys) {
            game.settings.set("fate-core-official", type, export_data);
        }
    }
}

async function prepareWorldItem(){
    let wid = game.settings.get("fate-core-official","wid");
    if (!wid){
        // Create the world data extra
        let name = `${game.world.title}_worldData_extra`;
        let tracks = game.settings.get("fate-core-official","tracks");
        let aspects = game.settings.get("fate-core-official","aspects");
        let stunts = game.settings.get("fate-core-official","stunts");
        let skills = game.settings.get("fate-core-official","skills");
        let defaults = game.settings.get("fate-core-official","defaults");
        let widItem = await Item.create({"name":name, "type":"Extra", "system.tracks":tracks, "system.stunts":stunts, "system.skills":skills, "system.aspects":aspects, "system.defaults":defaults});
        
        // Set the world setting to have the correct uuid
        await game.settings.set("fate-core-official","wid",widItem.uuid);

        if (JSON.stringify(fcoConstants.wd().system.tracks) == JSON.stringify(game.settings.get("fate-core-official", "tracks"))) game.settings.set("fate-core-official","tracks",{});
        if (JSON.stringify(fcoConstants.wd().system.stunts) == JSON.stringify(game.settings.get("fate-core-official", "stunts"))) game.settings.set("fate-core-official","stunts",{});
        if (JSON.stringify(fcoConstants.wd().system.aspects) == JSON.stringify(game.settings.get("fate-core-official", "aspects"))) game.settings.set("fate-core-official","aspects",{});
        if (JSON.stringify(fcoConstants.wd().system.skills) == JSON.stringify(game.settings.get("fate-core-official", "skills"))) game.settings.set("fate-core-official","skills",{});
        if (JSON.stringify(fcoConstants.wd().system.defaults) == JSON.stringify(game.settings.get("fate-core-official", "defaults"))) game.settings.set("fate-core-official","defaults",{});
        
        foundry.utils.debouncedReload();
    }
}
    
Hooks.once('ready', async () => {

    Hooks.on("preMoveToken", (tokenDocument, data, options) => {
        options.autoRotate = !game.settings.get("fate-core-official","disableAutoTokenRotation");
    });

    game.system["fco-shifted"]=false;

    // Set up a reference to the Fate Core Official translations file or fallback file.
    if (game.i18n?.translations["fate-core-official"]) {
        game.system["lang"] = game.i18n.translations["fate-core-official"];
    } else {
        game.system["lang"] = game.i18n._fallback["fate-core-official"];
    }
    setupSheet();
    setupFont();
    if (game.user == game.users.activeGM){
        await rationaliseKeys();
        await prepareWorldItem();
        game.actors.contents.forEach(async actor => await actor.rationaliseKeys());
        game.items.contents.forEach(async extra => await extra.rationaliseKeys());
    } 

    let skill_choices = {};
    let skills = fcoConstants.wd()?.system?.skills;
    skill_choices["None"]="None";
    skill_choices["Disable"]="Disable";
    for (let skill in skills){skill_choices[skill]=skills[skill].name};

    game.settings.register("fate-core-official","init_skill", {
        name:game.i18n.localize("fate-core-official.initiativeSkill"),
        hint:game.i18n.localize("fate-core-official.initiativeSetting"),
        "scope":"world",
        "config":true,
        "restricted":true,
        type:String,
        default:"None",
        choices:skill_choices,
        requiresReload:true
    })
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
    if (game.user == game.users.activeGM) await Actor.updateDocuments(updates)

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
        if (game.user == game.users.activeGM) await Setting.updateDocuments(systemSettings);
    }
    catch (error){
        //Do nothing, just don't stop what you're doing!
    }

    // Now flags, let us write a convenience function

    async function changeFlags(doc){
        let flags1 = doc.flags["ModularFate"];
        let flags2 = doc.flags["FateCoreOfficial"];
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
        if (game.user == game.users.activeGM) await changeFlags(doc);
    }

    // Actors
    for (let doc of game.actors){
        if (game.user == game.users.activeGM) await changeFlags(doc);
    }

    // Scenes & Token actors
    for (let doc of game.scenes){
        if (game.user == game.users.activeGM) await changeFlags(doc);
        for (let tok of doc.tokens){
            if (game.user == game.users.activeGM) await changeFlags(tok);
        }
    }

    // Combats & combatants
    for (let doc of game.combats) {
        if (game.user == game.users.activeGM) await changeFlags (doc);
        for (let com of doc.combatants){
            if (game.user == game.users.activeGM) await changeFlags (com);
        }
    }


    // The code for initialising a new world with the content of a module pack goes here.
    // The fallback position is to display a similar message to the existing one.            
    if (game.settings.get("fate-core-official","run_once") == false && game.user.isGM){
        const ehmodules = [];
        game.modules.forEach(m => {
            if (m?.flags?.ehproduct == "Fate Core Adventure"){
                ehmodules.push(m);
            }
        })

        class fate_splash extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2){
            constructor(...args){
                super(...args);
            }

            static DEFAULT_OPTIONS = {
                position:{
                    //height: window.innerHeight - 50, 
                    //width: window.innerWidth/2+15
                },
                window: {title: this.title},
                tag: "div",
                classes:['fate']
            }

            static PARTS = {
                FateSplash: {
                    template: "systems/fate-core-official/templates/fate-splash.html"
                }
            }

            get title(){ return "New World Setup"};

            _onRender(context, options){
                const cont = this.element.querySelector('button[id="fco_continue_button"]');
                cont?.addEventListener('click', async event => {
                    await game.settings.set("fate-core-official","run_once",true);
                    let wd = fcoConstants.wd();
                    await wd.update({"system.defaults":game.system["lang"]["baseDefaults"]});
                    await ui.sidebar.render();
                    this.close();
                })

                const install = this.element.querySelectorAll('button[name="eh_install"]');
                    install?.forEach(module => {module?.addEventListener('click', async event => {
                        let module = event.target.id.split("_")[1];
                        game.settings.set("fate-core-official", "installing", module);
                        // Now to activate the module, which should kick off a refresh, allowing the installation to begin.
                        // As of v10 it does not trigger a refresh, so we need to do it manually; let's use the debounceReload() function.
                        let mc = game.settings.get("core","moduleConfiguration");
                        if (mc[module] == true) {
                            this.installModule(module);
                            this.close();
                        }
                        else {
                            mc[module]=true;
                            await game.settings.set("core", "moduleConfiguration", mc);
                            foundry.utils.debouncedReload();
                        }
                    })
                })
            }

           async _prepareContext(options){
                let data = {};
                data.ehmodules = foundry.utils.duplicate(ehmodules);
                for (let ehm of data.ehmodules){
                    ehm.richDesc = await fcoConstants.fcoEnrich(ehm.description);
                }
                data.num_modules = ehmodules.length;
                data.h = window.innerHeight /2;
                data.w = window.innerWidth /2;
                data.mh = data.h/1.1;
                return data;
            }

            async installModule(module_name){
                /*
                    The core system now has code to export settings on creating an adventure as flags on the adventure, and to re-import them
                    from flags on import of the module.
                */
    
                // Grab the adventure pack and import it.
                // The compendium must be called 'content'
                // All 'adventures' in this compendium will be imported. This would allow us to segregate content on occasion, for example
                // allowing scenes and characters to be imported separately from the journal entries forming the text of the book.
                // When imported using the fate_splash installer, the settings from each adventure will be imported automatically, each overwriting the last.
                
                let pack = await game.packs.get(`${module_name}.content`);
                await pack.getDocuments();
                
                //Todo: Consider whether we want to restrict to installing just the first adventure in the pack, allowing others to be for characters, etc.
                for (let p of pack.contents){
                    p.sheet.overrideSettings = true;
                    await p.import();
                }

                // Set installing and run_once to the appropriate post-install values
                await game.settings.set("fate-core-official", "run_once", true);
                await game.settings.set("fate-core-official", "installing", "none");

                //Set this game's image to the world's default
                await fetch(foundry.utils.getRoute("setup"), { 
                   method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: "editWorld",
                      background: `modules/${module_name}/art/world.webp`, title:game.world.title, id:game.world.id, nextSession:null
                    })
                });

                game.folders.forEach (folder => game.folders._expanded[folder.uuid] = true);
                ui.sidebar.render();
            }
        }

        if (game.user.isGM){
            if (game.settings.get("fate-core-official","installing") === "none") {
                let f = new fate_splash().render(true);
            } else {
                new fate_splash().installModule(game.settings.get("fate-core-official","installing"));
            }
        }
    }
})


// Needed to update with token name changes in FU.
Hooks.on('updateToken', (token, data, userId) => {
    let check = false;
    if (data.hidden != undefined || data.delta != undefined || data.flags != undefined || data.name!=undefined) check = true;
    if (check){
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

Hooks.on("renderPlayerList",(...args) =>{
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

Hooks.on("renderCombatTracker", () => {
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

//v13This is now for v13 only!
Hooks.on('getSceneControlButtons', controls => {
    if ( !game.user.isGM ) return;
    controls.tokens.tools.stuntDB = {
      name: "stuntDB",
      title: game.i18n.localize("fate-core-official.ViewTheStuntDatabase"),
      icon: "fas fa-book",
      onChange: (event, active) => {
        if ( active ) {
            let sd = new StuntDB("none"); 
            sd.render(true);
        }
      },
      button: true
    };
  });

// This next hook is required to prevent Things from showing up in the player configuration menu. 
// In v13, the change to app v2 means I may need to change the functions below as the seocnd argument is changing to HTMLElement rather than jQuery.
// I will need to replace html.find with html.querySelector
// See https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
Hooks.on("renderUserConfig", (user, html, data) => {
    let actors = html.querySelectorAll("option");
    for (let actor of actors){
        let id = actor.value;
        if (game.actors.get(id)?.type == "Thing"){
            actor.remove();
        }
    }
})

Hooks.once('init', async function () {
    CONFIG.Actor.documentClass = fcoActor;
    CONFIG.Item.documentClass = fcoExtra;

    CONFIG.fontDefinitions["Fate"] = {
        "editor": true,
        "fonts": [{urls: [`systems/fate-core-official/fonts/Fate Core Font.ttf`]}]
      }

      CONFIG.fontDefinitions["Fate Core"] = {
        "editor": true,
        "fonts": [{urls: [`systems/fate-core-official/fonts/Fate Core Font.ttf`]}]
      }

      CONFIG.fontDefinitions["Jost"] = {
        editor: true,
        fonts: [
          {urls: ["systems/fate-core-official/fonts/Jost-variable.ttf"]},
          {urls: ["systems/fate-core-official/fonts/Jost-italic.ttf"], style: "italic"}
        ]
      }

      CONFIG.fontDefinitions["Montserrat"] = {
          editor: true,
          fonts: [
              {urls:["systems/fate-core-official/fonts/Montserrat-Regular.otf"]},
              {urls:["systems/fate-core-official/fonts/Montserrat-Italic.otf"], style:"italic"},
              {urls:["systems/fate-core-official/fonts/Montserrat-Light.otf"], weight:300},
              {urls:["systems/fate-core-official/fonts/Montserrat-LightItalic.otf"], style:"italic", weight:300},
              {urls:["systems/fate-core-official/fonts/Montserrat-Bold.otf"], weight:"bold"},
              {urls:["systems/fate-core-official/fonts/Montserrat-BoldItalic.otf"], style:"italic", weight:"bold"},
              {urls:["systems/fate-core-official/fonts/Montserrat-Black.otf"], weight:900},
              {urls:["systems/fate-core-official/fonts/Montserrat-BlackItalic.otf"], style:"italic", weight:900},
          ]
      }

    //const includeRgx = new RegExp("/systems/fate-core-official/");
    //CONFIG.compatibility.includePatterns.push(includeRgx);

    //Let's initialise the settings at the system level.
    // ALL settings that might be relied upon later are now included here in order to prevent them from being unavailable later in the init hook.

    let bindings = [
        {
          key: "ShiftLeft"
        },
        {
          key: "ShiftRight"
        }
    ];
    
    game.keybindings.register("fate-core-official", "fcoInteractionModifier", {
        name: "Fate Core Official modifier key for dragging and clicking",
        editable: bindings,
        onDown: (...args) => { game.system["fco-shifted"] = true;},
        onUp: (...args) => { if (args[0].event.isTrusted == true) {game.system["fco-shifted"] = false;}}
    })

    game.settings.register("fate-core-official", "disableAutoTokenRotation" , {
        name: game.i18n.localize("fate-core-official.disableAutoTokenRotation"),
        scope: "world",
        type: Boolean,
        default: true,
        config: true,
        restricted: false,
    });

    
    game.settings.register("fate-core-official","wid", {
        name:"world data extra uuid",
        scope:"world",
        config:false,
        type: String,
        default: undefined
    });

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
        restricted: true    // Restrict this submenu to gamemaster only?
      });

    game.settings.register("fate-core-official", "defaultSkills", {
        name: game.i18n.localize("fate-core-official.ReplaceSkills"),
        hint: game.i18n.localize("fate-core-official.ReplaceSkillsHint"),
        scope: "world",     // This specifies a client-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        restricted:true,
        requiresReload: true,
        choices: {           // If choices are defined, the resulting setting will be a select menu
            "nothing":game.i18n.localize("fate-core-official.No"),
            "fateCore":game.i18n.localize("fate-core-official.YesFateCore"),
            "fateCondensed":game.i18n.localize("fate-core-official.YesFateCondensed"),
            "accelerated":game.i18n.localize("fate-core-official.YesFateAccelerated"),
            "dfa":game.i18n.localize("fate-core-official.YesDFA"),
            "clearAll":game.i18n.localize("fate-core-official.YesClearAll")
        },
        default: "nothing",        // The default value for the setting
        onChange: async value => { // A callback function which triggers when the setting is changed
                if (value == "fateCore"){
                    if (game.user.isGM){
                        await fcoConstants.wd().update({"system.skills":null}, {noHook:true, renderSheet:false}); 
                        await fcoConstants.wd().update({"system.skills":game.system["lang"]["FateCoreDefaultSkills"]});
                        game.settings.set("fate-core-official","defaultSkills","nothing");
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.defaultSkillsLabel"));
                    }
                }
                if (value=="clearAll"){
                    if (game.user.isGM) {
                        await fcoConstants.wd().update({"system.skills":null}, {noHook:true, renderSheet:false}); 
                        await fcoConstants.wd().update({"system.skills":{}}); 
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.defaultSkillsLabel"));
                    }
                }
                if (value=="fateCondensed"){
                    if (game.user.isGM){ 
                        await fcoConstants.wd().update({"system.skills":null}, {noHook:true, renderSheet:false}); 
                        await fcoConstants.wd().update({"system.skills":game.system["lang"]["FateCondensedDefaultSkills"]});
                        game.settings.set("fate-core-official","defaultSkills","nothing");
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.defaultSkillsLabel"));
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        await fcoConstants.wd().update({"system.skills":null}, {noHook:true, renderSheet:false}); 
                        await fcoConstants.wd().update({"system.skills":game.system["lang"]["FateAcceleratedDefaultSkills"]});
                        game.settings.set("fate-core-official","defaultSkills","nothing");
                        game.settings.set("fate-core-official","skillsLabel",game.i18n.localize("fate-core-official.FateAcceleratedSkillsLabel"));
                    }
                }
                if (value=="dfa"){
                    if (game.user.isGM){
                        await fcoConstants.wd().update({"system.skills":null}, {noHook:true, renderSheet:false}); 
                        await fcoConstants.wd().update({"system.skills":game.system["lang"]["DresdenFilesAcceleratedDefaultSkills"]});
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
            requiresReload: true,
            choices: {           // If choices are defined, the resulting setting will be a select menu
                "nothing":game.i18n.localize("No"),
                "fateCore":game.i18n.localize("fate-core-official.YesFateCore"),
                "fateCondensed":game.i18n.localize("fate-core-official.YesFateCondensed"),
                "accelerated":game.i18n.localize("fate-core-official.YesFateAccelerated"),
                "dfa":game.i18n.localize("fate-core-official.YesDFA"),
                "clearAll":game.i18n.localize("fate-core-official.YesClearAll")
            },
            default: "nothing",        // The default value for the setting
            onChange: async value => { // A callback function which triggers when the setting is changed
                    if (value == "fateCore"){
                        if (game.user.isGM){
                            await fcoConstants.wd().update({"system.aspects":null}, {noHook:true, renderSheet:false}); 
                            await fcoConstants.wd().update({"system.aspects":game.system["lang"]["FateCoreDefaultAspects"]});
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                    if (value == "fateCondensed"){
                        if (game.user.isGM){
                            await fcoConstants.wd().update({"system.aspects":null}, {noHook:true, renderSheet:false}); 
                            await fcoConstants.wd().update({"system.aspects":game.system["lang"]["FateCondensedDefaultAspects"]});
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                    if (value=="clearAll"){
                        if (game.user.isGM){
                            await fcoConstants.wd().update({"system.aspects":null}, {noHook:true, renderSheet:false}); 
                            await fcoConstants.wd().update({"system.aspects":{}});
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                    if (value=="accelerated"){
                        if (game.user.isGM){
                            await fcoConstants.wd().update({"system.aspects":null}, {noHook:true, renderSheet:false}); 
                            await fcoConstants.wd().update({"system.aspects":game.system["lang"]["FateAcceleratedDefaultAspects"]});
                            game.settings.set("fate-core-official","defaultAspects","nothing");
                        }
                    }
                    if (value=="dfa"){
                        if (game.user.isGM){
                            await fcoConstants.wd().update({"system.aspects":null}, {noHook:true, renderSheet:false}); 
                            await fcoConstants.wd().update({"system.aspects":game.system["lang"]["DresdenFilesAcceleratedDefaultAspects"]});
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
        requiresReload: true,
        choices: {           // If choices are defined, the resulting setting will be a select menu
            "nothing":game.i18n.localize("fate-core-official.No"),
            "fateCore":game.i18n.localize("fate-core-official.YesFateCore"),
            "fateCondensed":game.i18n.localize("fate-core-official.YesFateCondensed"),
            "accelerated":game.i18n.localize("fate-core-official.YesFateAccelerated"),
            "dfa":game.i18n.localize("fate-core-official.YesDFA"),
            "clearAll":game.i18n.localize("fate-core-official.YesClearAll")
        },
        default: "nothing",        // The default value for the setting
        onChange: async value => { // A callback function which triggers when the setting is changed
                if (value == "fateCore"){
                    if (game.user.isGM){
                        await fcoConstants.wd().update({"system.tracks":null}, {noHook:true, renderSheet:false}); 
                        await fcoConstants.wd().update({"system.tracks":game.system["lang"]["FateCoreDefaultTracks"]});
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                        game.settings.set("fate-core-official","track_categories",{"Combat":"Combat","Other":"Other"});
                    }
                }
                if (value=="clearAll"){
                    if (game.user.isGM){
                        await fcoConstants.wd().update({"system.tracks":null}, {noHook:true, renderSheet:false}); 
                        await fcoConstants.wd().update({"system.tracks":{}});
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                        game.settings.set("fate-core-official","track_categories",{"Combat":"Combat","Other":"Other"});
                    }
                }
                if (value=="fateCondensed"){
                    if (game.user.isGM){
                        await fcoConstants.wd().update({"system.tracks":null}, {noHook:true, renderSheet:false}); 
                        await fcoConstants.wd().update({"system.tracks":game.system["lang"]["FateCondensedDefaultTracks"]});
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                        game.settings.set("fate-core-official","track_categories",{"Combat":"Combat","Other":"Other"});
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        await fcoConstants.wd().update({"system.tracks":null}, {noHook:true, renderSheet:false}); 
                        await fcoConstants.wd().update({"system.tracks":game.system["lang"]["FateAcceleratedDefaultTracks"]});
                        game.settings.set("fate-core-official","defaultTracks","nothing");
                        game.settings.set("fate-core-official","track_categories",{"Combat":"Combat","Other":"Other"});
                    }
                }
                if (value == "dfa"){
                    if (game.user.isGM){
                        await fcoConstants.wd().update({"system.tracks":null}, {noHook:true, renderSheet:false}); 
                        await fcoConstants.wd().update({"system.tracks":game.system["lang"]["DresdenFilesAcceleratedDefaultTracks"]});
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
                fcoConstants.getCopiableDialog(game.i18n.localize("fate-core-official.ExportSettingsDialogTitle"), text);
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
                await fcoConstants.importSettings(text);
                await game.settings.set("fate-core-official","importSettings",false);
                foundry.utils.debouncedReload();
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
        foundry.applications.instances.forEach(app => {
            if (app.object.type == "Thing" || app.object.type == "fate-core-official") app.render(false);
        })
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
        foundry.applications.instances.forEach(app => {
            if (app.object.type == "Thing" || app.object.type == "fate-core-official") app.render(false);
        })
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
            foundry.applications.instances.forEach(app => {
                if (app.object.type == "Thing" || app.object.type == "fate-core-official") app.render(false);
            })
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
            foundry.applications.instances.forEach(app => {
                if (app.object.type == "Thing" || app.object.type == "fate-core-official") app.render(false);
            })
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
            foundry.applications.instances.forEach(app => {
                if (app.object.type == "Thing" || app.object.type == "fate-core-official") app.render(false);
            })
        }
    })

    game.settings.register("fate-core-official","showPronouns", {
        name: game.i18n.localize("fate-core-official.showPronouns"),
        hint: game.i18n.localize("fate-core-official.showPronounsHint"),
        scope:"client",
        config:true,
        type: Boolean,
        restricted:false,
        default:true,
    })

    game.settings.register("fate-core-official","modifiedRollDefault", {
        name:game.i18n.localize("fate-core-official.modifiedRollDefault"),
        hint:game.i18n.localize("fate-core-official.modifiedRollDefaultExplainer"),
        scope:"world",
        config:"true",
        type:Boolean,
        default:false
    })

    game.settings.register("fate-core-official","allowManualRolls", {
        name:game.i18n.localize("fate-core-official.allowManualOfflineRolls"),
        hint:game.i18n.localize("fate-core-official.allowManualOfflineRollsHint"),
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
        default: "NONE"
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

    game.settings.register("fate-core-official", "fco-world-sheet-scheme", {
        name: "World Default Sheet Scheme",
        label: "The sheet customisation scheme defined for this world",
        hint: "This setting defines the sheet customisation settings for the world, overriding the system defaults.",
        type: Object,
        default: {
            "sheet_header_colour": "#185cab",
            "sheet_accent_colour": "#6793c5",
            "backgroundColour": "#ffffff",
            "inputColour": "#ffffff",
            "textColour": "#000000",
            "interactableColour": "#b0c4de",
            "sheet_label_colour": "#ffffff",
            "use_notched": false,
            "fco_aspects_panel_height": 40,
            "fco_skills_panel_height": 55,
            "fco_user_sheet_logo": "/systems/fate-core-official/assets/pbf.svg"
        },
        config: false,
        scope:"world",
        onChange: () =>{
            // Do the things we need to do - proably just setupSheet and re-render for the logo
            setupSheet();
        }
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
        scope:"client",
        config:true,
        type:Boolean,
        restricted:false,
        default:false
    });

    game.settings.register("fate-core-official","fco-aspects-pane-mheight", {
        name:game.i18n.localize("fate-core-official.fcoAspectPaneHeight"),
        hint:game.i18n.localize("fate-core-official.fcoAspectPaneHeightHint"),
        config:false,
        type:Number,
        default:40,
        scope:"client",
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
        scope:"client",
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
       default:"Montserrat",
       restricted:false,
       scope:"client",
       config:true,
       choices:{0:"delete"},
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
        scope:"client",
        config:true,
        onChange:() => {
            setupFont();
        }
     });

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
        scope:"client",
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

    game.system.documentTypes.Item = ["Extra"];
    game.system.documentTypes.Actor = ["fate-core-official","Thing","FateCoreOfficial", "ModularFate"];
    
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

    game.settings.register("fate-core-official", "sortSkills", {
        name: game.i18n.localize("fate-core-official.Sort_skills_on_sheets_by_rank"),
        scope:"client",
        config:true,
        type:Boolean,
        restricted:false,
        default:false
    })

    game.settings.register("fate-core-official", "sortStunts", {
        name: game.i18n.localize("fate-core-official.Sort_stunts_on_sheets"),
        scope:"client",
        config:true,
        type:Boolean,
        restricted:false,
        default:false
    })

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
        scope:"client",
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
        default:12,
        onChange:async () => {
            await foundry.applications.instances.get("FateUtilities")?.render(false);
        }
    });

    game.settings.register("fate-core-official", "fu-ignore-list", {
        name: game.i18n.localize("fate-core-official.fu-ignore-list-name"),
        hint: game.i18n.localize("fate-core-official.fu-ignore-list-hint"),
        scope: "world",
        config: true,
        type: String,
        default:"",
        onChange:async () => {
            await foundry.applications.instances.get("FateUtilities")?.render(false);
        }
    });

    game.settings.register("fate-core-official", "fu-roll-formulae", {
        name: game.i18n.localize("fate-core-official.fu_roll_formulae_name"),
        hint: game.i18n.localize("fate-core-official.fu_roll_formulae_hint"),
        scope: "world",
        config: true,
        type: String,
        default:"4dF"
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
        choices:"delete",
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
        return `1d0+${this.actor.system.skills[init_skill].rank}`;
    }
}

Handlebars.registerHelper("fco_ladder", function(result){
    let fc = new fcoConstants();
    let lookup = fc.getFateLadder()[result];
    if (lookup){
        return `(${lookup})`;
    } else {
        return "";
    }
});

Handlebars.registerHelper("fco_get_enr_notes", function (token_id, type, key, enriched_tokens) {
    return enriched_tokens[token_id][type][key].richNotes;
})

Handlebars.registerHelper("fco_enr", async function (html) {
    return await fcoConstants.fcoEnrich(html);
})

Handlebars.registerHelper("fco_strip", function (value) {
    return value.replace(/(<([^>]+)>)/gi, "")
})

Handlebars.registerHelper("fco_isGM", function () {
    return game.user.isGM;
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

Handlebars.registerHelper("fco_concat", function(value1, value2){
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

Handlebars.registerHelper("fco_item_name_from_id", function (actor, id){
    let item = actor.items.get(id);
    return item?.name;
})

class CustomiseSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

    static DEFAULT_OPTIONS = {
        tag: "form",
        id: "CustomiseSheet",
        window: {
            icon: "fas fa-palette",
            title: this.title
        },
        form:{
            submitOnClose: false,
            closeOnSubmit: false,
            handler: CustomiseSheet.#updateObject
        }
    }

    static PARTS = {
        CustomiseSheetForm: {
            template: "systems/fate-core-official/templates/CustomiseSheet.html"
        }
    }

    get title() {
        return game.i18n.localize("fate-core-official.customiseSheet");
    }

    static async #updateObject(event, form, formDataExtended){
        let formData = formDataExtended.object;
        let button = event.submitter.name;
        let scheme = {
            "sheet_header_colour": formData.sheet_header_colour,
            "sheet_accent_colour": formData.sheet_accent_colour,
            "backgroundColour": formData.backgroundColour,
            "inputColour": formData.inputColour,
            "textColour": formData.textColour,
            "interactableColour": formData.interactableColour,
            "sheet_label_colour": formData.sheet_label_colour,
            "use_notched": formData.use_notched,
            "fco_aspects_panel_height": formData.fco_aspects_panel_height,
            "fco_skills_panel_height": formData.fco_skills_panel_height,
            "fco_user_sheet_logo": formData.fco_user_sheet_logo
        }

        if (button == "apply_sheet_settings"){
            await game.user.setFlag("fate-core-official","current-sheet-scheme", scheme);
            ui.notifications.info(game.i18n.localize("fate-core-official.colourSettingsApplied"));
            setupSheet();
        }

        if (button == "save_sheet_settings"){
            await game.user.setFlag("fate-core-official","current-sheet-scheme", scheme);
            setupSheet();
            this.close();
        }
        
        if (button == "fco_store_colourScheme"){
            let schemes = game.user.getFlag("fate-core-official", "colourSchemes");
            if (!schemes) schemes = [];
            let scheme = formData;
            let name = await fcoConstants.getInput(game.i18n.localize("fate-core-official.nameToUse"));
            if (!name) name = "Unnamed Colour Scheme";
            let p = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.makePublic"), game.i18n.localize("fate-core-official.saveAsPublic"));
            let publicB = false;
            if (p) publicB = true;
            let schemeData = {name:name, scheme:scheme, public:publicB};
            schemes.push(schemeData);
            await game.user.unsetFlag("fate-core-official", "colourSchemes");
            await game.user.setFlag("fate-core-official", "colourSchemes", schemes);
            let cs = await foundry.applications.instances.get("FcoColourSchemes");
            if (cs){
                cs.render(true);
                try {
                    cs.bringToFront();
                } catch {

                }
            } else {
                cs = new FcoColourSchemes();
                cs.customiseSheet = this;
                cs.render(true);
            }
        }

        if (button == "fco_make_default" && game.user.isGM){
            let scheme = formData;
            await game.settings.set("fate-core-official","fco-world-sheet-scheme", scheme);
            let cs = await foundry.applications.instances.get("FcoColourSchemes")?.render();
        }

        if (button == "undo"){
            this.custom = game.user.getFlag("fate-core-official","current-sheet-scheme");
            if (!this.custom) this.custom = game.settings.get("fate-core-official","fco-world-sheet-scheme");
            this.render(false);
        }

        if (button == "fco_view_colourSchemes"){
            let cs = await foundry.applications.instances.get("FcoColourSchemes");
            if (cs){
                cs.render(true);
                try {
                    cs.bringToFront();
                } catch {

                }
            } else {
                cs = new FcoColourSchemes();
                cs.customiseSheet = this;
                cs.render(true);
            }
        }

        if (button == "fco_load_custom"){
            let text = JSON.stringify(await this._prepareContext(),null,5);
            let value =  await new Promise(resolve => {
                new foundry.applications.api.DialogV2({
                    window:{title: game.i18n.localize("fate-core-official.LoadCustomSheet")},
                    content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="fatecoreofficial_custom_sheet_value">${text}</textarea></div>`,
                    buttons: [{
                            action: "Populate",
                            label: game.i18n.localize("fate-core-official.PopulateFromPasted"),
                            callback: () => {
                                resolve (document.getElementById("fatecoreofficial_custom_sheet_value").value);
                            },
                            default: true
                        }]
                }).render(true)
            });
            let data = JSON.parse(value);
            this.custom = data;
            this.render(false);
        }

        if (button == "del_fco_custom"){
            await game.user.unsetFlag("fate-core-official","current-sheet-scheme");
            ui.notifications.info(game.i18n.localize("fate-core-official.colourSettingsApplied"));
            setupSheet();
            this.custom = false;
            this.render();
        }
    }

    async _prepareContext(){
        if (this.custom){
            return this.custom;
        } else {
            let scheme = game.user.getFlag("fate-core-official","current-sheet-scheme");
            if (!scheme) scheme = game.settings.get("fate-core-official","fco-world-sheet-scheme");
            if (scheme.fco_user_sheet_logo == "world") scheme.fco_user_sheet_logo = game.settings.get("fate-core-official","fco-world-sheet-scheme").fco_user_sheet_logo;
            return scheme;
        }
    }

    async close(){
        let cs = await foundry.applications.instances.get("FcoColourSchemes")?.render();
        if (cs){
            cs.close();
        }
        super.close();
    }

    async _onRender(){
        let logo = this.element.querySelector(`file-picker[name="fco_user_sheet_logo"]`);
        logo?.addEventListener("change", () => {
            if (logo.value == "world"){                
                logo.value = game.settings.get("fate-core-official", "fco-world-sheet-scheme").fco_user_sheet_logo;
            } 
            this.element.querySelector('img[name="fco_user_sheet_logo_img"]').src = logo.value;
        })
    }
}

class FcoColourSchemes extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id:"FcoColourSchemes",
        tag: "form",
        window:{
            title:this.title,
            icon:"fas fa-palette"
        },
        position:{width:1280}
    }

    static PARTS = {
        FcoColourSchemesForm: {
            template: "systems/fate-core-official/templates/FcoColourSchemes.html"
        }
    }

    get title(){
        return game.i18n.localize("fate-core-official.viewStoredColourSchemes");
    }

    async _prepareContext(){
        let mySchemes = game.user.getFlag("fate-core-official", "colourSchemes");
        let otherSchemes = [];
        
        game.users.forEach (user =>{
            if (user.id != game.user.id){
                let schemes = user.getFlag("fate-core-official", "colourSchemes");
                if (schemes){
                    schemes.forEach(sc => {
                        sc.author = user;
                    })
                    otherSchemes = otherSchemes.concat(schemes.filter(sc => sc.public));
                }
            }
        })

        if (mySchemes) {
                mySchemes.forEach(scheme => {
                if (!scheme.scheme.hasOwnProperty("fco_user_sheet_logo") || scheme.scheme?.fco_user_sheet_logo == "world"){
                    scheme.scheme.fco_user_sheet_logo = game.settings.get("fate-core-official","fco-world-sheet-scheme").fco_user_sheet_logo;
                }
            })
        }

        if (otherSchemes){
                otherSchemes.forEach(scheme => {
                if (!scheme.scheme.hasOwnProperty("fco_user_sheet_logo") || scheme.scheme?.fco_user_sheet_logo == "world"){
                    scheme.scheme.fco_user_sheet_logo = game.settings.get("fate-core-official","fco-world-sheet-scheme").fco_user_sheet_logo;
                }
            })
        }

        this.mySchemes = mySchemes;
        this.otherSchemes = otherSchemes;

        return {
            mySchemes:mySchemes,
            otherSchemes:otherSchemes,
            worldScheme:game.settings.get("fate-core-official","fco-world-sheet-scheme"),
            isGM:game.user.isGM,
        } 
    }

    async _onRender(context, options){
        
        this.element.querySelectorAll('.colourSchemeUpload').forEach(button => button?.addEventListener('click', async event => {
            let index = event.currentTarget.getAttribute("data-index");
            let scheme = this.mySchemes[index].scheme;
            this.customiseSheet.custom = scheme; 
            this.customiseSheet.render(true);
            try {
                this.customiseSheet.bringToFront();
            } catch {
                
            }
        }))

        this.element.querySelector('.worldSchemeUpload')?.addEventListener('click', async event => {
            let scheme = game.settings.get("fate-core-official","fco-world-sheet-scheme");
            this.customiseSheet.custom = scheme;
            this.customiseSheet.render(true);
            try {
                this.customiseSheet.bringToFront();
            } catch {
                
            }
        })

        this.element.querySelector('.revertToSystemScheme')?.addEventListener('click', async event => {
            let del = await fcoConstants.confirmDeletion();
            if (del){
                await game.settings.set("fate-core-official","fco-world-sheet-scheme", 
                {
                    "sheet_header_colour": "#185cab",
                    "sheet_accent_colour": "#6793c5",
                    "backgroundColour": "#ffffff",
                    "inputColour": "#ffffff",
                    "textColour": "#000000",
                    "interactableColour": "#b0c4de",
                    "sheet_label_colour": "#ffffff",
                    "use_notched": false,
                    "fco_aspects_panel_height": 40,
                    "fco_skills_panel_height": 55,
                    "fco_user_sheet_logo": "/systems/fate-core-official/assets/pbf.svg"
                })
                this.render(false);
            }
        })

        this.element.querySelectorAll('.colourSchemeDelete').forEach(button => button?.addEventListener ('click', async event => {
            let del = await fcoConstants.confirmDeletion();
            if (del){
                let index = event.currentTarget.getAttribute("data-index");
                this.mySchemes.splice(index, 1);
                await game.user.unsetFlag("fate-core-official","colourSchemes");
                await game.user.setFlag("fate-core-official","colourSchemes",this.mySchemes);
                this.render(false);
            }
        }))

        this.element.querySelectorAll('.publicColourSchemeDelete').forEach(button => button?.addEventListener ('click', async event => {
            let del = await fcoConstants.confirmDeletion();
            if (del){
                let index = event.currentTarget.getAttribute("data-index");
                let user = this.otherSchemes[index].author;
                let scheme = this.otherSchemes[index];
                let userSchemes = user.getFlag("fate-core-official","colourSchemes");
                for (let i = 0; i < userSchemes.length; i++){
                    let toDelete = JSON.stringify(scheme);
                    let toTest = JSON.stringify(userSchemes[i]);
                    if (toDelete == toTest){
                        userSchemes.splice(i, 1);
                        await user.unsetFlag("fate-core-official","colourSchemes");
                        await user.setFlag("fate-core-official","colourSchemes", userSchemes);
                        this.render(false);
                        return;
                    }
                }
                this.render(false);
            }
        }))

        this.element.querySelectorAll('.scheme_name').forEach (field => field?.addEventListener('change', async event => {
            let index = event.currentTarget.getAttribute("data-index");
            this.mySchemes[index].name = event.currentTarget.value;
            await game.user.unsetFlag("fate-core-official","colourSchemes");
            await game.user.setFlag("fate-core-official","colourSchemes",this.mySchemes);
            this.render(false);
        }))

        this.element.querySelectorAll('.colourSchemePublicCheck').forEach(box => box?.addEventListener('change', async event => {
            let index = event.currentTarget.getAttribute("data-index");
            this.mySchemes[index].public = event.currentTarget.checked;
            await game.user.unsetFlag("fate-core-official","colourSchemes");
            await game.user.setFlag("fate-core-official","colourSchemes",this.mySchemes);
            this.render(false);
        }));

        this.element.querySelectorAll('.publicColourSchemeUpload').forEach(button => button?.addEventListener ('click', async event => {
            let index = event.currentTarget.getAttribute("data-index");
            let scheme = this.otherSchemes[index].scheme;
            this.customiseSheet.custom = scheme; 
            this.customiseSheet.render(true);
            try {
                this.customiseSheet.bringToFront();
            } catch {

            }
        }))
    }
}

document?.addEventListener("contextmenu", async event => {
    if (event.target.classList.contains("fco_popviewable")){
        // Construct the Application instance
        let uuid = event.target.getAttribute("data-uuid");
        let source = await fromUuid(uuid);
        let title = "Unknown";
        let src = "";
        // Case token
        if (source.constructor.name == "TokenDocument"){
            title = source.actor.name;
            src = source.actor.img;
        } 
        // Case not a token
        if (source.constructor.name.startsWith("fco")){
            title = source.name;
            src = source.img;
        }

        const ip = new foundry.applications.apps.ImagePopout({
                window: {
                    "title": title
                },
                "uuid":uuid,
                src: src
            },
        );

        // Display the image popout
        ip.render(true);
    }
})


