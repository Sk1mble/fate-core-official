Hooks.on('getSceneControlButtons', function(hudButtons)
{
    if (game.user.isGM){
        let hud = hudButtons.find(val => {return val.name == "token";})
        if (hud){
            hud.tools.push({
                name:"ImportCharacter",//Completed
                title:game.i18n.localize("fate-core-official.ImportCharacter"),
                icon:"fas fa-download",
                onClick: async ()=> {
                    let fci = new FateCharacterImporter();
                    let data = await fci.getFCI_JSON();
                    fci.import(data);
                },
                button:true
            });
        }
    }
})

class FateCharacterImporter {
    async getFCI_JSON(){
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("fate-core-official.PasteCharacterData"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="import_fate_character"></textarea></div>`,
                buttons: {
                    ok: {
                        label: "Save",
                        callback: () => {
                            resolve (document.getElementById("import_fate_character").value);
                        }
                    }
                },
            }).render(true)
        });
    }

    async import (data){
        try {
            data = JSON.parse(data);    
        } catch {
            ui.notifications.error(game.i18n.localize("fate-core-official.couldnotparse"));
            return;
        }
        
        //First we need to figure out where the character came from
        //Fari: data.fariType == character
        //FateX: data.exportSource.system == fatex

        let actorData = {
            "name":"blank",
            "type":"fate-core-official",
            "system":{
                        details:{
                                    fatePoints:{
                                                    refresh:"0"
                                    }
                        }
            }
        }

        if (data?.type==="fate-core-official"){
            actorData = data;
        }

        if (data?.flags?.exportSource?.system === "fatex"){
            actorData.name = data.name;
            actorData.img = data.img;
            actorData.prototypeToken = data.prototypeToken;
            actorData.system.details = {
                fatePoints:{
                    current:data.system.fatepoints.current, 
                    refresh:data.system.fatepoints.refresh
                },
                biography:{
                    value:data.system.biography.value
                }
            };

            // That's all the basic data, for everything else we have to iterate through the character's items.
            const items = data.items;
            
            // Let's begin with aspects
            const rawAspects = items.filter(item => item.type === "aspect");
            let aspects = {};
            rawAspects.forEach(rawAspect => {
                let aspect = {};
                aspect.name = rawAspect.name.split(".").join("․");
                aspect.value = rawAspect.data.value;
                aspect.description = rawAspect.data.description;
                aspects[`${aspect.name}`] = aspect;
            })
            actorData.system.aspects = aspects;

            //Skills
            const rawSkills = items.filter(item => item.type === "skill");
            let skills = {};
            rawSkills.forEach(rawSkill => {
                let skill = {};
                skill.name = rawSkill.name.split(".").join("․");
                skill.rank = rawSkill.data.rank;
                skill.description = rawSkill.data.description;
                skills[`${skill.name}`] = skill;
            })
            actorData.system.skills = skills;

            //Stunts
            const rawStunts = items.filter(item => item.type === "stunt");
            let stunts = {};
            rawStunts.forEach(rawStunt => {
                let stunt = {};
                stunt.name = rawStunt.name.split(".").join("․");
                stunt.description = rawStunt.data.description;
                stunt.refresh_cost = 0;
                stunts[`${stunt.name}`] = stunt;
            })
            actorData.system.stunts = stunts;

            let tracks = {};
            
            //Tracks (Stress and consequences in the FateX parlance)
            const rawTracks = items.filter (item => item.type === "stress" || item.type === "consequence");
            rawTracks.forEach(rawTrack => {
                let track = {};
                track.name = rawTrack.name.split(".").join("․");
                track.category = "Combat";
                track.description = rawTrack.data.description;
                track.unique = true;
                track.enabled = true;
                track.universal = true;
                if (track.type === "stress" && (track.name.toLowerCase().includes("physical") || track.name.toLowerCase().includes("mental"))) {
                    track.recovery_type = "fleeting";
                }
                else {
                    track.recovery_type = "sticky";
                }
                
                if (rawTrack.type == "stress") track.aspect = "No";
                if (rawTrack.type == "consequence") {
                    track.aspect = {name:rawTrack.data.value, when_marked:true, as_name:false};
                    track.harm_can_absorb = rawTrack.data.icon;
                    track.label="none";
                }

                if (rawTrack.data.labelType == 0){
                    track.label="escalating";
                }
                if (rawTrack.data.labelType == 1){
                    track.label="1";
                }
                if (rawTrack.data.labelType == 2){
                    track.label=rawTrack.data.customLabel.split(" ")[0];
                }

                //Need to get the values from atomatiion here, if any, to ensure the number of stress boxes is correct.
                const skillReferences = rawTrack?.flags?.fatex?.skillReferences;
                const skillReferenceSettings = rawTrack?.flags?.fatex?.skillReferenceSettings;

                /*  OPERATOR_EQUALS: 0,
                    OPERATOR_NOT_EQUALS: 1,
                    OPERATOR_GT: 2,
                    OPERATOR_LT: 3,
                    OPERATOR_GTE: 4,
                    OPERATOR_LTE: 5,

                    TYPES
                    STATUS: 0,
                    BOXES: 1,

                    CONJUNCTIONS
                    OR 0
                    AND 1
                */

                let boxModifier = 0;
                if (skillReferences){
                    track.enabled = false;
                    let linked_skills = [];
                    skillReferences.forEach(reference =>{
                        let linked_skill = {};
                        //condition is the value of the skill we're checking for
                        let condition = reference?.condition;
                        let skill = reference.skill;
                        //Basically all tracks use gte, operator 4, so let's ignore everything else.
                        
                        if (skillReferenceSettings?.conjunction == 0){
                            //enable if one of conditions met OR
                            if (actorData.system.skills[skill].rank >= condition){
                                linked_skill = {linked_skill:skill, rank:condition, boxes:0, enables:true}
                                linked_skills.push(linked_skill);
                                track.enabled = true;
                            } 
                        }

                        if (skillReferenceSettings?.conjunction == 1){
                            //enable if all conditions met AND
                            linked_skill = {linked_skill:skill, rank:condition, boxes:0, enables:true}
                            linked_skills.push(linked_skill);
                            if (actorData.system.skills[skill].rank >= condition){
                                track.enabled = true;
                            } else {
                                track.enabled = false;
                            }
                        }

                        if (actorData.system.skills[skill].rank >= condition){
                            if (reference.type == 0){
                                // Enables
                                linked_skill = {linked_skill:skill, rank:condition, boxes:0, enables:true}
                                linked_skills.push(linked_skill);
                                track.enabled = true;
                            }
                        }
                        
                        if (actorData.system.skills[skill].rank >= condition){
                            if (reference.type == 1) {
                                //Modifies boxes
                                track.enabled = true;
                                boxModifier += reference.argument;
                                linked_skill = {linked_skill:skill, rank:condition, boxes:reference.argument, enables:false}
                                linked_skills.push(linked_skill);
                            }
                        }
                    })
                    track.linked_skills = linked_skills;
                }

                let boxValues = 0;
                if (rawTrack.type == "stress"){
                    track.boxes = rawTrack.data.size+boxModifier;
                    boxValues = rawTrack.data.value;
                }

                if (rawTrack.type == "consequence"){
                    track.boxes = rawTrack.data.boxAmount+boxModifier;
                    boxValues = rawTrack.data.boxValues;
                }
                track.box_values = [];
                for (let i = 1; i <= track.boxes; i++){
                    track.box_values.push((parseInt(boxValues) & (2 **i)) != 0) //Should be false if 0 and true otherwise
                }
                tracks[`${track.name}`] = track;
            })
            actorData.system.tracks = tracks;

            //Extras
            const rawExtras = items.filter (item => item.type === "extra");
            let extras = [];
            rawExtras.forEach(rawExtra => {
                    let extra = {
                        name:rawExtra.name,
                        type:"Extra",
                        system:{
                            description:{value:rawExtra.data.description},
                            refresh:0,
                            countSkills:false,
                            active:true
                        }
                    }
                extras.push(extra);
            })
            actorData.items = extras;
        }

        // Import from Fari (only supports the newest version)
        let allSections=[];
        let rows;

        if (data?.fariType?.toLowerCase() === "character") {
            rows = data.pages.flatMap((page) => {
                return page.rows;
            });

            rows.forEach(row => {
                let columns = row.columns;
                columns.forEach(column => {
                    allSections = allSections.concat(column.sections);
                });
            })
            
            //Assign aspects
            const aspectSection = allSections.find(
                (section) => section.label.toLowerCase() === "aspects"
            );
            const rawAspects = aspectSection?.blocks.map((block) => {
                return {
                    name: block.label,
                    value: block.value,
                };
            });

            let aspects = {};
            rawAspects.forEach(rawAspect => {
                let aspect = {};
                aspect.name = rawAspect.name.split(".").join("․"); //Prevents issues in keys with periods.
                aspect.value = rawAspect.value;
                aspects[`${aspect.name}`] = aspect;
            })
            actorData.system.aspects = aspects;

            //Assign skills - Will add all sections that contain skill blocks.
            let skillSection = [];
            allSections.forEach (section => {
                if (section.blocks[0].type.toLowerCase() === "skill"){
                    skillSection = skillSection.concat(section.blocks);
                }
            })
            
            const rawSkills = skillSection?.map((block) => {
                let rank = parseInt(block.value);
                if (!rank) rank = 0;
                return {
                    name: block.label,
                    value: rank,
                };
            })
            // Now let's assign the skills
            let skills = {};
            rawSkills.forEach(rawSkill => {
                let skill = {};
                skill.name = rawSkill.name.split(".").join("․"); //Prevents issues in keys with periods.
                skill.rank = rawSkill.value;
                skills[`${skill.name}`] = skill;
            })
            actorData.system.skills = skills;

            //Assign Stunts

            let stuntSection = [];
            allSections.forEach (section => {
                if (section.blocks[0].label.toLowerCase().includes("stunt")){
                    stuntSection = stuntSection.concat(section.blocks);
                }
            })

            const rawStunts = stuntSection?.map((block) => {
                return {
                    name: block.label,
                    value: block.value,
                };
            })

            let stunts = {};
            rawStunts.forEach(rawStunt => {
                let stunt = {};
                stunt.name = rawStunt.name.split(".").join("․"); //Prevents issues in keys with periods.
                stunt.description = rawStunt.value;
                stunt.refresh_cost = 0; // Fari doesn't track the cost of stunts so this will have to be modified by the user after import.
                stunts[`${stunt.name}`] = stunt;
            })
            actorData.system.stunts = stunts;

            // Assign refresh
            const fpSection = allSections.find (
                (section) => section.label.toLowerCase() === "fate points"
            );
            const fpBlock = fpSection.blocks.find(block => block.label.toLowerCase() === "fate points");
            actorData.system.details.fatePoints.current = parseInt(fpBlock.value);
            actorData.system.details.fatePoints.refresh = parseInt(fpBlock.meta.max);

            // Assign Notes, Biography, Description (if present)

            //Notes
            const notesSection = allSections.find (
                (section) => section.blocks.filter(n => n.label.toLowerCase() === "notes").length > 0
            );
            const notes = notesSection?.blocks.map((block) => {
                if (block.label.toLowerCase().includes("notes")){
                    return {
                        value: block.value
                    }
                }
            })
            let notesText = "";  
            if (notes) notes.forEach(note => {
                if (note) notesText += note.value +"\n"
            });
            actorData.system.details.notes={value:notesText};

            //Biography
            const biographySection = allSections.find (
                (section) => section.blocks.filter(n => n.label.toLowerCase() === "biography").length > 0
            );
            const biography = biographySection?.blocks.map((block) => {
                    if (block.label.toLowerCase().includes("biography")){
                    return {
                        value: block.value
                    }
                }
            })
            let biographyText = "";  
            if (biography) biography.forEach(bio => {
                if (bio) biographyText += bio.value +"\n"
            });
            actorData.system.details.biography={value:biographyText};

            //Description
            const descriptionSection = allSections.find (
                (section) => section.blocks.filter(n => n.label.toLowerCase() === "description").length > 0
            );
            const description = descriptionSection?.blocks.map((block) => {
                if (block.label.toLowerCase().includes("description")){
                    return {
                        value: block.value
                    }
                }
            })
            let descriptionText = "";  
            if (description) description.forEach(desc => {
                if (desc) descriptionText += desc.value +"\n"
            });
            actorData.system.details.description={value:descriptionText};

            //Assign stress & consequences
            //only works if there's exactly one Conseqences/Conditions section on the sheet.
            const consequencesSection = allSections.find (
                (section) => section.label.toLowerCase().includes("consequences") || section.label.toLowerCase().includes("conditions")
            );
            const rawConsequences = consequencesSection?.blocks.map((block) => {
                return {
                    name: block.label,
                    value: block.value,
                };
            })

            let tracks = {};

             //Get stress
             const stressSection = allSections.find (
                (section) => section.label.toLowerCase().includes("stress")
            );
            const rawStresses = stressSection?.blocks.map((block) => {
                return {
                    name: block.label,
                    value: block.value,
                };
            })

            //Get consequences
            rawConsequences.forEach(rawConsequence => {
                if (Array.isArray(rawConsequence.value)){
                    rawStresses.push(rawConsequence);
                } else {
                    let consequence = {};
                    consequence.name = rawConsequence.name.split(".").join("․"); //Prevents issues in keys with periods.
                    consequence.aspect = {"when_marked":true, "name":rawConsequence.value};
                    consequence.category = "Combat";
                    consequence.unique = true;
                    consequence.enabled = true;
                    tracks[`${consequence.name}`] = consequence;
                }
            })

            rawStresses.forEach(rawStress => {
                let track = {};
                track.name = rawStress.name.split(".").join("․"); //Prevents issues in keys with periods.
                track.category = "Combat";
                track.unique = true;
                track.enabled = true;
                if (track.name.toLowerCase().includes("mental") || track.name.toLowerCase().includes("physical")) track.recovery_type = "Fleeting";
                else track.recovery_type = "Sticky"
                track.boxes = rawStress.value.length;
                track.box_values = rawStress.value.map(box => box.checked);
                tracks[`${track.name}`] = track;
            })

            actorData.system.tracks = tracks;

            // Assign name
            actorData.name = data?.name;
        }
        let finalActor = await Actor.create(actorData, {"renderSheet":true});
    }
}