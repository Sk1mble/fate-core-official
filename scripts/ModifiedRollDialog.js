class ModifiedRollDialog extends Application {
    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/ModularFate/templates/ModifiedRollDialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = `Modified Roll`;
        options.resizable = false;
        return options 
    } // End getDefaultOptions

    constructor(actor, skill){
        super();
        this.actor = actor;
        this.skill_name = skill;
    }

    activateListeners(html){
        super.activateListeners(html);
        const roll=html.find("button[class='modifiedRoll']");
        roll.on("click",event => this.on_roll_click(event, html));
    }

    on_roll_click(event, html){
        let total_modifier = 0;     
        let modifier = html.find("input[id='modifier']")[0].value;

        total_modifier+=parseInt(modifier);

        let description = html.find("input[id='description']")[0].value;
        let second_skill = html.find("select[id='second_skill']")[0].value;
        let stunts = html.find("input[class='stunt_box']"); //This is an array
        let second_skill_rank = 0;
        let second_skill_text = ""
        let skill_rank = this.actor.data.data.skills[this.skill_name].rank;

        total_modifier += parseInt(skill_rank);
        let modifier_text = "";
        if (modifier > 0){
            modifier_text= `Modifier: +${modifier} (${description})<br>`
        }
        if (modifier < 0){
            modifier_text= `Modifier: -${modifier} (${description})<br>`
        }

        if (second_skill != "None"){
            second_skill_rank = this.actor.data.data.skills[second_skill].rank;
            let ladder = ModularFateConstants.getFateLadder();
            let rs2 = ladder[`${second_skill_rank.toString()}`];
            second_skill_text = `Second skill: ${second_skill} at rank ${second_skill_rank} (${rs2})`
            total_modifier += parseInt(second_skill_rank);
        }

        let stunt_text = ""

        for (let i = 0; i< stunts.length; i++){
            if (stunts[i].checked){
                let s_name = stunts[i].id.split("_")[1]
                let s_modifier = this.actor.data.data.stunts[s_name].bonus;
                stunt_text += "Stunt: "+ s_name + " (+" + s_modifier + ")<br>"
                total_modifier += parseInt(s_modifier);
            }
        }

        let r = new Roll(`4dF + ${total_modifier}`);
        let roll = r.roll();

        let msg = ChatMessage.getSpeaker(this.actor)
        msg.alias = this.actor.name;

        let ladder = ModularFateConstants.getFateLadder();
        let rs = ladder[`${skill_rank.toString()}`];

        roll.toMessage({
            flavor: `<h1>${event.target.id}</h1>Rolled by ${game.user.name}<br>
            Skill: ${this.skill_name} at rank ${skill_rank} (${rs})<br>
            ${modifier_text}
            ${stunt_text}
            ${second_skill_text}`,
            speaker: msg
        });

        this.close();
    }

    getData (){
        this.options.title = `Modified ${this.skill_name} roll for ${this.actor.name}`
        this.actor.activeSkill=this.skill_name;
        return this.actor;
    }
}
