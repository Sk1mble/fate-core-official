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

Hooks.once('ready', async function () {
    if (game.settings.get("ModularFate","run_once") == false){
        if (game.user.isGM){
            ModularFateConstants.awaitOKDialog("Welcome to the Modular Fate System!","Welcome! Head on over to the System options in Foundry's Settings menu to get everything set up. Use the options to pre-load default skills, aspects, and tracks from Core, Condensed or Accelerated and then customise them, or you can start completely from scratch - it's up to you!<p/>Any character created will be initialised using those settings, so it's best not to create any characters until you've finished setting up your game.<p/> Have fun!",500,250);
            game.settings.set("ModularFate","run_once", true);
        }
    }
})

Hooks.once('init', async function () {
    game.settings.register("ModularFate", "run_once", {
        name: "Run Once?",
        hint:"Pops up a brief tutorial message on first load of a world with this system",
        scope:"world",
        config:"false",
        type: Boolean
    })

    //On init, we initialise any settings and settings menus and HUD overrides as required.
    console.log(`Initializing Modular Fate`);
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet("ModularFate", ModularFateCharacter, { types: ["ModularFate"], makeDefault: true });

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

    /*

    //register a setting for the game's current refresh
    CONFIG.FATE = FATE;
    await preloadHandlebarsTemplates();
    // Register Actor sheets

    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('Fate', CoreCharacterSheet, {
        types: ['Core'],
        makeDefault: true,
    });
    Actors.registerSheet('Fate', FAECharacterSheet, {
        types: ['Accelerated'],
    });
    Actors.registerSheet('Fate', CondensedCharacterSheet, {
        types: ['Condensed'],
    });
    // Register Item sheets
    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('fate', ItemSheetFATE, {
        types: ['Stunt', 'Skill'],
        makeDefault: true,
    });
    Items.registerSheet('fate', ExtraSheet, { types: ['Extra'] });
    */
});

/* -------------------------------- */
/*	Everything else					*/
/*	(TODO: Move somewhere safer)	*/
/* -------------------------------- */
// Adds a simple Handlebars "for loop" block helper
/*Handlebars.registerHelper('for', function (times, block) {
    var accum = '';
    for (let i = 0; i < times; i++) {
        block.data.index = i;
        block.data.num = i + 1;
        accum += block.fn(i);
    }
    return accum;
});*/
