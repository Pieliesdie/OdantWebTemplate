{
    //#region external variables inserted by post-build.js
    const methodName = '[#methodName#]';
    const type = '[#type#]';
    const source = '[#source#]';
    const version = '[#version#]';
    const actionFolder = `/web/${source}/server/${type}/${methodName}`;
    const actionName = `init.js`;
    const actionPath = `${actionFolder}/${actionName}`;
    //#endregion

    //#region oda wrappers source/oda.ts
    //implements  oda.ts IOdaItem
    class odaItemWrapper {
        constructor($item) {
            this._item = $item;
        }

        async post(params, post_object = {}) {
            return await this._request(this._item, params, post_object)
        }

        async get(path = '', params = {}) {
            return await this._request(`${this._item.url}${path}`, params)
        }

        async _request(context, params, post_object, fetchParams = {}) {
            let p = params || {};
            if (typeof p === 'string')
                p = {'method': p};
            let url = this._buildUrl(context, p);

            p = {
                method: post_object ? 'POST' : 'GET',
                body: post_object,
                credentials: 'include'
            };

            Object.assign(p, fetchParams);
            const response = await fetch(encodeURI(url), p);
            switch (response.status) {
                case 200: {
                    let content_type_header = response.headers.get('Content-Type');
                    let res = content_type_header ? content_type_header.split(';')[0] : content_type_header;
                    switch (res) {
                        case 'application/x.odant.async':
                        case 'application/x.odant.async+json':
                        case 'text/x-json':
                        case 'application/json':
                            return response.json();
                        case 'text/cmd':
                        case 'text/css':
                        case 'text/csv':
                        case 'text/javascript':
                        case 'application/javascript':
                        case 'text/php':
                        case 'text/html':
                        case 'text/plain':
                        case 'text/xml':
                            return response.text();
                        case 'image/png':
                        case 'image/gif':
                        case 'image/jpg':
                        case 'image/jpeg':
                        case 'application/octet-stream':
                            return response.buffer();

                        default: {
                            throw new Error('Unresolved fetch mime-type: ' + res);
                        }
                    }
                }
                case 500: {
                    const text = await response.text();
                    throw new Error(text);
                }
            }

        }

        _buildUrl(context = '', params = {}) {
            let url = context.url || context;
            let arr = [];
            for (let n in params) {
                let val = params[n];
                if (val)
                    arr.push(n + (val ? ('=' + val) : ''));
            }
            params = arr.join('&');
            if (params)
                url += (url.includes('?') ? '&' : '?') + arr.join('&');
            url = this._url(url);
            return url;
        }

        _url(url) {
            if (url) {
                if (url.indexOf('ssid') < 0) {
                    if (url.indexOf('?') < 0)
                        url += this._getSSID('?');
                    else if (url.indexOf('ssid=') < 0)
                        url += this._getSSID('&');
                }
            }
            return url;
        };

        _getSSID(delimiter) {
            return (SSID && (delimiter ? delimiter : '') + 'ssid=' + SSID) || '';
        };
    }

    //implements oda.ts IClass
    class OdaClassWrapper extends odaItemWrapper {
        static async create($class) {
            if (!($class instanceof odaClass)) {
                return undefined;
            }
            return new OdaClassWrapper($class);
        }

        constructor($class) {
            super($class)
        }

        async getObject(oid) {
            let _object = await this._item.getObject(oid);
            return (await OdaObjectWrapper.create(_object));
        }

        async staticObject() {
            return await this.getObject(this._item.id);
        }

        async findClass(path) {
            let cls = await this._item.$owner.findItem(path);
            if (cls instanceof odaClass) {
                return await OdaClassWrapper.create(cls)
            }
            throw new Error(`class ${path} not found`)
        }

        async getIndex(name) {
            return await this.get(`/I:${name}`);
        }

        async getFilePath(path) {
            let pathModule = await import('node:path');
            let fileInfo = pathModule.parse(path);
            let odaPath = (await this.getDirList(`${fileInfo.dir}`, fileInfo.base))?.FILE?.[0]?.path;
            if (!odaPath) {
                throw new Error(`File ${path} not found in class C:${this._item.id}`);
            }
            let filePath = (await this.get(odaPath, {method: 'get_file_path'}))?.result;
            if (!filePath) {
                throw new Error(`File ${path} not found in class C:${this._item.id}`);
            }
            return filePath;
        }

        async getDirList(path = '', mask = '*') {
            return (await this.get(`/~${path}`, {method: 'get_dirlist', format: 'json-2', mask: mask}));
        }

        async findObjectsId(filter = 'true()') {
            return (await this.post({method: 'find_objects_id'}, filter))?.result?.split(' ') || [];
        }
    }

    //implements oda.ts IObject
    class OdaObjectWrapper extends odaItemWrapper {
        static async create($object) {
            if (!($object instanceof odaObject)) {
                return undefined;
            }
            if (version === '3') {
                await $object.load();
            }
            return new OdaObjectWrapper($object);
        }

        constructor($object) {
            super($object);
        }

        get Root() {
            if (version === '3') {
                return this._item.body
            }
            return this._item.Root;
        }

        async save() {
            return await this._item.save();
        }
    }

    //#endregion oda wrappers

    class ContextFabric {
        //TODO:cache import?
        static async createInit(context) {
            let contextClass = await OdaClassWrapper.create(context.$class);
            let contextObject = await OdaObjectWrapper.create(context.contextItem);
            let path = 'file://' + await contextClass.getFilePath(actionPath);
            let initModule = await import(path);
            let init = new initModule.default.Init(contextClass, contextObject);
            return init;
        }
    }

    async function execute(params) {
        try {
            let init = await ContextFabric.createInit(this);
            let res = await init.execute(params);
            return ok(res);
        } catch (e) {
            return error(e);
        }

        function error(exception) {
            return {
                "status": 500,
                "error": exception.message,
                "stacktrace": exception.stack
            }
        }

        function ok(body) {
            let jsonBody =  Object(body) !== body ? { "result": body } : body
            return {
                "status": 200,
                ...jsonBody
            }
        }
    }

    //DON'T DELETE THIS
    //see post-build.js
    //web2template.js or web3template.js here
    //[#ActionRegisterCode#]
}