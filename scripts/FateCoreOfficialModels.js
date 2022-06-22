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

class fcoSkill extends foundry.abstract.DataModel {
    static defineSchema(){
        return {
            "name":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "description":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "overcome":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "caa":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "attack":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "defend":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "pc": new foundry.data.fields.BooleanField({ nullable: false, required: true, initial:true}),
            "rank": new foundry.data.fields.NumberField({ required: true, initial:0 }),
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
            "description":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "notes":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "extra_id": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "original_name": new foundry.data.fields.StringField({ required: false, initial:undefined })
        }
    }
}

class trackAspectField extends foundry.data.fields.ObjectField {
    _validateType(data){
        if (data == "No" || data == game.i18n.localize("fate-core-official.DefinedWhenMarked") || data == game.i18n.localize("fate-core-official.AspectAsName") || data == game.i18n.localize("fate-core-official.NameAsAspect")){
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
			"rank": new foundry.data.fields.NumberField({ required: true, initial:0 }),
			"boxes": new foundry.data.fields.NumberField({ required: true, initial:0 }),
			"enables": new foundry.data.fields.BooleanField({ required: true, initial:false })
        }));

        let recovery_type = new foundry.data.fields.StringField({nullable: false, required: true, initial:"Fleeting"});
        recovery_type.choices = ["Fleeting","Sticky","Lasting"];

        let category = new foundry.data.fields.StringField({ nullable: false, required: true, initial:"Combat"});
        category.choices = Object.keys(game.settings.get("fate-core-official","track_categories"));

        return {
            "category":category,
            "name":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "description":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "notes":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "extra_id": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "original_name": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "linked_skills":linked_skills,
            "paid":new foundry.data.fields.BooleanField({ required: true, initial:false }),
            "universal":new foundry.data.fields.BooleanField({ required: true, initial:true }),
            "unique":new foundry.data.fields.BooleanField({ required: true, initial:true }),
            "enabled":new foundry.data.fields.BooleanField({ required: true, initial:true }),
            "label":new trackLabelField({nullable: false, required: true, initial:"escalating"}),
            "recovery_type":recovery_type,
            "when_marked":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "recovery_conditions":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "harm_can_absorb": new foundry.data.fields.NumberField({ required: true, initial:0 }),
            "boxes":new foundry.data.fields.NumberField({ required: true, initial:0 }),
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
            "description":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "notes":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "extra_id": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "original_name": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "linked_skill": new foundry.data.fields.StringField({ required: true, initial:"None" }),
            "refresh_cost":new foundry.data.fields.NumberField({ required: true, initial:1 }),
            "overcome":new foundry.data.fields.BooleanField({ required: true, initial:false }),
            "caa":new foundry.data.fields.BooleanField({ required: true, initial:false }),
            "attack":new foundry.data.fields.BooleanField({ required: true, initial:false }),
            "defend":new foundry.data.fields.BooleanField({ required: true, initial:false }),
            "bonus":new foundry.data.fields.NumberField({ required: true, initial:0 }),
            "boxes":new foundry.data.fields.NumberField({ required: true, initial:0 }),
            "box_values":new foundry.data.fields.ArrayField(new foundry.data.fields.BooleanField()),
        }
    }
}

// Consider adding a model for character sheet colour schemes.
// Consider using models on importing from Fari/FateX to standardize data (FateCharacterImporter)
// Consider using models for character default frameworks to ensure consistency in using, exporting & importing them. (FateCharacterDefaults)