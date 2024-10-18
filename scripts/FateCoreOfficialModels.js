/*
* More notes to self: This is how you can define a DataModel:
* class testModel extends foundry.abstract.DataModel {
*     static defineSchema(){
*         return {
*              value: new fields.NumberField({ required: true, initial:10, min:0 }),
*              bonus: new fields.NumberField({ required: true, initial:0 }),
*              mod: new fields.NumberField({ required: true, initial:0 })
*           };
*     }
* }
* There are many different field types available in foundry.data.fields, one of which, schemaField, allows an object to be defined as a field.
* Once defined, we can create an object as a new instance of the DataModel, and creation will only work if correct data is fed. We can also use className.cleanData(dataObject) to sanitise the model and make it valid for the dataModel schema.
* 
* SchemaField example with defaults defined:
* class testModel extends foundry.abstract.DataModel {
*     static defineSchema(){
*         return {
*       value: new foundry.data.fields.NumberField({ required: true, initial:10, min:0 }),
*       bonus: new foundry.data.fields.NumberField({ required: true, initial:0 }),
*       mod: new foundry.data.fields.NumberField({ required: true, initial:0 }),
*       test: new foundry.data.fields.SchemaField ({
*                   test1:new foundry.data.fields.NumberField({ required: true, initial:10, min:0 }),
*                   test2: new foundry.data.fields.NumberField({ required: true, initial:10, min:0 })
*              },{required:true, initial:{test1:5, test2:6}}
*       ),
*      }
*     };
* }
* We can set a DataModel as pertaining to an actor by extending DataModel and then configuring your data model to be used via CONFIG.Actor.systemDataModels[type]

* Numberfield properties:
* {string} name The name of this data field within the schema that contains it
* {boolean} required=false Is this field required to be populated?
* {boolean} nullable=false Can this field have null values?
* {Function|*} initial The initial value of a field, or a function which assigns that initial value.
* {Function} validate A data validation function which accepts one argument with the current value.
* {boolean} [readonly=false] Should the prepared value of the field be read-only, preventing it from being changed unless a change to the _source data is applied.
* {string} label A localizable label displayed on forms which render this field.
* {string} hint Localizable help text displayed on forms which render this field.
* {string} validationError A custom validation error string. When displayed will be prepended with the document name, field name, and candidate value.
* To create a field with a random ID in it: new foundry.data.fields.StringField({initial: () => foundry.utils.randomID()})
*/

/* To make a stringfield searchable, add the property textSearch: true */

class fcoSkill extends foundry.abstract.DataModel {
    static defineSchema(){
        return {
            "name":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "description":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "overcome":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "caa":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "attack":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "defend":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "pc": new foundry.data.fields.BooleanField({ nullable: false, required: true, initial:true}),
            "rank": new foundry.data.fields.NumberField({ required: true, initial:0, integer:true }),
            "extra_id": new foundry.data.fields.StringField({ required: false, initial: undefined }),
            "original_name": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "adhoc": new foundry.data.fields.BooleanField({ required: false, initial:false }),
            "hidden": new foundry.data.fields.BooleanField({ required: false, initial:false }),
        }
    }
}

class fcoAspect extends foundry.abstract.DataModel {
    static defineSchema(){
        return {
            "name":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "value":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "description":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "notes":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "extra_id": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "original_name": new foundry.data.fields.StringField({ required: false, initial:undefined })
        }
    }
}

class trackAspectField extends foundry.data.fields.ObjectField {
    _validateType(data){
        if (data == game.i18n.localize("fate-core-official.No") 
            || data == game.i18n.localize("fate-core-official.DefinedWhenMarked") 
            || data == game.i18n.localize("fate-core-official.AspectAsName") 
            || data == game.i18n.localize("fate-core-official.NameAsAspect")
            || data == "Aspect as Name" || data == "No" 
            || data == "Defined when marked" 
            || data == "Name As Aspect" 
            || data == "as_name" 
            || data == "no" 
            || data == "when_marked"
        ){
            return true;
        } else {
            if (Object.prototype.toString.call(data) === '[object Object]'){
                let valid = true;
                if (!data?.as_name && !data?.when_marked){
                    valid = false;
                    this.validationError = game.i18n.localize("fate-core-official.trackAspectFieldValidation1");
                } 
                if (data?.as_name && data?.when_marked){
                    this.validationError = game.i18n.localize("fate-core-official.trackAspectFieldValidation1")
                    valid = false;
                } 
                if (Object.keys(data).indexOf("name") == -1){
                    this.validationError = game.i18n.localize("fate-core-official.trackAspectFieldValidation2");
                    valid = false;
                } 
                return valid;
            } else {
                return false;
            }
        }
    }
    
    _cast(data){
        // This is required to prevent a validation error as the default _cast function casts the data to an object.
        return data;
    }
}

class trackLabelField extends foundry.data.fields.StringField {
    _validateType(string){
        let validate = true;
        if (string.constructor.name != "String") validate = false;
        if (string !== "escalating" && string !== "none" && string.length > 1) validate = false;
        return validate;
    }
}

