class ModifiedRollDialog extends Application {
    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/ModifiedRollDialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.ModifiedRoll");
        options.resizable = false;
        options.classes = options.classes.concat(['fate']);
        return options 
    } // End getDefaultOptions

    constructor(actor, skill, track){
        super();
        this.actor = actor;
        this.skill_name = skill;
        this.track = track;
    }

    activateListeners(html){
        super.activateListeners(html);
        const roll=html.find("button[class='modifiedRoll']");
        roll.on("click",event => this.on_roll_click(event, html));
    }

    async on_roll_click(event, html){
        let total_modifier = 0;     
        let modifier = html.find("input[id='modifier']")[0].value;

        total_modifier+=parseInt(modifier);

        let description = html.find("input[id='description']")[0].value;
        let second_skill = html.find("select[id='second_skill']")[0].value;
        let stunts = html.find("input[class='stunt_box']"); //This is an array
        let second_skill_rank = 0;
        let second_skill_text = ""
        let skill_rank = 0;
        if (this.track){
            let track = this.actor.system.tracks[this.skill_name];
            if (track.rollable == "full"){
                // Get the number of full boxes
                for (let i = 0; i < track.box_values.length; i++){
                    if (track.box_values[i]) skill_rank++;
                }
            }
            if (track.rollable == "empty"){
                // Get the number of empty boxes
                for (let i = 0; i < track.box_values.length; i++){
                    if (!track.box_values[i]) skill_rank++;
                }
            }
            if (track.rollable != "empty" && track.rollable != "full") return;
        } else {
            skill_rank = this.actor.system.skills[this.skill_name].rank;
        }

        let manual_roll = html.find("select[id='manualRoll']")[0]?.value;

        total_modifier += parseInt(skill_rank);
        let modifier_text = "";
        if (modifier > 0){
            modifier_text= `${game.i18n.localize("fate-core-official.Modifier")}: +${modifier} (${description})<br>`
        }
        if (modifier < 0){
            modifier_text= `${game.i18n.localize("fate-core-official.Modifier")}: -${modifier} (${description})<br>`
        }

        if (second_skill != game.i18n.localize("fate-core-official.None")){
            second_skill_rank = this.actor.system.skills[second_skill].rank;
            let ladder = fcoConstants.getFateLadder();
            let rs2 = ladder[`${second_skill_rank.toString()}`];
            second_skill_text = game.i18n.format("fate-core-official.secondSkillAtRank", {skill:second_skill, rank:second_skill_rank, ladder:rs2});
            total_modifier += parseInt(second_skill_rank);
        }

        let stunt_text = ""

        for (let i = 0; i < stunts.length; i++){
            if (stunts[i].checked){
                let s_name = stunts[i].id.split("_")[1]
                let s_modifier = this.actor.system.stunts[s_name].bonus;
                if (i > 0 ) stunt_text+="<br/>"
                stunt_text += game.i18n.localize("fate-core-official.Stunt")+": "+ s_name + " (+" + s_modifier + ")"
                total_modifier += parseInt(s_modifier);
            }
        }

        let r;
        let roll; 
        let manualFlavour = "";
        let formula = "";

        if (game.settings.get("fate-core-official","allowManualRolls") && manual_roll.length != 0){
            let results = '';
            let num = parseInt(manual_roll)
            manualFlavour = `<br/>${game.i18n.localize("fate-core-official.manualRoll")}: ${num}`;
            if (num == 0){
                results = '{"result":-0,"active":true},{"result":-0,"active":true},{"result":-0,"active":true},{"result":-0,"active":true}'
            }
            if (num == -1){
                results = '{"result":-1,"active":true,"failure":true},{"result":-0,"active":true},{"result":-0,"active":true},{"result":-0,"active":true}'
            }
            if (num == -2){
                results = '{"result":-1,"active":true,"failure":true},{"result":-1,"active":true,"failure":true},{"result":-0,"active":true},{"result":-0,"active":true}'
            }
            if (num == -3){
                results = '{"result":-1,"active":true,"failure":true},{"result":-1,"active":true,"failure":true},{"result":-1,"active":true,"failure":true},{"result":-0,"active":true}'
            }
            if (num == -4){
                results = '{"result":-1,"active":true,"failure":true},{"result":-1,"active":true,"failure":true},{"result":-1,"active":true,"failure":true},{"result":-1,"active":true,"failure":true}'
            }
            if (num == 1){
                results = '{"result":1,"active":true, "success":true},{"result":-0,"active":true},{"result":-0,"active":true},{"result":-0,"active":true}'
            }
            if (num == 2){
                results = '{"result":1,"active":true, "success":true},{"result":1,"active":true, "success":true},{"result":-0,"active":true},{"result":-0,"active":true}'
            }
            if (num == 3){
                results = '{"result":1,"active":true, "success":true},{"result":1,"active":true, "success":true},{"result":1,"active":true, "success":true},{"result":-0,"active":true}'
            }
            if (num == 4){
                results = '{"result":1,"active":true, "success":true},{"result":1,"active":true, "success":true},{"result":1,"active":true, "success":true},{"result":1,"active":true, "success":true}'
            }
            roll = Roll.fromJSON(`{"class":"Roll","options":{},"dice":[],"formula":"4df + ${total_modifier}","terms":[{"class":"FateDie","options":{},"evaluated":true,"number":4,"faces":3,"modifiers":[],"results":[${results}]},{"class":"OperatorTerm","options":{},"evaluated":true,"operator":"+"},{"class":"NumericTerm","options":{},"evaluated":true,"number":${total_modifier}}],"total":${num+total_modifier},"evaluated":true}`)
        } else {
            // Get the custom roll from the <select> box for that purpose and enter it here. If there's no custom roll set, fall back to 4dF.
            // First, set to 4dF
            formula = '4dF'
            // Then get the value from the dialog, doing nothing if it's blank or not displayed
            // ToDo: Set up the custom formula field in the HTML with id 'customFormula'
            // ToDo: Add custom formulae from setting to the custom formula field
            // ToDo: Ensure custom formula field is shown if there's more than 4dF in the custom formula setting.
            let customFormula = html.find("select[id='customFormula']")[0]?.value;
            if (customFormula) formula = customFormula;

            r = new Roll(`${formula} + ${total_modifier}`);
            roll = await r.roll();
            
            // Here we go, we can add the custom dice 
            roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};

            // Add the formula to the roll so we can extract it in FateUtilities to do re-rolls without having to parse the roll ourselves
            roll.options.fco_formula = formula;
        }
    
        let msg = ChatMessage.getSpeaker({actor:this.actor})
        msg.alias = this.actor.name;

        let ladder = fcoConstants.getFateLadder();
        let rs = ladder[`${skill_rank.toString()}`];
        roll.toMessage({
            flavor: `<h1>${this.skill_name}</h1>${formula} ${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
            ${game.i18n.localize("fate-core-official.Skill_Rank")}: ${skill_rank} (${rs})<br>
            ${modifier_text}
            ${stunt_text}
            ${second_skill_text}
            ${manualFlavour}`,
            speaker: msg
        });

        this.close();
    }

    getData (){
        this.options.title = game.i18n.format("fate-core-official.modifiedRollFor", {skill:this.skill_name, name:this.actor.name})
        let data = {};
        data.actor = this.actor;
        data.activeSkill=this.skill_name;
        data.allowManual = game.settings.get("fate-core-official","allowManualRolls");
        let formulae = game.settings.get("fate-core-official","fu-roll-formulae");
        data.showFormulae = false;
        data.formulae = [];
        if (formulae){
            data.formulae = formulae.split(",").map(item => item.trim());
            if (data.formulae.length > 1) data.showFormulae = true;
            if (data.formulae.length == 1 && data.formulae[0].toLowerCase() != '4df') data.showFormulae = true;
            if (data.formulae.indexOf('4dF') == -1 && data.formulae.indexOf('4df') == -1) data.formulae.push('4df');
        }
        return data;
    }
}
