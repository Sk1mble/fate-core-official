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
*/
/* -------------------------------- */
/*	System initialization			*/
/* -------------------------------- */

var style = `style="background: white; color: black; font-family:Arial;"`
var inboxStyle= `style="background: white; color: black; font-family:Arial; width: 100px; height:50px;"`

Hooks.once('init', async function () {
    //On init, we initialise any settings and settings menus and HUD overrides as required.
    console.log(`Initializing Modular Fate`);

    /*
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
