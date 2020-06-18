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
    console.log(`Initializing Modular Fate`);

    //We will be using this setting to store the world's list of skills.
    game.settings.register("modularFate", "skills", {
        name: "Skill list",
        hint: "This is the list of skills for this particular world.",
        scope: "world",
        config: false,
        type: Object
    });

    //Register the default Fate Core skill list as a setting option
    game.settings.register("modularFate","coreSkillList", {
        name:"Fate Core Default Skill List",
        scope:"world",
        config:false,
        type:Object
    });

    game.settings.register("modularFate","acceleratedSkillList",{
        name:"Fate Accelerated Default Approach List",
        scope:"world",
        config:false,
        type:Object
    })

    game.settings.set("modularFate","coreSkillList", ModularFateConstants.getFateCoreDefaultSkills());
    game.settings.set("modularFate","acceleratedSkillList", ModularFateConstants.getFateAcceleratedDefaultSkills());

    // Register a setting for replacing the existing skill list with one of the pre-defined default sets.
    game.settings.register("modularFate", "defaultSkills", {
    name: "Replace Or Clear All World Skills?",
    hint: "Pick a skill set with which to override the world's current skills. CANNOT BE UNDONE.",
    scope: "world",     // This specifies a client-stored setting
    config: true,        // This specifies that the setting appears in the configuration view
    type: String,
    choices: {           // If choices are defined, the resulting setting will be a select menu
      "nothing":"No",
      "fateCore":"Yes - Fate Core Defaults",
      "accelerated":"Yes - Fate Accelerated Defaults",
      "clearAll":"Yes - Clear All Skills"
    },
    default: "nothing",        // The default value for the setting
    onChange: value => { // A callback function which triggers when the setting is changed
      if (value == "fateCore"){
          game.settings.set("modularFate","skills",game.settings.get("modularFate","coreSkillList"));
      }
      if (value=="clearAll"){
          game.settings.set("modularFate","skills",[]);
      }
      if (value=="accelerated"){
          game.settings.set("modularFate","skills",game.settings.get("modularFate","acceleratedSkillList"));
      }
      game.settings.set("modularFate","defaultSkills","nothing");
    }
  });

    // This is the class called from the options to view and edit the skills.
    class SkillSetup extends FormApplication{
        constructor(...args){
                super(...args);
        }

        static get defaultOptions() {
            const options = super.defaultOptions;
            options.template = "systems/modularFate/templates/SkillSetup.html"; 
    
            //Define the FormApplication's options
            options.width = "auto";
            options.height = "auto";
            options.title = `Setup Skills for world ${game.world.title}`;
            options.closeOnSubmit = true;
            options.id = "SkillSetup"; // CSS id if you want to override default behaviors
            options.resizable = false;
            return options;
        }
        getData(){
            this.skills=game.settings.get("modularFate","skills");
            const templateData = {
               skills:this.skills
            }
            return templateData;
          }
        
          //Here are the action listeners
          activateListeners(html) {
            super.activateListeners(html);
            const editButton = html.find("button[id='editSkill']");
            const deleteButton = html.find("button[id='deleteSkill']");
            const addButton = html.find("button[id='addSkill']");

            editButton.on("click", event => this._onEditButton(event, html));
            deleteButton.on("click", event => this._onDeleteButton(event, html));
            addButton.on("click", event => this._onAddButton(event, html));

            Hooks.on('closeEditSkill',async () => {
                console.log("responding to hook");
                this.render(true);
            })
        }
        
        //Here are the event listener functions.
        async _onEditButton(event,html){
            //Launch the EditSkill FormApplication.
            let skills = game.settings.get("modularFate","skills");
            let slb = html.find("select[id='skillListBox'")[0].value;
            for (let i = 0; i< skills.length; i++){
                if (skills[i].name==slb){
                    let e = new EditSkill(skills[i]);
                    e.render(true);       
                }
            }
        }
        async _onDeleteButton(event,html){
            //Code to delete the selected skill
            //First, get the name of the skill from the HTML element skillListBox
            let slb = html.find("select[id='skillListBox'")[0].value;
            
            //Find that skill in the list of skills
            let skills=game.settings.get("modularFate","skills");
            var index=undefined;
            for (let i = 0;i<skills.length; i++){
                if (skills[i].name === slb){
                    index = i;
                }
            }
            //Use splice to cut that skill out of the list of skills
            if (index != undefined){
                skills.splice(index,1);
                //Set the game settings for skills as appropriate.
                await game.settings.set("modularFate","skills",skills);
                this.render(true); 
            }
        }
        async _onAddButton(event,html){
            //Launch the EditSkill FormApplication.
            let e = new EditSkill(undefined);
            e.render(true);
        }
    }

    //This is the class to edit a specific skill
    class EditSkill extends FormApplication{
        constructor(skill){
                super(skill);
                this.skill=skill;
                if (this.skill==undefined){
                    this.skill={
                        "name":"",
                        "description":"",
                        "overcome":"",
                        "caa":"",
                        "attack":"",
                        "defend":"",
                        "pc":"true"
                    }
                }
        }

         //Here are the action listeners
         activateListeners(html) {
            super.activateListeners(html);
            const saveButton = html.find("button[id='edit_save_changes']");
            saveButton.on("click", event => this._onSaveButton(event, html));
        }
        
        //Here are the event listener functions.
        async _onSaveButton(event,html){
            //Get the name of the skill and the other attributes
            let name = html.find("input[id='edit_skill_name']")[0].value;
            let description = html.find("textarea[id='edit_skill_description']")[0].value;
            let overcome = html.find("textarea[id='edit_skill_overcome']")[0].value;
            let caa = html.find("textarea[id='edit_skill_caa']")[0].value;
            let attack = html.find("textarea[id='edit_skill_attack']")[0].value;
            let defend = html.find("textarea[id='edit_skill_defend']")[0].value;
            let pc = html.find("input[id='edit_pc']")[0].checked;
            let skills=game.settings.get("modularFate","skills");
            let newSkill = {"name":name, "description":description,"overcome":overcome,"caa":caa, "attack":attack,"defend":defend,"pc":pc};

            var existing = false;
            //First check if we already have a skill by that name, or the skill is blank; if so, throw an error.
            if (name == undefined || name ==""){
                ui.notifications.error("You cannot have a skill with a blank name.")
            } else {

                for (let i =0; i< skills.length; i++){
                    if (skills[i].name == name){
                        skills[i]=newSkill;
                        existing = true;
                    }
                } 
            }
            if (!existing){            
                skills.push(newSkill);
            }
            await game.settings.set("modularFate","skills",skills);
            this.close();
        }

        static get defaultOptions() {
            const options = super.defaultOptions;
            options.template = "systems/modularFate/templates/EditSkill.html"; 
    
            //Define the FormApplication's options
            options.width = "1000";
            options.height = "auto";
            options.title = `Skill Editor`;
            options.closeOnSubmit = true;
            options.id = "EditSkill"; // CSS id if you want to override default behaviors
            options.resizable = true;
            return options;
        }
        getData(){
            const templateData = {
               skill:this.skill
            }
            return templateData;
          }
    }
    
    game.settings.registerMenu("modularFate", "SkillSetup", {
        name: "Skill Setup",
        label: "Setup",      // The text label used in the button
        hint: "Configure this world's skill (or Approach) list.",
        type: SkillSetup,   // A FormApplication subclass which should be created
        restricted: true                   // Restrict this submenu to gamemaster only?
      });

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
