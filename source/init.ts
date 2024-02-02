import {IOdaClass, IOdaObject} from "./oda";
export class Init {
    //#region External variables
    class: IOdaClass;
    object: IOdaObject | undefined;
    //#endregion
    constructor(cls: IOdaClass, obj: IOdaObject) {
        this.class = cls;
        this.object = obj;
    }

    async execute(params: any) {

    }
}

