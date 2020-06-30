class FateUtilities extends Application {
static async clearFleeting(object){
        this.object = object;

        //This is a convenience method which clears all fleeting Tracks.
        let tracks = duplicate(this.object.data.data.tracks);
        
        for (let t in tracks){
            let track = tracks[t];
            if (track.recovery_type == "Fleeting"){
                for (let i = 0; i < track.box_values.length; i++){
                    track.box_values[i] = false;
                }
                if (track.aspect.name != undefined){
                    track.aspect.name = "";
                }
            }
        }
        await this.object.update({
            ["data.tracks"]: tracks
        })
    }
}
