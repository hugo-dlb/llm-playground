"use strict";

const fs = require("fs");

const rawdata = fs.readFileSync("input.json");
const data = JSON.parse(rawdata);

let output = "";

for (const page of data.results[0].page_data) {
    output += page.raw_text;
    output += "\\n";
}

try {
    fs.writeFileSync("input.txt", output);
    console.log("output written to input.txt");
} catch (err) {
    console.error(err);
}
