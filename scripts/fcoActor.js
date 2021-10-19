export class fcoActor extends Actor {

    get visible(){
        if (this.type === "Thing" && game.system.showThings !== true){
            return false;
        } 
        else {
            return super.visible;
        }
    }

    // Override the standard createDialog to just spawn a character called 'New Actor'.
    static async createDialog (...args){

        let perm;
        if (isNewerVersion(game.version, '9.224')){
            perm = {"default":CONST.DOCUMENT_PERMISSION_LEVELS[game.settings.get("fate-core-official", "default_actor_permission")]};
        } else {
            perm = {"default":CONST.ENTITY_PERMISSIONS[game.settings.get("fate-core-official", "default_actor_permission")]};
        }

        if (args[0].folder) {
            Actor.create({"name":"New Character", "folder":args[0].folder, "type":"fate-core-official", permission: perm});
        } else {
            Actor.create({"name":"New Character", "type":"fate-core-official", permission: perm});
        }
        
    }

    async _preCreate(...args){
        await super._preCreate(...args);
        const data = this.data;

        if (data.type == "ModularFate" || data.type == "FateCoreOfficial"){
            data.update({type:"fate-core-official"})
        }

        if (data?.data?.details?.fatePoints?.refresh === ""){
            data.update(this.initialisefcoCharacter());
        }
    }

    async _preUpdate(data, options, user){
        await super._preUpdate(data, options, user);
        if (data.type == "ModularFate" || data.type == "FateCoreOfficial"){
            data.type = "fate-core-official"; 
        }
    }

    initialisefcoCharacter () {
        let actor = this;
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

    getHighest (data, test, extra_id){
        let count = 1;
        // Get the highest number on any item relating to this one.
        for (let item in data){
            if (item.startsWith(test)){
                if (data[item].extra_tag?.extra_id == extra_id){
                    let num = parseInt(item.split(" ")[item.split(" ").length-1],10);
                    if (num){
                        return num;
                    } else {
                        return 0;
                    }
                }
                let num = parseInt(item.split(" ")[item.split(" ").length-1],10);
                if (num) {
                    count = num + 1;
                } else {
                    count ++;
                }
            }
        }
        return count;
    }

    async updateFromExtra(itemData) {
        let actor = this;

        if (!itemData.data.active && !itemData.data.data.active) {
            // This currently adds the stuff to the character sheet even if active is false, which we do not want.
            return;
        }

        actor.sheet.editing = true;
            let extra = duplicate(itemData);
    
            //Find each aspect, skill, stunt, and track attached to each extra
            //Add an extra data item to the data type containing the id of the original item.
            //Done: Edit editplayertracks to be blind to any object with the extra data type defined
            //Done: Edit editplayerskills to be blind to any object with the extra data type defined
            //Done: Edit editplayeraspects to be blind to any object with the extra data type defined
            //Check to see if the thing is already on the character sheet. If it is, update with the version from the item (should take care of diffing for me and only do a database update if changed)
            //Done: Remove the ability to delete stunts bestowed upon the character by their extras (disable the delete button if extra_tag != undefined)
            
            let stunts_output = {};
            let skills_output = {};
            let aspects_output = {};
            let tracks_output = {};
    
                let extra_name = extra.name;
                let extra_id = extra._id;
                let extra_tag = {"extra_name":extra_name, "extra_id":extra_id};
    
                let stunts = duplicate(extra.data.stunts);
        
                if (!Array.isArray(stunts)){
                    for (let stunt in stunts){
                        let count = this.getHighest(actor.data.data.stunts, stunt, extra_id);
                        stunts[stunt].extra_tag = extra_tag;
                        if (count > 1){    
                            stunts[stunt].name = stunts[stunt].name + ` ${count}`;
                        }
                        stunts_output[stunts[stunt].name]=stunts[stunt];
                    }
                }
    
                let skills = duplicate(extra.data.skills);
                if (!Array.isArray(skills)){
                    let askills = duplicate(actor.data.data.skills);  
                    for (let skill in skills){
                        // If this and its constituent skills are NOT set to combine skills, we need to create an entry for this skill.
                        if (!extra.data.combineSkills && !skills[skill].combineMe){
                            let count = this.getHighest(askills, skill, extra_id);
                            skills[skill].extra_tag = extra_tag;
                            if (count > 1){    
                                skills[skill].name = skills[skill].name + ` ${count}`;
                            }
                            skills_output[skills[skill].name]=skills[skill];
                        } 

                        // We need to ensure the combined skills are setup correctly; if we've just removed the setting here then we need to rebuild
                        // We need to build all the combined skills here and make sure that they're returned properly in skills_output
                        let combined_skill;
                        for (let ask in askills){
                            if (ask == skill){
                                // This is the skill that everything is being merged into; 
                                // only the skill with the raw name of the extra_skill works for merging 
                                combined_skill = askills[ask];
                                if (combined_skill) combined_skill = duplicate(combined_skill);                                    
                            }
                        }
                        if (combined_skill && !combined_skill.extra_tag){
                            // The skill is a real one from the character and we cannot combine with it.
                        } else {
                            // If it is null, it needs to be created. That can only happen if this extra is newly creating a merged skill.
                            if (!combined_skill){
                                combined_skill = duplicate(skills[skill]);
                                combined_skill.extra_tag = extra_tag;
                            }
                            // Now we know for a fact that the base combined_skill is there and we have a reference to it, we can set its ranks.
                            if (combined_skill){
                                combined_skill.rank = 0;
                                for (let extra of this.items){
                                    if (extra.data.data.active){
                                        if (extra.data.data.combineSkills || extra.data.data.skills[skill]?.combineMe || combined_skill.extra_tag.extra_id == extra.id){
                                            let esk = extra.data.data.skills[skill];
                                            if (esk){
                                                combined_skill.rank += esk.rank;
                                            }
                                        }
                                    }
                                }
                                skills_output[combined_skill.name] = combined_skill;
                            }
                        }
                    }
                }
                let aspects = duplicate(extra.data.aspects);

                if (!Array.isArray(aspects)){
                    for (let aspect in aspects){
                        let count = this.getHighest(actor.data.data.aspects, aspect, extra_id);
                        aspects[aspect].extra_tag = extra_tag;
                        if (count > 1){
                            aspects[aspect].name = aspects[aspect].name + ` ${count}`;
                        }
                        aspects_output[aspects[aspect].name]=aspects[aspect];
                    }
                }
                
                let tracks = duplicate(extra.data.tracks);
                if (!Array.isArray(tracks)){
                    for (let track in tracks){
                        let count = this.getHighest(actor.data.data.tracks, track, extra_id);
                        tracks[track].extra_tag = extra_tag;
                        if (count >1 ){
                            tracks[track].name = tracks[track].name +` ${count}`;
                        }
                        tracks_output[tracks[track].name]=tracks[track];
                    }        
                }
    
            let actor_stunts = duplicate(actor.data.data.stunts);
    
            let actor_tracks = duplicate(actor.data.data.tracks);
    
            //Look for orphaned tracks on the character that aren't on the item any longer and delete them from the character
            //Find all tracks on this actor that have the item's ID in their extra_tag attribute
            //Check to see that those tracks are also on the item's list of tracks
            //If they aren't, delete them from the character.
    
            let update_object = {};
    
            for (let t in actor_tracks){
                let track = actor_tracks[t];
                if (track.extra_tag != undefined && track.extra_tag.extra_id == extra_id){
                    if (tracks_output[t] == undefined){
                        update_object[`data.tracks.-=${t}`] = null;
                    }
                }
            }
    
            for (let track in tracks_output){
                if (actor_tracks[track]!=undefined){
                    for (let i = 0; i < tracks_output[track]?.box_values?.length; i++){
                        tracks_output[track].box_values[i] = actor_tracks[track]?.box_values[i];
                    }
                    if (actor_tracks[track].aspect?.when_marked) tracks_output[track].aspect.name = actor_tracks[track].aspect?.name;
                    if (actor_tracks[track]?.notes) tracks_output[track].notes = actor_tracks[track].notes;
                }
            }
            
            let actor_aspects = duplicate(actor.data.data.aspects);
    
            //Ditto for orphaned aspects
            for (let a in actor_aspects){
                let aspect = actor_aspects[a];
                if (aspect != undefined && aspect.extra_tag != undefined && aspect.extra_tag.extra_id == extra_id){
                    if (aspects_output[a] == undefined){
                        update_object[`data.aspects.-=${a}`] = null;
                    }
                }
            }
    
            let actor_skills = duplicate(actor.data.data.skills);
    
            //Ditto for orphaned skills
            for (let s in actor_skills){
                let skill = actor_skills[s];
                if (skill != undefined && skill.extra_tag != undefined && skill.extra_tag.extra_id == extra_id){
                    if (skills_output[s] == undefined){
                        update_object[`data.skills.-=${s}`] = null;
                    }
                }
            }
    
            //Ditto for orphaned stunts
            for (let s in actor_stunts){
                let stunt = actor_stunts[s];
                if (stunt != undefined && stunt.extra_tag != undefined && stunt.extra_tag.extra_id == extra_id){
                    if (stunts_output[s] == undefined){
                        update_object[`data.stunts.-=${s}`] = null;;
                    }
                }
            }
            actor.sheet.editing = false;
            await actor.update(update_object);

            let final_stunts = mergeObject(actor.data.data.stunts, stunts_output, {"inPlace":false});
            let working_tracks = mergeObject(actor.data.data.tracks, tracks_output, {"inPlace":false});
            let final_skills = mergeObject(actor.data.data.skills, skills_output, {"inPlace":false});
            let final_aspects = mergeObject(actor.data.data.aspects, aspects_output, {"inPlace":false});
            let final_tracks = this.setupTracks (duplicate(final_skills), duplicate(working_tracks));

            await actor.update({    
                "data.tracks":final_tracks,
                "data.aspects":final_aspects,
                "data.skills":final_skills,
                "data.stunts":final_stunts
            })
    }

    async deactivateExtra (item, deleting){
        this.sheet.editing = true;
        let actor = this;
        let itemData = item.data;
        if (deleting == undefined) deleting = true;

        //Add a parameter - 'deleting' - if false, push the existing track on the actor back to the extra
        //before removing it - if the extra is toggled on and off, any tracks on the character that are partially
        //filled in should remain that way. This should be as simple as adding a parameter to calls to this method
        //and then removing extra_tag from each track and writing it back to the item in an update call.
        if (!deleting){
            let trackUpdates = duplicate(item.data.data.tracks);
            for (let t in trackUpdates){
                let track = actor?.data?.data?.tracks[t];
                if (track){
                    track = duplicate(track);
                    delete track.extra_tag;
                    trackUpdates[t] = track;
                }
            }
            let stuntUpdates = duplicate(item.data.data.stunts);
            for (let s in stuntUpdates){
                let stunt = actor?.data?.data?.stunts[s];
                if (stunt){
                    stunt = duplicate(stunt);
                    delete stunt.extra_tag;
                    stuntUpdates[s] = stunt;
                }
            }
            await item.update({"data.tracks":trackUpdates, "data.stunts":stuntUpdates},{renderSheet:false});
        }
        //Clean up any tracks, aspects, skills, or stunts that were on this extra but are now orphaned.
    
        let updateObject = {}
    
        let actor_aspects = duplicate(actor.data.data.aspects)
    
        for(let aspect in actor_aspects)
        {
            let et = actor_aspects[aspect].extra_tag;
            if (et != undefined && et.extra_id == itemData._id){
                updateObject[`data.aspects.-=${aspect}`] = null;
            }
        }
        
        let actor_stunts = duplicate(actor.data.data.stunts)
    
        for (let stunt in actor_stunts){
            let et = actor_stunts[stunt].extra_tag;
            if (et != undefined && et.extra_id == itemData._id){
                updateObject[`data.stunts.-=${stunt}`] = null;
            }
        }
    
        let actor_tracks = duplicate(actor.data.data.tracks)
    
        for (let track in actor_tracks){
            let et = actor_tracks[track].extra_tag;
            if (et != undefined && et.extra_id == itemData._id){
                updateObject[`data.tracks.-=${track}`] = null;
            }
        }
    
        let actor_skills = duplicate(actor.data.data.skills)
    
        for (let skill in actor_skills){
            let et = actor_skills[skill].extra_tag;
            if (et!= undefined && et.extra_id == itemData._id){
                updateObject[`data.skills.-=${skill}`] = null;
            }
        }      
        //ToDo: Rebuild/clean up combined skills.

        actor.sheet.editing = false;
        await actor.update(updateObject);
        let ctracks = duplicate(actor.data.data.tracks);
        let cskills = duplicate(actor.data.data.skills);
        let etracks = actor.setupTracks(cskills, ctracks);
        await actor.update({"data.tracks":etracks});
        // This is required in order to make sure we get the combined skills setup correctly
        for (let extra of actor.items){
            if (extra.id != item.id && extra.data.data.active) await actor.updateFromExtra(extra);
        }
    }
    
    async rollSkill (skillName){
        if (skillName){
            let actor = this;
            let skill = actor.data.data.skills[skillName];
            let rank = skill.rank;
            let r = new Roll(`4dF + ${rank}`);
            let ladder = fcoConstants.getFateLadder();
            let rankS = rank.toString();
            let rung = ladder[rankS];
            let roll = await r.roll();
            roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};

            let msg = ChatMessage.getSpeaker(actor)
            msg.alias = actor.name;

            roll.toMessage({
                flavor: `<h1>${skill.name}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                        ${game.i18n.localize("fate-core-official.SkillRank")}: ${rank} (${rung})`,
                speaker: msg,
            });
        }
    }
    
    async rollStunt(stuntName){
        if (stuntName){
            let stunt = this.data.data.stunts[stuntName];
            let skill = stunt.linked_skill;
            let bonus = parseInt(stunt.bonus);
    
            let ladder = fcoConstants.getFateLadder();
            let rank = 0;
            if (skill == "Special"){
                // We need to pop up a dialog to get a skill to roll.
                let skills = [];
                for (let x in this.data.data.skills){
                    skills.push(this.data.data.skills[x].name);
                }
                let sk = await fcoConstants.getInputFromList (game.i18n.localize("fate-core-official.select_a_skill"), skills);
                skill = sk;
                rank = this.data.data.skills[skill].rank;
            } else {
                rank = this.data.data.skills[skill].rank;
            }
    
            let rankS = rank.toString();
            let rung = ladder[rankS];
    
            let r = new Roll(`4dF + ${rank}+${bonus}`);
            let roll = await r.roll();
            roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};
    
            let msg = ChatMessage.getSpeaker(this.actor)
            msg.alias = this.name;
    
            roll.toMessage({
                flavor: `<h1>${skill}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                ${game.i18n.localize("fate-core-official.SkillRank")}: ${rank} (${rung})<br> 
                ${game.i18n.localize("fate-core-official.Stunt")}: ${stunt.name} (+${bonus})`,
                speaker: msg
            });
        }
    }
    
    async rollModifiedSkill (skillName) {
        if (skillName){
            let mrd = new ModifiedRollDialog(this, skillName);
            mrd.render(true);
            try {
                mrd.bringToTop();
            } catch  {
                // Do nothing.
            }
        }
    }

    prepareData(...args){
        super.prepareData(...args);
        if (this.type == "fate-core-official"){
            this.data.data.details.fatePoints.max = this.data.data.details.fatePoints.refresh;
            this.data.data.details.fatePoints.value = this.data.data.details.fatePoints.current;

            let tracks = this.data.data.tracks;
            for (let track in tracks){
                if (tracks[track].box_values){
                    this.data.data.details[track] = {max:tracks[track].box_values.length, value:tracks[track].box_values.length-tracks[track].box_values.filter(b => b).length};
                }
            }
        }
    }

    setupTracks (skills, tracks) {
        // This method takes skill and track data and returns corrected tracks enabled and disabled etc. according to the values of those skills
        // and the tracks' settings for enabling/disabling tracks according to skill ranks.

        let categories = game.settings.get("fate-core-official", "track_categories");
        //GO through all the tracks, find the ones with boxes, check the number of boxes and linked skills and initialise as necessary.
        for (let t in tracks) {
            let track = tracks[t];

            if (track.universal) {
                track.enabled = true;
            }

            // Check for linked skills and enable/add boxes as necessary.
            if (track.linked_skills != undefined && track.linked_skills.length > 0 && Object.keys(skills).length > 0) {
                track.enabled = false;
                let linked_skills = tracks[t].linked_skills;
                let box_mod = 0;
                for (let i = 0; i < linked_skills.length; i++) {
                    let l_skill = linked_skills[i].linked_skill;
                    let l_skill_rank = linked_skills[i].rank;
                    let l_boxes = linked_skills[i].boxes;
                    let l_enables = linked_skills[i].enables;

                    //Get the value of the player's skill
                    if (skills[l_skill] == undefined && l_enables == false){
                        if (l_boxes > 0) {
                            track.enabled = true;
                        }
                    }else {
                        let skill_rank = skills[l_skill]?.rank;
                        //If this is 'enables' and the skill is high enough, enable.
                        if (l_enables && skill_rank >= l_skill_rank) {
                            track.enabled = true;
                        }
                    //If this adds boxes and the skill is high enough, add boxes if not already present.
                    //Telling if the boxes are already present is the hard part.
                    //If boxes.length > boxes it means we have added boxes, but how many? I think we need to store a count and add
                    //or subract them at the end of our run through the linked skills.
                        
                        if (l_boxes > 0 ) {
                            if (l_enables == false) track.enabled = true;
                            if (skill_rank >= l_skill_rank){
                                box_mod += l_boxes;
                            }
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
        return tracks;
    }

    get skills (){
        return this.data.data.skills;
    }
}