class fcoTrack extends foundry.abstract.DataModel {
    static defineSchema(){
        let linked_skills = new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
            "linked_skill":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
			"rank": new foundry.data.fields.NumberField({ required: true, initial:0, integer:true}),
			"boxes": new foundry.data.fields.NumberField({ required: true, initial:0, integer:true}),
			"enables": new foundry.data.fields.BooleanField({ required: true, initial:false })
        }));

        let recovery_type = new foundry.data.fields.StringField({nullable: false, required: true, initial:"Fleeting"});
        recovery_type.choices = ["Fleeting","Sticky","Lasting"];

        let category = new foundry.data.fields.StringField({ nullable: false, required: true, initial:"Combat"});
        category.choices = () => {return Object.keys(game.settings.get("fate-core-official","track_categories"))};

        return {
            "category":category,
            "name":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "description":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "notes":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "extra_id": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "original_name": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "linked_skills":linked_skills,
            "paid":new foundry.data.fields.BooleanField({ required: true, initial:false }),
            "universal":new foundry.data.fields.BooleanField({ required: true, initial:true }),
            "unique":new foundry.data.fields.BooleanField({ required: true, initial:true }),
            "enabled":new foundry.data.fields.BooleanField({ required: true, initial:true }),
            "label":new trackLabelField({nullable: false, required: true, initial:"escalating"}),
            "recovery_type":recovery_type,
            "when_marked":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "recovery_conditions":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "harm_can_absorb": new foundry.data.fields.NumberField({ required: true, initial:0, integer:true }),
            "boxes":new foundry.data.fields.NumberField({ required: true, initial:0, integer:true }),
            "box_values":new foundry.data.fields.ArrayField(new foundry.data.fields.BooleanField()),
            "aspect":new trackAspectField({required: true, initial:"No"}),
            "rollable":new foundry.data.fields.StringField({ nullable:false, required: true, initial:"false", choices: ["false", "full", "empty"] })
        }
    }
}

class fcoStunt extends foundry.abstract.DataModel {
    static defineSchema(){
        return {
            "name":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "description":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "notes":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "extra_id": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "original_name": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "linked_skill": new foundry.data.fields.StringField({ required: true, initial:"None" }),
            "refresh_cost":new foundry.data.fields.NumberField({ required: true, initial:1, integer:true }),
            "overcome":new foundry.data.fields.BooleanField({ required: true, initial:false }),
            "caa":new foundry.data.fields.BooleanField({ required: true, initial:false }),
            "attack":new foundry.data.fields.BooleanField({ required: true, initial:false }),
            "defend":new foundry.data.fields.BooleanField({ required: true, initial:false }),
            "bonus":new foundry.data.fields.NumberField({ required: true, initial:0, integer:true }),
            "boxes":new foundry.data.fields.NumberField({ required: true, initial:0, integer:true }),
            "box_values":new foundry.data.fields.ArrayField(new foundry.data.fields.BooleanField()),
            "macro":new foundry.data.fields.DocumentUUIDField({required:true, nullable:true, initial:null})
        }
    }
}

// Implement data models for characters instead of utilising template.json

class fcoActorModel extends foundry.abstract.DataModel {
    static defineSchema () {
        const fields = foundry.data.fields;
        return {
            "details":new fields.SchemaField({
                    "description":new fields.SchemaField({"value":new fields.HTMLField({nullable:false, required: true, initial:""})}),
                    "biography":new fields.SchemaField({"value":new fields.HTMLField({nullable:false, required: true, initial:""})}),
                    "pronouns":new fields.SchemaField({"value":new fields.StringField({nullable:false, required: true, initial:""})}),
                    "notes":new fields.SchemaField({
                        "value":new fields.HTMLField({nullable:false, required: true, initial:""}),
                        "GM":new fields.BooleanField({nullable:false, required: true, initial:false})
                    }),
                    "fatePoints":new fields.SchemaField({
                        "current":new fields.NumberField({required:true, initial:0, integer:true}),
                        "refresh":new fields.NumberField({nullable:true, required:true, initial:null, integer:true}),
                        "boosts":new fields.NumberField({nullable:false, required:true, initial:0, integer:true}),
                    }),
                    "sheet_mode":new fields.StringField({ nullable:false, required: true, initial:"minimal_at_refresh_0", choices: ["minimal_at_refresh_0", "minimal", "full"]}),
                }),
            "tracks":new fields.ObjectField({nullable:true, required:true, initial:{}}),
            "stunts":new fields.ObjectField({nullable:true, required:true, initial:{}}),
            "skills":new fields.ObjectField({nullable:true, required:true, initial:{}}),
            "aspects":new fields.ObjectField({nullable:true, required:true, initial:{}}),
            "override":new fields.SchemaField({
                "active":new fields.BooleanField ({nullable :false, required:true, initial:false}),
                "refresh":new fields.NumberField ({nullable:false, required:true, initial:0, integer:true}),
                "skillPoints":new fields.NumberField ({nullable:false, required:true, initial:0, integer:true}),
            }),
        }
    }
}

