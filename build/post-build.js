import * as fs from "fs"

let config = JSON.parse(fs.readFileSync("./odaconfig.json").toString())
let methodFolderUri = `${config.location.link}/~/web/${config.location.source}/server/${config.location.type}/${config.location.method}`;
await copyActionToServer(config.location.type, config.location.method, config.location.source);
await saveDirToServer("./dist", methodFolderUri);

async function copyActionToServer(type, methodName, source) {
    let jsfile = fs.readFileSync("./build/odaAction.js").toString();
    let version = await getServerVersion(new URL(methodFolderUri).origin);
    let template = fs.readFileSync(`./build/web${version}template.js`).toString();

    jsfile = jsfile.replace(/\/\/\[\#ActionRegisterCode\#\]/g, template);
    jsfile = jsfile.replace(/\[\#methodName\#\]/g, methodName);
    jsfile = jsfile.replace(/\[\#type\#\]/g, type);
    jsfile = jsfile.replace(/\[\#source\#\]/g, source);
    jsfile = jsfile.replace(/\[\#version\#\]/g, version);

    let uri = new URL(methodFolderUri);
    await saveFile(`${methodFolderUri}/${methodName}.js?method=save_file`, jsfile)
}

async function getServerVersion(host) {
    let uri = host + `/web/package.json`;
    try {
        let packageJson = await fetch(uri);
        let body = await packageJson.json();
        let configVersion = Array.from(body?.version?.toString())[0];
        return configVersion == '3' ? '3' : '2';
    }
    catch {
        return '2';
    }
}

async function saveDirToServer(dir, methodUri) {
    for (let fileName of fs.readdirSync(dir)) {
        let fullPath = `${dir}/${fileName}`
        let isDir = fs.statSync(fullPath).isDirectory();
        if (isDir) continue;

        let file = fs.readFileSync(fullPath);
        let uri = `${methodUri}/${fileName}?method=save_file`
        await saveFile(uri, file);
    }
}
async function saveFile(uri, file) {
    let formdata = new FormData();
    formdata.append("file", file);

    var requestOptions = {
        method: 'POST',
        body: formdata,
        redirect: 'follow'
    };

    await fetch(uri, requestOptions)
}