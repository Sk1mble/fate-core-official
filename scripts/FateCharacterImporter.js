Hooks.on('getSceneControlButtons', function(hudButtons)
{
    if (game.user.isGM){
        let hud = hudButtons.find(val => {return val.name == "token";})
        if (hud){
            hud.tools.push({
                name:"ImportCharacter",//Completed
                title:game.i18n.localize("ModularFate.ImportCharacter"),
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
                title: game.i18n.localize("ModularFate.PasteCharacterData"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="import_fate_character"></textarea></div>`,
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
        data = JSON.parse(data);
        
        //First we need to figure out where the character came from
        //Fari: data.fariType == character
        //FateX: data.exportSource.system == fatex

        let actorData = {
            "name":"blank",
            "type":"ModularFate",
            "data":{
                        details:{
                                    fatePoints:{
                                                    refresh:"0"
                                    }
                        }
            }
        }

        if (data?.type==="ModularFate"){
            actorData = data;
        }

        if (data?.flags?.exportSource?.system === "fatex"){
            console.log(data);
            actorData.name = data.name;
            actorData.img = data.img;
            actorData.token = data.token;
            actorData.data.details = {
                fatePoints:{
                    current:data.data.fatepoints.current, 
                    refresh:data.data.fatepoints.refresh
                },
                biography:{
                    value:data.data.biography.value
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
            actorData.data.aspects = aspects;

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
            actorData.data.skills = skills;

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
            actorData.data.stunts = stunts;

            let tracks = {};
            
            //Stress
            //isChecked: data.data.value & (2 ** i),
            //Could use !! data.data.value & (2 ** i)
            const rawStresses = items.filter (item => item.type === "stress");
            rawStresses.forEach(rawStress => {
                let track = {};
                track.name = rawStress.name.split(".").join("․");
                track.category = "Combat";
                track.description = rawStress.data.description;
                track.unique = true;
                track.enabled = true;
                if (track.name.toLowerCase().includes("physical") || track.name.toLowerCase().includes("mental")) {
                    track.recovery_type = "fleeting";
                }
                else {
                    track.recovery_type = "sticky";
                }
                track.aspect = "No";
                if (rawStress.data.labelType == 0){
                    track.label="escalating";
                }
                if (rawStress.data.labelType == 1){
                    track.label="1";
                }
                if (rawStress.data.labelType == 2){
                    track.label=rawStress.data.customLabel.split(" ")[0];
                }
                track.boxes = rawStress.data.size;
                track.box_values = [];
                for (let i = 0; i < rawStress.data.size; i++){
                    track.box_values.push(rawStress.data.value & (2 **i) === 1) //Should be false if 0 and true if 1
                }
                tracks[`${track.name}`] = track;
            })

            //Consequences
            //Can have box values a-la Stress tracks because he's implemented conditions here.
            const rawConsequences = items.filter (item => item.type === "consequence");
            rawConsequences.forEach (rawConsequence => {
                let track = {};
                track.name = rawConsequence.name.split(".").join("․");
                track.category = "Combat";
                track.description = rawConsequence.data.description;
                track.unique = true;
                track.enabled = true;

            })

            actorData.data.tracks = tracks;

            //Extras

        }

        // Import from Fari (only supports the newest version)
        //console.log(data);
        if (data?.fariType?.toLowerCase() === "character") {
            const allSections = data.pages.flatMap((page) => {
                return page.sections;
            });

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
            actorData.data.aspects = aspects;

            //Assign skills - Will only work if there is a section with a single skills block (no matter what they are called).
            const skillSection = allSections.find (
                (section) => section.blocks[0].type.toLowerCase() === "skill"
            );
            const rawSkills = skillSection?.blocks.map((block) => {
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
            actorData.data.skills = skills;

            //Assign Stunts
            const stuntSection = allSections.find (
                (section) => section.label.toLowerCase().includes("stunts")
            );
            const rawStunts = stuntSection?.blocks.map((block) => {
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
            actorData.data.stunts = stunts;

            // Assign refresh
            const fpSection = allSections.find (
                (section) => section.label.toLowerCase() === "fate points"
            );
            const fpBlock = fpSection.blocks.find(block => block.label.toLowerCase() === "fate points");
            actorData.data.details.fatePoints.current = parseInt(fpBlock.value);
            actorData.data.details.fatePoints.refresh = parseInt(fpBlock.meta.max);

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
            actorData.data.details.notes={value:notesText};

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
            actorData.data.details.biography={value:biographyText};

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
            actorData.data.details.description={value:descriptionText};

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

            actorData.data.tracks = tracks;

            // Assign name
            actorData.name = data?.name;
        }
        let finalActor = await Actor.create(actorData, {"renderSheet":true});
    }
}