class fcoThingModel extends foundry.abstract.DataModel {
    static defineSchema () {
        const fields = foundry.data.fields;
        return {
            "container":new fields.SchemaField({
                "isContainer":new fields.BooleanField ({nullable :false, required:true, initial:false}),
                "locked":new fields.BooleanField ({nullable :false, required:true, initial:false}),
                "movable":new fields.BooleanField ({nullable :false, required:true, initial:true}),
                "security":new fields.NumberField ({nullable:false, required:true, initial:0, integer:true}),
                "extra":new fields.ObjectField({nullable:true, required:true, initial:{}}),
            })
        }
    }
}

class fcoExtraModel extends foundry.abstract.DataModel {
    static defineSchema () {
        const fields = foundry.data.fields;
        return {
            "description":new fields.SchemaField({"value":new fields.HTMLField({nullable:false, required: true, initial:""})}),
            "permissions":new fields.HTMLField({nullable:false, required: true, initial:""}),
            "costs":new fields.HTMLField({nullable:false, required: true, initial:""}),
            "refresh":new fields.NumberField ({nullable:false, required:true, initial:0, integer:true}),
            "tracks":new fields.ObjectField({nullable:true, required:true, initial:{}}),
            "stunts":new fields.ObjectField({nullable:true, required:true, initial:{}}),
            "skills":new fields.ObjectField({nullable:true, required:true, initial:{}}),
            "aspects":new fields.ObjectField({nullable:true, required:true, initial:{}}),
            "actions":new fields.SchemaField({
                "overcome":new fields.HTMLField({nullable:false, required: true, initial:""}),
                "create":new fields.HTMLField({nullable:false, required: true, initial:""}),
                "attack":new fields.HTMLField({nullable:false, required: true, initial:""}),
                "defend":new fields.HTMLField({nullable:false, required: true, initial:""}),
            }),
            "countSkills":new fields.BooleanField({required:true, initial:false, nullable:false}),
            "combineSkills":new fields.BooleanField({required:true, initial:false, nullable:false}),
            "contents":new fields.ObjectField({nullable:true, required:true, initial:{}}),
            "active":new fields.BooleanField({required:true, initial:true, nullable:false}),
        }
    }
}

// Register the appropriate data models
Hooks.on("init", () => {
    CONFIG.Actor.dataModels["fate-core-official"] = fcoActorModel;
    CONFIG.Actor.dataModels["Thing"] = fcoThingModel;
    CONFIG.Item.dataModels["Extra"] = fcoExtraModel;
});

Hooks.on("renderTokenConfig", (tokenConfig) => {
    let tracks = tokenConfig.actor.system.tracks;
    let possibles = ["details.fatePoints"];
    for (let track in tracks){
        if (tracks[track]?.boxes > 0){
            possibles.push(`details.${tracks[track].name}`);
        }
    }
    let toSet = {
        "fate-core-official": {
            bar:possibles,
            value:["details.fatePoints.value"]
        }
    }
    let renderPending = false;
    if (JSON.stringify(CONFIG.Actor.trackableAttributes) != JSON.stringify(toSet)) renderPending = true;
    CONFIG.Actor.trackableAttributes = toSet;
    if (renderPending) tokenConfig.render(true);
})

// Consider adding a model for character sheet colour schemes.
// Consider using models on importing from Fari/FateX to standardize data (FateCharacterImporter)
// Consider using models for character default frameworks to ensure consistency in using, exporting & importing them. (FateCharacterDefaults)

/**
 * When using the System template.json, the properties that can be used for a Token's resource bar are inferred from the template. This works well enough, but it can also include things like derived properties, properties that were intended to be hidden, or otherwise properties that are not suitable or ever useful as a resource bar, making it difficult for a user to locate the actual properties they want.

When using a Data Model for your system data, the core software will no longer attempt to infer which properties can be used as Token resource bars. Instead, you are given full control to tailor this list to whatever makes sense for your System. To do so, you need to modify the CONFIG.Actor.trackableAttributes configuration variable. The below example shows how to configure one resource as a bar attribute, and another as a value attribute.

Hooks.on("init", () => {
  CONFIG.Actor.trackableAttributes = {
    character: {
      bar: ["attributes.hp"],
      value: ["attributes.ac.value"]
    }
  };
});
For bar attributes, the property supplied must point to some object with both value and max properties, and these properties must both be numbers. For value attributes, the property supplied must simply point to any number. The attributes do not need to exist in your Data Model, they can be properties that are later derived as part of data preparation. If the attribute does not exist in the Data Model or is not a NumericField, then it will not be editable in the Token HUD.

Registering a Data Model
Once the Data Model is defined, the core API can be made aware of it and will automatically apply the data model to the system field of any registered types.

The following code snippet will register the example CharacterData model to be automatically applied as the system data for every Actor of the character type.

Hooks.on("init", () => {
  CONFIG.Actor.systemDataModels.character = CharacterData;
});

See: https://foundryvtt.com/article/system-data-models/
*/