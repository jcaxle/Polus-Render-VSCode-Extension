# Polus-Render VSCode-Ext
VSCode extension based on the [polus-render python package](https://github.com/jcaxle/polus-render)
![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/23fc3914-cb9f-45af-b481-ad27b8ee9a53)

Render application is loaded in an iframe within VSCode's Webview API. The extension allows pointing the iframe at:
* Render deployed to a server
* A [JS server](https://github.com/http-party/http-server) running on localhost and serving a production build of render, which has been bundled with this package


**The are three ways to load the data:**
1. Right clicking a .zarr or .ome.tif file in the VSCode explorer and selecting "open * with Polus Render".
> ![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/d11947bb-a516-49de-8df8-44ae8c7d8a8a)
2. Right clicking a file or empty space in the VSCode explorer and selecting "open Render" and following the prompts.
> ![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/1eb4f287-e675-4e04-bac2-b4610b5c0dc9)
3. Clicking "open Render" located on the top right of an opened editor and following the prompts.
> ![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/e749d54d-1599-467a-9bd4-b5c3c54dd889)

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
| Local | :heavy_check_mark:  | :heavy_check_mark: | :heavy_check_mark: | ❗ | :heavy_check_mark:
| Online | :heavy_check_mark:  |  |  |  | 


For local version of Zarr/TIF Drag & Drop, `.zarr` is not supported. Only `.ome.tif` image files are accepted. 

# Configuration
![image](https://github.com/jcaxle/Polus-Render-VSCode-Extension/assets/145499292/e93db393-8660-4148-9a91-6703fe049afa)

Options are all enabled by default.
- Prompt>Default:Local - Enable to use local build of render by default, Disable for online build of render by default.
- Prompt>Overlay:Disable - Enable to not show prompt for an additional overlay when opening image files. Disable to show prompt.
- Prompt>Polus>Type:Disable - Enable to not show which Render type to use, Disable to show which Render type to use.

# Implementation Details
- child-process.exec commands are used to launch http-server to server RenderUI, image files, and overlay files.

# Acknowledgements
- http-server: https://github.com/http-party/http-server
