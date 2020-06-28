import { ItemSheetFATE } from "./ItemSheet.js";
export class ExtraSheet extends ItemSheetFATE {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.height = 600;
        return options;
    }
    getData() {
        const data = super.getData();
        const actions = {};
        for (const [action, value] of Object.entries(data.data.actions)) {
            actions[action] = {
                label: game.i18n.localize(`FATE.Actions.${action}`),
                value,
            };
        }
        data.actions = actions;
        return data;
    }
}
