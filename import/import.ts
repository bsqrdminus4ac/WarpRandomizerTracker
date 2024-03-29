﻿let parsedFiles: { [fileName: string]: { hubName: string, locNames: string[] } };
let files: string[];
let locMap: { [name: string]: number };

let blockages = {
    "hgss": ["Trainer", "Flash", "Rock Smash", "Cut", "Bike", "Strength", "Surf", "Whirlpool", "Waterfall", "Rock Climb", "Power Plant", "Event"],
    "emerald": ["Trainer", "Cut", "Flash", "Bike", "Rock Smash", "Strength", "Surf", "Waterfall", "Dive", "Event"],
    "platinum": ["Trainer", "Rock Smash", "Cut", "Bike", "Surf", "Strength", "Rock Climb", "Waterfall", "Galactic Key", "Event"],
    "bw2": ["Trainer", "Cut", "Strength", "Surf", "Waterfall", "Dive", "Event"]
};

function doImport(gameToImport: string, version?: string) {
    parsedFiles = {};
    files = [];
    locMap = {};

    $.get("import/" + gameToImport + "/hubs.txt", function (fileData) {
        files = fileData.split("\n");
        files = files.filter(file => file.trim() !== "");
        files.forEach((hubData) => {
            let [file, image, hubVersion] = hubData.trim().split(",");
            if (!file) return;
            $.get("import/" + gameToImport + "/" + file + ".txt", function (locData) {
                let locs: string[] = locData.trim().split("\n").map(loc => loc.trim());
                parsedFiles[file] = {
                    hubName: locs[0],
                    locNames: locs.slice(1),
                };
            }, "text");
        });
    }, "text");

    $(document).off("ajaxStop");
    $(document).ajaxStop(function () {
        if (files.length > 0 && Object.keys(parsedFiles).length === files.length) {
            let mapData: LoadJSON = { Region: regionNames[gameToImport], Hubs: [], Locations: [], Blockages: [] };
            let nextLoc = 0;

            files.forEach((hubData) => {
                let [file, image, hubVersion] = hubData.trim().split(",");
                let newHubLocs = [];
                parsedFiles[file].locNames.forEach((locData) => {
                    if (locData === "") {
                        newHubLocs.push(NoLocation);
                    } else {
                        let [locName, blockage, addlData] = locData.split(",");
                        let locIndex: number;
                        if (!(locName in locMap)) {
                            locIndex = nextLoc;
                            locMap[locName] = locIndex;
                            let newLoc: LoadLocation = { Name: locName };
                            if (blockage) newLoc.BlockedBy = blockage.trim();
                            if (addlData) {
                                let extraData = parseExtraData(gameToImport, addlData);
                                if (extraData.version) newLoc.Version = extraData.version;
                                if (extraData.seasons) newLoc.Seasons = extraData.seasons;
                            }
                            mapData.Locations[nextLoc++] = newLoc;
                        } else {
                            locIndex = locMap[locName];
                        }
                        newHubLocs.push(locIndex);
                    }
                });
                let newHub: Hub = {
                    Name: parsedFiles[file].hubName,
                    Locations: newHubLocs
                };
                if (image) newHub.ImageName = gameToImport + "/" + image;
                if (hubVersion) newHub.Version = hubVersion;
                mapData.Hubs.push(newHub);
            });

            mapData.Blockages = blockages[gameToImport];
            console.log(mapData);
        }
    });
}

function parseExtraData(gameToImport: string, extraData: string) {
    let parsedData: { [key: string]: string } = {};
    if (gameToImport === "bw2") {
        let [version, seasons] = extraData.split("/");
        if (version) parsedData.version = version; 
        if (seasons) parsedData.seasons = seasons;
    }
    return parsedData;
}