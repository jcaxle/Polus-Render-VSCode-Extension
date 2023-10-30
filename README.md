# Polus-Render VSCode-Ext
**Homepage:** https://github.com/jcaxle/Polus-Render-VSCode-Extension/tree/main


VSCode extension based on the [polus-render python package](https://github.com/jcaxle/polus-render)
![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/3361aca5-441b-44c5-844a-98148c00d400)

Render application is loaded in an iframe within VSCode's Webview API. The extension allows pointing the iframe at:
* Render deployed to a server
* A [JS server](https://github.com/http-party/http-server) running on localhost and serving a production build of render, which has been bundled with this package


**The are three ways to load the data:**
1. Right clicking a .zarr or .ome.tif file in the VSCode explorer and selecting "open * with Polus Render".
> ![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/b2bac219-93fe-4adf-a9be-5e9843139246)
2. Right clicking a file or empty space in the VSCode explorer and selecting "open Render" and following the prompts.
> ![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/154b2224-d880-4878-b4ec-b19cf2858810)
3. Clicking "open Render" located on the top right of an opened editor and following the prompts.
> ![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/afd390bd-d244-4d85-89b0-dbccdcb8f4d3)

# Demo
TODO

# Requirements
- Node JS

# Installation
TODO VSCODE URL

# Dev Installation
```
git clone https://github.com/jcaxle/Polus-Render-VSCode-Extension.git
cd Polus-Render-VSCode-Extension
npm i
```

## Testing Extension
**Split into 3 parts:**
1. Compile extension
```
cd Polus-Render-VSCode-Extension
tsc -p ./
```

2. Move files
- Within VSCode, move generated `extension.js` and `extension.map.js` into `dist/`. Accept import changes prompt when it appears for `extension.js`.

3. Running extension
- Open `extension.ts` in the editor. Type `F5` which will open a debugging window where the extension is loaded.

# Project File Structure
```
Polus-Render-VSCode-Extension
| package.json                    // Includes VSCode Extension configuration options alongside package requirements
| tsconfig.json                   // TS config, must be kept to ES2020
| webpack.condfig.js              // Bundling instructions, unused but will be later used to bundle for web extension
| .vscodeignore                   // Files to ignore when building extension
| README                          
└───dist                          // JS files compiled from TS files
└───src
    | extension.ts                // Main entry point into extension, contains all VSCode functionality
    | polus-render.ts             // Contains all functionality for Polus Render. 
    ├───apps           
    │   ├───render-ui              // Build files of Polus Render
    └───test                       // test files
```
# Build Instructions
- In root directory, run `vsce package`.
- This will generated a `polus-render-<version>.vsix` file. Right click the extension which allows installation of the extension via the `Install Extension VSIX` option.
- To publish the extension, TODO 

# Render: Local build vs online
polus-render is bundled with a build of Polus Render which supports additional functionality compared to the web version. Table
is accurate as of 10/4/2023.
| Version           | Zarr from URL/Path | TIF from URL/Path   | Micro-JSON Support | Zarr/TIF Drag & Drop | Micro-JSON Drag & Drop | 
|----------------|---------------|---------------|----------------|-----------|-----|
| Local | ✔️  | ✔️ | ✔️ | ❗ | ✔️
| Online | ✔️  |  |  |  | 


For local version of Zarr/TIF Drag & Drop, `.zarr` is not supported. Only `.ome.tif` image files are accepted. 

# Prompt Navigation
## Image Prompt
![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/5e5418cf-8d63-4fe6-8dba-c511dad28d9a)
- Enter a url or file path to an image file to load. If you would like to load a file from the file explorer, type ESC and choose the image type. The fiie explorer will open afterwards,
## Overlay Prompt
- Similar prompt as Image Prompt
- Enter a url or file path to a overlay file to load. Type ESC to open a file explorer where you can select an overlay file from.

## Render Type Prompt
![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/d21312a4-091c-45ec-8ee7-970ebdf120f7)
- Select either to use local vs online render. Check [local build vs online](https://github.com/jcaxle/Polus-Render-VSCode-Extension/edit/dev/README.md#render-local-build-vs-online) section for details on differences.
# Configuration
![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/c431caa4-1fa2-4bbf-8f70-c01c8c9585d4)

Options are all enabled by default.
- Prompt>Default:Local - Enable to use local build of render by default, Disable for online build of render by default.
- Prompt>Overlay:Disable - Enable to not show prompt for an additional overlay when opening image files. Disable to show prompt.
- Prompt>Polus>Type:Disable - Enable to not show which Render type to use, Disable to show which Render type to use.

# Implementation Details
- child-process.exec commands are used to launch http-server to server RenderUI, image files, and overlay files.

# Acknowledgements
- http-server: https://github.com/http-party/http-server
