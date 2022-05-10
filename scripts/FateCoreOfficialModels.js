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

*/

// We aren't quite ready to use this yet, as it seems impossible at the minute to define a SchemaField that defaults to undefined or null, so I'm going to have issues with the code
// surrounding extra_tags unless I change ALL references checking to see if extra_tag is undefined to check for if (*.extra_tag?.id) - this will only do something if the extra_tag has a truthy id.
// Ideally I would rather have the extra_tag field default to null or undefined.

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
            "extra_tag": new foundry.data.fields.SchemaField({
                    "extra_name":new foundry.data.fields.StringField({ nullable: true, required: true, initial:null}), 
                    "extra_id":new foundry.data.fields.StringField({ nullable: true, required: true, initial:null})
                }, 
                {required:false, initial:undefined, nullable:true})
        }
    }
}

class fcoAspect extends foundry.abstract.DataModel {
    static defineSchema(){
        return {
            "name":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "description":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "notes":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
        }
    }
}

class fcoTrack extends foundry.abstract.DataModel {

}

class fcoStunt extends foundry.abstract.DataModel {

}