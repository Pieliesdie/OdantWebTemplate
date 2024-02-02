//!!!
//changes must be synchronized with ./build/odaAction.js
export interface IOdaItem {
    post(params: { [key: string]: string }, post_object: any): Promise<any>;
    get(path: string, params: { [key: string]: string }): Promise<any>;
}
export interface IOdaClass extends IOdaItem {
    getObject(oid: string): Promise<IOdaObject>;
    staticObject(): Promise<IOdaObject>;
    findClass(path: string): Promise<IOdaClass>;
    getIndex(name: string): Promise<any>;
    getFilePath(path: string): Promise<string>;
    findObjectsId(filter: string): Promise<string[]>
}
export interface IOdaObject extends IOdaItem {
    get Root(): any;
    save(): Promise<boolean>;
}
